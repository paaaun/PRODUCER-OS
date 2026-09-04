'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Mail, Plus, Trash2, Users, X } from 'lucide-react';

type Project = { id: string; name: string };
type Member = { user_id: string; email: string | null; full_name: string | null; role: string | null };

export default function TeamPage() {
  const sb = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [ownerId, setOwnerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadProjects() {
    const { data, error } = await sb.from('projects').select('id,name,owner_id').order('created_at', { ascending: false });
    if (error) { setError(error.message); return; }
    const list = (data || []).map((p: any) => ({ id: p.id, name: p.name }));
    setProjects(list);
    const qp = new URLSearchParams(location.search).get('project');
    const chosen = qp && list.some(p => p.id === qp) ? qp : (list[0]?.id || '');
    setProjectId(chosen);
    const selected = (data || []).find((p: any) => p.id === chosen);
    setOwnerId(selected?.owner_id || '');
  }

  async function loadMembers(pid = projectId) {
    if (!pid) { setMembers([]); return; }
    const { data, error } = await sb.rpc('get_project_members', { pid });
    if (error) setError(error.message); else setMembers(data || []);
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href = '/login'; return; }
      await loadProjects();
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (projectId) loadMembers(projectId); }, [projectId]);

  async function changeProject(id: string) {
    setProjectId(id);
    const selected = projects.find(p => p.id === id);
    setOwnerId(selected ? ownerId : '');
    history.replaceState(null, '', `/team?project=${id}`);
    setError(''); setMessage('');
    await loadMembers(id);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !email.trim()) return;
    setSaving(true); setError(''); setMessage('');
    const { error } = await sb.rpc('add_project_member_by_email', {
      pid: projectId,
      member_email: email.trim(),
      member_role: role,
    });
    if (error) setError(error.message.replace('Failed to fetch', 'Could not connect to Supabase'));
    else { setEmail(''); setMessage('Member added to this project.'); await loadMembers(); }
    setSaving(false);
  }

  async function removeMember(member: Member) {
    if (!confirm(`Remove ${member.email || 'this member'} from the project?`)) return;
    setError(''); setMessage('');
    const { error } = await sb.rpc('remove_project_member', { pid: projectId, member_id: member.user_id });
    if (error) setError(error.message); else { setMessage('Member removed.'); await loadMembers(); }
  }

  const project = projects.find(p => p.id === projectId);

  if (loading) return <AppShell><div className="empty"><h3>Loading team…</h3></div></AppShell>;

  return <AppShell>
    <div className="top">
      <div>
        <div className="eyebrow">{project?.name || 'PROJECT'} · ACCESS</div>
        <h1 className="title">Team</h1>
        <div className="subtitle">Give other Producer OS accounts access to this production.</div>
      </div>
      <div className="actions">
        <Link className="btn" href={projectId ? `/projects/${projectId}` : '/projects'}><ArrowLeft size={13}/> Project</Link>
        <select className="select" value={projectId} onChange={e => changeProject(e.target.value)}>
          {projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>

    {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
    {message && <div className="success" style={{ marginBottom: 12 }}>{message}</div>}

    {!projectId ? <section className="card empty"><h3>No projects yet</h3><div className="subtitle">Create a project first, then invite your production team.</div></section> : <>
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="section-head">
          <div><div className="eyebrow">PROJECT ACCESS</div><h2>Add a team member</h2></div>
          <Users size={20}/>
        </div>
        <form className="form-grid" onSubmit={addMember}>
          <label><span>Email address</span><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="person@example.com" /></label>
          <label><span>Role</span><select value={role} onChange={e => setRole(e.target.value)}><option>Member</option><option>Producer</option><option>Production Manager</option><option>Accountant</option><option>Crew</option></select></label>
          <div className="full actions"><button className="btn primary" disabled={saving}><Plus size={14}/>{saving ? 'Adding…' : 'Add to project'}</button></div>
        </form>
        <div className="subtitle" style={{ marginTop: 10 }}>The person must already have a Producer OS account with this email. Role-based permissions can be expanded later.</div>
      </section>

      <section className="card">
        <div className="section-head"><div><div className="eyebrow">{members.length} MEMBERS</div><h2>People with access</h2></div></div>
        {members.length === 0 ? <div className="empty"><h3>No additional members</h3><div className="subtitle">Only the project owner has access right now.</div></div> :
          <div className="table-wrap"><table className="table"><thead><tr><th>Person</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>
            {members.map(m => <tr key={m.user_id}><td>{m.full_name || 'Producer OS user'}</td><td>{m.email || '—'}</td><td>{m.role || 'Member'}</td><td><button className="btn ghost" onClick={() => removeMember(m)} title="Remove"><Trash2 size={13}/></button></td></tr>)}
          </tbody></table></div>
        }
      </section>
    </>}
  </AppShell>;
}
