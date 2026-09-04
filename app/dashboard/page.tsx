import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, MapPin, Plus, WalletCards, Users, Film, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

function money(value: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'RSD', maximumFractionDigits: 0 }).format(value || 0);
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase();
}

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div style={{ padding: 32 }}>Please log in.</div>;
  }

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('projects').select('id,name,project_type,status,budget,start_date,end_date').order('created_at', { ascending: false }),
  ]);

  const projectRows = projects ?? [];
  const projectIds = projectRows.map((project) => project.id);

  const [crewResult, scheduleResult, expensesResult] = projectIds.length
    ? await Promise.all([
        supabase.from('crew').select('id,project_id', { count: 'exact', head: false }).in('project_id', projectIds),
        supabase.from('shooting_schedule').select('id,project_id,shoot_date,shoot_day,crew_call', { count: 'exact', head: false }).in('project_id', projectIds),
        supabase.from('expenses').select('actual_amount,project_id').in('project_id', projectIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const crewCount = crewResult.data?.length ?? 0;
  const schedules = scheduleResult.data ?? [];
  const upcomingShoots = schedules.filter((item) => item.shoot_date && new Date(`${item.shoot_date}T23:59:59`) >= new Date()).length;
  const totalBudget = projectRows.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const totalSpent = (expensesResult.data ?? []).reduce((sum, expense) => sum + Number(expense.actual_amount || 0), 0);
  const firstName = (profile?.full_name || user.email || 'Producer').split(' ')[0];

  return (
    <AppShell>
      <div className="top">
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <h1 className="title">Good afternoon, {firstName}.</h1>
          <div className="subtitle">Your production control room. Everything for today's production in one place.</div>
        </div>
        <div className="actions">
          <button className="btn"><CalendarDays size={14}/> Today</button>
          <Link href="/projects/new" className="btn primary"><Plus size={14}/> New project</Link>
        </div>
      </div>

      <div className="grid stats">
        <div className="card"><div className="statlabel">ACTIVE PROJECTS</div><div className="statvalue">{projectRows.length}</div><div className="statmeta">Your projects</div></div>
        <div className="card"><div className="statlabel">CREW MEMBERS</div><div className="statvalue">{crewCount}</div><div className="statmeta">Across your productions</div></div>
        <div className="card"><div className="statlabel">TOTAL BUDGET</div><div className="statvalue">{money(totalBudget)}</div><div className="statmeta">Planned project budgets</div></div>
        <div className="card"><div className="statlabel">UPCOMING SHOOTS</div><div className="statvalue">{upcomingShoots}</div><div className="statmeta">From your shooting schedule</div></div>
      </div>

      <div className="grid two" style={{ marginTop: 13 }}>
        <section className="card">
          <div className="section-head"><div><div className="eyebrow">Live projects</div><h2>Production overview</h2></div><Link href="/projects">View all <ArrowUpRight size={12} style={{ verticalAlign: 'middle' }}/></Link></div>
          {projectRows.length === 0 ? (
            <div className="empty-state"><h3>No projects yet</h3><p>Create your first production project to start building your workspace.</p><Link href="/projects/new" className="btn primary"><Plus size={14}/> New project</Link></div>
          ) : (
            <div className="grid">
              {projectRows.map((project) => {
                const spent = (expensesResult.data ?? []).filter((expense) => expense.project_id === project.id).reduce((sum, expense) => sum + Number(expense.actual_amount || 0), 0);
                const budget = Number(project.budget || 0);
                const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
                return (
                  <Link href={`/projects/${project.id}`} className="project-card" key={project.id}>
                    <div className="project-top">
                      <div style={{ display: 'flex', gap: 11 }}>
                        <div className="project-mark">{initials(project.name)}</div>
                        <div><div className="project-title">{project.name}</div><div className="project-meta">{project.project_type} · {project.status}</div><div className="project-line"/><div className="mini-grid"><div><b>{project.start_date ? new Date(`${project.start_date}T00:00:00`).toLocaleDateString('en-GB') : '—'}</b><span>Start date</span></div><div><b>{money(spent)}</b><span>Spent</span></div><div><b>{money(budget)}</b><span>Budget</span></div></div></div>
                      </div>
                      <span className="pill yellow">{project.status}</span>
                    </div>
                    <div className="progress-row"><span>Budget usage</span><b>{pct}%</b></div><div className="progress"><span style={{ width: `${pct}%` }}/></div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-head"><div><div className="eyebrow">Portfolio</div><h2>Production status</h2></div><span className="pill yellow">{projectRows.length} PROJECT{projectRows.length === 1 ? '' : 'S'}</span></div>
          <div className="kpi"><span><Film size={12} style={{ verticalAlign: 'middle', marginRight: 6 }}/>Projects</span><b>{projectRows.length}</b></div>
          <div className="kpi"><span><Users size={12} style={{ verticalAlign: 'middle', marginRight: 6 }}/>Crew members</span><b>{crewCount}</b></div>
          <div className="kpi"><span><CalendarDays size={12} style={{ verticalAlign: 'middle', marginRight: 6 }}/>Scheduled shoots</span><b>{schedules.length}</b></div>
          <div className="kpi"><span><WalletCards size={12} style={{ verticalAlign: 'middle', marginRight: 6 }}/>Actual spend</span><b>{money(totalSpent)}</b></div>
          <div className="kpi"><span><CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: 6 }}/>Budget remaining</span><b className={totalSpent > totalBudget ? 'danger' : 'positive'}>{money(totalBudget - totalSpent)}</b></div>
          <div style={{ marginTop: 14 }}><div className="eyebrow">Next scheduled shoot</div>{schedules.length ? <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}><Clock3 size={16} color="var(--accent)"/><div><b style={{ fontSize: 11 }}>{schedules[0].shoot_date ? new Date(`${schedules[0].shoot_date}T00:00:00`).toLocaleDateString('en-GB') : 'Date not set'}</b><div className="subtitle">Day {schedules[0].shoot_day}{schedules[0].crew_call ? ` · Crew call ${String(schedules[0].crew_call).slice(0, 5)}` : ''}</div></div></div> : <div className="subtitle" style={{ marginTop: 8 }}>No shooting days scheduled yet.</div>}</div>
        </section>
      </div>

      <div className="grid three" style={{ marginTop: 13 }}>
        <section className="card"><div className="section-head"><div><div className="eyebrow">Next up</div><h2>Shooting schedule</h2></div><Link href="/schedule">Open</Link></div><div className="empty-state compact"><CalendarDays size={18}/><p>{schedules.length ? `${schedules.length} shooting day${schedules.length === 1 ? '' : 's'} in your projects.` : 'No shooting days yet.'}</p></div></section>
        <section className="card"><div className="section-head"><div><div className="eyebrow">People</div><h2>Crew snapshot</h2></div><Link href="/crew">Manage</Link></div><div className="kpi"><span><Users size={12} style={{ verticalAlign: 'middle', marginRight: 6 }}/>Crew members</span><b>{crewCount}</b></div><div className="kpi"><span>Projects with crew</span><b>{new Set((crewResult.data ?? []).map((member) => member.project_id)).size}</b></div></section>
        <section className="card"><div className="section-head"><div><div className="eyebrow">Quick actions</div><h2>Common tasks</h2></div></div><div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}><Link href="/projects/new" className="btn">+ Project</Link><Link href="/scenes" className="btn">+ Scene</Link><Link href="/crew" className="btn">+ Crew</Link><Link href="/locations" className="btn">+ Location</Link><Link href="/budget" className="btn">+ Expense</Link><Link href="/reports" className="btn">+ Report</Link></div></section>
      </div>
    </AppShell>
  );
}
