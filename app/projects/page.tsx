'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/AppShell';
import { Plus, Search, FolderKanban, Trash2, ArrowRight } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  project_type: string | null;
  producer: string | null;
  director: string | null;
  status: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function loadProjects() {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .select(
        'id,name,project_type,producer,director,status,budget,start_date,end_date,created_at'
      )
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setProjects([]);
    } else {
      setProjects((data ?? []) as Project[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function deleteProject(project: Project) {
    const confirmed = window.confirm(
      `Delete "${project.name}"?\n\nThis will permanently delete the project and all related production data. This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(project.id);
    setError('');

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id);

    if (error) {
      setError(`Could not delete "${project.name}": ${error.message}`);
      setDeletingId(null);
      return;
    }

    setProjects((current) => current.filter((p) => p.id !== project.id));
    setDeletingId(null);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((p) =>
      [
        p.name,
        p.project_type,
        p.producer,
        p.director,
        p.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [projects, search]);

  const money = (value: number | null) =>
    `€${Number(value ?? 0).toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })}`;

  return (
    <AppShell>
      <div className="top">
        <div>
          <div className="eyebrow">PRODUCTIONS</div>
          <h1 className="title">Projects</h1>
          <div className="subtitle">
            Manage your productions and open each project workspace.
          </div>
        </div>

        <div className="actions">
          <div className="search">
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
            />
          </div>

          <Link className="btn primary" href="/projects/new">
            <Plus size={14} />
            New project
          </Link>
        </div>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <section className="card">
          <div className="empty">
            <h3>Loading projects…</h3>
          </div>
        </section>
      ) : filtered.length === 0 ? (
        <section className="card">
          <div className="empty">
            <div className="project-mark">
              <FolderKanban size={18} />
            </div>
            <h3>
              {projects.length === 0 ? 'No projects yet' : 'No matching projects'}
            </h3>
            <div className="subtitle">
              {projects.length === 0
                ? 'Create your first production to start building the workspace.'
                : 'Try another search term.'}
            </div>

            {projects.length === 0 && (
              <Link
                href="/projects/new"
                className="btn primary"
                style={{ marginTop: 14 }}
              >
                <Plus size={14} />
                Create first project
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="section-head">
            <div>
              <div className="eyebrow">{filtered.length} projects</div>
              <h2>Your productions</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Producer</th>
                  <th>Budget</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link
                        href={`/projects/${project.id}`}
                        style={{ fontWeight: 700 }}
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td>{project.project_type || '—'}</td>
                    <td>{project.status || '—'}</td>
                    <td>{project.producer || '—'}</td>
                    <td>{money(project.budget)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Link
                          className="btn ghost"
                          href={`/projects/${project.id}`}
                          title="Open project"
                        >
                          <ArrowRight size={13} />
                        </Link>

                        <button
                          type="button"
                          className="btn ghost"
                          title="Delete project"
                          disabled={deletingId === project.id}
                          onClick={() => deleteProject(project)}
                          style={
                            deletingId === project.id
                              ? { opacity: 0.5, cursor: 'wait' }
                              : undefined
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  );
}
