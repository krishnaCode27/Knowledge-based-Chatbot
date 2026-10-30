 "use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Clock3, FileText, GraduationCap, MessageSquare, Plus, Search, Send, Settings, Sparkles, Trash2, Upload, X, Menu, Paperclip } from "lucide-react";

const DocumentStack = dynamic(() => import("./DocumentStack"), { ssr: false, loading: () => <div className="stack-placeholder" /> });
type Doc = { id: string; name: string; uploadedAt: string; size: number };
type Source = { documentId: string; fileName: string; heading: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

export default function KnowledgeApp() {
  const [tab, setTab] = useState<"chat" | "documents" | "settings">("chat");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Hello! I’m your university knowledge assistant. Upload Markdown documents, then ask me questions. I’ll look for relevant passages and show the sources I used." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadDocs() {
    try { const r = await fetch("/api/documents"); const d = await r.json(); setDocs(d.documents ?? []); } catch { setError("Could not load documents."); }
  }
  useEffect(() => { void loadDocs(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || busy) return;
    setInput(""); setError("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setBusy(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The request failed.");
      setMessages(prev => [...prev, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }
  async function uploadFile(file?: File) {
    if (!file) return;
    setError("");
    const form = new FormData(); form.append("file", file);
    try {
      const r = await fetch("/api/documents", { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Upload failed.");
      await loadDocs();
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    if (fileRef.current) fileRef.current.value = "";
  }
  async function removeDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    const r = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r.ok) await loadDocs(); else setError("Could not delete document.");
  }
  const filtered = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const nav = (next: "chat" | "documents" | "settings") => { setTab(next); setMobileOpen(false); };

  return <main className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark">K</div><div><strong>Knowledge <span>AI</span></strong><small>UNIVERSITY ASSISTANT</small></div><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <button className={`nav-item ${tab === "chat" ? "active" : ""}`} onClick={() => { setMessages([{ role: "assistant", content: "New conversation started. What would you like to learn?" }]); nav("chat"); }}><Plus size={18}/> New chat</button>
      <button className={`nav-item ${tab === "documents" ? "active" : ""}`} onClick={() => nav("documents")}><BookOpen size={18}/> Knowledge base <span className="nav-count">{docs.length}</span></button>
      <button className="nav-item" onClick={() => nav("chat")}><Clock3 size={18}/> Recent chats</button>
      <button className={`nav-item ${tab === "settings" ? "active" : ""}`} onClick={() => nav("settings")}><Settings size={18}/> Settings</button>
      <div className="side-divider"/>
      <div className="side-label">YOUR KNOWLEDGE BASE</div>
      <div className="side-stat"><div className="stat-icon"><GraduationCap size={19}/></div><div><strong>{docs.length}</strong><span>documents indexed</span></div></div>
      <button className="manage-link" onClick={() => nav("documents")}>Manage documents <span>↗</span></button>
      <div className="sidebar-foot"><div className="online-dot"/> Local workspace <span>•</span> Secure</div>
    </aside>

    {mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <section className="main-panel">
      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20}/></button>
        <div className="breadcrumb">Workspace <span>/</span> {tab === "chat" ? "New conversation" : tab === "documents" ? "Knowledge base" : "Settings"}</div>
        <div className="topbar-right"><div className="status-pill"><span className="online-dot"/> Knowledge base ready</div><div className="avatar">K</div></div>
      </header>

      {tab === "chat" && <div className="chat-layout">
        <div className="welcome">
          <DocumentStack/>
          <div className="welcome-copy"><div className="eyebrow"><Sparkles size={13}/> YOUR ACADEMIC COMPANION</div><h1>Knowledge, <em>connected.</em></h1><p>Ask questions across your university documents and get clear, source-backed answers.</p></div>
          <div className="welcome-meta"><span>{docs.length.toString().padStart(2, "0")}</span><small>DOCUMENTS<br/>IN YOUR LIBRARY</small></div>
        </div>
        <div className="conversation">
          {messages.map((m, i) => <div className={`message-row ${m.role}`} key={i}>
            {m.role === "assistant" && <div className="assistant-avatar"><Sparkles size={17}/></div>}
            <div className="message-content">
              <div className="message-bubble"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
              {!!m.sources?.length && <div className="source-list">{m.sources.map((s, j) => <div className="source-chip" key={`${s.documentId}-${j}`}><FileText size={13}/><span>{s.fileName}</span><i>› {s.heading}</i></div>)}</div>}
            </div>
            {m.role === "user" && <div className="user-avatar">K</div>}
          </div>)}
          {busy && <div className="message-row assistant"><div className="assistant-avatar"><Sparkles size={17}/></div><div className="typing"><span/><span/><span/></div></div>}
          <div ref={bottomRef}/>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <div className="composer-wrap">
          <div className="suggestions"><button onClick={() => setInput("Summarize the key topics in my documents.")}>Summarize my documents</button><button onClick={() => setInput("What are the important admission requirements?")}>Admission requirements</button><button onClick={() => setInput("Explain the main concepts in simple terms.")}>Explain a concept</button></div>
          <div className="composer"><button className="attach-button" onClick={() => fileRef.current?.click()} aria-label="Attach Markdown file"><Paperclip size={19}/></button><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Ask anything about your university..." rows={1}/><button className="send-button" onClick={() => void sendMessage()} disabled={!input.trim() || busy} aria-label="Send message"><Send size={17}/></button></div>
          <div className="composer-note">Knowledge AI can make mistakes. Verify important information with original documents.</div>
        </div>
      </div>}

      {tab === "documents" && <div className="page-content"><div className="page-heading"><div><div className="eyebrow">YOUR LIBRARY</div><h1>Knowledge base</h1><p>Manage the Markdown documents Knowledge AI can reference.</p></div><button className="primary-button" onClick={() => fileRef.current?.click()}><Upload size={16}/> Upload document</button></div><div className="document-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."/></div><span>{docs.length} DOCUMENTS</span></div><div className="document-grid">{filtered.map(doc => <article className="document-card" key={doc.id}><div className="document-icon"><FileText size={21}/></div><div className="document-info"><strong>{doc.name}</strong><span>{(doc.size / 1024).toFixed(1)} KB · {new Date(doc.uploadedAt).toLocaleDateString()}</span></div><button className="icon-button delete-button" onClick={() => void removeDoc(doc.id)} aria-label={`Delete ${doc.name}`}><Trash2 size={16}/></button></article>)}{filtered.length === 0 && <div className="empty-state"><BookOpen size={28}/><strong>No documents found</strong><p>Upload Markdown files to start building your knowledge base.</p><button className="secondary-button" onClick={() => fileRef.current?.click()}>Choose a document</button></div>}</div></div>}

      {tab === "settings" && <div className="page-content"><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p className="settings-copy">Knowledge AI uses your server-side Gemini configuration and local Markdown workspace.</p><div className="settings-card"><div><strong>AI provider</strong><p>Google Gemini, configured on the server.</p></div><span className="setting-status">{process.env.NODE_ENV === "production" ? "SERVER CONFIG" : "LOCAL DEV"}</span></div><div className="settings-card"><div><strong>Knowledge retrieval</strong><p>Keyword relevance matching across uploaded Markdown files.</p></div><span className="setting-status">ACTIVE</span></div><div className="settings-card"><div><strong>Document storage</strong><p>Local project data directory. Keep a backup of your data folder.</p></div><span className="setting-status">LOCAL</span></div></div>}

      <input ref={fileRef} type="file" accept=".md,text/markdown" hidden onChange={e => void uploadFile(e.target.files?.[0])}/>
    </section>
  </main>;
}