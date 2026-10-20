"use client";

import { useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  AudioLines,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Clock3,
  Cloud,
  Download,
  FileVideo,
  FolderOpen,
  Gauge,
  Grid2X2,
  Headphones,
  ImagePlus,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Menu,
  Mic2,
  MonitorPlay,
  MoreHorizontal,
  Move,
  Music2,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Split,
  Square,
  SunMedium,
  TextCursorInput,
  Undo2,
  Upload,
  Video,
  WandSparkles,
  X,
  ZoomIn,
} from "lucide-react";

const navItems = [
  ["Home", LayoutDashboard],
  ["Projects", FolderOpen],
  ["Assets", Layers3],
  ["AI Studio", WandSparkles],
  ["Templates", Grid2X2],
  ["Render Queue", Archive],
] as const;

const tracks = [
  { name: "Main video", color: "#4f8cff", icon: Video, clips: [{ label: "anime-intro.mp4", start: 4, width: 39, tone: "blue" }, { label: "forest-scene.mp4", start: 44, width: 34, tone: "blue" }] },
  { name: "VFX overlays", color: "#a78bfa", icon: Sparkles, clips: [{ label: "birds-overlay.mov", start: 39, width: 17, tone: "purple" }] },
  { name: "Voiceover", color: "#34d399", icon: Mic2, clips: [{ label: "narration_bn.wav", start: 2, width: 56, tone: "green" }] },
  { name: "Music", color: "#22d3ee", icon: Music2, clips: [{ label: "cinematic-bed.mp3", start: 0, width: 82, tone: "cyan" }] },
  { name: "Captions", color: "#f472b6", icon: TextCursorInput, clips: [{ label: "বাংলা subtitle", start: 12, width: 31, tone: "pink" }] },
] as const;

const editorTools = [
  ["Select", Move],
  ["Split", Split],
  ["Text", TextCursorInput],
  ["Audio", AudioLines],
  ["Effects", Sparkles],
  ["Color", SunMedium],
  ["Speed", Gauge],
  ["AI tools", WandSparkles],
] as const;

function IconButton({ children, label, onClick, active = false }: { children: React.ReactNode; label: string; onClick?: () => void; active?: boolean }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className={`icon-button ${active ? "icon-button-active" : ""}`}>{children}</button>;
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

export default function StudioApp() {
  const [activeNav, setActiveNav] = useState("AI Studio");
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [planReady, setPlanReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [selectedTool, setSelectedTool] = useState("Select");
  const uploadRef = useRef<HTMLInputElement>(null);

  const formattedPrompt = useMemo(() => prompt.trim() || "Describe an edit and I’ll turn it into a safe, reviewable plan.", [prompt]);

  const handleUpload = (files: FileList | null) => {
    if (!files) return;
    setUploaded((current) => [...current, ...Array.from(files).map((file) => file.name)]);
    setShowUpload(false);
  };

  const handleRender = () => {
    setRendering(true);
    setRenderProgress(20);
    window.setTimeout(() => setRenderProgress(68), 550);
    window.setTimeout(() => { setRenderProgress(100); setRendering(false); }, 1400);
  };

  return (
    <main className="studio-app">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={19} /></div><div><strong>MotionForge</strong><span>AI VIDEO STUDIO</span></div></div>
        <div className="workspace-switcher"><div className="workspace-avatar">M</div><div><small>Workspace</small><b>My creative space</b></div><ChevronDown size={15} /></div>
        <div className="nav-label">Workspace</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(([label, Icon]) => <button key={label} type="button" onClick={() => setActiveNav(label)} className={`nav-item ${activeNav === label ? "selected" : ""}`}><Icon size={17} /><span>{label}</span>{label === "Render Queue" && <em>2</em>}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="storage-card"><div className="storage-top"><span>Local workspace</span><i /></div><b>Media storage</b><div className="storage-track"><span /></div><small>1.2 GB of 5 GB used</small></div><button type="button" className="nav-item muted"><Settings2 size={17} /><span>Settings</span></button><button type="button" className="nav-item muted"><CircleHelp size={17} /><span>Help & shortcuts</span></button></div>
      </aside>

      <section className="app-column">
        <header className="topbar"><div className="topbar-left"><IconButton label="Open menu"><Menu size={18} /></IconButton><div className="breadcrumb"><Lock size={13} /><span>Personal</span><ChevronRight size={12} /><strong>Anime world / 60s story</strong></div><span className="saved"><Check size={13} /> Saved</span></div><div className="topbar-right"><button type="button" className="ghost-button"><Undo2 size={15} /> <span className="hide-mobile">Undo</span></button><button type="button" className="ghost-button"><Redo2 size={15} /> <span className="hide-mobile">Redo</span></button><button type="button" className="ghost-button"><Bell size={16} /></button><button type="button" className="copilot-trigger" onClick={() => setCopilotOpen((current) => !current)}><WandSparkles size={15} /> AI Copilot</button><button type="button" className="export-button" onClick={handleRender}><Download size={15} /> Export</button></div></header>

        <div className="editor-body">
          <div className="tool-rail"><div className="tool-rail-label">Tools</div>{editorTools.map(([label, Icon]) => <button type="button" key={label} onClick={() => setSelectedTool(label)} className={`tool-item ${selectedTool === label ? "active" : ""}`}><Icon size={17} /><span>{label}</span></button>)}</div>
          <div className="workspace">
            <div className="preview-panel">
              <div className="panel-topline"><div><span className="eyebrow">Preview monitor</span><span className="draft-pill"><i /> Draft preview</span></div><div className="preview-actions"><button type="button" className="tiny-select">16:9 <ChevronDown size={12} /></button><IconButton label="Fullscreen"><MonitorPlay size={16} /></IconButton><IconButton label="Preview settings"><SlidersHorizontal size={16} /></IconButton></div></div>
              <div className="video-stage"><div className="stage-glow" /><div className="scene-card"><div className="scene-sky" /><div className="scene-moon" /><div className="scene-horizon" /><div className="scene-character"><div className="character-head" /><div className="character-body" /><div className="character-coat" /></div><div className="scene-title">ANIME<br /><span>WORLD</span></div><div className="stage-time">00:12 <span>/ 01:00</span></div></div><div className="play-overlay"><button type="button" onClick={() => setPlaying((current) => !current)} aria-label={playing ? "Pause preview" : "Play preview"}>{playing ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}</button></div></div>
              <div className="transport"><span className="timecode">00:12.04</span><div className="transport-controls"><button type="button" aria-label="Previous frame"><ArrowUp size={15} className="rotate-270" /></button><button type="button" onClick={() => setPlaying((current) => !current)} className="transport-play">{playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}</button><button type="button" aria-label="Next frame"><ArrowDown size={15} className="rotate-90" /></button></div><span className="timecode muted-text">30 fps</span></div>
            </div>

            <div className="timeline-panel"><div className="timeline-toolbar"><div className="timeline-title"><span className="eyebrow">Timeline</span><strong>01:00</strong><span className="timeline-status"><Cloud size={13} /> Autosaved</span></div><div className="timeline-actions"><IconButton label="Timeline settings"><SlidersHorizontal size={15} /></IconButton><IconButton label="Zoom timeline"><ZoomIn size={15} /></IconButton><button type="button" className="tiny-select">Fit <ChevronDown size={12} /></button></div></div><div className="timeline-ruler"><span>00:00</span><span>00:10</span><span>00:20</span><span>00:30</span><span>00:40</span><span>00:50</span><span>01:00</span></div><div className="track-list">{tracks.map((track) => <div className="track-row" key={track.name}><div className="track-label" style={{ "--track": track.color } as React.CSSProperties}><track.icon size={14} /><span>{track.name}</span><button type="button" aria-label={`Mute ${track.name}`}><Headphones size={12} /></button></div><div className="track-lane">{track.clips.map((clip) => <button type="button" key={clip.label} className={`clip clip-${clip.tone}`} style={{ left: `${clip.start}%`, width: `${clip.width}%` }}><span>{clip.label}</span><i /></button>)}</div></div>)}</div><div className="playhead" style={{ left: "28%" }}><span /></div></div>
          </div>

          {copilotOpen && <aside className="copilot-panel"><div className="copilot-header"><div className="copilot-title"><div className="copilot-icon"><WandSparkles size={17} /></div><div><strong>AI Copilot</strong><span>Timeline-aware creative partner</span></div></div><button type="button" onClick={() => setCopilotOpen(false)} aria-label="Close AI Copilot"><X size={16} /></button></div><div className="copilot-content"><div className="understood-card"><div className="card-eyebrow"><Sparkles size={13} /> What I understand</div><p>You are building a cinematic anime story. I can edit your timeline, create captions, find overlays and prepare an export plan.</p></div><div className="prompt-label">Try a command</div><div className="prompt-box"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="যেমন: ১০ সেকেন্ডে flying birds overlay যোগ করো..." rows={4} /><div className="prompt-footer"><span>বাংলা অথবা English</span><button type="button" onClick={() => setPlanReady(true)} disabled={!prompt.trim()}><Send size={13} /> Plan changes</button></div></div><div className="suggestion-row"><button type="button" onClick={() => setPrompt("প্রথম ৩ সেকেন্ড কেটে দাও এবং বাংলা subtitle যোগ করো")}>Trim + captions</button><button type="button" onClick={() => setPrompt("একটি cinematic birds overlay যোগ করো")}>Add VFX</button></div><div className="plan-card"><div className="plan-heading"><div><span className="card-eyebrow">Planned changes</span><strong>{planReady ? "Ready to review" : "Example plan"}</strong></div><em>Needs approval</em></div>{["Preserve current timeline edits", "Generate Bengali captions from narration", "Prepare a social-ready preview export"].map((item) => <div className="plan-row" key={item}><Check size={14} /> <span>{item}</span></div>)}<div className="estimate"><Clock3 size={13} /> Estimated render time: 2 minutes</div><div className="plan-actions"><button type="button" className="preview-plan">Preview plan</button><button type="button" className="edit-plan">Edit plan</button></div></div><div className="copilot-note"><Lightbulb size={14} /> Nothing changes until you approve a plan. Every AI edit is reversible.</div></div></aside>}
        </div>
      </section>

      <aside className="right-drawer"><div className="drawer-tabs"><button type="button" className="drawer-tab active">Inspector</button><button type="button" className="drawer-tab">Assets</button></div><div className="inspector-content"><SectionTitle eyebrow="Selected clip" title="Anime intro" action={<button type="button" className="dots-button"><MoreHorizontal size={16} /></button>} /><div className="selected-preview"><div className="mini-scene"><div className="mini-character" /></div><div><strong>anime-intro.mp4</strong><span>00:04 — 00:28</span></div></div><div className="inspector-section"><div className="section-row"><span>Transform</span><ChevronDown size={15} /></div><div className="control-grid"><label>Position X<input value="0" readOnly /></label><label>Position Y<input value="0" readOnly /></label><label>Scale<input value="100%" readOnly /></label><label>Rotation<input value="0°" readOnly /></label></div></div><div className="inspector-section"><div className="section-row"><span>Opacity</span><b>100%</b></div><input className="range" type="range" defaultValue="100" /></div><div className="inspector-section"><div className="section-row"><span>Blend mode</span><button type="button" className="value-button">Normal <ChevronDown size={13} /></button></div></div><div className="inspector-section"><div className="section-row"><span>Color correction</span><ChevronDown size={15} /></div><div className="color-row"><span>Exposure</span><input className="range" type="range" defaultValue="52" /></div><div className="color-row"><span>Saturation</span><input className="range cyan" type="range" defaultValue="62" /></div></div></div><div className="drawer-footer"><button type="button" className="secondary-button"><RotateCcw size={14} /> Reset</button><button type="button" className="primary-button" onClick={() => setRendering(true)}><Sparkles size={14} /> Apply</button></div></aside>

      {showUpload && <div className="modal-backdrop" onClick={() => setShowUpload(false)}><div className="upload-modal" onClick={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowUpload(false)}><X size={17} /></button><div className="upload-icon"><Upload size={22} /></div><h2>Import media</h2><p>Upload video, image, audio or subtitle files to your project.</p><button type="button" className="drop-zone" onClick={() => uploadRef.current?.click()}><ImagePlus size={24} /><strong>Browse files</strong><span>or drag and drop here</span><small>MP4, MOV, PNG, JPG, MP3, SRT · up to 500 MB</small></button><input ref={uploadRef} type="file" multiple hidden accept="video/*,image/*,audio/*,.srt" onChange={(event) => handleUpload(event.target.files)} />{uploaded.length > 0 && <div className="uploaded-list">{uploaded.map((file) => <span key={file}><FileVideo size={13} />{file}<Check size={13} /></span>)}</div>}</div></div>}

      {rendering && <div className="render-toast"><div className="render-icon"><Clapperboard size={17} /></div><div><strong>Preparing your export</strong><span>Encoding timeline · {renderProgress}%</span></div><div className="render-progress"><i style={{ width: `${renderProgress}%` }} /></div></div>}
      <button type="button" className="floating-upload" onClick={() => setShowUpload(true)}><Plus size={17} /> Import media</button>
    </main>
  );
}
