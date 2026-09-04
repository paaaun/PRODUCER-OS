'use client';

import { useEffect } from 'react';

type Language = 'sr' | 'en';

const translations: Record<string, string> = {
  'Dashboard':'Kontrolna tabla',
  'Projects':'Projekti',
  'Scenes':'Scene',
  'Shooting Schedule':'Plan snimanja',
  'Call Sheets':'Call sheetovi',
  'Crew':'Ekipa',
  'Locations':'Lokacije',
  'Budget':'Budžet',
  'Daily Reports':'Dnevni izveštaji',
  'Documents':'Dokumenti',
  'Team':'Tim',
  'Settings':'Podešavanja',
  'Home':'Početna',
  'Schedule':'Plan snimanja',

  'SYSTEM':'SISTEM',
  'PRODUCTION':'PRODUKCIJA',
  'New project':'Novi projekat',
  'Project name':'Naziv projekta',
  'Project type':'Tip projekta',
  'Type':'Tip',
  'Status':'Status',
  'Producer':'Producent',
  'Director':'Reditelj',
  'Budget (RSD)':'Budžet (RSD)',
  'Create project':'Kreiraj projekat',
  'Cancel':'Otkaži',
  'Open':'Otvori',
  'Delete':'Obriši',
  'Save':'Sačuvaj',
  'Edit':'Izmeni',
  'Add':'Dodaj',
  'Search':'Pretraži',
  'Close':'Zatvori',
  'Back':'Nazad',
  'Create':'Kreiraj',
  'Update':'Ažuriraj',
  'Loading…':'Učitavanje…',
  'Loading...':'Učitavanje...',
  'No projects yet.':'Još nema projekata.',
  'Create your first project to get started.':'Kreiraj prvi projekat da počneš.',
  'Development':'Razvoj',
  'Pre-production':'Predprodukcija',
  'Production':'Produkcija',
  'Post-production':'Postprodukcija',
  'Completed':'Završeno',

  'Appearance':'Izgled',
  'Choose how Producer OS looks on this device.':'Izaberi kako Producer OS izgleda na ovom uređaju.',
  'Dark':'Tamna',
  'Light':'Svetla',
  'Account':'Nalog',
  'Language':'Jezik',
  'Choose the Producer OS interface language.':'Izaberi jezik interfejsa Producer OS-a.',
  'Srpski':'Srpski',
  'English':'English',
  'Log out':'Odjavi se',
  'Signing out…':'Odjavljivanje…',

  'Scene':'Scena',
  'Scene number':'Broj scene',
  'Int / Ext':'Enterijer / Eksterijer',
  'Day / Night':'Dan / Noć',
  'Location':'Lokacija',
  'Set':'Set',
  'Description':'Opis',
  'Characters':'Likovi',
  'Extras':'Statisti',
  'Props':'Rekvizita',
  'Wardrobe':'Kostim',
  'Makeup':'Šminka',
  'Vehicles':'Vozila',
  'Special equipment':'Specijalna oprema',
  'Notes':'Napomene',
  'New scene':'Nova scena',

  'Shoot day':'Dan snimanja',
  'Date':'Datum',
  'Start time':'Početak',
  'End time':'Kraj',
  'Crew call':'Poziv ekipe',
  'Lunch':'Pauza za ručak',
  'New schedule item':'Nova stavka plana',

  'Call sheet':'Call sheet',
  'General call':'Opšti poziv',
  'Weather':'Vreme',
  'Parking':'Parking',
  'Catering':'Ketering',
  'Emergency contacts':'Kontakti za hitne slučajeve',
  'New call sheet':'Novi call sheet',

  'Name':'Ime',
  'Department':'Odeljenje',
  'Position':'Pozicija',
  'Phone':'Telefon',
  'Email':'E-mail',
  'Day rate (RSD)':'Dnevnica (RSD)',
  'Availability':'Dostupnost',
  'New crew member':'Novi član ekipe',

  'Address':'Adresa',
  'Contact name':'Kontakt osoba',
  'Rate (RSD)':'Cena (RSD)',
  'Permits':'Dozvole',
  'Electricity':'Struja',
  'Dressing room':'Garderoba',
  'New location':'Nova lokacija',

  'Budget categories':'Budžetske kategorije',
  'Category':'Kategorija',
  'Planned':'Planirano',
  'Actual':'Stvarno',
  'Remaining':'Preostalo',
  'Expenses':'Troškovi',
  'Expense':'Trošak',
  'Planned amount':'Planirani iznos',
  'Actual amount':'Stvarni iznos',
  'Paid':'Plaćeno',
  'Expense date':'Datum troška',
  'Additional expenses (RSD)':'Dodatni troškovi (RSD)',
  'New category':'Nova kategorija',
  'New expense':'Novi trošak',

  'Daily report':'Dnevni izveštaj',
  'First shot':'Prvi kadar',
  'Lunch time':'Vreme ručka',
  'Wrap time':'Kraj snimanja',
  'Scenes scheduled':'Planirane scene',
  'Scenes completed':'Završene scene',
  'Scenes omitted':'Izostavljene scene',
  'Overtime minutes':'Prekovremeni minuti',
  'Delays':'Kašnjenja',
  'Incidents':'Incidenti',
  'New daily report':'Novi dnevni izveštaj',

  'Upload':'Otpremi',
  'Upload files':'Otpremi fajlove',
  'Choose files':'Izaberi fajlove',
  'Drag & drop files here':'Prevuci fajlove ovde',
  'No documents yet.':'Još nema dokumenata.',
  'Project':'Projekat',
  'File':'Fajl',
  'Files':'Fajlovi',
  'Download':'Preuzmi',
  'Remove':'Ukloni',

  'Add member':'Dodaj člana',
  'Member email':'E-mail člana',
  'Role':'Uloga',
  'Member':'Član',
  'Production Manager':'Menadžer produkcije',
  'Accountant':'Računovođa',
  'Remove member':'Ukloni člana',
  'No team members yet.':'Još nema članova tima.',

  'Login':'Prijava',
  'Log in':'Prijavi se',
  'Create account':'Napravi nalog',
  'Full name':'Ime i prezime',
  'Password':'Lozinka',
  'Forgot password?':'Zaboravljena lozinka?',
  'Don’t have an account?':'Nemaš nalog?',
  'Already have an account?':'Već imaš nalog?',
  'Sign up':'Registruj se',
  'Sign in':'Prijavi se',
};

const reverse: Record<string, string> = Object.fromEntries(
  Object.entries(translations).map(([en, sr]) => [sr, en])
);

function translateText(value: string, language: Language) {
  const map = language === 'sr' ? translations : reverse;
  const exact = map[value.trim()];
  if (exact) {
    const leading = value.match(/^\s*/)?.[0] ?? '';
    const trailing = value.match(/\s*$/)?.[0] ?? '';
    return leading + exact + trailing;
  }

  let result = value;
  const entries = Object.entries(map).sort((a,b)=>b[0].length-a[0].length);
  for (const [from,to] of entries) {
    if (result.includes(from)) result = result.split(from).join(to);
  }
  return result;
}

function applyLanguage(language: Language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.parentElement && !['SCRIPT','STYLE'].includes(node.parentElement.tagName)) {
      nodes.push(node as Text);
    }
  }
  nodes.forEach(n => {
    const original = n.textContent ?? '';
    const translated = translateText(original, language);
    if (translated !== original) n.textContent = translated;
  });

  document.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]').forEach(el => {
    for (const attr of ['placeholder','title','aria-label']) {
      const value = el.getAttribute(attr);
      if (value) el.setAttribute(attr, translateText(value, language));
    }
  });
}

export default function LanguageManager() {
  useEffect(() => {
    const getLanguage = (): Language =>
      localStorage.getItem('producer-os-language') === 'en' ? 'en' : 'sr';

    const run = () => {
      requestAnimationFrame(() => applyLanguage(getLanguage()));
    };

    run();

    const observer = new MutationObserver(() => run());
    observer.observe(document.body, { childList: true, subtree: true });

    const onLanguageChange = () => run();
    window.addEventListener('producer-os-language-change', onLanguageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('producer-os-language-change', onLanguageChange);
    };
  }, []);

  return null;
}

