 "use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Brain, Check, ChevronLeft, ChevronRight, Clock3, Compass, GraduationCap, LockKeyhole, LogIn, Menu, Search, Sparkles, Target, X } from "lucide-react";
import { courses, quizzes } from "@/lib/courses";
import { createClient } from "@/lib/supabase/client";

type Progress = Record<string, { completed: number[]; quiz?: number }>;
const LOCAL_KEY = "mindlab-progress-v1";

export default function Home() {
  const [active, setActive] = useState<string | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [progress, setProgress] = useState<Progress>({});
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) setProgress(JSON.parse(saved));
      setNotes(localStorage.getItem("mindlab-notes-v1") || "");
    } catch {}
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => { setUserEmail(data.user?.email ?? null); setUserId(data.user?.id ?? null); });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setUserEmail(session?.user?.email ?? null); setUserId(session?.user?.id ?? null); });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const [{ data: progressRow }, { data: noteRows }] = await Promise.all([
        supabase.from("user_progress").select("progress").eq("user_id", userId).maybeSingle(),
        supabase.from("user_notes").select("content").eq("user_id", userId).maybeSingle()
      ]);
      if (cancelled) return;
      if (progressRow?.progress) {
        setProgress(progressRow.progress as Progress);
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(progressRow.progress)); } catch {}
      }
      if (noteRows?.content !== undefined) {
        setNotes(noteRows.content);
        try { localStorage.setItem("mindlab-notes-v1", noteRows.content); } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const activeCourse = courses.find(c => c.id === active) ?? null;
  const currentLesson = activeCourse?.lessons[lessonIndex] ?? null;
  const totalLessons = courses.reduce((n, c) => n + c.lessons.length, 0);
  const completedCount = Object.values(progress).reduce((n, p) => n + p.completed.length, 0);
  const completedCourses = courses.filter(c => (progress[c.id]?.completed.length ?? 0) === c.lessons.length).length;
  const percent = Math.round(completedCount / totalLessons * 100);
  const filtered = useMemo(() => courses.filter(c => `${c.title} ${c.description} ${c.category}`.toLowerCase().includes(query.toLowerCase())), [query]);

  function saveProgress(next: Progress) {
    setProgress(next);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch {}
    const supabase = createClient();
    if (supabase && userId) {
      void supabase.from("user_progress").upsert({ user_id: userId, progress: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    }
  }
  function openCourse(id: string, lesson = 0) {
    setActive(id); setLessonIndex(lesson); setQuizAnswer(null); setMenuOpen(false);
    window.setTimeout(() => document.getElementById("lesson-view")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
  function markComplete() {
    if (!activeCourse) return;
    const next = { ...progress, [activeCourse.id]: { ...(progress[activeCourse.id] || { completed: [] }), completed: Array.from(new Set([...(progress[activeCourse.id]?.completed ?? []), lessonIndex])) } };
    saveProgress(next);
  }
  function nextLesson() {
    if (!activeCourse) return;
    if (lessonIndex < activeCourse.lessons.length - 1) setLessonIndex(lessonIndex + 1);
    else {
      const idx = courses.findIndex(c => c.id === activeCourse.id);
      if (idx < courses.length - 1) openCourse(courses[idx + 1].id, 0);
    }
    setQuizAnswer(null);
  }
  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault(); setLoadingAuth(true); setAuthMessage("");
    const supabase = createClient();
    if (!supabase) { setAuthMessage("Connect Supabase in .env.local first. See README for setup."); setLoadingAuth(false); return; }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setAuthMessage(error ? error.message : "Check your email for your secure sign-in link.");
    setLoadingAuth(false);
  }
  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setUserEmail(null);
    setUserId(null);
  }
  async function saveNotes() {
    try {
      localStorage.setItem("mindlab-notes-v1", notes);
      const supabase = createClient();
      if (supabase && userId) {
        const { error } = await supabase.from("user_notes").upsert({ user_id: userId, content: notes, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        if (error) { setNoteSaved(false); return; }
      }
      setNoteSaved(true); window.setTimeout(() => setNoteSaved(false), 1800);
    } catch {}
  }

  return <main className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <a className="logo" href="#" onClick={() => {setActive(null);setMenuOpen(false)}}><span className="logo-mark"><Brain size={22}/></span><span>mind<span className="logo-accent">lab</span><small>PSYCHOLOGY ACADEMY</small></span></a>
      <div className="side-label">YOUR SPACE</div>
      <button className={`nav-item ${!active ? "nav-active" : ""}`} onClick={() => {setActive(null);setMenuOpen(false)}}><Compass size={18}/> Overview</button>
      <button className="nav-item" onClick={() => {document.getElementById("curriculum")?.scrollIntoView({behavior:"smooth"});setMenuOpen(false)}}><BookOpen size={18}/> Course library <span className="nav-count">12</span></button>
      <button className="nav-item" onClick={() => {document.getElementById("notes")?.scrollIntoView({behavior:"smooth"});setMenuOpen(false)}}><Target size={18}/> Reflection journal</button>
      <div className="sidebar-bottom"><div className="side-label">YOUR PROGRESS</div><div className="side-progress"><div className="progress-row"><span>Course progress</span><b>{percent}%</b></div><div className="progress-track"><span style={{width:`${percent}%`}}/></div><small>{completedCount} of {totalLessons} lessons completed</small></div><div className="profile-mini"><div className="avatar">M</div><div><b>{userEmail ? userEmail.split("@")[0] : "Your learning space"}</b><small>{userEmail ? "Signed in" : "Self-paced learner"}</small></div><button className="icon-btn" aria-label="Account" onClick={() => userEmail ? signOut() : setAuthOpen(true)}>{userEmail ? <X size={16}/> : <LogIn size={16}/>}</button></div></div>
    </aside>
    <section className="main-column">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Menu/></button><div className="breadcrumb">Learning space <span>/</span> <b>{activeCourse ? activeCourse.title : "Overview"}</b></div><div className="top-actions"><span className="streak"><Sparkles size={15}/> Small steps count</span><button className="account-btn" onClick={() => userEmail ? signOut() : setAuthOpen(true)}>{userEmail ? "Sign out" : "Sign in"} <ArrowRight size={15}/></button></div></header>
      {!activeCourse ? <div className="content">
        <section className="welcome"><div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-dot"/> A LITTLE CURIOSITY GOES A LONG WAY</div><h1>Understand the mind.<br/><em>Understand people.</em></h1><p>A thoughtful, practical introduction to psychology. Learn at your own pace, connect ideas to real life, and build understanding one lesson at a time.</p><button className="button-primary" onClick={() => {const c=courses.find(c => (progress[c.id]?.completed.length ?? 0) < c.lessons.length) ?? courses[0]; const idx=(progress[c.id]?.completed ?? []).length;openCourse(c.id,Math.min(idx,c.lessons.length-1));}}>Pick up where you left off <ArrowRight size={17}/></button><div className="welcome-foot"><span><Check size={14}/> 12 guided modules</span><span><Check size={14}/> Short lessons</span><span><Check size={14}/> No rush, no pressure</span></div></div><div className="brain-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="brain-emoji">🧠</div><div className="float-card float-top"><span className="float-icon purple"><Sparkles size={15}/></span><span><b>Curiosity first</b><small>Question what you assume</small></span></div><div className="float-card float-bottom"><span className="float-icon cyan"><BookOpen size={15}/></span><span><b>Learn by doing</b><small>Ideas you can use</small></span></div></div></section>
        <section className="stats-grid"><div className="stat-card"><div className="stat-icon purple"><GraduationCap size={19}/></div><div><span>Modules completed</span><strong>{completedCourses}<small> / 12</small></strong></div></div><div className="stat-card"><div className="stat-icon cyan"><BookOpen size={19}/></div><div><span>Lessons completed</span><strong>{completedCount}<small> / {totalLessons}</small></strong></div></div><div className="stat-card"><div className="stat-icon peach"><Target size={19}/></div><div><span>Overall progress</span><strong>{percent}<small>%</small></strong></div></div></section>
        <section className="section-block" id="curriculum"><div className="section-heading"><div><span className="eyebrow muted-eyebrow">THE LEARNING PATH</span><h2>Explore the curriculum</h2><p>From the foundations of the mind to the psychology of everyday life.</p></div><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a topic..." aria-label="Find a topic"/></div></div>
          <div className="course-grid">{filtered.map(c=>{const done=progress[c.id]?.completed.length ?? 0;const pct=Math.round(done/c.lessons.length*100);return <button key={c.id} className="course-card" onClick={()=>openCourse(c.id)}><div className="course-card-top"><span className={`course-icon ${c.color}`}>{c.icon}</span><span className="course-number">{c.number}</span></div><span className="course-category">{c.category}</span><h3>{c.title}</h3><p>{c.description}</p><div className="course-meta"><span><BookOpen size={14}/> {c.lessons.length} lessons</span><span><Clock3 size={14}/> ~30 min</span></div><div className="course-progress"><div className="progress-track"><span style={{width:`${pct}%`}}/></div><small>{pct===100?"Completed":`${done}/${c.lessons.length} done`}</small></div><div className="course-open">Open module <ArrowRight size={15}/></div></button>})}</div>
        </section>
        <section className="bottom-grid"><div className="note-card" id="notes"><div className="note-heading"><span className="note-icon"><BookOpen size={18}/></span><div><h3>Your reflection journal</h3><p>Keep the questions, observations, and ideas you want to remember.</p></div></div><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What did you notice about your thoughts, feelings, or behavior today?"/><div className="note-actions"><small>Saved in this browser on this device.</small><button className="button-dark" onClick={saveNotes}>{noteSaved ? <><Check size={15}/> Saved</> : "Save reflection"}</button></div></div><div className="principle-card"><div className="principle-top"><Sparkles size={18}/><span>ONE IDEA TO KEEP</span></div><h3>Observation isn't the same as explanation.</h3><p>“They went quiet” is an observation. “They dislike me” is a hypothesis. Psychology begins when we get curious about the difference.</p><div className="principle-mark">“</div></div></section>
      </div> : <div className="content lesson-page" id="lesson-view">
        <button className="back-link" onClick={()=>setActive(null)}><ChevronLeft size={17}/> Back to course library</button>
        <div className="lesson-hero"><div><span className="eyebrow muted-eyebrow">MODULE {activeCourse.number} · {activeCourse.category}</span><h1>{activeCourse.title}</h1><p>{activeCourse.description}</p><div className="lesson-hero-meta"><span><BookOpen size={15}/> {activeCourse.lessons.length} lessons</span><span><Clock3 size={15}/> About 30 minutes</span></div></div><div className={`lesson-hero-icon ${activeCourse.color}`}>{activeCourse.icon}</div></div>
        <div className="lesson-layout"><aside className="lesson-list"><div className="lesson-list-heading"><b>In this module</b><span>{progress[activeCourse.id]?.completed.length ?? 0}/{activeCourse.lessons.length}</span></div>{activeCourse.lessons.map((l,i)=><button key={l.title} className={`lesson-list-item ${lessonIndex===i?"lesson-selected":""}`} onClick={()=>{setLessonIndex(i);setQuizAnswer(null)}}><span className="lesson-check">{progress[activeCourse.id]?.completed.includes(i)?<Check size={14}/>:String(i+1).padStart(2,"0")}</span><span className="lesson-list-copy"><b>{l.title}</b><small><Clock3 size={12}/> {l.duration}</small></span></button>)}</aside>
          <article className="lesson-body"><div className="lesson-body-top"><span>LESSON {String(lessonIndex+1).padStart(2,"0")}</span><span>{currentLesson?.duration}</span></div><h2>{currentLesson?.title}</h2><p className="lesson-lead">{currentLesson?.body}</p><div className="takeaway"><div className="takeaway-icon"><Sparkles size={17}/></div><div><b>The key idea</b><p>{currentLesson?.takeaway}</p></div></div>
            {lessonIndex===activeCourse.lessons.length-1 && <div className="quiz-card"><div className="quiz-kicker">QUICK KNOWLEDGE CHECK</div><h3>{quizzes[activeCourse.id].question}</h3>{quizzes[activeCourse.id].options.map((opt,i)=><button key={opt} className={`quiz-option ${quizAnswer===i?(i===quizzes[activeCourse.id].answer?"quiz-correct":"quiz-wrong"):""}`} onClick={()=>{setQuizAnswer(i);if(i===quizzes[activeCourse.id].answer){const next={...progress,[activeCourse.id]:{...(progress[activeCourse.id]||{completed:[]}),quiz:i}};saveProgress(next)}}}><span>{String.fromCharCode(65+i)}</span>{opt}{quizAnswer===i && (i===quizzes[activeCourse.id].answer?<Check size={16}/>:<X size={16}/>)}</button>)}{quizAnswer!==null&&<p className={`quiz-feedback ${quizAnswer===quizzes[activeCourse.id].answer?"good":""}`}>{quizAnswer===quizzes[activeCourse.id].answer?"That's right. ":"Not quite. "}{quizzes[activeCourse.id].explanation}</p>}</div>}
            <div className="lesson-footer"><button className="button-outline" disabled={lessonIndex===0} onClick={()=>{setLessonIndex(lessonIndex-1);setQuizAnswer(null)}}><ChevronLeft size={16}/> Previous</button><button className="button-primary" onClick={()=>{markComplete();if(lessonIndex<activeCourse.lessons.length-1)nextLesson();else {setActive(null)}}}>{progress[activeCourse.id]?.completed.includes(lessonIndex)?"Completed ✓":"Mark complete"} <ArrowRight size={16}/></button></div>
          </article></div>
      </div>}
      <footer className="footer"><span>mindlab</span><span>Built for curiosity, grounded in evidence.</span><span>Educational use only · Not a diagnostic tool</span></footer>
    </section>
    {authOpen && <div className="modal-backdrop" onClick={()=>setAuthOpen(false)}><section className="auth-modal" onClick={e=>e.stopPropagation()}><button className="modal-close icon-btn" onClick={()=>setAuthOpen(false)}><X size={18}/></button><div className="auth-mark"><LockKeyhole size={22}/></div><span className="eyebrow muted-eyebrow">YOUR PERSONAL SPACE</span><h2>Keep your learning with you.</h2><p>Sign in by email to prepare for synced progress across devices. Local progress works without an account.</p><form onSubmit={sendMagicLink}><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/><button className="button-primary full-button" disabled={loadingAuth}>{loadingAuth?"Sending link…":"Email me a sign-in link"} <ArrowRight size={16}/></button></form>{authMessage&&<p className="auth-message">{authMessage}</p>}<small>Requires your own Supabase project configuration. See setup guide.</small></section></div>}
  </main>;
}