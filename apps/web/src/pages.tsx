import { DragEvent, FormEvent, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowDownToLine, ArrowRight, BadgeCheck, BarChart3, BookOpen,
  Bot, Building, Building2, Calendar, CalendarCheck, Check, CheckCircle2,
  ChevronDown, ChevronRight, CircleAlert, CircleCheck, Clock3, Database,
  Download, FileDown, FileSpreadsheet, FileUp, Filter, GraduationCap, GripVertical,
  Info, Layers3, Lightbulb, ListFilter, MapPin, MessageSquareText, MoreHorizontal,
  Move, Network, PanelRightOpen, Pencil, Play, Plus, RefreshCw, Search, Send,
  Settings2, ShieldAlert, ShieldCheck, SlidersHorizontal, Sparkles, SquareArrowOutUpRight,
  Table2, UploadCloud, UserCheck, Users, WandSparkles, X, Zap,
} from 'lucide-react';
import { api } from './api';
import type { Assignment, Faculty, PageId, Policy, Resource } from './types';

type SharedProps = {
  data: any;
  setData: (update: any) => void;
  navigate: (page: PageId) => void;
  notify: (message: string) => void;
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

export function DashboardPage({ data, navigate }: SharedProps) {
  const dashboard = data.dashboard;
  return (
    <div className="page-stack dashboard-page">
      <section className="welcome-band">
        <div className="welcome-copy">
          <span className="section-kicker"><Sparkles size={14} /> Semester planning · 2026–27</span>
          <h2>Your college is nearly ready to schedule.</h2>
          <p>All hard-constraint data is healthy. Complete the remaining teaching assignments, then generate a conflict-free master timetable.</p>
          <div className="welcome-actions">
            <button className="button lime" onClick={() => navigate('generation')}><WandSparkles size={17} /> Open generation studio</button>
            <button className="button ghost-light" onClick={() => navigate('requirements')}>Review missing data <ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="readiness-ring" style={{ '--progress': `${dashboard.readinessScore * 3.6}deg` } as React.CSSProperties}>
          <div><strong>{dashboard.readinessScore}<sup>%</sup></strong><span>Data readiness</span></div>
        </div>
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
      </section>

      <section className="metric-grid">
        <MetricCard icon={GraduationCap} tone="teal" value={dashboard.entities.departments} label="Departments" detail={`${dashboard.entities.programs} active programs`} />
        <MetricCard icon={Users} tone="blue" value={dashboard.entities.faculty} label="Faculty members" detail={`${dashboard.entities.students.toLocaleString()} enrolled students`} />
        <MetricCard icon={Building2} tone="amber" value={dashboard.entities.resources} label="Campus resources" detail="54 rooms · 12 labs · 2 workshops" />
        <MetricCard icon={BookOpen} tone="purple" value={dashboard.entities.requirements} label="Weekly sessions" detail="427 fully configured" flag="57 need review" />
      </section>

      <section className="dashboard-columns">
        <div className="panel readiness-panel">
          <PanelHeader title="Setup readiness" subtitle="Data required for a reliable generation run" action="Review all" onAction={() => navigate('academic')} />
          <div className="readiness-list">
            {dashboard.readiness.map((item: any, index: number) => (
              <div className="readiness-item" key={item.label}>
                <div className={`readiness-icon r-${index}`}><Check size={15} /></div>
                <div className="readiness-copy"><div><strong>{item.label}</strong><span>{item.count}</span></div><div className="progress-track"><i style={{ width: `${item.value}%` }} /></div></div>
                <b>{item.value}%</b>
              </div>
            ))}
          </div>
          <div className="readiness-note"><Lightbulb size={18} /><div><strong>Recommended next step</strong><p>Map eligibility for 7 faculty members to unlock all teaching requirements.</p></div><button onClick={() => navigate('faculty')}><ArrowRight size={16} /></button></div>
        </div>

        <div className="panel run-panel">
          <PanelHeader title="Latest solver run" subtitle={dashboard.latestRun.generatedAt} action="Open timetable" onAction={() => navigate('timetable')} />
          <div className="run-status-row"><span className="status-pill success"><CheckCircle2 size={14} /> Feasible</span><span>Run #024</span></div>
          <div className="score-block"><div><span>Optimization score</span><strong>{dashboard.latestRun.objectiveScore}</strong><small>↓ 14% from prior run</small></div><div className="score-gauge"><i style={{ width: '82%' }} /></div></div>
          <div className="run-metrics">
            <div><strong>{dashboard.latestRun.sessionsPlaced}</strong><span>Sessions placed</span></div>
            <div><strong>{dashboard.latestRun.durationSeconds}s</strong><span>Solve time</span></div>
            <div><strong className="green-text">{dashboard.latestRun.hardConflicts}</strong><span>Hard conflicts</span></div>
          </div>
          <div className="solver-stage"><div className="stage done"><Check size={12} /> Validate</div><span /><div className="stage done"><Check size={12} /> Feasible</div><span /><div className="stage done"><Check size={12} /> Optimize</div></div>
        </div>
      </section>

      <section className="dashboard-columns lower">
        <div className="panel activity-panel">
          <PanelHeader title="College footprint" subtitle="Active scheduling entities by department" action="Manage structure" onAction={() => navigate('academic')} />
          <div className="department-bars">
            {data.departments.slice(0, 6).map((department: any) => (
              <div key={department.id} className="department-bar-row"><span className="dept-code" style={{ background: `${department.color}18`, color: department.color }}>{department.code}</span><div><i style={{ width: `${Math.max(26, department.students / 5)}px`, background: department.color }} /></div><b>{department.students}</b></div>
            ))}
          </div>
          <div className="chart-legend"><span><i className="legend-dot teal-bg" /> Enrolled students</span><small>2,372 total</small></div>
        </div>
        <div className="panel upcoming-panel">
          <PanelHeader title="Planning timeline" subtitle="Key dates for this timetable cycle" />
          <div className="timeline-list">
            {dashboard.upcoming.map((event: any, index: number) => <div className="timeline-item" key={event.title}><div className={`date-tile d-${index}`}><strong>{event.date.split(' ')[0]}</strong><span>{event.date.split(' ')[1]}</span></div><div><strong>{event.title}</strong><span>{event.owner}</span></div><em>{event.type}</em></div>)}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, tone, value, label, detail, flag }: any) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={20} /></div><div className="metric-value"><strong>{formatNumber(value)}</strong><span>{label}</span></div><p>{detail}</p>{flag && <em><AlertCircle size={12} /> {flag}</em>}<ChevronRight className="metric-arrow" size={18} /></div>;
}

function PanelHeader({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return <div className="panel-header"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action && <button onClick={onAction}>{action} <ChevronRight size={14} /></button>}</div>;
}

export function AcademicPage({ data, notify }: SharedProps) {
  const [selected, setSelected] = useState(data.departments[0]);
  return (
    <div className="page-stack">
      <PageIntro title="Model your college hierarchy" description="Programs, levels, divisions, and batches form the cohort boundaries enforced by the solver." actions={<button className="button primary" onClick={() => notify('Department creation form opened')}><Plus size={16} /> Add department</button>} />
      <div className="stats-strip"><MiniStat label="Departments" value="8" note="All active" /><MiniStat label="Programs" value="9" note="UG & PG" /><MiniStat label="Academic levels" value="34" note="Across programs" /><MiniStat label="Student cohorts" value="82" note="44 divisions · 38 batches" /></div>
      <div className="structure-layout">
        <aside className="panel structure-list">
          <div className="list-search"><Search size={16} /><input placeholder="Find a department" /></div>
          {data.departments.map((department: any) => <button key={department.id} className={selected.id === department.id ? 'selected' : ''} onClick={() => setSelected(department)}><span className="dept-monogram" style={{ background: department.color }}>{department.code.slice(0, 2)}</span><div><strong>{department.name}</strong><small>{department.faculty} faculty · {department.students} students</small></div><ChevronRight size={16} /></button>)}
        </aside>
        <section className="panel structure-detail">
          <div className="detail-banner" style={{ '--dept-color': selected.color } as React.CSSProperties}><div className="large-monogram" style={{ background: selected.color }}>{selected.code}</div><div><span>Department</span><h2>{selected.name}</h2><p>{selected.code} · B.Tech · Established 2001</p></div><button className="button secondary"><Pencil size={15} /> Edit details</button></div>
          <div className="hierarchy-title"><div><h3>B.Tech {selected.name}</h3><p>4 academic levels · {selected.students} enrolled students</p></div><button className="button text"><Plus size={15} /> Add level</button></div>
          <div className="level-grid">
            {['First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((level, index) => <div className="level-card" key={level}><div className="level-card-top"><span>{index + 1}</span><div><strong>{level}</strong><small>{['FE','SE','TE','BE'][index]} · Semester {index * 2 + 1} & {index * 2 + 2}</small></div><MoreHorizontal size={17} /></div><div className="cohort-row"><span><Users size={14} /> {index === 0 ? 72 : index === 1 ? 68 : index === 2 ? 74 : 70} students</span><span><Layers3 size={14} /> 2 divisions</span></div><div className="division-chips"><b>Division A <small>2 batches</small></b><b>Division B <small>2 batches</small></b></div></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}

export function FacultyPage({ data, notify }: SharedProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Faculty | null>(null);
  const list = (data.faculty as Faculty[]).filter((item) => `${item.name} ${item.department} ${item.code}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="page-stack">
      <PageIntro title="Faculty capacity & teaching rights" description="Eligibility and workload limits are hard constraints. Every requirement must map to an approved, available faculty member." actions={<><button className="button secondary"><FileUp size={16} /> Import</button><button className="button primary" onClick={() => notify('New faculty form ready')}><Plus size={16} /> Add faculty</button></>} />
      <div className="stats-strip faculty-stats"><MiniStat label="Active faculty" value="119" note="Across 8 departments" /><MiniStat label="Eligibility mapped" value="94%" note="7 profiles need action" tone="warning" /><MiniStat label="Average workload" value="14.6h" note="of 18h weekly cap" /><MiniStat label="Hard blackouts" value="43" note="Availability rules" /></div>
      <div className="panel table-panel">
        <div className="toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search faculty, code or department…" /></div><button className="filter-button"><Filter size={15} /> Department <ChevronDown size={14} /></button><button className="filter-button"><UserCheck size={15} /> Eligibility <ChevronDown size={14} /></button><span className="toolbar-count">{list.length} faculty shown</span><button className="icon-button"><SlidersHorizontal size={17} /></button></div>
        <div className="data-table faculty-table">
          <div className="table-row table-head"><span>Faculty member</span><span>Department</span><span>Eligibility</span><span>Weekly workload</span><span>Availability</span><span /></div>
          {list.map((member) => <div className="table-row" key={member.id} onClick={() => setSelected(member)}><span className="person-cell"><i>{member.initials}</i><div><strong>{member.name}</strong><small>{member.code} · {member.title}</small></div></span><span><b className="soft-chip">{member.department}</b></span><span><strong>{member.eligibleSubjects.length} subjects</strong><small className="cell-subtext">{member.eligibleSubjects.slice(0, 2).join(', ')}</small></span><span className="workload-cell"><span><strong>{member.assignedHours}h</strong> / {member.maxWeeklyWorkload}h</span><i><b style={{ width: `${member.assignedHours / member.maxWeeklyWorkload * 100}%` }} /></i></span><span><b className={`status-text ${member.status === 'LIMITED' ? 'limited' : ''}`}><i /> {member.status === 'LIMITED' ? 'Limited' : 'Available'}</b><small className="cell-subtext">{member.unavailable[0] || 'No blackouts'}</small></span><span><MoreHorizontal size={17} /></span></div>)}
        </div>
      </div>
      {selected && <FacultyDrawer member={selected} close={() => setSelected(null)} notify={notify} />}
    </div>
  );
}

function FacultyDrawer({ member, close, notify }: { member: Faculty; close: () => void; notify: (s: string) => void }) {
  return <><div className="drawer-scrim" onClick={close} /><aside className="drawer"><div className="drawer-header"><span>Faculty profile</span><button onClick={close}><X size={18} /></button></div><div className="faculty-profile"><i>{member.initials}</i><h2>{member.name}</h2><p>{member.title} · {member.department}</p><span>{member.email}</span></div><div className="drawer-section"><div className="drawer-section-title"><h3>Weekly workload</h3><strong>{member.assignedHours} / {member.maxWeeklyWorkload}h</strong></div><div className="large-progress"><i style={{ width: `${member.assignedHours/member.maxWeeklyWorkload*100}%` }} /></div><p>{member.maxWeeklyWorkload - member.assignedHours} hours remain within the hard workload cap.</p></div><div className="drawer-section"><div className="drawer-section-title"><h3>Subject eligibility</h3><button><Plus size={14} /> Add</button></div><div className="eligibility-list">{member.eligibleSubjects.map((subject, index) => <div key={subject}><BadgeCheck size={17} /><span><strong>{subject}</strong><small>{index === 0 ? 'Primary instructor' : 'Approved'}</small></span><MoreHorizontal size={15} /></div>)}</div></div><div className="drawer-section"><h3>Hard unavailability</h3>{member.unavailable.length ? member.unavailable.map((item) => <div className="blackout" key={item}><Calendar size={16} /><span>{item}</span></div>) : <p className="empty-note">No availability blackouts configured.</p>}</div><div className="drawer-actions"><button className="button secondary" onClick={close}>Close</button><button className="button primary" onClick={() => notify('Faculty profile updated')}><Pencil size={15} /> Edit profile</button></div></aside></>;
}

export function InfrastructurePage({ data, notify }: SharedProps) {
  const [type, setType] = useState('ALL');
  const resources = (data.resources as Resource[]).filter((room) => type === 'ALL' || room.type === type);
  return <div className="page-stack"><PageIntro title="Campus resource map" description="Map physical rooms to ownership, capacity and capabilities so every solver candidate is operationally valid." actions={<><button className="button secondary"><Building size={16} /> Add building</button><button className="button primary" onClick={() => notify('Resource form opened')}><Plus size={16} /> Add resource</button></>} />
    <div className="campus-overview panel"><div className="campus-copy"><span className="section-kicker dark"><MapPin size={14} /> Apex College Campus</span><h2>3 buildings · 12 floors · 68 active resources</h2><p>Technology Block carries 61% of all lab sessions.</p></div><div className="building-map"><div className="building-shape b-main"><span>Main</span><i /><i /><i /></div><div className="building-shape b-tech"><span>Technology</span><i /><i /><i /><i /></div><div className="building-shape b-work"><span>Workshop</span><i /><i /></div><svg viewBox="0 0 400 110"><path d="M30 85 C120 15 240 115 370 35" /></svg></div><div className="campus-legend"><span><i className="dot green" /> Operational</span><span><i className="dot amber" /> High utilization</span></div></div>
    <div className="resource-toolbar"><div className="segmented">{['ALL','CLASSROOM','LAB','WORKSHOP'].map((item) => <button className={type === item ? 'active' : ''} key={item} onClick={() => setType(item)}>{item === 'ALL' ? 'All resources' : item[0] + item.slice(1).toLowerCase()}</button>)}</div><div className="search-box small"><Search size={16} /><input placeholder="Find a room…" /></div><button className="filter-button"><Filter size={15} /> Filters</button></div>
    <div className="resource-grid">{resources.map((room) => <div className="resource-card" key={room.id}><div className="resource-card-head"><span className={`resource-type-icon ${room.type.toLowerCase()}`}>{room.type === 'LAB' ? <Database size={19} /> : room.type === 'WORKSHOP' ? <Settings2 size={19} /> : <Table2 size={19} />}</span><div><span>{room.type}</span><h3>{room.name}</h3></div><MoreHorizontal size={17} /></div><div className="resource-location"><MapPin size={14} /> {room.building} · {room.floor}</div><div className="resource-facts"><span><strong>{room.capacity}</strong> seats</span><span><strong>{room.department}</strong> owner</span><span><strong>{room.capabilities.length}</strong> capabilities</span></div><div className="capability-chips">{room.capabilities.map((cap) => <b key={cap}>{cap}</b>)}</div><div className="utilization"><span>Weekly utilization <strong>{room.utilization}%</strong></span><i><b className={room.utilization > 88 ? 'hot' : ''} style={{ width: `${room.utilization}%` }} /></i></div></div>)}</div>
  </div>;
}

export function RequirementsPage({ notify }: SharedProps) {
  const requirements = [
    ['IT301', 'Database Systems', 'TY IT · Division A', 'Dr. Meena Iyer', 'LECTURE', '1 × 3', 'CLASSROOM', 'Ready'],
    ['IT302L', 'SQL Laboratory', 'TY IT · Batch A1', 'Dr. Meena Iyer', 'PRACTICAL', '2 × 1', 'LAB', 'Ready'],
    ['IT303', 'Computer Networks', 'TY IT · Division A', 'Prof. Rahul Patil', 'LECTURE', '1 × 3', 'CLASSROOM', 'Ready'],
    ['IT304L', 'Network Laboratory', 'TY IT · Batch A1', 'Prof. Rahul Patil', 'PRACTICAL', '2 × 1', 'LAB', 'Ready'],
    ['IT305', 'Operating Systems', 'TY IT · Division A', 'Dr. Kavita Shah', 'LECTURE', '1 × 3', 'CLASSROOM', 'Warning'],
    ['ILOC301', 'Data Analytics', 'TY IT · Divisions A+B', 'Dr. Sneha Joshi', 'LECTURE', '1 × 2', 'CLASSROOM', 'Ready'],
  ];
  return <div className="page-stack"><PageIntro title="Translate curriculum into sessions" description="Each requirement expands into discrete schedulable sessions with duration, cohort, faculty and resource constraints." actions={<><button className="button secondary"><FileUp size={16} /> Bulk import</button><button className="button primary" onClick={() => notify('Teaching requirement draft created')}><Plus size={16} /> New requirement</button></>} />
    <div className="stats-strip"><MiniStat label="Requirements" value="484" note="427 generation-ready" /><MiniStat label="Expanded sessions" value="612" note="Per teaching week" /><MiniStat label="Practical hours" value="238" note="Continuous blocks" /><MiniStat label="Needs attention" value="57" note="Faculty or room missing" tone="warning" /></div>
    <div className="panel table-panel"><div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder="Search subject, cohort or faculty…" /></div><button className="filter-button"><GraduationCap size={15} /> TY IT <ChevronDown size={14} /></button><button className="filter-button"><ListFilter size={15} /> All types <ChevronDown size={14} /></button><span className="toolbar-count">6 of 62 shown</span></div><div className="data-table requirements-table"><div className="table-row table-head"><span>Subject</span><span>Student cohort</span><span>Faculty</span><span>Type</span><span>Duration × weekly</span><span>Resource</span><span>Status</span></div>{requirements.map((row) => <div className="table-row" key={`${row[0]}-${row[2]}`}><span><strong>{row[1]}</strong><small className="cell-subtext">{row[0]}</small></span><span>{row[2]}</span><span>{row[3]}</span><span><b className={`session-badge ${row[4].toLowerCase()}`}>{row[4]}</b></span><span>{row[5]}</span><span>{row[6]}</span><span><b className={`requirement-status ${row[7].toLowerCase()}`}>{row[7] === 'Ready' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{row[7]}</b></span></div>)}</div></div>
  </div>;
}

export function PoliciesPage({ data, setData, navigate, notify }: SharedProps) {
  const toggle = async (policy: Policy) => {
    const updated = await api.togglePolicy(policy.id);
    setData({ ...data, policies: data.policies.map((item: Policy) => item.id === policy.id ? updated : item) });
    notify(`${updated.name} ${updated.active ? 'enabled' : 'paused'}`);
  };
  return <div className="page-stack"><PageIntro title="Shape optimization without hard-coding" description="Policies guide room priority, compactness and movement. They can improve a valid schedule, but never override hard constraints." actions={<><button className="button agent-button" onClick={() => navigate('agent')}><Sparkles size={16} /> Describe a policy</button><button className="button primary" onClick={() => notify('Policy builder opened')}><Plus size={16} /> Create policy</button></>} />
    <div className="policy-explainer"><div><ShieldCheck size={20} /><span><strong>Hard constraints remain absolute</strong><p>Policy weights only rank feasible assignments. Capacity, eligibility, workload and collision rules cannot be relaxed.</p></span></div><button>Learn how weighting works <SquareArrowOutUpRight size={14} /></button></div>
    <div className="policy-layout"><div className="policy-list"><div className="section-heading"><div><h3>Active policy set</h3><p>{data.policies.filter((p: Policy) => p.active).length} active · Applied to the next generation run</p></div><button className="filter-button"><Filter size={15} /> All policies <ChevronDown size={14} /></button></div>{data.policies.map((policy: Policy) => <div className={`policy-card ${!policy.active ? 'disabled' : ''}`} key={policy.id}><div className={`policy-icon ${policy.type.toLowerCase()}`}>{policy.type === 'RESOURCE_FALLBACK' ? <Building2 size={19} /> : policy.type === 'GAP_MINIMIZATION' ? <Clock3 size={19} /> : policy.type === 'BUILDING_MOVEMENT' ? <Move size={19} /> : <Calendar size={19} />}</div><div className="policy-copy"><div><h3>{policy.name}</h3><b>{policy.department}</b></div><p>{policy.description}</p>{policy.primaryOwner && <div className="fallback-path"><span>{policy.primaryOwner}<small>Primary</small></span><ArrowRight size={14} />{policy.fallbackOwners.map((owner, index) => <span key={owner}>{owner}<small>Fallback {index + 1}</small></span>)}</div>}<div className="policy-meta"><span><SlidersHorizontal size={13} /> Weight {policy.weight}</span><span>Updated {policy.updatedAt}</span></div></div><div className="policy-controls"><button className={`toggle ${policy.active ? 'on' : ''}`} onClick={() => toggle(policy)}><i /></button><button><MoreHorizontal size={18} /></button></div></div>)}</div>
      <aside className="panel objective-panel"><span className="section-kicker dark"><BarChart3 size={14} /> Objective mix</span><h3>Optimization weights</h3><p>Relative influence on CP-SAT's objective score.</p><div className="weight-chart">{[['Resource priority',100,'#28786d'],['Compact faculty days',70,'#54749e'],['Compact student days',65,'#7b5da8'],['Campus movement',45,'#b47b38']].map(([label,value,color]) => <div key={label as string}><span>{label}<b>{value}</b></span><i><em style={{ width: `${value}%`, background: color as string }} /></i></div>)}</div><div className="objective-total"><span>Current objective</span><strong>Minimize <i>Z</i></strong><small>4 weighted penalty groups</small></div><button className="button secondary full"><Settings2 size={15} /> Tune objectives</button></aside></div>
  </div>;
}

export function GenerationPage({ data, setData, navigate, notify }: SharedProps) {
  const [timeLimit, setTimeLimit] = useState(120);
  const [scope, setScope] = useState('All departments');
  const [optimizations, setOptimizations] = useState({ gaps: true, movement: true, fallback: true });
  const [status, setStatus] = useState<'idle'|'running'|'complete'>('idle');
  const [result, setResult] = useState<any>(null);
  const generate = async () => {
    setStatus('running'); setResult(null);
    try {
      const generated = await api.generate({ academicYear: '2026–27', department: scope, timeLimitSeconds: timeLimit, optimizeGaps: optimizations.gaps, optimizeMovement: optimizations.movement });
      setResult(generated); setStatus('complete');
      setData({ ...data, schedule: { ...data.schedule, assignments: generated.assignments, validation: { valid: true, hardConflicts: 0, warnings: 1 }, objectiveScore: generated.metrics.objectiveScore } });
      notify('Optimal timetable generated and validated');
    } catch (error) { setStatus('idle'); notify(error instanceof Error ? error.message : 'Generation failed'); }
  };
  return <div className="page-stack generation-page"><div className="generation-hero"><div><span className="section-kicker"><Zap size={14} /> Deterministic optimization</span><h2>Turn institutional constraints into one viable week.</h2><p>Orbit expands 484 teaching requirements, searches valid candidates, and asks CP-SAT to minimize your active policy penalties.</p></div><div className="engine-badge"><span className="live-dot" /><div><strong>OR-Tools CP-SAT</strong><small>Healthy · 8 search workers</small></div></div></div>
    <div className="generation-layout"><section className="generation-config"><div className="config-section"><div className="config-number">1</div><div className="config-body"><h3>Generation scope</h3><p>Choose the data included in this solver run.</p><label>Academic year<select><option>2026–27 · Current</option></select><ChevronDown size={15} /></label><label>Department scope<select value={scope} onChange={(e) => setScope(e.target.value)}><option>All departments</option><option>Information Technology</option><option>First Year Engineering</option></select><ChevronDown size={15} /></label><div className="scope-summary"><span><GraduationCap size={16} /> 8 departments</span><span><BookOpen size={16} /> 484 requirements</span><span><Users size={16} /> 82 cohorts</span></div></div></div>
      <div className="config-section"><div className="config-number">2</div><div className="config-body"><h3>Optimization strategy</h3><p>Select which soft objectives should improve the feasible solution.</p>{[['gaps','Compact faculty & student days','Minimize idle windows between sessions',Clock3],['movement','Reduce building movement','Keep consecutive sessions physically close',Move],['fallback','Prefer department-owned rooms','Use configured fallback resources only when needed',Building2]].map(([key,title,desc,Icon]) => { const ObjectiveIcon = Icon as typeof Clock3; return <button className={`objective-toggle ${optimizations[key as keyof typeof optimizations] ? 'selected' : ''}`} key={key as string} onClick={() => setOptimizations({ ...optimizations, [key as string]: !optimizations[key as keyof typeof optimizations] })}><span><ObjectiveIcon size={18} /></span><div><strong>{title as string}</strong><small>{desc as string}</small></div><i>{optimizations[key as keyof typeof optimizations] && <Check size={12} />}</i></button>;})}</div></div>
      <div className="config-section"><div className="config-number">3</div><div className="config-body"><h3>Search budget</h3><p>Best feasible solution is retained if optimization reaches the limit.</p><div className="range-label"><span>Time limit</span><strong>{timeLimit} seconds</strong></div><input type="range" min="30" max="300" step="30" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} /><div className="range-marks"><span>30s</span><span>Balanced</span><span>300s</span></div></div></div>
    </section>
    <aside className="run-console panel"><div className="console-head"><div><span>Preflight</span><h3>Ready to generate</h3></div><span className="status-pill success"><CheckCircle2 size={14} /> All checks passed</span></div><div className="preflight-list">{[['Academic structure','82 schedulable cohorts'],['Faculty eligibility','484 requirements mapped'],['Workload caps','119 faculty within limits'],['Resource candidates','2,946 valid combinations'],['Hard blackouts','43 rules compiled'],['Policy objective','4 weighted groups']].map(([title,note]) => <div key={title}><CheckCircle2 size={16} /><span><strong>{title}</strong><small>{note}</small></span></div>)}</div>{status === 'running' && <div className="solver-running"><div className="solver-spinner"><i /><span><WandSparkles size={20} /></span></div><strong>Optimizing timetable…</strong><p>Searching candidate assignments and minimizing policy penalties.</p><div className="solver-progress"><i /></div><div className="live-stages"><span className="done">Sessions built</span><span className="active">CP-SAT search</span><span>Independent validation</span></div></div>}{status === 'complete' && result && <div className="solver-result"><div className="result-check"><Check size={26} /></div><h3>Optimal solution found</h3><p>Every session is assigned with zero hard conflicts.</p><div className="result-metrics"><span><strong>{result.metrics.sessionsPlaced}</strong>Placed</span><span><strong>{result.metrics.objectiveScore}</strong>Score</span><span><strong>{result.metrics.durationSeconds}s</strong>Time</span></div><button className="button secondary full" onClick={() => navigate('timetable')}>Review timetable <ArrowRight size={16} /></button></div>}{status === 'idle' && <div className="impact-preview"><span>Expected run</span><div><Clock3 size={17} /><p><strong>30–90 seconds</strong><small>Based on current data volume</small></p></div><div><ShieldCheck size={17} /><p><strong>Hard constraints locked</strong><small>No rule relaxation permitted</small></p></div></div>}<button className="button lime dark-text full generate-button" onClick={generate} disabled={status === 'running'}>{status === 'running' ? <><RefreshCw className="spin" size={17} /> Solver running</> : <><Play fill="currentColor" size={17} /> Generate timetable</>}</button><small className="console-footnote">A new draft version will be created. Published timetables are never overwritten.</small></aside>
    </div>
  </div>;
}

export function TimetablePage({ data, setData, notify }: SharedProps) {
  const schedule = data.schedule;
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [dragged, setDragged] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState('TY IT — A');
  const assignments = schedule.assignments.filter((item: Assignment) => item.cohort.startsWith('TY IT'));
  const drop = async (event: DragEvent, day: string, startSlot: number) => {
    event.preventDefault();
    if (!dragged) return;
    const validation = await api.validateMove({ assignmentId: dragged.id, day, startSlot, roomId: dragged.roomId });
    if (!validation.valid) { notify(validation.conflicts[0] || 'This move violates a hard constraint'); setDragged(null); return; }
    const updatedAssignments = schedule.assignments.map((item: Assignment) => item.id === dragged.id ? { ...item, day, startSlot } : item);
    setData({ ...data, schedule: { ...schedule, assignments: updatedAssignments } });
    notify('Session moved — all hard constraints revalidated'); setDragged(null);
  };
  return <div className="page-stack timetable-page"><div className="timetable-meta"><div><span className="status-pill draft">Draft · Version {schedule.version}</span><h2>{schedule.name}</h2><p>Generated {schedule.generatedAt} · Objective score {schedule.objectiveScore}</p></div><div className="validation-summary"><ShieldCheck size={20} /><div><strong>Valid timetable</strong><span>0 hard conflicts · {schedule.validation.warnings} advisories</span></div></div><div className="timetable-actions"><button className="button secondary"><Download size={16} /> Export</button><button className={`button ${editMode ? 'primary' : 'secondary'}`} onClick={() => setEditMode(!editMode)}><Move size={16} /> {editMode ? 'Finish editing' : 'Edit grid'}</button><button className="button primary" onClick={() => notify('Timetable sent for academic review')}><CalendarCheck size={16} /> Send for review</button></div></div>
    <div className="timetable-toolbar"><div className="view-switch"><button className="active"><Users size={15} /> Cohort</button><button><UserCheck size={15} /> Faculty</button><button><Building2 size={15} /> Room</button></div><label><GraduationCap size={15} /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>TY IT — A</option><option>TY IT — B</option><option>All IT cohorts</option></select><ChevronDown size={14} /></label><button className="filter-button"><Calendar size={15} /> Full week</button><span className="grid-legend"><i className="lecture-dot" /> Lecture <i className="practical-dot" /> Practical <i className="tutorial-dot" /> Tutorial</span></div>
    {editMode && <div className="edit-notice"><Move size={17} /><div><strong>Grid editing is on</strong><span>Drag a session to another slot. Orbit validates room, faculty, cohort, capacity and blackout constraints before applying the move.</span></div><button><ShieldCheck size={15} /> Live validation</button></div>}
    <div className="schedule-scroll"><div className="schedule-grid" style={{ '--columns': schedule.slots.length } as React.CSSProperties}><div className="grid-corner"><span>DAY</span><small>TIME</small></div>{schedule.slots.map((slot: any) => <div className="time-head" key={slot.label}><strong>{slot.label}</strong><span>{slot.end}</span></div>)}{schedule.days.map((day: string) => <div className="day-row" key={day}><div className="day-label"><strong>{day.slice(0,3).toUpperCase()}</strong><span>{assignments.filter((a: Assignment) => a.day === day).reduce((sum: number, a: Assignment) => sum + a.duration, 0)}h scheduled</span></div><div className="day-slots">{schedule.slots.map((_: any, slotIndex: number) => <div className="drop-cell" key={slotIndex} onDragOver={(e) => editMode && e.preventDefault()} onDrop={(e) => drop(e, day, slotIndex)} />)}{assignments.filter((a: Assignment) => a.day === day).map((assignment: Assignment) => <button draggable={editMode} onDragStart={() => setDragged(assignment)} onDragEnd={() => setDragged(null)} onClick={() => setSelected(assignment)} key={assignment.id} className={`session-card ${assignment.color} ${assignment.type.toLowerCase()} ${dragged?.id === assignment.id ? 'dragging' : ''}`} style={{ gridColumn: `${assignment.startSlot + 1} / span ${assignment.duration}` }}><span className="session-top"><b>{assignment.subjectCode}</b>{editMode ? <GripVertical size={13} /> : <em>{assignment.type === 'PRACTICAL' ? 'LAB' : assignment.type.slice(0,3)}</em>}</span><strong>{assignment.subjectName}</strong><small><MapPin size={11} /> {assignment.roomName}</small><small><UserCheck size={11} /> {assignment.facultyName.replace('Prof. ', '').replace('Dr. ', '')}</small></button>)}</div></div>)}</div></div>
    <div className="timetable-foot"><span><Info size={15} /> Lunch interval 13:15–14:00 is excluded from scheduling candidates.</span><span>19 sessions · 24 contact hours · {filter}</span></div>
    {selected && <SessionDrawer assignment={selected} close={() => setSelected(null)} notify={notify} />}
  </div>;
}

function SessionDrawer({ assignment, close, notify }: { assignment: Assignment; close: () => void; notify: (s: string) => void }) {
  return <><div className="drawer-scrim" onClick={close} /><aside className="drawer session-drawer"><div className="drawer-header"><span>Session details</span><button onClick={close}><X size={18} /></button></div><div className={`session-detail-hero ${assignment.color}`}><span>{assignment.type}</span><h2>{assignment.subjectName}</h2><p>{assignment.subjectCode} · {assignment.cohort}</p></div><div className="session-facts"><div><Calendar size={17} /><span><small>Day</small><strong>{assignment.day}</strong></span></div><div><Clock3 size={17} /><span><small>Duration</small><strong>{assignment.duration} period{assignment.duration > 1 ? 's' : ''}</strong></span></div><div><MapPin size={17} /><span><small>Resource</small><strong>{assignment.roomName}</strong></span></div><div><UserCheck size={17} /><span><small>Faculty</small><strong>{assignment.facultyName}</strong></span></div></div><div className="drawer-section"><h3>Constraint checks</h3><div className="checks-list">{['Faculty eligible for subject','Weekly workload within cap','Room capacity & capabilities','No resource, faculty or cohort collision','No hard availability blackout'].map((check) => <div key={check}><CheckCircle2 size={16} /><span>{check}</span></div>)}</div></div><div className="drawer-actions"><button className="button secondary" onClick={close}>Close</button><button className="button primary" onClick={() => notify('Select a new slot in edit mode')}><Move size={15} /> Move session</button></div></aside></>;
}

export function DiagnosticsPage({ data, navigate }: SharedProps) {
  return <div className="page-stack"><PageIntro title="Understand feasibility before it fails" description="Diagnostics expose scarce resources, narrow availability and policy effects as specific, actionable findings." actions={<button className="button primary"><RefreshCw size={16} /> Run diagnostics</button>} />
    <div className="diagnostic-summary"><div className="health-score"><div className="small-ring"><strong>96</strong></div><span><small>Scheduling health</small><strong>Excellent</strong><p>Core data can produce a feasible timetable.</p></span></div><div><strong>0</strong><span>Blocking errors</span></div><div><strong className="amber-text">2</strong><span>Warnings</span></div><div><strong>14</strong><span>Advisories</span></div><div><strong className="green-text">7</strong><span>Resolved</span></div></div>
    <div className="diagnostics-layout"><div className="finding-list"><div className="section-heading"><div><h3>Active findings</h3><p>Ordered by impact on solver flexibility</p></div><button className="filter-button"><Filter size={15} /> All severity</button></div>{data.diagnostics.map((item: any) => <div className={`finding-card ${item.severity}`} key={item.id}><div className="finding-icon">{item.severity === 'warning' ? <ShieldAlert size={20} /> : item.severity === 'resolved' ? <CircleCheck size={20} /> : <Info size={20} />}</div><div className="finding-copy"><div><b>{item.category}</b><span>{item.entity}</span></div><h3>{item.title}</h3><p>{item.detail}</p><button>{item.action} <ArrowRight size={14} /></button></div><MoreHorizontal size={17} /></div>)}</div><aside className="panel bottleneck-panel"><span className="section-kicker dark"><Network size={14} /> Constraint pressure</span><h3>Most constrained entities</h3><p>Candidate flexibility after hard filtering.</p>{[['IT-L1','Database Laboratory',9,91],['FAC-017','Dr. Kavita Shah',16,79],['TY-IT-A1','Practical cohort',22,62],['AUD-01','Central Auditorium',38,41]].map(([code,name,candidates,pressure]) => <div className="pressure-row" key={code as string}><div><strong>{code}</strong><span>{name}</span></div><b>{candidates} candidates</b><i><em style={{ width: `${pressure}%` }} /></i></div>)}<button className="button secondary full" onClick={() => navigate('generation')}>Open generation studio</button></aside></div>
  </div>;
}

export function ImportsPage({ notify }: SharedProps) {
  const [file, setFile] = useState<string>('');
  const input = useRef<HTMLInputElement>(null);
  const templates = [['Faculty roster','Faculty profiles, workload caps and department','faculty-template.xlsx'],['Teaching requirements','Subjects, cohorts, faculty and weekly hours','requirements-template.xlsx'],['Campus resources','Buildings, rooms, capacity and capabilities','resources-template.xlsx'],['Availability grid','Faculty and room hard blackouts','availability-template.xlsx']];
  return <div className="page-stack"><PageIntro title="Bring institutional data in, take timetables out" description="Validated spreadsheet workflows make onboarding repeatable without compromising relational integrity." />
    <div className="exchange-tabs"><button className="active"><UploadCloud size={16} /> Import data</button><button><FileDown size={16} /> Export timetable</button><button><Clock3 size={16} /> Import history</button></div>
    <div className="import-layout"><section><div className="panel upload-panel"><div className="upload-heading"><span>1</span><div><h3>Choose a data type</h3><p>Start with one of the institution-safe templates.</p></div></div><div className="template-grid">{templates.map(([title,desc,name],index) => <button key={title} className={index === 0 ? 'selected' : ''}><span><FileSpreadsheet size={20} /></span><div><strong>{title}</strong><small>{desc}</small><em><Download size={13} /> {name}</em></div><i>{index === 0 && <Check size={12} />}</i></button>)}</div></div><div className="panel upload-panel"><div className="upload-heading"><span>2</span><div><h3>Upload completed template</h3><p>XLSX or CSV · Maximum 10 MB</p></div></div><div className={`drop-zone ${file ? 'has-file' : ''}`} onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {e.preventDefault(); setFile(e.dataTransfer.files[0]?.name || 'faculty-roster.xlsx');}}>{file ? <><div className="file-ready"><FileSpreadsheet size={24} /><div><strong>{file}</strong><span>42 KB · Ready to validate</span></div><CheckCircle2 size={20} /></div><button className="button primary" onClick={(e) => { e.stopPropagation(); notify('42 rows validated — 40 ready, 2 warnings'); }}>Validate 42 rows</button></> : <><UploadCloud size={32} /><h3>Drop your spreadsheet here</h3><p>or <button>browse files</button> from your computer</p></>}<input ref={input} type="file" accept=".xlsx,.csv" hidden onChange={(e) => setFile(e.target.files?.[0]?.name || '')} /></div></div></section><aside className="panel import-guide"><span className="section-kicker dark"><ShieldCheck size={14} /> Safe import</span><h3>What happens next?</h3>{[['Headers validated','Required columns and data formats are checked.'],['References resolved','Department and subject codes map to existing records.'],['Issues previewed','Nothing is written until you approve clean rows.'],['Atomic commit','All accepted rows save in one database transaction.']].map(([title,desc],index) => <div className="guide-step" key={title}><span>{index+1}</span><div><strong>{title}</strong><p>{desc}</p></div></div>)}<div className="template-tip"><Lightbulb size={17} /><p><strong>Keep codes stable</strong>Use department and subject codes from the downloaded template to prevent duplicate records.</p></div></aside></div>
  </div>;
}

export function AgentPage({ data, setData, navigate, notify }: SharedProps) {
  const [messages, setMessages] = useState<any[]>([
    { role: 'agent', text: 'Hello! I can translate college scheduling preferences into structured policies. I never assign timetable slots myself — the deterministic solver handles that.', time: '10:46 AM' },
  ]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const submit = async (event?: FormEvent) => {
    event?.preventDefault(); if (!text.trim()) return;
    const message = text.trim(); setText(''); setMessages((items) => [...items, { role: 'user', text: message, time: 'Now' }]); setThinking(true);
    try { const response = await api.interpretPolicy(message); setMessages((items) => [...items, { role: 'agent', text: response.response, time: 'Now', tools: response.toolsUsed }]); setProposal(response.proposedPolicy); } finally { setThinking(false); }
  };
  const approve = async () => {
    const created = await api.createPolicy({ ...proposal, active: true });
    setData({ ...data, policies: [created, ...data.policies] }); setProposal(null); setMessages((items) => [...items, { role: 'agent', text: `Policy “${created.name}” is now active and will be compiled into the next optimization objective.`, time: 'Now' }]); notify('Policy approved and activated');
  };
  return <div className="agent-layout"><section className="chat-panel"><div className="chat-context"><div className="agent-avatar"><Bot size={21} /></div><div><strong>Orbit policy assistant</strong><span><i /> Online · Tool access restricted</span></div><button><Settings2 size={17} /></button></div><div className="chat-messages">{messages.map((message,index) => <div className={`chat-message ${message.role}`} key={index}>{message.role === 'agent' && <span className="mini-agent"><Sparkles size={14} /></span>}<div><p>{message.text}</p>{message.tools && <small className="tools-used"><Settings2 size={12} /> Used {message.tools.join(' · ')}</small>}<span>{message.time}</span></div></div>)}{thinking && <div className="chat-message agent"><span className="mini-agent"><Sparkles size={14} /></span><div className="typing"><i /><i /><i /></div></div>}{proposal && <div className="proposal-card"><div className="proposal-head"><span><WandSparkles size={17} /></span><div><small>PROPOSED POLICY</small><h3>{proposal.name}</h3></div><b>Needs approval</b></div><div className="proposal-fields"><div><span>Type</span><strong>{proposal.type.replaceAll('_',' ')}</strong></div><div><span>Department</span><strong>{proposal.department}</strong></div><div><span>Primary owner</span><strong>{proposal.primaryOwner || 'Not applicable'}</strong></div><div><span>Fallback</span><strong>{proposal.fallbackOwners.join(' → ') || 'None'}</strong></div><div><span>Preference weight</span><strong>{proposal.weight}</strong></div></div><div className="proposal-actions"><button className="button secondary" onClick={() => setProposal(null)}>Revise</button><button className="button primary" onClick={approve}><Check size={15} /> Approve policy</button></div></div>}</div><form className="chat-input" onSubmit={submit}><div><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe a scheduling policy…" rows={2} /><button type="submit" disabled={!text.trim()}><Send size={17} /></button></div><span><ShieldCheck size={13} /> Policy actions require your confirmation</span><small>Try: “IT practicals should use IT labs first, then CSE labs.”</small></form></section><aside className="agent-sidebar"><div className="agent-info"><span className="large-agent"><Sparkles size={22} /></span><h3>Safe by design</h3><p>The assistant can understand and explain policy intent, but cannot generate slots, run SQL or bypass authorization.</p></div><div className="tool-boundaries"><h4>Available tools</h4>{[['getDepartments','Read active departments'],['validatePolicy','Check schema & references'],['createPolicy','Requires confirmation'],['explainConflict','Read solver diagnostics']].map(([tool,desc],index) => <div key={tool}><span>{index < 2 ? <Database size={15} /> : index === 2 ? <Plus size={15} /> : <ShieldAlert size={15} />}</span><p><strong>{tool}</strong><small>{desc}</small></p><CheckCircle2 size={14} /></div>)}</div><div className="prompt-ideas"><h4>Example requests</h4>{['Avoid gaps longer than one period for faculty.','Keep first-year classes before 4 PM.','Why is the IT lab schedule constrained?'].map((idea) => <button key={idea} onClick={() => setText(idea)}>{idea}<ArrowRight size={13} /></button>)}</div><button className="button secondary full" onClick={() => navigate('policies')}>View all policies</button></aside></div>;
}

function PageIntro({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-intro"><div><h2>{title}</h2><p>{description}</p></div>{actions && <div className="intro-actions">{actions}</div>}</div>;
}

function MiniStat({ label, value, note, tone }: { label: string; value: string; note: string; tone?: string }) {
  return <div className={`mini-stat ${tone || ''}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
