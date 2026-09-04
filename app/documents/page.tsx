'use client';

import AppShell from '@/components/AppShell';
import { createClient } from '@/lib/supabase/client';
import { File, FileText, Image, Film, Upload, Download, Trash2, Search, X, FolderOpen } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Project = { id: string; name: string };
type Doc = { id: string; project_id: string; name: string; document_type: string | null; storage_path: string | null; created_at: string };

const BUCKET = 'documents';

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg','jpeg','png','webp','gif'].includes(ext || '')) return <Image size={18}/>;
  if (['mp4','mov','avi','mkv'].includes(ext || '')) return <Film size={18}/>;
  if (['pdf','doc','docx','txt','rtf'].includes(ext || '')) return <FileText size={18}/>;
  return <File size={18}/>;
}
function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function Documents() {
  const sb = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pid, setPid] = useState('');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href = '/login'; return; }
      const { data, error } = await sb.from('projects').select('id,name').order('created_at', { ascending: false });
      if (error) setError(error.message);
      const list = data || [];
      setProjects(list);
      const q = new URLSearchParams(location.search).get('project');
      setPid(q && list.some(p => p.id === q) ? q : list[0]?.id || '');
    })();
  }, []);

  useEffect(() => { if (pid) load(); }, [pid]);

  async function load() {
    const { data, error } = await sb.from('documents').select('*').eq('project_id', pid).order('created_at', { ascending: false });
    if (error) setError(error.message); else setDocs(data || []);
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!pid || !files.length) return;
    setError(''); setUploading(true); setProgress(0);
    const list = Array.from(files);
    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${pid}/${crypto.randomUUID()}-${safe}`;
        const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (uploadError) throw uploadError;
        const ext = file.name.includes('.') ? file.name.split('.').pop()!.toUpperCase() : 'FILE';
        const { error: dbError } = await sb.from('documents').insert({ project_id: pid, name: file.name, document_type: ext, storage_path: path });
        if (dbError) {
          await sb.storage.from(BUCKET).remove([path]);
          throw dbError;
        }
        setProgress(Math.round(((i + 1) / list.length) * 100));
      }
      await load();
    } catch (e: any) {
      setError(e?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }

  async function openFile(doc: Doc) {
    if (!doc.storage_path) return;
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60 * 10);
    if (error) setError(error.message); else if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function remove(doc: Doc) {
    if (!confirm(`Delete "${doc.name}"? This will permanently remove the file.`)) return;
    setError('');
    if (doc.storage_path) {
      const { error } = await sb.storage.from(BUCKET).remove([doc.storage_path]);
      if (error) { setError(error.message); return; }
    }
    const { error } = await sb.from('documents').delete().eq('id', doc.id).eq('project_id', pid);
    if (error) setError(error.message); else setDocs(prev => prev.filter(x => x.id !== doc.id));
  }

  const filtered = useMemo(() => docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase())), [docs, search]);
  const project = projects.find(p => p.id === pid);

  return <AppShell>
    <div className="top">
      <div><div className="eyebrow">{project?.name || 'PROJECT'} · FILE ROOM</div><h1 className="title">Documents</h1><div className="subtitle">Scripts, contracts, releases, references and production files.</div></div>
      <div className="actions">
        <select className="select" value={pid} onChange={e => { setPid(e.target.value); history.replaceState(null, '', `/documents?project=${e.target.value}`); }}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="search"><Search size={14}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."/></div>
      </div>
    </div>

    {error && <div className="error" style={{marginBottom:12}}>{error}</div>}

    <section className="card">
      <div className="section-head"><div><div className="eyebrow">{docs.length} files</div><h2>Project files</h2></div><span className="subtitle">Private project storage</span></div>
      <div className={`upload-zone ${dragging ? 'dragging' : ''}`} onDragEnter={e => { e.preventDefault(); setDragging(true); }} onDragOver={e => e.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files); }} onClick={() => !uploading && inputRef.current?.click()}>
        <input ref={inputRef} type="file" multiple hidden onChange={e => { if (e.target.files) uploadFiles(e.target.files); e.currentTarget.value = ''; }}/>
        <div className="upload-icon"><Upload size={20}/></div>
        <h3>{uploading ? `Uploading ${progress}%` : 'Drop files here or click to upload'}</h3>
        <div className="subtitle">Upload PDFs, documents, images, video and other production files.</div>
        {uploading && <div className="upload-progress"><span style={{width: `${progress}%`}}/></div>}
      </div>

      {filtered.length === 0 ? <div className="empty"><FolderOpen size={22}/><h3>No files yet</h3><div className="subtitle">Upload your first production document above.</div></div> :
        <div className="doc-list">{filtered.map(d => <div className="doc-row" key={d.id}>
          <div className="file-icon">{fileIcon(d.name)}</div>
          <div style={{flex:1,minWidth:0}}><strong style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</strong><small>{d.document_type || 'FILE'} · {new Date(d.created_at).toLocaleDateString('en-GB')}</small></div>
          <button className="btn ghost" title="Open file" onClick={() => openFile(d)} disabled={!d.storage_path}><Download size={14}/></button>
          <button className="btn ghost" title="Delete file" onClick={() => remove(d)}><Trash2 size={14}/></button>
        </div>)}</div>}
    </section>
  </AppShell>;
}
