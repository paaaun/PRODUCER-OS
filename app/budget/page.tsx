'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Pencil, Search, ArrowLeft, Save, X } from 'lucide-react';

type Project = { id: string; name: string };
type Category = { id: string; project_id: string; name: string; planned: number | null };
type Expense = {
  id: string;
  project_id: string;
  category_id: string | null;
  description: string;
  planned_amount: number | null;
  actual_amount: number | null;
  paid: boolean | null;
  expense_date: string | null;
  notes: string | null;
};

const parseMoney = (value: string) => {
  const clean = value.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
};

const money = (value: number | null | undefined) =>
  `${Number(value ?? 0).toLocaleString('sr-RS', { maximumFractionDigits: 2 })} RSD`;

export default function BudgetPage() {
  const sb = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryEditing, setCategoryEditing] = useState<Category | { new: true } | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryPlanned, setCategoryPlanned] = useState('');
  const [expenseEditing, setExpenseEditing] = useState<Expense | { new: true } | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    category_id: '', description: '', planned_amount: '', actual_amount: '',
    paid: false, expense_date: '', notes: ''
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      const { data, error } = await sb.from('projects')
        .select('id,name').eq('owner_id', user.id).order('created_at', { ascending: false });
      if (error) setError(error.message);
      else {
        const list = (data ?? []) as Project[];
        setProjects(list);
        const qp = new URLSearchParams(window.location.search).get('project');
        setProjectId(qp && list.some(p => p.id === qp) ? qp : list[0]?.id ?? '');
      }
      setLoading(false);
    })();
  }, []);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    const [c, e] = await Promise.all([
      sb.from('budget_categories').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
      sb.from('expenses').select('*').eq('project_id', projectId).order('expense_date', { ascending: false })
    ]);
    if (c.error) setError(c.error.message); else setCategories((c.data ?? []) as Category[]);
    if (e.error) setError(e.error.message); else setExpenses((e.data ?? []) as Expense[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [projectId]);

  const planned = useMemo(() => categories.reduce((s, c) => s + Number(c.planned ?? 0), 0), [categories]);
  const actual = useMemo(() => expenses.reduce((s, e) => s + Number(e.actual_amount ?? 0), 0), [expenses]);
  const remaining = planned - actual;
  const filtered = expenses.filter(e =>
    `${e.description} ${e.notes ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  function openCategory(c?: Category) {
    if (c) {
      setCategoryEditing(c);
      setCategoryName(c.name);
      setCategoryPlanned(String(c.planned ?? ''));
    } else {
      setCategoryEditing({ new: true });
      setCategoryName('');
      setCategoryPlanned('');
    }
    setError('');
  }

  async function saveCategory() {
    if (!projectId || !categoryName.trim()) return;
    setSaving(true); setError('');
    const payload = { project_id: projectId, name: categoryName.trim(), planned: parseMoney(categoryPlanned) };
    const result = 'new' in (categoryEditing as any)
      ? await sb.from('budget_categories').insert(payload)
      : await sb.from('budget_categories').update(payload).eq('id', (categoryEditing as Category).id).eq('project_id', projectId);
    if (result.error) setError(result.error.message);
    else { setCategoryEditing(null); await load(); }
    setSaving(false);
  }

  async function deleteCategory(id: string) {
    if (!window.confirm('Delete this budget category?')) return;
    const { error } = await sb.from('budget_categories').delete().eq('id', id).eq('project_id', projectId);
    if (error) setError(error.message); else await load();
  }

  function openExpense(e?: Expense) {
    setExpenseEditing(e ?? { new: true });
    setExpenseForm({
      category_id: e?.category_id ?? '',
      description: e?.description ?? '',
      planned_amount: e?.planned_amount == null ? '' : String(e.planned_amount),
      actual_amount: e?.actual_amount == null ? '' : String(e.actual_amount),
      paid: Boolean(e?.paid),
      expense_date: e?.expense_date ?? '',
      notes: e?.notes ?? ''
    });
    setError('');
  }

  async function saveExpense() {
    if (!projectId || !expenseForm.description.trim()) return;
    setSaving(true); setError('');
    const payload = {
      project_id: projectId,
      category_id: expenseForm.category_id || null,
      description: expenseForm.description.trim(),
      planned_amount: parseMoney(expenseForm.planned_amount),
      actual_amount: parseMoney(expenseForm.actual_amount),
      paid: expenseForm.paid,
      expense_date: expenseForm.expense_date || null,
      notes: expenseForm.notes || null
    };
    const result = 'new' in (expenseEditing as any)
      ? await sb.from('expenses').insert(payload)
      : await sb.from('expenses').update(payload).eq('id', (expenseEditing as Expense).id).eq('project_id', projectId);
    if (result.error) setError(result.error.message);
    else { setExpenseEditing(null); await load(); }
    setSaving(false);
  }

  async function deleteExpense(id: string) {
    if (!window.confirm('Delete this expense?')) return;
    const { error } = await sb.from('expenses').delete().eq('id', id).eq('project_id', projectId);
    if (error) setError(error.message); else await load();
  }

  const project = projects.find(p => p.id === projectId);

  if (loading && !projects.length) return <AppShell><div className="empty"><h3>Loading budget…</h3></div></AppShell>;

  return <AppShell>
    <div className="top">
      <div>
        <div className="eyebrow">{project?.name ?? 'PROJECT'}</div>
        <h1 className="title">Budget</h1>
        <div className="subtitle">Track planned and actual production costs in Serbian dinars.</div>
      </div>
      <div className="actions">
        <Link className="btn" href={projectId ? `/projects/${projectId}` : '/projects'}><ArrowLeft size={13}/> Project</Link>
        <select className="select" value={projectId} onChange={e => {
          setProjectId(e.target.value);
          history.replaceState(null, '', `/budget?project=${e.target.value}`);
        }}>
          {projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>

    {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

    <div className="stats">
      <div className="stat"><div className="eyebrow">PLANNED</div><strong>{money(planned)}</strong></div>
      <div className="stat"><div className="eyebrow">ACTUAL</div><strong>{money(actual)}</strong></div>
      <div className="stat"><div className="eyebrow">REMAINING</div><strong>{money(remaining)}</strong></div>
    </div>

    <section className="card" style={{ marginBottom: 16 }}>
      <div className="section-head">
        <div><div className="eyebrow">{categories.length} categories</div><h2>Budget categories</h2></div>
        <button className="btn primary" onClick={() => openCategory()}><Plus size={14}/> Add category</button>
      </div>
      {categories.length === 0 ? <div className="empty">No budget categories yet.</div> :
        <div className="table-wrap"><table className="table"><thead><tr><th>Category</th><th>Planned</th><th></th></tr></thead><tbody>
          {categories.map(c => <tr key={c.id}><td>{c.name}</td><td>{money(c.planned)}</td><td><div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
            <button className="btn ghost" onClick={() => openCategory(c)} title="Edit"><Pencil size={13}/></button>
            <button className="btn ghost" onClick={() => deleteCategory(c.id)} title="Delete"><Trash2 size={13}/></button>
          </div></td></tr>)}
        </tbody></table></div>}
    </section>

    <section className="card">
      <div className="section-head">
        <div><div className="eyebrow">{expenses.length} expenses</div><h2>Expenses</h2></div>
        <div className="actions">
          <div className="search"><Search size={14}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search expenses..."/></div>
          <button className="btn primary" onClick={() => openExpense()}><Plus size={14}/> Add expense</button>
        </div>
      </div>
      {filtered.length === 0 ? <div className="empty">No expenses yet.</div> :
        <div className="table-wrap"><table className="table"><thead><tr><th>Description</th><th>Category</th><th>Planned</th><th>Actual</th><th>Paid</th><th>Date</th><th></th></tr></thead><tbody>
          {filtered.map(e => <tr key={e.id}><td>{e.description}</td><td>{categories.find(c=>c.id===e.category_id)?.name ?? '—'}</td><td>{money(e.planned_amount)}</td><td>{money(e.actual_amount)}</td><td>{e.paid ? 'Yes' : 'No'}</td><td>{e.expense_date || '—'}</td><td><div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
            <button className="btn ghost" onClick={() => openExpense(e)} title="Edit"><Pencil size={13}/></button>
            <button className="btn ghost" onClick={() => deleteExpense(e.id)} title="Delete"><Trash2 size={13}/></button>
          </div></td></tr>)}
        </tbody></table></div>}
    </section>

    {categoryEditing && <div className="modal-backdrop"><div className="modal">
      <div className="modal-head"><div><div className="eyebrow">BUDGET CATEGORY</div><h2>{'new' in (categoryEditing as any) ? 'Add category' : 'Edit category'}</h2></div>
        <button className="btn ghost" onClick={()=>setCategoryEditing(null)}><X size={16}/></button></div>
      <div className="form-grid">
        <label>Category name<input value={categoryName} onChange={e=>setCategoryName(e.target.value)}/></label>
        <label>Planned amount (RSD)<input type="text" inputMode="decimal" value={categoryPlanned} placeholder="e.g. 150000" onChange={e=>setCategoryPlanned(e.target.value)}/></label>
      </div>
      <div className="modal-actions"><button className="btn" onClick={()=>setCategoryEditing(null)}>Cancel</button><button className="btn primary" disabled={saving} onClick={saveCategory}><Save size={14}/>{saving?'Saving…':'Save'}</button></div>
    </div></div>}

    {expenseEditing && <div className="modal-backdrop"><div className="modal">
      <div className="modal-head"><div><div className="eyebrow">EXPENSE</div><h2>{'new' in (expenseEditing as any) ? 'Add expense' : 'Edit expense'}</h2></div>
        <button className="btn ghost" onClick={()=>setExpenseEditing(null)}><X size={16}/></button></div>
      <div className="form-grid">
        <label>Description *<input value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm,description:e.target.value})}/></label>
        <label>Category<select value={expenseForm.category_id} onChange={e=>setExpenseForm({...expenseForm,category_id:e.target.value})}><option value="">No category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Planned amount (RSD)<input type="text" inputMode="decimal" value={expenseForm.planned_amount} placeholder="e.g. 150000" onChange={e=>setExpenseForm({...expenseForm,planned_amount:e.target.value})}/></label>
        <label>Actual amount (RSD)<input type="text" inputMode="decimal" value={expenseForm.actual_amount} placeholder="e.g. 145000" onChange={e=>setExpenseForm({...expenseForm,actual_amount:e.target.value})}/></label>
        <label>Date<input type="date" value={expenseForm.expense_date} onChange={e=>setExpenseForm({...expenseForm,expense_date:e.target.value})}/></label>
        <label>Paid<select value={expenseForm.paid ? 'yes' : 'no'} onChange={e=>setExpenseForm({...expenseForm,paid:e.target.value==='yes'})}><option value="no">No</option><option value="yes">Yes</option></select></label>
        <label className="full">Notes<textarea value={expenseForm.notes} onChange={e=>setExpenseForm({...expenseForm,notes:e.target.value})}/></label>
      </div>
      <div className="modal-actions"><button className="btn" onClick={()=>setExpenseEditing(null)}>Cancel</button><button className="btn primary" disabled={saving} onClick={saveExpense}><Save size={14}/>{saving?'Saving…':'Save'}</button></div>
    </div></div>}
  </AppShell>;
}
