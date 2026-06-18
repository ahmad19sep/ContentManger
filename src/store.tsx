import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STAGES } from './constants';
import { ymd } from './dates';
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

interface Settings {
  accentColor: string;
  weekStartsMonday: boolean;
  userName: string;
  userRole: string;
  sidebarCollapsed: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  accentColor: '#5B5BD6',
  weekStartsMonday: false,
  userName: 'Alex Rivera',
  userRole: 'Solo creator',
  sidebarCollapsed: false,
};

function loadVideos(): Video[] {
  try {
    const raw = localStorage.getItem(VIDEOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Video[];
    }
  } catch {
    /* ignore corrupt storage */
  }
  return SEED_VIDEOS;
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

export interface Store {
  // persisted data
  videos: Video[];
  settings: Settings;
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
  // mutations
  setStage: (id: string, stageId: StageId) => void;
  moveStage: (id: string, dir: -1 | 1) => void;
  toggleCheck: (id: string, key: string) => void;
  updateNote: (id: string, val: string) => void;
  updateDrive: (id: string, val: string) => void;
  updatePublish: (id: string, val: string) => void;
  deleteVideo: (id: string) => void;
  openModal: (stage?: StageId) => void;
  closeModal: () => void;
  saveVideo: () => void;
  addIdea: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<Video[]>(loadVideos);
  const [settings, setSettings] = useState<Settings>(loadSettings);

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

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
    } catch {
      /* ignore quota */
    }
  }, [videos]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  // apply accent to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accentColor);
  }, [settings.accentColor]);

  const store = useMemo<Store>(() => {
    const setForm = (patch: Partial<VideoForm>) =>
      setFormState((f) => ({ ...f, ...patch }));

    const setStage = (id: string, stageId: StageId) =>
      setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, stage: stageId } : v)));

    const moveStage = (id: string, dir: -1 | 1) =>
      setVideos((vs) =>
        vs.map((v) => {
          if (v.id !== id) return v;
          const i = stageIndex(v.stage);
          const ni = Math.max(0, Math.min(STAGES.length - 1, i + dir));
          return { ...v, stage: STAGES[ni].id };
        }),
      );

    const toggleCheck = (id: string, key: string) =>
      setVideos((vs) =>
        vs.map((v) => {
          if (v.id !== id) return v;
          const checks = { ...v.checks, [key]: !v.checks[key] };
          return { ...v, checks };
        }),
      );

    const updateNote = (id: string, val: string) =>
      setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, note: val } : v)));

    const updateDrive = (id: string, val: string) =>
      setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, drive: val } : v)));

    const updatePublish = (id: string, val: string) =>
      setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, publish: val } : v)));

    const deleteVideo = (id: string) => {
      setVideos((vs) => vs.filter((v) => v.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
    };

    const openModal = (stage?: StageId) => {
      setFormState((f) => ({ ...f, stage: stage || 'idea', title: '' }));
      setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    const saveVideo = () => {
      setFormState((f) => {
        if (!f.title.trim()) return f;
        const nv: Video = {
          id: 'v' + Date.now(),
          title: f.title.trim(),
          platform: f.platform,
          stage: f.stage,
          priority: f.priority,
          due: f.due,
          publish: '',
          note: '',
          checks: {},
        };
        setVideos((vs) => [...vs, nv]);
        setModalOpen(false);
        setView('pipeline');
        return { ...f, title: '' };
      });
    };

    const addIdea = () => {
      setIdeaDraft((draft) => {
        const t = draft.trim();
        if (!t) return draft;
        const nv: Video = {
          id: 'v' + Date.now(),
          title: t,
          platform: 'yt',
          stage: 'idea',
          priority: 'low',
          due: ymd(new Date(2026, 6, 1)),
          publish: '',
          note: 'New idea — develop the angle.',
          checks: {},
        };
        setVideos((vs) => [...vs, nv]);
        return '';
      });
    };

    return {
      videos,
      settings,
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
      resetData: () => setVideos(SEED_VIDEOS),
      setStage,
      moveStage,
      toggleCheck,
      updateNote,
      updateDrive,
      updatePublish,
      deleteVideo,
      openModal,
      closeModal,
      saveVideo,
      addIdea,
    };
  }, [
    videos,
    settings,
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
