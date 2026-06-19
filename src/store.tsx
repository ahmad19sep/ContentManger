import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './auth';
import { STAGES } from './constants';
import { ymd } from './dates';
import {
  importVideos,
  insertVideo,
  listVideos,
  patchVideo,
  removeVideo,
  subscribeVideos,
} from './lib/videosApi';
import {
  createWorkspace as apiCreateWorkspace,
  listMembers,
  listWorkspaces,
  type Member,
  type WorkspaceSummary,
} from './lib/workspacesApi';
import { syncVideoFolder } from './lib/driveApi';
import { SEED_VIDEOS } from './seed';
import type {
  DeviceId,
  PlatformId,
  StageId,
  Video,
  VideoForm,
  ViewId,
} from './types';

const VIDEOS_KEY = 'videoflow.videos.v1';
const SETTINGS_KEY = 'videoflow.settings.v1';
const WS_KEY = 'videoflow.workspace';

interface Settings {
  accentColor: string;
  weekStartsMonday: boolean;
  userName: string;
  userRole: string;
  sidebarCollapsed: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  accentColor: '#6C5CE7',
  weekStartsMonday: false,
  userName: 'Alex Rivera',
  userRole: 'Solo creator',
  sidebarCollapsed: false,
};

/** Stored local videos, or null if the user has never saved any locally. */
function readStoredVideos(): Video[] | null {
  try {
    const raw = localStorage.getItem(VIDEOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Video[];
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function loadVideos(): Video[] {
  return readStoredVideos() ?? SEED_VIDEOS;
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

function stageIndex(id: StageId): number {
  return STAGES.findIndex((s) => s.id === id);
}

function reportError(e: unknown) {
  console.error('[videoflow] cloud sync error:', e);
}

// debounce per-field cloud writes (e.g. typing in notes) keyed by `field:id`
const debouncers = new Map<string, ReturnType<typeof setTimeout>>();
function debounce(key: string, fn: () => void, ms = 500) {
  const existing = debouncers.get(key);
  if (existing) clearTimeout(existing);
  debouncers.set(
    key,
    setTimeout(() => {
      debouncers.delete(key);
      fn();
    }, ms),
  );
}

export interface Store {
  // data
  videos: Video[];
  settings: Settings;
  // mode
  cloud: boolean;
  dataLoading: boolean;
  canImportLocal: boolean;
  // workspaces (cloud)
  workspaces: WorkspaceSummary[];
  currentWorkspaceId: string | null;
  currentWorkspace: WorkspaceSummary | null;
  members: Member[];
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  // ephemeral UI state
  view: ViewId;
  device: DeviceId;
  search: string;
  platformFilter: 'all' | PlatformId;
  selectedId: string | null;
  modalOpen: boolean;
  dragId: string | null;
  dragOverStage: StageId | null;
  calYear: number;
  calMonth: number;
  ideaDraft: string;
  form: VideoForm;
  // setters
  setView: (v: ViewId) => void;
  setDevice: (d: DeviceId) => void;
  setSearch: (s: string) => void;
  setPlatformFilter: (p: 'all' | PlatformId) => void;
  setSelectedId: (id: string | null) => void;
  setDragId: (id: string | null) => void;
  setDragOverStage: (s: StageId | null) => void;
  setIdeaDraft: (s: string) => void;
  setForm: (patch: Partial<VideoForm>) => void;
  setCal: (year: number, month: number) => void;
  gotoPrevMonth: () => void;
  gotoNextMonth: () => void;
  gotoToday: () => void;
  setAccent: (c: string) => void;
  toggleWeekStart: () => void;
  setUserName: (name: string) => void;
  setUserRole: (role: string) => void;
  toggleSidebar: () => void;
  resetData: () => void;
  importLocalData: () => Promise<void>;
  // mutations
  setStage: (id: string, stageId: StageId) => void;
  moveStage: (id: string, dir: -1 | 1) => void;
  toggleCheck: (id: string, key: string) => void;
  updateNote: (id: string, val: string) => void;
  updateDrive: (id: string, val: string) => void;
  updatePublish: (id: string, val: string) => void;
  updateAssignee: (id: string, userId: string | null) => void;
  deleteVideo: (id: string) => void;
  openModal: (stage?: StageId) => void;
  closeModal: () => void;
  saveVideo: () => void;
  addIdea: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { cloud, user } = useAuth();

  const [videos, setVideos] = useState<Video[]>(loadVideos);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [canImportLocal, setCanImportLocal] = useState(false);

  const [view, setView] = useState<ViewId>('dashboard');
  const [device, setDevice] = useState<DeviceId>('desktop');
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | PlatformId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(5);
  const [ideaDraft, setIdeaDraft] = useState('');
  const [form, setFormState] = useState<VideoForm>({
    title: '',
    platform: 'yt',
    stage: 'idea',
    priority: 'med',
    due: '2026-06-26',
  });

  // ---- cloud: load videos for the signed-in user's workspace ----
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!cloud || !userId) {
      setWorkspaces([]);
      setWorkspaceId(null);
      return;
    }
    let active = true;
    setDataLoading(true);
    (async () => {
      try {
        const ws = await listWorkspaces();
        if (!active) return;
        setWorkspaces(ws);
        let stored: string | null = null;
        try {
          stored = localStorage.getItem(WS_KEY);
        } catch {
          /* ignore */
        }
        const chosen = ws.find((w) => w.id === stored)?.id ?? ws[0]?.id ?? null;
        setWorkspaceId(chosen);
        setVideos(chosen ? await listVideos(chosen) : []);
        if (!active) return;
        setMembers(chosen ? await listMembers(chosen).catch(() => []) : []);
        if (!active) return;
        setCanImportLocal((readStoredVideos()?.length ?? 0) > 0);
      } catch (e) {
        reportError(e);
      } finally {
        if (active) setDataLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [cloud, userId]);

  // ---- cloud: live updates from other users (and our own echoes) ----
  useEffect(() => {
    if (!cloud || !workspaceId) return;
    const unsubscribe = subscribeVideos(workspaceId, {
      onUpsert: (video) =>
        setVideos((vs) => {
          const i = vs.findIndex((x) => x.id === video.id);
          if (i === -1) return [...vs, video];
          const copy = vs.slice();
          copy[i] = video;
          return copy;
        }),
      onDelete: (id) => setVideos((vs) => vs.filter((x) => x.id !== id)),
    });
    return unsubscribe;
  }, [cloud, workspaceId]);

  // ---- local mode: persist videos to localStorage (never persist cloud data) ----
  useEffect(() => {
    if (cloud) return;
    try {
      localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
    } catch {
      /* ignore quota */
    }
  }, [videos, cloud]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accentColor);
  }, [settings.accentColor]);

  const store = useMemo<Store>(() => {
    const setForm = (patch: Partial<VideoForm>) =>
      setFormState((f) => ({ ...f, ...patch }));

    // optimistic local update + (in cloud mode) a DB write
    const mutate = (id: string, transform: (v: Video) => Video) => {
      let next: Video | undefined;
      setVideos((vs) =>
        vs.map((v) => {
          if (v.id !== id) return v;
          next = transform(v);
          return next;
        }),
      );
      return next;
    };

    const setStage = (id: string, stageId: StageId) => {
      mutate(id, (v) => ({ ...v, stage: stageId }));
      if (cloud) patchVideo(id, { stage: stageId }).catch(reportError);
    };

    const moveStage = (id: string, dir: -1 | 1) => {
      const updated = mutate(id, (v) => {
        const i = stageIndex(v.stage);
        const ni = Math.max(0, Math.min(STAGES.length - 1, i + dir));
        return { ...v, stage: STAGES[ni].id };
      });
      if (cloud && updated) patchVideo(id, { stage: updated.stage }).catch(reportError);
    };

    const toggleCheck = (id: string, key: string) => {
      const updated = mutate(id, (v) => ({
        ...v,
        checks: { ...v.checks, [key]: !v.checks[key] },
      }));
      if (cloud && updated) patchVideo(id, { checks: updated.checks }).catch(reportError);
    };

    const updateNote = (id: string, val: string) => {
      mutate(id, (v) => ({ ...v, note: val }));
      if (cloud) debounce(`note:${id}`, () => patchVideo(id, { note: val }).catch(reportError));
    };

    const updateDrive = (id: string, val: string) => {
      mutate(id, (v) => ({ ...v, drive: val }));
      if (cloud) debounce(`drive:${id}`, () => patchVideo(id, { drive: val }).catch(reportError));
    };

    const updatePublish = (id: string, val: string) => {
      mutate(id, (v) => ({ ...v, publish: val }));
      if (cloud) patchVideo(id, { publish: val }).catch(reportError);
    };

    const updateAssignee = (id: string, assigneeId: string | null) => {
      mutate(id, (v) => ({ ...v, assigneeId }));
      if (cloud) {
        patchVideo(id, { assigneeId })
          .then(() => syncVideoFolder(id))
          .catch(reportError);
      }
    };

    const deleteVideo = (id: string) => {
      setVideos((vs) => vs.filter((v) => v.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      if (cloud) removeVideo(id).catch(reportError);
    };

    const openModal = (stage?: StageId) => {
      setFormState((f) => ({ ...f, stage: stage || 'idea', title: '' }));
      setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    const finishCreate = () => {
      setFormState((f) => ({ ...f, title: '' }));
      setModalOpen(false);
      setView('pipeline');
    };

    const saveVideo = () => {
      if (!form.title.trim()) return;
      const base: Omit<Video, 'id'> = {
        title: form.title.trim(),
        platform: form.platform,
        stage: form.stage,
        priority: form.priority,
        due: form.due,
        publish: '',
        note: '',
        checks: {},
      };
      if (cloud && workspaceId && userId) {
        insertVideo(base, workspaceId, userId)
          .then((nv) => {
            setVideos((vs) => [...vs, nv]);
            syncVideoFolder(nv.id);
          })
          .catch(reportError);
        finishCreate();
      } else {
        setVideos((vs) => [...vs, { id: 'v' + Date.now(), ...base }]);
        finishCreate();
      }
    };

    const addIdea = () => {
      const t = ideaDraft.trim();
      if (!t) return;
      const base: Omit<Video, 'id'> = {
        title: t,
        platform: 'yt',
        stage: 'idea',
        priority: 'low',
        due: ymd(new Date(2026, 6, 1)),
        publish: '',
        note: 'New idea — develop the angle.',
        checks: {},
      };
      if (cloud && workspaceId && userId) {
        insertVideo(base, workspaceId, userId)
          .then((nv) => {
            setVideos((vs) => [...vs, nv]);
            syncVideoFolder(nv.id);
          })
          .catch(reportError);
        setIdeaDraft('');
      } else {
        setVideos((vs) => [...vs, { id: 'v' + Date.now(), ...base }]);
        setIdeaDraft('');
      }
    };

    const switchWorkspace = (id: string) => {
      if (id === workspaceId) return;
      setWorkspaceId(id);
      try {
        localStorage.setItem(WS_KEY, id);
      } catch {
        /* ignore */
      }
      setSelectedId(null);
      setDataLoading(true);
      listVideos(id)
        .then((vids) => setVideos(vids))
        .catch(reportError)
        .finally(() => setDataLoading(false));
      listMembers(id)
        .then((m) => setMembers(m))
        .catch(() => setMembers([]));
    };

    const createWorkspace = async (name: string) => {
      if (!userId) return;
      try {
        const ws = await apiCreateWorkspace(name, userId);
        setWorkspaces((prev) => [...prev, ws]);
        switchWorkspace(ws.id);
      } catch (e) {
        reportError(e);
      }
    };

    const refreshWorkspaces = async () => {
      try {
        setWorkspaces(await listWorkspaces());
      } catch (e) {
        reportError(e);
      }
    };

    const refreshMembers = async () => {
      if (!workspaceId) return;
      try {
        setMembers(await listMembers(workspaceId));
      } catch (e) {
        reportError(e);
      }
    };

    const importLocalData = async () => {
      if (!cloud || !workspaceId || !userId) return;
      const stored = readStoredVideos() ?? [];
      if (stored.length === 0) {
        setCanImportLocal(false);
        return;
      }
      try {
        const imported = await importVideos(stored, workspaceId, userId);
        setVideos((vs) => [...vs, ...imported]);
        localStorage.removeItem(VIDEOS_KEY);
        setCanImportLocal(false);
      } catch (e) {
        reportError(e);
      }
    };

    return {
      videos,
      settings,
      cloud,
      dataLoading,
      canImportLocal,
      workspaces,
      currentWorkspaceId: workspaceId,
      currentWorkspace: workspaces.find((w) => w.id === workspaceId) ?? null,
      members,
      switchWorkspace,
      createWorkspace,
      refreshWorkspaces,
      refreshMembers,
      view,
      device,
      search,
      platformFilter,
      selectedId,
      modalOpen,
      dragId,
      dragOverStage,
      calYear,
      calMonth,
      ideaDraft,
      form,
      setView,
      setDevice,
      setSearch,
      setPlatformFilter,
      setSelectedId,
      setDragId,
      setDragOverStage,
      setIdeaDraft,
      setForm,
      setCal: (year, month) => {
        setCalYear(year);
        setCalMonth(month);
      },
      gotoPrevMonth: () =>
        setCalMonth((m) => {
          if (m === 0) {
            setCalYear((y) => y - 1);
            return 11;
          }
          return m - 1;
        }),
      gotoNextMonth: () =>
        setCalMonth((m) => {
          if (m === 11) {
            setCalYear((y) => y + 1);
            return 0;
          }
          return m + 1;
        }),
      gotoToday: () => {
        setCalMonth(5);
        setCalYear(2026);
      },
      setAccent: (c) => setSettings((s) => ({ ...s, accentColor: c })),
      toggleWeekStart: () =>
        setSettings((s) => ({ ...s, weekStartsMonday: !s.weekStartsMonday })),
      setUserName: (name) => setSettings((s) => ({ ...s, userName: name })),
      setUserRole: (role) => setSettings((s) => ({ ...s, userRole: role })),
      toggleSidebar: () =>
        setSettings((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed })),
      resetData: () => {
        if (!cloud) setVideos(SEED_VIDEOS);
      },
      importLocalData,
      setStage,
      moveStage,
      toggleCheck,
      updateNote,
      updateDrive,
      updatePublish,
      updateAssignee,
      deleteVideo,
      openModal,
      closeModal,
      saveVideo,
      addIdea,
    };
  }, [
    videos,
    settings,
    cloud,
    dataLoading,
    canImportLocal,
    workspaces,
    workspaceId,
    members,
    userId,
    view,
    device,
    search,
    platformFilter,
    selectedId,
    modalOpen,
    dragId,
    dragOverStage,
    calYear,
    calMonth,
    ideaDraft,
    form,
  ]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
