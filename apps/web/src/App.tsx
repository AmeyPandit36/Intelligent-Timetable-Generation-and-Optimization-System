import { useEffect, useState } from 'react';
import {
  Bell, Bot, Building2, CalendarDays, ChevronDown, CircleGauge, ClipboardList,
  Database, FileUp, GraduationCap, Menu, MessageSquareText, PanelLeftClose,
  Play, Settings2, ShieldCheck, Sparkles, Users, WandSparkles, X,
} from 'lucide-react';
import { api } from './api';
import type { PageId } from './types';
import {
  AcademicPage, AgentPage, DashboardPage, DiagnosticsPage, FacultyPage,
  GenerationPage, ImportsPage, InfrastructurePage, PoliciesPage,
  RequirementsPage, TimetablePage,
} from './pages';

const pageMeta: Record<PageId, { title: string; eyebrow: string }> = {
  dashboard: { title: 'Command center', eyebrow: 'Workspace overview' },
  academic: { title: 'Academic structure', eyebrow: 'Institution setup' },
  faculty: { title: 'Faculty studio', eyebrow: 'People & eligibility' },
  infrastructure: { title: 'Infrastructure', eyebrow: 'Campus resources' },
  requirements: { title: 'Teaching requirements', eyebrow: 'Curriculum setup' },
  policies: { title: 'Policy studio', eyebrow: 'Scheduling preferences' },
  generation: { title: 'Generation studio', eyebrow: 'CP-SAT optimization' },
  timetable: { title: 'Timetable', eyebrow: 'Review & edit' },
  diagnostics: { title: 'Diagnostics', eyebrow: 'Feasibility intelligence' },
  imports: { title: 'Data exchange', eyebrow: 'Import & export' },
  agent: { title: 'Orbit assistant', eyebrow: 'Conversational policies' },
};

const navSections: { label: string; items: { id: PageId; label: string; icon: typeof Bell }[] }[] = [
  { label: 'Workspace', items: [
    { id: 'dashboard', label: 'Command center', icon: CircleGauge },
    { id: 'timetable', label: 'Timetable', icon: CalendarDays },
    { id: 'generation', label: 'Generate', icon: WandSparkles },
  ] },
  { label: 'College data', items: [
    { id: 'academic', label: 'Academic structure', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'infrastructure', label: 'Infrastructure', icon: Building2 },
    { id: 'requirements', label: 'Requirements', icon: ClipboardList },
  ] },
  { label: 'Intelligence', items: [
    { id: 'policies', label: 'Policies', icon: Settings2 },
    { id: 'diagnostics', label: 'Diagnostics', icon: ShieldCheck },
    { id: 'imports', label: 'Data exchange', icon: FileUp },
    { id: 'agent', label: 'Orbit assistant', icon: MessageSquareText },
  ] },
];

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState('');
  const [data, setData] = useState<any>({});

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [dashboard, departments, faculty, resources, policies, diagnostics, schedule] = await Promise.all([
        api.dashboard(), api.departments(), api.faculty(), api.resources(), api.policies(), api.diagnostics(), api.schedule(),
      ]);
      setData({ dashboard, departments, faculty, resources, policies, diagnostics, schedule });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const navigate = (target: PageId) => {
    setPage(target);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shared = { data, setData, navigate, notify: setToast };
  const content = loading ? <WorkspaceSkeleton /> : loadError ? <LoadError message={loadError} retry={loadData} /> : (() => {
    switch (page) {
      case 'dashboard': return <DashboardPage {...shared} />;
      case 'academic': return <AcademicPage {...shared} />;
      case 'faculty': return <FacultyPage {...shared} />;
      case 'infrastructure': return <InfrastructurePage {...shared} />;
      case 'requirements': return <RequirementsPage {...shared} />;
      case 'policies': return <PoliciesPage {...shared} />;
      case 'generation': return <GenerationPage {...shared} />;
      case 'timetable': return <TimetablePage {...shared} />;
      case 'diagnostics': return <DiagnosticsPage {...shared} />;
      case 'imports': return <ImportsPage {...shared} />;
      case 'agent': return <AgentPage {...shared} />;
    }
  })();

  return (
    <div className="app-shell">
      <div className={`mobile-scrim ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><CalendarDays size={21} strokeWidth={2.2} /></div>
          <div><strong>ORBIT</strong><span>Timetable intelligence</span></div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="institution-switcher">
          <div className="institution-avatar">AC</div>
          <div><strong>Apex College</strong><span>Engineering Campus</span></div>
          <ChevronDown size={15} />
        </div>
        <nav>
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <span className="nav-label">{section.label}</span>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
                    <Icon size={18} strokeWidth={1.9} /><span>{item.label}</span>
                    {item.id === 'diagnostics' && <em>2</em>}
                    {item.id === 'agent' && <Sparkles className="nav-sparkle" size={13} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="solver-mini"><span className="live-dot" /><div><strong>Solver online</strong><small>CP-SAT · v9.14</small></div></div>
          <button><PanelLeftClose size={17} /> Collapse menu</button>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="page-title"><span>{pageMeta[page].eyebrow}</span><h1>{pageMeta[page].title}</h1></div>
          <div className="topbar-actions">
            <button className="year-selector"><CalendarDays size={16} /> 2026–27 <ChevronDown size={14} /></button>
            <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
            <button className="avatar-button"><span>AP</span><div><strong>Amey Pandit</strong><small>Administrator</small></div><ChevronDown size={14} /></button>
            {page !== 'generation' && <button className="button primary compact" onClick={() => navigate('generation')}><Play size={15} fill="currentColor" /> Generate</button>}
          </div>
        </header>
        <div className="page-content">{content}</div>
      </main>
      {toast && <div className="toast"><ShieldCheck size={18} /><span>{toast}</span><button onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  );
}

function WorkspaceSkeleton() {
  return <div className="skeleton-page"><div className="skeleton hero" /><div className="skeleton-grid">{[1,2,3,4].map((n) => <div className="skeleton card" key={n} />)}</div><div className="skeleton table" /></div>;
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="load-error"><Database size={32} /><h2>Workspace data is unavailable</h2><p>{message}. Make sure the API service is running, then try again.</p><button className="button primary" onClick={retry}>Retry connection</button></div>;
}

export default App;
