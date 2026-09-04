'use client';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {Plus, Search, Trash2, FolderKanban} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {createClient} from '@/lib/supabase/client';

type Project = { id:string; name:string; project_type:string; status:string; budget:number|string; producer:string|null; director:string|null; start_date:string|null; end_date:string|null; created_at:string };

export default function Projects(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [deleting,setDeleting]=useState<string|null>(null);

  useEffect(()=>{
    const load=async()=>{
      const sb=createClient();
      const {data:{user}}=await sb.auth.getUser();
      if(!user){ window.location.href='/login'; return; }
      const {data,error}=await sb.from('projects').select('id,name,project_type,status,budget,producer,director,start_date,end_date,created_at').order('created_at',{ascending:false});
      if(error) setError(error.message); else setProjects((data||[]) as Project[]);
      setLoading(false);
    };
    load();
  },[]);
    async function deleteProject(project: Project) {
    const confirmed = window.confirm(
      `Delete "${project.name}"?\n\nThis will permanently delete the project and all related production data. This cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(project.id);
    setError('');

    const sb = createClient();

    const { error } = await sb
      .from('projects')
      .delete()
      .eq('id', project.id);

    if (error) {
      setError(`Could not delete "${project.name}": ${error.message}`);
      setDeleting(null);
      return;
    }

    setProjects((current) =>
      current.filter((p) => p.id !== project.id)
    );

    setDeleting(null);
  }

  const filtered=useMemo(()=>projects.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.project_type.toLowerCase().includes(search.toLowerCase())),[projects,search]);
  const statusClass=(status:string)=>status==='Production'?'yellow':status==='Completed'?'green':status==='Post-production'?'blue':status==='Pre-production'?'blue':'blue';
  const money=(v:number|string)=>`€${Number(v||0).toLocaleString('en-US',{maximumFractionDigits:0})}`;

  return <AppShell>
    <div className="top"><div><h1 className="title">Projects</h1><div className="subtitle">All productions you have access to.</div></div><div className="actions"><div className="search"><Search size={14}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects..."/></div><Link href="/projects/new" className="btn primary"><Plus size={14}/> New project</Link></div></div>
    <section className="card">
      <div className="section-head"><div><div className="eyebrow">{projects.length} {projects.length===1?'production':'productions'}</div><h2>Project library</h2></div><div className="subtitle">Live from Supabase</div></div>
      {loading ? <div className="empty"><div className="project-mark"><FolderKanban size={18}/></div><h3>Loading projects…</h3><div className="subtitle">Connecting to your production database.</div></div> : error ? <div className="error">{error}</div> : filtered.length===0 ? <div className="empty"><div className="project-mark"><FolderKanban size={18}/></div><h3>{projects.length===0?'No projects yet':'No matching projects'}</h3><div className="subtitle">{projects.length===0?'Create your first production to start building the workspace.':'Try another search term.'}</div>{projects.length===0&&<Link href="/projects/new" className="btn primary" style={{marginTop:14}}>Create first project</Link>}</div> :
      <div className="table-wrap"><table className="table"><thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Producer</th><th>Budget</th><th>Created</th><th></th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><Link href={`/projects/${p.id}`} style={{color:'#fff',textDecoration:'none',fontWeight:900}}>{p.name}</Link><div className="subtitle" style={{marginTop:3}}>{p.director?`Director · ${p.director}`:'No director assigned'}</div></td><td>{p.project_type}</td><td><span className={'pill '+statusClass(p.status)}>{p.status}</span></td><td>{p.producer||'—'}</td><td>{money(p.budget)}</td><td>{new Date(p.created_at).toLocaleDateString('en-GB')}</td><td><button type="button" onClick={()=>deleteProject(p)} disabled={deleting===p.id} title="Delete project" aria-label={`Delete ${p.name}`} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:34,height:34,borderRadius:8,border:'1px solid rgba(255,80,80,.25)',background:'rgba(255,80,80,.08)',color:'#ff6b6b',cursor:deleting===p.id?'wait':'pointer',opacity:deleting===p.id?.55:1}}>{deleting===p.id?<span style={{fontSize:11}}>…</span>:<Trash2 size={15}/>}</button></td></tr>)}</tbody></table></div>}
    </section>
  </AppShell>
}
