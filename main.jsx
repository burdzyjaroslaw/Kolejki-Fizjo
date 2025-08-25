
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as XLSX from 'xlsx';
import { checkSupabase } from './lib/supabase';

const ALL_TREATMENTS = ["Prądy", "Laser", "Ultradźwięki", "Magnetoterapia", "Sollux", "Kineza"];
const KINEZA_TYPES = ["Ćw. ind.", "Ćw. izometryczne", "Ćw. czynne wolne", "Ćw. w odciążeniu"];
const SECTIONS = ["Import","Kolejki","Pacjenci","Ustawienia","Tura"];
// Simple inline icons for sections
function SectionIcon({name, className=""}){
  const common = {width:16, height:16, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round"};
  switch(name){
    case "Import": // arrow into tray
      return <svg {...common} className={className}><path d="M12 3v12"/><path d="M8 9l4 4 4-4"/><rect x="4" y="15" width="16" height="6" rx="2"/></svg>;
    case "Kolejki": // list
      return <svg {...common} className={className}><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/></svg>;
    case "Pacjenci": // user
      return <svg {...common} className={className}><circle cx="12" cy="8" r="3.2"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>;
    case "Ustawienia": // gear
      return <svg {...common} className={className}><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/></svg>;
    case "Tura": // archive/clock
      return <svg {...common} className={className}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7l3-4h12l3 4"/><path d="M12 11v4"/><path d="M12 15h3"/></svg>;
    default:
      return null;
  }
}


function Badge({children}){
  return <span className="ml-2 inline-flex items-center rounded-full bg-brand-100 text-brand-800 dark:bg-white/10 dark:text-white px-2 py-0.5 text-[11px]">{children}</span>;
}

function Modal({open, onClose, children}){
  return (
    <div className={`${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} fixed inset-0 z-[60] flex items-center justify-center transition`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative z-[61] bg-white dark:bg-brand-900 border border-brand-200 dark:border-white/10 rounded-xl shadow-xl p-4 max-w-sm w-[92%]">
        {children}
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white">OK</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({open, onClose, active, setActive, onLogout, dark, toggleDark}){
  useEffect(()=>{
    const onKey = (e)=>{ if(e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 transition-opacity z-[50] ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-[240px] bg-white dark:bg-brand-900 border-r border-brand-200 dark:border-white/10 shadow-xl
                    transform transition-transform z-[51] ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog" aria-modal="true"
      >
        <div className="p-4 border-b border-brand-100 dark:border-white/10 flex items-center justify-between">
          <div className="font-semibold">Menu</div>
          <button onClick={onClose} className="px-2 py-1 rounded-md hover:bg-brand-50 dark:hover:bg-white/10">✕</button>
        </div>
        <nav className="p-2 text-sm">
          {SECTIONS.map(item => (
            <button key={item}
              onClick={()=>{ setActive(item); onClose(); }}
              className={`w-full text-left px-3 py-2 rounded-md hover:bg-brand-50 dark:hover:bg-white/10 mb-1 ${active===item ? 'bg-brand-50 dark:bg-white/10 font-semibold' : ''}`}>
              {item}
            </button>
          ))}
        </nav>
        <div className="p-3"><button onClick={toggleDark} className="w-full px-3 py-2 rounded-md border border-brand-200 bg-white hover:bg-brand-50 dark:bg-white/10 dark:hover:bg-white/20">{dark ? "☀️ Jasny" : "🌙 Ciemny"}</button></div>
<div className="mt-auto p-3">
          <button onClick={onLogout} className="w-full px-3 py-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-300 dark:hover:bg-white/10">Wyloguj</button>
        </div>
      </aside>
    </>
  );
}

function Header({day, tourStart, onReset, onNewTour, dark, toggleDark, onOpenSidebar, goHome, activeSection, onSelectSection, q, setQ, matches, onPickPatient, cloudStatus}){
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 sticky top-0 bg-white/80 dark:bg-brand-900/80 backdrop-blur border-b border-brand-100 dark:border-white/10 z-[40]">
      <div className="flex items-center gap-2">
        <button onClick={onOpenSidebar} aria-label="Otwórz menu" className="px-2 py-1 rounded-md border border-brand-200 dark:border-white/20 hover:bg-brand-50 dark:hover:bg-white/10">☰</button>
        <button onClick={goHome} className="text-xl font-bold hover:opacity-80">Kolejki Fizjo</button>
        {activeSection === "Kolejki" && (
          <div className="relative w-72 ml-3">
            <input
              value={q}
              onChange={(e)=>setQ && setQ(e.target.value)}
              placeholder="Szukaj po imieniu lub numerze karty…"
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:ring-2 focus:ring-brand-400 transition"
            />
            {q && (matches?.length||0) > 0 && (
              <div className={`absolute mt-2 w-full bg-white dark:bg-brand-900/80 border border-brand-200 dark:border-white/10 shadow-lg overflow-hidden z-[50]`}>
                {matches.map(([card, p]) => (
                  <div key={card}
                      onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); onPickPatient && onPickPatient(card);}}
                      className="px-3 py-2 cursor-pointer hover:bg-brand-50 dark:hover:bg-white/10 transition">
                    <div className="font-medium">{card} — {p.name || "?"}</div>
                    <div className="text-[12px] opacity-70">
                      {Array.isArray(p.treatments) && p.treatments.map((t,i)=> <span key={i} className="mr-2">{t.kind}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        
      </div>
      <div className="flex items-center gap-2 flex-wrap">
  {SECTIONS.map(item => (
    <button
      key={item}
      onClick={()=> onSelectSection && onSelectSection(item)}
      className={`px-3 py-1.5 rounded-lg border text-sm transition ${
        activeSection===item
          ? 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700'
          : 'bg-white dark:bg-brand-900/60 border-brand-200 dark:border-white/10 hover:bg-brand-50 dark:hover:bg-white/10'
      }`}
    >
      <span className="inline-flex items-center gap-2">
        <SectionIcon name={item} className="w-4 h-4 opacity-80" />
        {item}
      </span>
    </button>
  ))}
  <span className={
    `ml-2 text-xs px-2 py-1 rounded ` +
    (cloudStatus==='ok' ? 'bg-green-100 text-green-800' :
      cloudStatus==='needsInit' ? 'bg-yellow-100 text-yellow-800' :
      cloudStatus==='checking' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-800')
  }>
    {cloudStatus==='ok' ? 'Chmura: OK' : cloudStatus==='needsInit' ? 'Chmura: połączono (wymaga inicjalizacji)' : cloudStatus==='checking' ? 'Chmura: sprawdzam…' : 'Chmura: offline'}
  </span>
</div>
    </div>
  );
}

function formatDateCell(val){
  if(!val) return "";
  if (typeof val === "number"){
    try { return XLSX.SSF.format("yyyy-mm-dd", val); } catch(e){}
  }
  const s = String(val).strip ? String(val).strip() : String(val).trim();
  // Accept "HH:MM" || "H:MM"
  const m = s.match(/^(\d{1,2}\d{2})$/);
  if (m){
    const [_, h, mi] = m;
    return `${h.padStart(2,"0")}:${mi}`;
  }
  // Accept "HH.MM" used sometimes
  const m2 = s.match(/^(\d{1,2})[.,](\d{2})$/);
  if (m2){
    const [_, h, mi] = m2;
    return `${h.padStart(2,"0")}:${mi}`;
  }
  return s;
}

function PatientsView({patients, setPatients, queues, setQueues, importCohort}){
  const [searchTerm, setSearchTerm] = React.useState("");
  const [editing, setEditing] = useState(null);
  const [newP, setNewP] = useState({card:"", name:""});
  const [selected, setSelected] = useState(new Set());
  const toggleOne = (card)=>{
    setSelected(prev=>{
      const next = new Set(prev);
      if(next.has(card)) next.delete(card); else next.add(card);
      return next;
    });
  };
  const toggleAll = (cards)=>{
    setSelected(prev=>{
      const next = new Set(prev);
      const allOn = cards.every(c => next.has(c));
      if(allOn){ cards.forEach(c=>next.delete(c)); } else { cards.forEach(c=>next.add(c)); }
      return next;
    });
  };
  const deleteOne = (card)=>{
    setPatients(prev=>{ const out={...prev}; delete out[card]; return out; });
    setQueues(prev=>{ const out={}; for(const [kind, arr] of Object.entries(prev||{})){ out[kind]=(arr||[]).filter(it=>String(it.card)!==String(card)); } return out; });
    setSelected(prev=>{ const n=new Set(prev); n.delete(card); return n; });
  };
  const deleteMany = (cards)=>{
    const set = new Set(cards.map(String));
    setPatients(prev=>{ const out={}; for(const [card,p] of Object.entries(prev||{})){ if(!set.has(String(card))) out[card]=p; } return out; });
    setQueues(prev=>{ const out={}; for(const [kind, arr] of Object.entries(prev||{})){ out[kind]=(arr||[]).filter(it=>!set.has(String(it.card))); } return out; });
    setSelected(new Set());
  };


  const rows = Object.entries(patients).filter(([card]) => card.toLowerCase().includes(searchTerm.toLowerCase())).map(([card, p]) => ({card, name: p.name, count: p.treatments.length}));

  const startEdit = (card)=>{
    const p = patients[card];
    setEditing({card, name: p.name, treatments: JSON.parse(JSON.stringify(p.treatments))});
  };

  const saveEdit = ()=>{
    setPatients(prev => {
      const copy = {...prev};
      const {card, name, treatments} = editing;
      copy[card] = {name, treatments};
      return copy;
    });
    setEditing(null);
  };

  const addRow = ()=>{
    const card = newP.card.trim();
    const name = newP.name.trim();
    if(!card || !name) return;
    setPatients(prev => {
      if(prev[card]) return prev;
      return {...prev, [card]: {name, treatments:[], cohort: importCohort}};
    });
    setNewP({card:"", name:""});
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold mb-2">Lista pacjentów</div>
        <div className="overflow-auto border border-brand-200 dark:border-white/10 rounded-lg">{/* Pasek: Szukaj + Dodaj pacjenta (przeniesione do góry) */}
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-end gap-2 md:max-w-md w-full">
          <input
            type="text"
            placeholder="Numer karty lub imię"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-2 outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        <form onSubmit={(e)=>{ e.preventDefault(); addRow(); }} className="flex flex-wrap items-end gap-2">
          <input
            value={newP.card}
            onChange={e=>setNewP(p=>({...p, card:e.target.value}))}
            placeholder="Numer karty"
            className="px-3 py-2 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5"
          />
          <input
            value={newP.name}
            onChange={e=>setNewP(p=>({...p, name:e.target.value}))}
            placeholder="Imię"
            className="px-3 py-2 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5"
          />
          <button className="h-[38px] rounded-md bg-blue-600 px-4 text-white hover:bg-blue-700 active:bg-blue-800" type="submit">Dodaj</button>
          <p className="w-full text-xs text-slate-500 md:w-auto md:ml-2">Zabiegi dodasz w edycji pacjenta.</p>
        </form>
      </div>
<table className="min-w-full text-sm">
            <thead className="bg-brand-50/60 dark:bg-white/10">
              <tr>
                <th className="px-3 py-2"><input type="checkbox" onChange={(e)=>toggleAll(rows.map(r=>r.card))} checked={rows.length>0 && rows.every(r=>selected.has(r.card))} /></th>
                <th className="text-left px-3 py-2">Numer karty</th>
                <th className="text-left px-3 py-2">Imię</th>
                <th className="text-left px-3 py-2">Liczba zabiegów</th>
                <th className="text-right px-3 py-2">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.card} className="border-t border-brand-100 dark:border-white/10">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(r.card)} onChange={()=>toggleOne(r.card)} /></td>
                  <td className="px-3 py-2">{r.card}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.count}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={()=>startEdit(r.card)} className="mr-2 px-2 py-1 rounded border border-brand-200 bg-white hover:bg-brand-50 dark:bg-white/10 dark:hover:bg-white/20">Edytuj</button>
                    <button onClick={()=>deleteOne(r.card)} className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">Usuń</button>
                  </td>
                </tr>
              ))}
              {rows.length===0 && (
                <tr><td colSpan="4" className="px-3 py-6 text-center opacity-60">Brak pacjentów</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <div className="border border-brand-200 dark:border-white/10 rounded-lg p-3">
          <div className="text-sm font-semibold mb-2">Edytuj: {editing.card}</div>
          <div className="flex flex-wrap gap-2 mb-2">
            <input value={editing.name} onChange={e=>setEditing(ed=>({...ed, name:e.target.value}))} className="px-3 py-2 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5 w-64" />
          </div>
          <div className="space-y-2">
            {editing.treatments.map((t, i)=> (
              <div key={i} className="flex flex-wrap gap-2 items-center">
                <select value={t.kind} onChange={e=>{
                  const v=e.target.value;
                  setEditing(ed=>{
                    const tt=[...ed.treatments]; tt[i]={...tt[i], kind:v}; return {...ed, treatments:tt};
                  });
                }} className="px-2 py-1.5 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5">
                  {ALL_TREATMENTS.map(k=><option key={k}>{k}</option>)}
                </select>
                <input value={t.desc} onChange={e=>{
                  const v=e.target.value;
                  setEditing(ed=>{
                    const tt=[...ed.treatments]; tt[i]={...tt[i], desc:v}; return {...ed, treatments:tt};
                  });
                }} placeholder="Okolica / rodzaj (np. Ćw. ind.)" className="px-3 py-2 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5 w-64" />
                <button onClick={()=>setEditing(ed=>{
                  const tt=[...ed.treatments]; tt.splice(i,1); return {...ed, treatments:tt};
                })} className="px-2 py-1 rounded-md border border-brand-200 dark:border-white/20 hover:bg-brand-50 dark:hover:bg-white/10">Usuń</button>
              </div>
            ))}
            <button onClick={()=>setEditing(ed=>({...ed, treatments:[...ed.treatments, {kind:ALL_TREATMENTS[0], desc:""}]}))} className="px-3 py-1.5 rounded-md border border-brand-200 dark:border-white/20 hover:bg-brand-50 dark:hover:bg-white/10">+ Dodaj zabieg</button>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={saveEdit} className="px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700">Zapisz</button>
            <button onClick={()=>setEditing(null)} className="px-3 py-2 rounded-md border border-brand-200 dark:border-white/20 hover:bg-brand-50 dark:hover:bg-white/10">Anuluj</button>
          </div>
        </div>
      )}
    </div>
  );
}


async function sha256(text){
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt(len=16){
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function getUsers(){
  try { return JSON.parse(localStorage.getItem('kf_users')) || []; } catch { return []; }
}
function setUsers(users){
  localStorage.setItem('kf_users', JSON.stringify(users));
}
function getSessionUser(){
  try { return JSON.parse(localStorage.getItem('kf_sessionUser')) || null; } catch { return null; }
}
function setSessionUser(u){
  if(u) localStorage.setItem('kf_sessionUser', JSON.stringify({username:u.username}));
  else localStorage.removeItem('kf_sessionUser');
}


function ArchivedToursView({importCohort, setPatients}){
  // Load and auto-clean (expire after 20 days)
  const [archived, setArchived] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('archivedTours'))||{ambu:[],dzienni:[]}; }catch(e){ return {ambu:[],dzienni:[]}; }
  });
  const persistArchived = (next)=>{
    setArchived(next);
    try { localStorage.setItem('archivedTours', JSON.stringify(next)); } catch(e){}
  };
  useEffect(()=>{
    try{
      const now = Date.now();
      const cutoff = now - 20*24*60*60*1000; // 20 days
      const next = {ambu:[], dzienni:[]};
      for(const k of ['ambu','dzienni']){
        const arr = Array.isArray(archived[k]) ? archived[k] : [];
        next[k] = arr.filter(t => {
          const ts = Date.parse(t.id || t.archivedAt || "");
          return !isNaN(ts) && ts >= cutoff;
        });
      }
      // Only persist if something changed length-wise
      if ((next.ambu.length !== (archived.ambu||[]).length) || (next.dzienni.length !== (archived.dzienni||[]).length)){
        persistArchived(next);
      }
    }catch(e){}
  }, []);

  // Child panel per tour with its own local state
  function TourPanel({tour, idx}){
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null); // {origCard, card, name, treatments:[]}

    const filteredRows = useMemo(()=>{
      const entries = Object.entries(tour.patients||{});
      if(!search) return [];
      const s = search.toLowerCase();
      return entries.filter(([card,p])=> String(card).toLowerCase().includes(s) || (p.name||"").toLowerCase().includes(s));
    }, [tour, search]);

    const restorePatient = (p)=>{
      setPatients(prev=>{
        const copy={...prev};
        if(!copy[p.card]) copy[p.card]={...p, cohort: importCohort};
        return copy;
      });
    };

    const startEdit = (card)=>{
      const p = tour.patients[card];
      const treatments = Array.isArray(p.treatments) ? JSON.parse(JSON.stringify(p.treatments)) : [];
      setEditing({origCard: card, card, name: p.name||"", treatments});
    };

    const saveEdit = ()=>{
      if(!editing) return;
      const {origCard, card, name, treatments} = editing;
      const next = JSON.parse(JSON.stringify(archived));
      const arr = next[importCohort] || [];
      const t = arr[idx];
      if(!t) return;
      if(origCard !== card){ delete t.patients[origCard]; }
      t.patients[card] = { ...(t.patients[card]||{}), name, treatments };
      persistArchived(next);
      setEditing(null);
    };

    const removeTreatment = (i)=> setEditing(ed=>{ const t=[...ed.treatments]; t.splice(i,1); return {...ed, treatments:t}; });
    const addTreatment = ()=> setEditing(ed=>{ const t=[...ed.treatments, {kind:ALL_TREATMENTS[0], desc:""}]; return {...ed, treatments:t}; });

    return (
      <div className="border border-brand-200 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-white/5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm font-semibold">
            {tour.name || tour.id}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={()=>{ if (confirm('Usunąć tę turę?')) { const next = JSON.parse(JSON.stringify(archived)); (next[importCohort]||[]).splice(idx,1); persistArchived(next); } }}
              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md"
            >
              Usuń turę
            </button>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Szukaj po karcie lub imieniu…"
              className="px-3 py-1.5 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {!search && (<div className="text-sm opacity-70">Wpisz w wyszukiwarce, aby wyświetlić pacjenta z tej tury.</div>)}
        {search && (
          <table className="min-w-full text-sm rounded-md overflow-hidden">
            <thead className="bg-brand-50/60 dark:bg-white/10">
              <tr><th className="text-left px-3 py-2">Numer karty</th><th className="text-left px-3 py-2">Imię i nazwisko</th><th className="px-3 py-2 text-right">Akcje</th></tr>
            </thead>
            <tbody>
              {filteredRows.map(([card,p])=> (
                <tr key={card} className="border-t border-brand-100/60 dark:border-white/10 hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-3 py-2">{card}</td>
                  <td className="px-3 py-2">{p.name||"?"}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button onClick={()=>restorePatient({card, ...p})} className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800">Dodaj do listy</button>
                    <button onClick={()=>startEdit(card)} className="px-2.5 py-1.5 rounded-md border border-brand-200 dark:border-white/20 hover:bg-brand-50 dark:hover:bg-white/10">Edytuj</button>
                  </td>
                </tr>
              ))}
              {search && filteredRows.length===0 && (<tr><td colSpan="3" className="px-3 py-4 text-center opacity-60">Brak wyników</td></tr>)}
            </tbody>
          </table>
        )}

        {editing && (
          <div className="border border-brand-200 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-white/5 shadow-sm">
            <div className="text-sm font-semibold mb-2">Edytuj (tura {tour.name || tour.id})</div>
            <div className="flex flex-wrap gap-2 mb-2">
              <input value={editing.card} onChange={e=>setEditing(ed=>({...ed, card:e.target.value}))} placeholder="Numer karty" className="px-2 py-1.5 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5" />
              <input value={editing.name} onChange={e=>setEditing(ed=>({...ed, name:e.target.value}))} placeholder="Imię i nazwisko" className="px-2 py-1.5 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5 w-64" />
            </div>
            <div className="space-y-2">
              {editing.treatments.map((t,i)=> (
                <div key={i} className="flex flex-wrap gap-2 items-center">
                  <select value={t.kind} onChange={e=>{ const v=e.target.value; setEditing(ed=>{ const tt=[...ed.treatments]; tt[i]={...tt[i], kind:v}; return {...ed, treatments:tt}; }); }} className="px-2 py-1.5 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5">
                    {ALL_TREATMENTS.map(k=><option key={k}>{k}</option>)}
                  </select>
                  <input value={t.desc||""} onChange={e=>{ const v=e.target.value; setEditing(ed=>{ const tt=[...ed.treatments]; tt[i]={...tt[i], desc:v}; return {...ed, treatments:tt}; }); }} placeholder="opis / okolica / rodzaj" className="px-2 py-1.5 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5 w-64" />
                  <button onClick={()=>removeTreatment(i)} className="px-2 py-1 rounded-md border border-red-300 text-red-700 hover:bg-red-50">Usuń</button>
                </div>
              ))}
              <button onClick={addTreatment} className="px-2 py-1 rounded-md border hover:bg-brand-50 dark:hover:bg-white/10">+ Dodaj zabieg</button>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={saveEdit} className="px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700">Zapisz</button>
              <button onClick={()=>setEditing(null)} className="px-3 py-2 rounded-md border border-brand-200 dark:border-white/20">Anuluj</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render all tours stacked for this cohort
  const list = Array.isArray(archived[importCohort]) ? archived[importCohort] : [];
  return (
    <div className="space-y-4">
      
      {list.length===0 && (<div className="text-xs opacity-60">Brak zamkniętych tur</div>)}
      <div className="space-y-4">
        {list.map((t,i)=>(<TourPanel key={(t.id||"")+":"+i} tour={t} idx={i} />))}
      </div>
    </div>
  );
}function AuthShell({onLogin}){
  const [hasUsers, setHasUsers] = useState(()=> getUsers().length>0);
  useEffect(()=>{ setHasUsers(getUsers().length>0); }, []);
  return hasUsers ? <Login onLogin={onLogin}/> : <Register onRegister={()=>{ setHasUsers(true); }}/>
}

function Field({label, type='text', value, onChange, placeholder=''}){
  return (
    <label className="block">
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-brand-200 dark:border-white/20 bg-white dark:bg-white/5 outline-none focus:ring-2 focus:ring-brand-400"/>
    </label>
  );
}

function CardWrap({title, children, footer}){
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-brand-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4">
        <div className="text-lg font-semibold mb-1">{title}</div>
        <div className="opacity-70 text-sm mb-3">Kolejki Fizjo</div>
        <div className="space-y-2">{children}</div>
        {footer && <div className="mt-3 text-xs opacity-70">{footer}</div>}
      </div>
    </div>
  );
}

function Register({onRegister}){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async ()=>{
    setMsg("");
    if(!username.trim()){ setMsg("Podaj nazwę użytkownika."); return; }
    if(password.length<6){ setMsg("Hasło musi mieć min. 6 znaków."); return; }
    if(password!==repeat){ setMsg("Hasła się nie zgadzają."); return; }
    const users = getUsers();
    if(users.find(u=>u.username.toLowerCase()===username.toLowerCase())){
      setMsg("Taki użytkownik już istnieje."); return;
    }
    setBusy(true);
    const salt = randomSalt(16);
    const hash = await sha256(password + ":" + salt);
    users.push({username, salt, hash, createdAt: Date.now()});
    setUsers(users);
    setBusy(false);
    onRegister && onRegister();
  };

  return (
    <CardWrap title="Rejestracja">
      <Field label="Nazwa użytkownika" value={username} onChange={setUsername} placeholder="np. anna.k"/>
      <Field label="Hasło" type="password" value={password} onChange={setPassword} placeholder="min. 6 znaków"/>
      <Field label="Powtórz hasło" type="password" value={repeat} onChange={setRepeat}/>
      {msg && <div className="text-sm text-red-600 dark:text-red-400">{msg}</div>}
      <button disabled={busy} onClick={submit} className="w-full mt-1 px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">
        {busy? "Tworzenie..." : "Utwórz konto"}
      </button>
      <div className="mt-2 text-xs opacity-70">To jednorazowa rejestracja. Kolejni użytkownicy muszą być dodani ręcznie (do zrobienia).</div>
    </CardWrap>
  );
}

function Login({onLogin}){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async ()=>{
    setMsg("");
    setBusy(true);
    const users = getUsers();
    const user = users.find(u=>u.username.toLowerCase()===username.toLowerCase());
    if(!user){ setMsg("Nieprawidłowy login lub hasło."); setBusy(false); return; }
    const check = await sha256(password + ":" + user.salt);
    if(check!==user.hash){ setMsg("Nieprawidłowy login lub hasło."); setBusy(false); return; }
    setSessionUser({username: user.username});
    setBusy(false);
    onLogin && onLogin({username: user.username});
  };

  return (
    <CardWrap title="Logowanie" footer="W razie problemów skontaktuj się z administratorem.">
      <Field label="Login" value={username} onChange={setUsername} placeholder="nazwa użytkownika"/>
      <Field label="Hasło" type="password" value={password} onChange={setPassword}/>
      {msg && <div className="text-sm text-red-600 dark:text-red-400">{msg}</div>}
      <button disabled={busy} onClick={submit} className="w-full mt-1 px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">
        {busy? "Logowanie..." : "Zaloguj"}
      </button>
    </CardWrap>
  );
}

function App(){
  const [cloudStatus, setCloudStatus] = useState('checking');
  useEffect(()=>{ (async()=>{ const res = await checkSupabase(); setCloudStatus(res.ok ? (res.needsInit ? 'needsInit' : 'ok') : 'offline'); })(); }, []);

  const [visibleKinds, setVisibleKinds] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('kf_visibleRubryki')) || ALL_TREATMENTS; } catch { return ALL_TREATMENTS; }
  });

  const [day, setDay] = useState(1);
  const [tourStart, setTourStart] = useState("");
  const [importCohort, setImportCohort] = useState("dzienni");
  const [patients, setPatients] = useState(() => {
  const saved = localStorage.getItem('patients');
  return saved ? JSON.parse(saved) : {};
});

useEffect(() => {
  localStorage.setItem('patients', JSON.stringify(patients));
}, [patients]);;
  
  // Per-cohort day counters (persisted)
  const [cohortDays, setCohortDays] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('cohortDays')||'{"ambu":0,"dzienni":0}'); } catch(e){ return {"ambu":0,"dzienni":0}; }
  });
  
  const [cohortDurations, setCohortDurations] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('cohortDurations')||'{"ambu":10,"dzienni":15}'); } catch(e){ return {"ambu":10,"dzienni":15}; }
  });
  useEffect(()=>{ localStorage.setItem('cohortDurations', JSON.stringify(cohortDurations)); }, [cohortDurations]);
const [cohortStart, setCohortStart] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('cohortStart')||'{"ambu":"", "dzienni":""}'); } catch(e){ return {"ambu":"", "dzienni":""}; }
  });
  useEffect(()=>{ localStorage.setItem('cohortDays', JSON.stringify(cohortDays)); }, [cohortDays]);
  useEffect(()=>{ localStorage.setItem('cohortStart', JSON.stringify(cohortStart)); }, [cohortStart]);

  const incCohortDay = (which)=> { clearQueuesForCohort(which); setCohortDays(prev=> ({...prev, [which]: (prev[which]||0)+1 })); };
  const resetCohortDay = (which)=> setCohortDays(prev=> ({...prev, [which]: 1 }));
  const setCohortStarted = (which)=> setCohortStart(prev=> ({...prev, [which]: prev[which] || new Date().toISOString().slice(0,10) }));
const [queues, setQueues] = useState(Object.fromEntries(ALL_TREATMENTS.map(t=>[t, []])));
  // Usuwa z KOLEJEK wpisy pacjentów należących do danej tury (ambu/dzienni)
  function clearQueuesForCohort(which){
    if(!which) return;
    setQueues(prev => {
      const next = {};
      for (const [kind, arr] of Object.entries(prev||{})){
        next[kind] = (arr||[]).filter(it => {
          const p = patients && patients[it.card];
          return !(p && p.cohort === which);
        });
      }
      return next;
    });
  }

  const [registered, setRegistered] = useState([]);
  const [q, setQ] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Kolejki");
  const [currentUser, setCurrentUser] = useState(()=> getSessionUser());
  const [expanded, setExpanded] = useState({});
  const [pendingParsed, setPendingParsed] = useState(null);
  const [fixOpen, setFixOpen] = useState(false);
  const [fixRows, setFixRows] = useState([]);
  // --- Long-press & priority move state ---
  const [menu, setMenu] = useState(null); // {x,y, kind, id}
  const lpTimer = useRef(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const cancelClickRef = useRef(false);

  const openMenu = (x, y, payload) => setMenu({ x, y, ...payload });
  const closeMenu = () => setMenu(null);
  const clearLp = () => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; } };

  const moveUpInQueue = (kind, id) => {
    setQueues(prev => {
      const updated = { ...prev };
      const arr = [...(updated[kind] || [])];
      const idx = arr.findIndex(x => (x.id || `${x.card}-${x.desc}`) === id);
      if (idx > 0) { [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; updated[kind] = arr; }
      return updated;
    });
    closeMenu();
  };

  const moveTopInQueue = (kind, id) => {
    setQueues(prev => {
      const updated = { ...prev };
      const arr = [...(updated[kind] || [])];
      const idx = arr.findIndex(x => (x.id || `${x.card}-${x.desc}`) === id);
      if (idx > 0) {
        const [item] = arr.splice(idx, 1);
        updated[kind] = [{ ...item, manualPriority: true, manualChangedAt: Date.now() }, ...arr];
      }
      return updated;
    });
    closeMenu();
  };


  useEffect(()=>{ document.documentElement.classList.toggle('dark', dark); }, [dark]);
  useEffect(()=>{ /* session bootstrap */ const s=getSessionUser(); if(s && !currentUser){ setCurrentUser(s); } }, []);
  useEffect(()=>{ localStorage.setItem('kf_visibleRubryki', JSON.stringify(visibleKinds)); }, [visibleKinds]);

  function formatDateCell(val){
    if(!val) return "";
    if (typeof val === "number"){
      try { return XLSX.SSF.format("yyyy-mm-dd", val); } catch(e){}
    }
    const s = String(val).trim();
    const normalized = s.replace(/\./g, "-").replace(/\//g, "-");
    const m = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m){
      const [_, d, mo, y] = m;
      return `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}`;
    }
    const m2 = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m2) return normalized;
    return s;
  }

  
  function addRowToParsed(row, parsed){
    const card = String(row["Numer karty"]||"").trim();
    const name = String(row["Imię"]||"").trim();
    if(!card) return;
    if(!parsed[card]) parsed[card] = {name, treatments:[]};
    else if(name && !parsed[card].name) parsed[card].name = name;
    for(let i=1;i<=5;i++){
      const kind = String(row[`Zabieg ${i}`]||"").trim();
      const area = String(row[`Okolica ${i}`]||"").trim();
      const currentType = String(row[`Rodzaj prądu ${i}`]||"").trim();
      const kineType = String(row[`Rodzaj kinezy ${i}`]||"").trim();
      if(kind && area){
        let desc = area;
        if(kind==="Prądy" && currentType){ desc = `${area} (${currentType})`; }
        if(kind==="Kineza" && (kineType)){ desc = `${area} (${kineType})`; }
        if(!parsed[card].treatments) parsed[card].treatments = [];
        parsed[card].treatments.push({kind, desc});
      }
    }
  }

// === Excel import: NEW FORMAT + Layout A fallback ===
function letterToIndex(letter){
  let num = 0;
  for (let i=0; i<letter.length; i++){ num = num*26 + (letter.charCodeAt(i) - 64); }
  return num - 1; // zero-based
}
function normalizeHeader(h){
  if (!h) return "";
  return String(h).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g,' ').trim();
}

// Layout A via A1 (D–H prądy, I–L kineza, M/N–Q/R pary)
function parseByBlocksA1(rowsA1){
  const parsed = {};
  if (!rowsA1 || rowsA1.length === 0) return parsed;
  const header = rowsA1[0] || [];
  const get = (r,c)=> (rowsA1[r] && rowsA1[r][c] != null ? String(rowsA1[r][c]) : "");

  const pradyIdx = ["D","E","F","G","H"].map(letterToIndex);
  const kinezaIdx = ["I","J","K","L"].map(letterToIndex);
  const pairs = [["M","N"],["O","P"],["Q","R"]].map(([z,a])=>[letterToIndex(z),letterToIndex(a)]);

  const mapQ = {
    "laser":"Laser",
    "mtc":"Magnetronik",
    "magnetoterapia":"Magnetronik",
    "magnetronik":"Magnetronik",
    "sollux":"Sollux",
    "ud":"Ultradźwięki",
    "ultradzwieki":"Ultradźwięki",
    "ultradźwięki":"Ultradźwięki",
  };

  for (let r=1; r<rowsA1.length; r++){
    const card = get(r, letterToIndex("A")).trim();
    if(!card) continue;
    const name = get(r, letterToIndex("B")).trim();
    const time = get(r, letterToIndex("C")).trim();
    const p = parsed[card] || (parsed[card] = {name, time, treatments: []});
    if (!p.name && name) p.name = name;
    if (!p.time && time) p.time = time;

    // Prądy D–H: desc = "TYPE AREA"
    for (const idx of pradyIdx){
      const area = get(r, idx).trim();
      if (area){
        const type = String(header[idx]||"").trim();
        const desc = (type ? `${type} ${area}` : area).trim();
        p.treatments.push({ kind:"Prądy", desc });
      }
    }
    // Kineza I–L
    for (const idx of kinezaIdx){
      const area = get(r, idx).trim();
      if (area){
        const type = String(header[idx]||"").trim();
        const desc = (type ? `${type} ${area}` : area).trim();
        p.treatments.push({ kind:"Kineza", desc });
      }
    }
    // Pary
    for (const [zIdx, aIdx] of pairs){
      const z = get(r, zIdx).trim();
      if (!z) continue;
      const a = get(r, aIdx).trim();
      const q = mapQ[z.toLowerCase()] || null;
      if (q) p.treatments.push({ kind: q, desc: a });
    }
  }
  return parsed;
}

// NEW FORMAT: Z1->Prądy (Rodzaj prądu 1 + Okolica 1), Z2->Kineza (Rodzaj kinezy 2 + Okolica 2), Z3..Z5 -> Laser/UD/MTC/Sollux
function parseNewFormatA(rowsA1){
  const parsed = {};
  if (!rowsA1 || rowsA1.length === 0) return parsed;
  const headers = rowsA1[0] || [];

  const hmap = {};
  for (let c=0; c<headers.length; c++){ const key = normalizeHeader(headers[c]); if (key && !(key in hmap)) hmap[key] = c; }
  const idx = (...names)=>{ for (const n of names){ const k = normalizeHeader(n); if (k in hmap) return hmap[k]; } return -1; };

  const A = idx("Numer karty","numer karty");
  const B = idx("Imię","Imie");
  const C = idx("Godzina przyjścia","Godzina przyjscia");

  // Z1 (Prądy) — akceptuj 'Prądy/Prady' wpisane w 'Zabieg 1'
  const Z1 = idx("Zabieg 1","Z1","Prądy","Prady","Zabieg1");
  const O1 = idx("Okolica 1","Okolica1");
  const RP1 = idx("Rodzaj prądu 1","Rodzaju prądu 1","Rodzaj pradu 1","Rodzaj pradu1","Rodzaj prądu1");

  // Z2 (Kineza)
  const Z2 = idx("Zabieg 2","Z2","Kineza","Zabieg2");
  const O2 = idx("Okolica 2","Okolica2");
  const RK2 = idx("Rodzaj kinezy 2","Rodzaj kinezy2","Rodzaj kinesy 2","Rodzaj kinesy2","Rodzaj kinesy");

  // Z3..Z5 + okolice
  const Z3 = idx("Zabieg 3","Z3"); const O3 = idx("Okolica 3","Okolica3");
  const Z4 = idx("Zabieg 4","Z4"); const O4 = idx("Okolica 4","Okolica4");
  const Z5 = idx("Zabieg 5","Z5"); const O5 = idx("Okolica 5","Okolica5");

  const mapQ = {
    "laser":"Laser",
    "mtc":"Magnetronik",
    "magnetoterapia":"Magnetronik",
    "magnetronik":"Magnetronik",
    "sollux":"Sollux",
    "ud":"Ultradźwięki",
    "ultradzwieki":"Ultradźwięki",
    "ultradźwięki":"Ultradźwięki",
  };

  const ensure = (card, name, time)=>{
    const p = parsed[card] || (parsed[card] = { name, time, treatments: [] });
    if (name && !p.name) p.name = name;
    if (time && !p.time) p.time = time;
    return p;
  };

  for (let r=1; r<rowsA1.length; r++){
    const row = rowsA1[r] || [];
    const card = A>=0 ? String(row[A]||"").trim() : "";
    if (!card) continue;
    const name = B>=0 ? String(row[B]||"").trim() : "";
    const time = C>=0 ? String(row[C]||"").trim() : "";
    const p = ensure(card, name, time);

    // Zabieg 1 -> Prądy
    const area1 = O1>=0 ? String(row[O1]||"").trim() : "";
    const type1 = RP1>=0 ? String(row[RP1]||"").trim() : "";
    const z1 = Z1>=0 ? String(row[Z1]||"").trim().toLowerCase() : "";
    if (area1 || type1 || z1 == "prądy" || z1 == "prady"){
      const desc = [type1, area1].filter(Boolean).join(" ").trim();
      if (desc) p.treatments.push({ kind:"Prądy", desc });
    }

    // Zabieg 2 -> Kineza
    const area2 = O2>=0 ? String(row[O2]||"").trim() : "";
    const type2 = RK2>=0 ? String(row[RK2]||"").trim() : "";
    const z2 = Z2>=0 ? String(row[Z2]||"").trim().toLowerCase() : "";
    if (area2 || type2 || z2 == "kineza"){
      const desc = [type2, area2].filter(Boolean).join(" ").trim();
      if (desc) p.treatments.push({ kind:"Kineza", desc });
    }

    // Zabieg 3..5 -> konkretne kolejki
    const pushZA = (z,a)=>{
      if (!z) return;
      const q = mapQ[(z||"").toLowerCase()] || null;
      if (!q) return;
      p.treatments.push({ kind: q, desc: (a||"").trim() });
    };
    const z3 = Z3>=0 ? String(row[Z3]||"").trim() : ""; const a3 = O3>=0 ? String(row[O3]||"").trim() : "";
    const z4 = Z4>=0 ? String(row[Z4]||"").trim() : ""; const a4 = O4>=0 ? String(row[O4]||"").trim() : "";
    const z5 = Z5>=0 ? String(row[Z5]||"").trim() : ""; const a5 = O5>=0 ? String(row[O5]||"").trim() : "";
    pushZA(z3,a3); pushZA(z4,a4); pushZA(z5,a5);
  }

  return parsed;
}


const handleFile = async (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    // size guard ~5MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE){
      alert("Plik jest zbyt duży (>5 MB). Podziel na mniejsze lub usuń niepotrzebne arkusze.");
      return;
    }
    setFileName(file.name);
    try {
      const m = JSON.parse(localStorage.getItem('lastFileNameByCohort')||'{}');
      if (importCohort) { m[importCohort] = file.name; localStorage.setItem('lastFileNameByCohort', JSON.stringify(m)); }
    } catch(e){}
    let rows = [];
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, {defval:""});
      const rowsA1 = XLSX.utils.sheet_to_json(sheet, {header:1, defval:""});
      let parsedV2 = parseNewFormatA(rowsA1);
      if (!parsedV2 || Object.values(parsedV2).reduce((a,p)=>a+((p.treatments||[]).length),0) === 0){
        parsedV2 = parseByBlocksA1(rowsA1);
      }

    } catch(err){
      console.error(err);
      alert("Nie udało się odczytać pliku Excel. Upewnij się, że to .xlsx i spróbuj ponownie.");
      return;
    }

    // Header validation
    const allHeaders = new Set(rows.flatMap(r=>Object.keys(r)));
    const required = ["Numer karty","Imię"]; // minimal required
    const missingReq = required.filter(h=>!allHeaders.has(h));
    if (missingReq.length){
      alert("Brak wymaganych kolumn w Excelu: " + missingReq.join(", "));
      return;
    }

    // Build parsed and collect issues for missing card/name
    const parsed = {};
    const issues = [];
    rows.forEach((row, idx) => {
      const cardRaw = String(row["Numer karty"]||"").trim();
      const nameRaw = String(row["Imię"]||"").trim();
      if(!cardRaw || !nameRaw){
        issues.push({ idx: idx+2, card: cardRaw, name: nameRaw, row });
        return;
      }
      addRowToParsed(row, parsed);
    });

    // Warn about duplicates (informational)
    const counts = {};
    rows.forEach(r=>{ const c = String(r["Numer karty"]||"").trim(); if(c){ counts[c]=(counts[c]||0)+1; } });
    const dupeCards = Object.entries(counts).filter(([c,n])=>n>1).map(([c,n])=>`${c} (x${n})`);
    if(dupeCards.length){
      alert("Wykryto duplikaty numerów kart – zabiegi dla tych kart zostaną scalone: " + dupeCards.join(", "));
    }

    if (issues.length){
      setFixRows(issues);
      setPendingParsed(parsed);
      setFixOpen(true);
      return;
    }

    
    // OVERRIDE_V2: jeśli nowy parser zwrócił zabiegi, nadpisz parsed
    if (typeof parsedV2 !== "undefined" && parsedV2) {
      const _cnt = Object.values(parsedV2).reduce((acc, p)=> acc + (Array.isArray(p.treatments)? p.treatments.length : 0), 0);
      if (_cnt > 0) {
        for (const k of Object.keys(parsed)) delete parsed[k];
        Object.assign(parsed, parsedV2);
      }
    }

    // STAMP COHORT + MERGE
    try {
      if (importCohort) {
        for (const k of Object.keys(parsed)) {
          if (!parsed[k]) continue;
          parsed[k].cohort = importCohort;
        }
      }
    } catch(e){ console.warn("STAMP_COHORT failed", e); }
    setPatients(prev => ({...prev, ...parsed}));
    // SET_START_AFTER_IMPORT
    try {
      if (importCohort) {
        if (!cohortStart[importCohort]) setCohortStarted(importCohort);
        if (!cohortDays[importCohort] || cohortDays[importCohort]===0) setCohortDays(prev=> ({...prev, [importCohort]: 1}));
      }
    } catch(e){}
    
    setActiveSection("Kolejki");
    setFileName("");
    if(fileInputRef.current){ fileInputRef.current.value = ""; }
  };

  const matches = useMemo(()=> Object.entries(patients)
    .filter(([card, p]) => (q && (card.includes(q) || (p.name||"").toLowerCase().includes(q.toLowerCase()))))
    .slice(0,10), [patients, q]);

  const addToQueues = (card)=>{
    if(!patients[card]) return;  // pozwól wybrać pacjenta ponownie tego samego dnia
    const p = patients[card];
    const updated = {...queues};
    p.treatments.forEach(t => {
      // (widoczność: tylko render, nie dodawanie)
      if(!updated[t.kind]) updated[t.kind]=[];
      const _id = `${card}:${t.kind}:${(t.desc||'').trim()}`;
      if (!updated[t.kind].some(x=>x.id===_id)) {
        updated[t.kind] = [...updated[t.kind], { id: _id, card, name: p.name, desc: t.desc, done:false, t:null }];
      }
    });
    setQueues(updated);
    setRegistered(prev=>[...prev, card]);
    setQ("");
  }
// Remove only patients and queue items of a selected cohort ('ambu' or 'dzienni')
function closeCohort(which){
  const toArchive = Object.fromEntries(Object.entries(patients||{}).filter(([card,p]) => p && p.cohort === which));
  if(!which) return;
  setPatients(prev => {
    const toRemove = new Set(Object.entries(prev).filter(([card,p]) => p && p.cohort === which).map(([card]) => String(card)));
    const next = {};
    for (const [card, p] of Object.entries(prev)){
      if(!toRemove.has(String(card))) next[card] = p;
    }
    // Also filter queues
    setQueues(prevQ => {
      const nq = {};
      for (const [kind, arr] of Object.entries(prevQ||{})){
        nq[kind] = (arr||[]).filter(it => !toRemove.has(String(it.card)));
      }
      return nq;
    });
    return next;
  });
  try {
    const archivedRaw = localStorage.getItem('archivedTours');
    const archived = archivedRaw ? JSON.parse(archivedRaw) : {ambu:[], dzienni:[]};
    const nameMap = JSON.parse(localStorage.getItem('lastFileNameByCohort')||'{}');
    const tourName = nameMap && nameMap[which] ? String(nameMap[which]) : null;
    archived[which] = archived[which] || [];
    archived[which].push({ id: new Date().toISOString(), name: tourName, patients: toArchive });
    localStorage.setItem('archivedTours', JSON.stringify(archived));
  } catch(e){ console.warn("Archive failed", e); }
  localStorage.removeItem('patients');
}
;

  const toggleDone = (kind, id)=>{
    const updated = {...queues};
    const index = updated[kind].findIndex(x=>x.id===id);
    if(index<0) return;
    const item = {...updated[kind][index]};
    if(!item.done){
      item.done = true;
      item.t = setTimeout(()=>{
        setQueues(prev => {
          const copy = {...prev};
          copy[kind] = copy[kind].filter(x=>x.id!==id);
          return copy;
        });
      }, 10000);
    } else {
      item.done = false;
      if(item.t){ clearTimeout(item.t); item.t=null; }
    }
    updated[kind] = updated[kind].map((x)=> x.id===id ? item : x);
    setQueues(updated);
  };

  const countsActive = Object.fromEntries(ALL_TREATMENTS.map(t => [t, queues[t]?.filter(x=>!x.done).length || 0]));

  const onReset = ()=>{
    
    setDay(d=> d+1);
    setQueues(Object.fromEntries(ALL_TREATMENTS.map(t=>[t, []])));
    setRegistered([]);
  };

  const onNewTour = ()=>{
    setDay(1);
    setQueues(Object.fromEntries(ALL_TREATMENTS.map(t=>[t, []])));
    setRegistered([]);
    setPatients({});
    setQ("");
    setFileName("");
    setTourStart("");
    setActiveSection("Import");
    setSidebarOpen(false);
  };

  const onLogout = ()=>{ setSessionUser(null); try{ setCurrentUser && setCurrentUser(null); }catch(e){}; window.location.reload();
    setQueues(Object.fromEntries(ALL_TREATMENTS.map(t=>[t, []])));
    setRegistered([]);
    setQ("");
    setActiveSection("Kolejki");
    setSidebarOpen(false);
    alert("Wylogowano (lokalnie).");
  };

    const kindsToShow = ALL_TREATMENTS.filter(k => visibleKinds.includes(k));
  const toggleExpand = (kind)=> setExpanded(prev => ({...prev, [kind]: !prev[kind]}));

  return (

<div className="min-h-screen text-[14px]">
      <Header
        day={day}
        tourStart={tourStart}
        onReset={onReset}
        onNewTour={onNewTour}
        dark={dark}
        toggleDark={()=>setDark(d=>!d)}
        onOpenSidebar={()=>setSidebarOpen(true)}
        goHome={()=>{ setActiveSection("Kolejki"); setSidebarOpen(false); }}
        activeSection={activeSection}
        onSelectSection={(s)=>{ setActiveSection(s); setSidebarOpen(false); }}
        q={q}
        setQ={setQ}
        matches={matches}
        onPickPatient={addToQueues}
        cloudStatus={cloudStatus}
      />

      <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} active={activeSection} setActive={setActiveSection} onLogout={onLogout} dark={dark} toggleDark={()=>setDark(d=>!d)} />

      


      


      


      <div className="p-3 max-w-6xl mx-auto">
        {activeSection === "Import" && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Import</h3>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <label className="text-xs opacity-80">Plik Excel:</label>
              
        {/* IMPORT_COHORT_UI */}
        <div className="px-3 py-2 text-sm text-slate-700">Ten plik dotyczy:</div>
        <div className="px-3 pb-2 space-x-4">
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input type="radio" name="importCohort" checked={importCohort==='ambu'} onChange={()=>setImportCohort('ambu')} />
            <span>ambu</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input type="radio" name="importCohort" checked={importCohort==='dzienni'} onChange={()=>setImportCohort('dzienni')} />
            <span>dzienni</span>
          </label>
        </div>
    
        <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFile}
                className="file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-600 file:text-white hover:file:bg-brand-700
                          file:cursor-pointer block w-full max-w-md border rounded-md px-2.5 py-2 border-brand-200 dark:border-white/10 bg-white dark:bg-white/5" />
              <div className="text-xs opacity-70">{fileName ? `✅ ${fileName}` : "Najpierw wybierz plik Excel"}</div>
            </div>
            <p className="mt-2 text-xs opacity-70"></p>
          </div>
        )}

        {activeSection === "Kolejki" && (
          <>
            <div className="relative max-w-lg mb-3 hidden">
              <input
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="Szukaj po imieniu lub numerze karty…"
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:ring-2 focus:ring-brand-400 transition"
              />
              {q && matches.length>0 && (
                <div className={`absolute mt-2 w-full bg-white dark:bg-brand-900 rounded-lg border border-brand-200 dark:border-white/10 shadow-lg overflow-hidden z-[30]`}>
                  {matches.map(([card, p]) => (
                    <div key={card}
                        onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); addToQueues(card);}} onClick={(e)=>{e.preventDefault(); e.stopPropagation(); addToQueues(card);}}
                        className="px-3 py-2 cursor-pointer hover:bg-brand-50 dark:hover:bg-white/10 transition">
                      <div className="font-medium">{card} — {p.name || "?"}</div>
                      <div className="text-[12px] opacity-70">
                        {p.treatments.map((t,i)=> <span key={i} className="mr-2">{t.kind}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* PASEK TUR: liczniki + zamykanie */}
            <div className="w-full flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-slate-50 border rounded-lg border-slate-200 mb-3">
              <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded bg-white shadow text-sm">
                <span className="font-semibold">Ambu:</span>
                <span>dzień {cohortDays.ambu||0} z {cohortDurations.ambu}</span>
                {cohortStart.ambu ? <span className="whitespace-nowrap opacity-70">(start: {cohortStart.ambu})</span> : null}
                <button className="ml-2 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200" onClick={()=>incCohortDay('ambu')}>Nowy dzień</button>
                <button className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200" onClick={()=>resetCohortDay('ambu')}>Reset</button>
                <button className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md" onClick={()=>closeCohort('ambu')}>Zamknij turę</button>
              </div>
              <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded bg-white shadow text-sm">
                <span className="font-semibold">Dzienni:</span>
                <span>dzień {cohortDays.dzienni||0} z {cohortDurations.dzienni}</span>
                {cohortStart.dzienni ? <span className="whitespace-nowrap opacity-70">(start: {cohortStart.dzienni})</span> : null}
                <button className="ml-2 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200" onClick={()=>incCohortDay('dzienni')}>Nowy dzień</button>
                <button className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200" onClick={()=>resetCohortDay('dzienni')}>Reset</button>
                <button className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md" onClick={()=>closeCohort('dzienni')}>Zamknij turę</button>
              </div>
            </div>


            <div className={`grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`}>
              {kindsToShow.map(kind => {
                const list = queues[kind] || [];
                const visible = expanded[kind] ? list : list.slice(0,5);
                return (
                <div key={kind} className="rounded-xl border border-brand-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
                  <div className="px-3 py-2 flex items-center justify-between border-b border-brand-100 dark:border-white/10 bg-brand-50/60 dark:bg-white/10">
                    <div className="font-semibold text-[14px]">{kind}</div>
                    <div className="flex items-center gap-2">
                      <Badge>{list.filter(x=>!x.done).length} w kolejce</Badge>
                      {list.length>5 && (
                        <button onClick={()=>setExpanded(prev=>({...prev, [kind]: !prev[kind]}))} className="text-xs px-2 py-1 rounded-md border border-brand-200 dark:border-white/20 hover:bg-brand-50 dark:hover:bg-white/10">
                          {expanded[kind] ? "Zwiń" : "Rozwiń"}
                        </button>
                      )}
                    </div>
                  </div>
                  <ol className="p-2 space-y-1.5 text-[13px]">
                    {visible.map((p, idx) => {
                      const itemId = p.id || `${p.card}-${p.desc}-${idx}`;
                      const onPointerDown = (e) => {
                        lastPointer.current = { x: e.clientX ?? 0, y: e.clientY ?? 0 };
                        clearLp();
                        lpTimer.current = setTimeout(() => {
                          cancelClickRef.current = true;
                          openMenu(lastPointer.current.x || window.innerWidth/2, lastPointer.current.y || window.innerHeight/2, { kind, id: itemId });
                        }, 500);
                      };
                      const onPointerMove = (e) => {
                        const x = e.clientX ?? 0, y = e.clientY ?? 0;
                        const dx = Math.abs(x - (lastPointer.current.x || 0));
                        const dy = Math.abs(y - (lastPointer.current.y || 0));
                        lastPointer.current = { x, y };
                        if (dx > 6 || dy > 6) clearLp();
                      };
                      const onPointerUp = () => {
                        clearLp();
                        setTimeout(()=>{ cancelClickRef.current = false; }, 0);
                      };
                      const onContextMenu = (e) => {
                        e.preventDefault();
                        openMenu(e.clientX, e.clientY, { kind, id: itemId });
                        cancelClickRef.current = true;
                      };
                      const onClick = () => {
                        if (cancelClickRef.current) { cancelClickRef.current = false; return; }
                        toggleDone(kind, itemId);
                      };
                      return (
                        <li
                          role="listitem"
                          tabIndex={0}
                          onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); onClick(); } }}
                          onClick={onClick}
                          onPointerDown={onPointerDown}
                          onPointerMove={onPointerMove}
                          onPointerUp={onPointerUp}
                          onPointerCancel={onPointerUp}
                          onContextMenu={onContextMenu}
                          className={`rounded-md px-2.5 py-2 cursor-pointer outline-none ${p.done ? "line-through opacity-60" : "hover:bg-brand-50 dark:hover:bg-white/10"}`}
                          title="Przytrzymaj lub kliknij PPM, aby przesunąć"
                        >
                          <div className="grid grid-cols-[40px,1fr] gap-3 items-start">
  <div className="font-bold text-blue-800 tabular-nums border-r border-slate-400 pr-3">{p.card}</div>
  <div className="min-w-0">
    <div className="font-bold truncate">
      {p.name}
      {p.manualPriority && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">priorytet</span>}
    </div>
    <div className="font-bold truncate">{p.desc}</div>
  </div>
</div>
                        </li>
                      );
                    })}
                    {list.length===0 && (
                      <li role="listitem" tabIndex={0} onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); toggleDone(kind, p.id || `${p.card}-${p.desc}-${idx}`); } }} className="px-2.5 py-6 text-center opacity-50">Brak pacjentów</li>
                    )}
                    {!expanded[kind] && list.length>5 && (
                      <li role="listitem" tabIndex={0} onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); toggleDone(kind, p.id || `${p.card}-${p.desc}-${idx}`); } }} className="font-bold px-2.5 py-1 text-center text-xs opacity-70">+{(list.length-5)} oczekuje dalej</li>
                    )}
                  
                  </ol>
                  {menu && (
                    <div
                      role="menu"
                      className="fixed z-[1000] bg-white dark:bg-brand-900 border border-brand-200 dark:border-white/10 rounded-xl shadow-xl min-w-[200px]"
                      style={{ left: Math.min(menu.x, window.innerWidth - 220), top: Math.min(menu.y, window.innerHeight - 120) }}
                      onClick={(e)=>e.stopPropagation()}
                    >
                      <div className="px-3 py-2 border-b border-brand-100 dark:border-white/10 font-semibold text-sm">
                        Akcje dla kolejki: {menu.kind}
                      </div>
                      <div className="p-1">
                        <button
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-brand-50 dark:hover:bg-white/10 disabled:opacity-50"
                          onClick={()=>moveUpInQueue(menu.kind, menu.id)}
                        >
                          Przesuń o 1 w górę
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-brand-50 dark:hover:bg-white/10"
                          onClick={()=>moveTopInQueue(menu.kind, menu.id)}
                        >
                          Na początek kolejki
                        </button>
                      </div>
                      <div className="px-3 py-2">
                        <button className="w-full text-left text-sm opacity-70 hover:opacity-100" onClick={closeMenu}>Zamknij</button>
                      </div>
                    </div>
                  )}

                </div>
              )})}
            </div>
          </>
        )}

        {activeSection === "Pacjenci" && (
          <PatientsView patients={patients} setPatients={setPatients} queues={queues} setQueues={setQueues} importCohort={importCohort} />
        )}

        {activeSection === "Ustawienia" && (
          <div className="space-y-3">
            <div className="text-sm font-semibold">Widoczne rubryki</div>
            <div className="flex flex-wrap gap-2">
              {ALL_TREATMENTS.map(k => (
                <label key={k} className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-brand-200 dark:border-white/20">
                  <input type="checkbox" checked={visibleKinds.includes(k)} onChange={()=>{
                    setVisibleKinds(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev, k]);
                  }} />
                  <span>{k}</span>
                </label>
              ))}
            </div>
            <div className="text-xs opacity-70">
              Ustawienia zapisywane lokalnie. Loginy i synchronizacja dodamy później.
            </div>
          </div>
        )}

        {activeSection === "Tura" && (<div className="space-y-6"><div><div className="text-sm font-semibold mb-2 bg-brand-50/80 dark:bg-white/10 rounded-xl px-4 py-2 inline-block">Archiwum — AMBU</div><ArchivedToursView importCohort={"ambu"} setPatients={setPatients} /></div><div><div className="text-sm font-semibold mb-2 bg-brand-50/80 dark:bg-white/10 rounded-xl px-4 py-2 inline-block">Archiwum — DZIENNI</div><ArchivedToursView importCohort={"dzienni"} setPatients={setPatients} /></div></div>)}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
function boot(){
  const s = getSessionUser && getSessionUser();
  const hasUsers = getUsers && (getUsers().length>0);
  const gotoApp = ()=> root.render(<App/>);
  if(s){ gotoApp(); return; }
  if(hasUsers){ root.render(<Login onLogin={()=>{ gotoApp(); }}/>) }
  else{ root.render(<Register onRegister={()=>{ root.render(<Login onLogin={()=>{ gotoApp(); }}/>) }}/>) }
}
boot();
