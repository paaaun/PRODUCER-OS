import Sidebar from './Sidebar';
import LanguageManager from './LanguageManager';

export default function AppShell({children}:{children:React.ReactNode}){
  return <div className="shell">
    <Sidebar/>
    <main className="main">
      <LanguageManager/>
      {children}
    </main>
    <div className="mobilebar">
      <a href="/dashboard">⌂<span>Home</span></a>
      <a href="/projects">▣<span>Projects</span></a>
      <a href="/schedule">◷<span>Schedule</span></a>
      <a href="/crew">♙<span>Crew</span></a>
      <a href="/budget">€<span>Budget</span></a>
    </div>
  </div>
}
