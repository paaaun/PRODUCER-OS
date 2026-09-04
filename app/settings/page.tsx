'use client'

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { Check, LogOut, Moon, Sun } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Theme='dark'|'light';
type Language='sr'|'en';

export default function SettingsPage(){
  const [theme,setTheme]=useState<Theme>('dark');
  const [loggingOut,setLoggingOut]=useState(false);
  const [language,setLanguage]=useState<Language>('sr');
  const router=useRouter();

  useEffect(()=>{
    const saved=localStorage.getItem('producer-os-theme') as Theme | null;
    const initial=saved==='light'?'light':'dark';
    setTheme(initial);
    document.documentElement.dataset.theme=initial;

    const savedLanguage=localStorage.getItem('producer-os-language') as Language | null;
    setLanguage(savedLanguage==='en'?'en':'sr');
  },[]);

  function changeTheme(next:Theme){
    setTheme(next);
    localStorage.setItem('producer-os-theme',next);
    document.documentElement.dataset.theme=next;
  }

  function changeLanguage(next:Language){
    setLanguage(next);
    localStorage.setItem('producer-os-language',next);
    window.dispatchEvent(new Event('producer-os-language-change'));
  }

  async function logout(){
    setLoggingOut(true);
    const supabase=createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return <AppShell>
    <div className="top">
      <div><div className="eyebrow">{language==='sr'?'SISTEM':'SYSTEM'}</div><h1 className="title">{language==='sr'?'Podešavanja':'Settings'}</h1><p className="subtitle">{language==='sr'?'Upravljaj izgledom, jezikom i nalogom Producer OS-a.':'Manage your Producer OS preferences and account.'}</p></div>
    </div>

    <div className="settings-stack">
      <section className="card settings-card">
        <div className="settings-heading"><div><h2>{language==='sr'?'Izgled':'Appearance'}</h2><p>{language==='sr'?'Izaberi kako Producer OS izgleda na ovom uređaju.':'Choose how Producer OS looks on this device.'}</p></div></div>
        <div className="theme-options">
          <button className={'theme-option '+(theme==='dark'?'selected':'')} onClick={()=>changeTheme('dark')}>
            <div className="theme-preview dark-preview"><div className="preview-sidebar"/><div className="preview-content"><i/><i/><i/></div></div>
            <div className="theme-label"><Moon size={15}/><span>{language==='sr'?'Tamna':'Dark'}</span>{theme==='dark'&&<Check size={15}/>}</div>
          </button>
          <button className={'theme-option '+(theme==='light'?'selected':'')} onClick={()=>changeTheme('light')}>
            <div className="theme-preview light-preview"><div className="preview-sidebar"/><div className="preview-content"><i/><i/><i/></div></div>
            <div className="theme-label"><Sun size={15}/><span>{language==='sr'?'Svetla':'Light'}</span>{theme==='light'&&<Check size={15}/>}</div>
          </button>
        </div>
      </section>

      <section className="card settings-card">
        <div className="settings-heading"><div><h2>{language==='sr'?'Jezik':'Language'}</h2><p>{language==='sr'?'Izaberi jezik interfejsa Producer OS-a.':'Choose the Producer OS interface language.'}</p></div></div>
        <div className="theme-options">
          <button className={'theme-option '+(language==='sr'?'selected':'')} onClick={()=>changeLanguage('sr')}>
            <div className="theme-label"><span>🇷🇸 Srpski</span>{language==='sr'&&<Check size={15}/>}</div>
          </button>
          <button className={'theme-option '+(language==='en'?'selected':'')} onClick={()=>changeLanguage('en')}>
            <div className="theme-label"><span>🇬🇧 English</span>{language==='en'&&<Check size={15}/>}</div>
          </button>
        </div>
      </section>

      <section className="card settings-card danger-card">
        <div className="settings-heading"><div><h2>{language==='sr'?'Nalog':'Account'}</h2><p>{language==='sr'?'Odjavi se sa ovog Producer OS naloga na ovom uređaju.':'Sign out of this Producer OS account on this device.'}</p></div></div>
        <button className="btn logout-btn" onClick={logout} disabled={loggingOut}><LogOut size={15}/>{loggingOut?(language==='sr'?'Odjavljivanje…':'Signing out…'):(language==='sr'?'Odjavi se':'Log out')}</button>
      </section>
    </div>
  </AppShell>
}
