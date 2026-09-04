'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage(){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const router=useRouter();

  async function submit(e:FormEvent){
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase=createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if(error){
      setError(error.message);
      setLoading(false);
      return;
    }

 
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="eyebrow">PRODUCER OS</div>
        <h1 className="title">Create account</h1>
        <p className="subtitle">Create your production workspace account.</p>

        <form className="formgrid" onSubmit={submit}>
          <div className="field span2">
            <label>Full name</label>
            <input
              required
              value={name}
              onChange={e=>setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="field span2">
            <label>Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="field span2">
            <label>Password</label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {error && <div className="error span2">{error}</div>}

          <div className="span2 actions">
            <button className="btn primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <a className="btn" href="/login">Log in</a>
          </div>
        </form>
      </div>
    </main>
  );
}
