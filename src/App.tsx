import { Calendar } from './components/Calendar';
import { Dashboard } from './components/Dashboard';
import { Drawer } from './components/Drawer';
import { Ideas } from './components/Ideas';
import { MobileNav } from './components/MobileNav';
import { NewVideoModal } from './components/NewVideoModal';
import { Pipeline } from './components/Pipeline';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { useStore } from './store';

function ViewContent() {
  const s = useStore();
  switch (s.view) {
    case 'pipeline':
      return <Pipeline />;
    case 'calendar':
      return <Calendar />;
    case 'ideas':
      return <Ideas />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  const s = useStore();
  const isMobile = s.device === 'mobile';

  const stageStyle: React.CSSProperties = isMobile
    ? { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e7e5df', padding: 24 }
    : { height: '100vh', display: 'flex', background: 'var(--canvas)' };

  const frameStyle: React.CSSProperties = isMobile
    ? {
        width: 404,
        height: 872,
        maxHeight: '96vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        border: '11px solid #15151a',
        borderRadius: 46,
        overflow: 'hidden',
        background: 'var(--surface)',
      }
    : { flex: 1, display: 'flex', position: 'relative', height: '100vh', overflow: 'hidden', background: 'var(--surface)' };

  return (
    <div style={stageStyle}>
      <div style={frameStyle}>
        {!isMobile && <Sidebar />}

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--canvas)' }}>
          <Topbar />
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <ViewContent />
          </div>
        </main>

        {isMobile && <MobileNav />}

        <Drawer />
        <NewVideoModal />
      </div>
    </div>
  );
}
