"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileImage, Film, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { renderPhotoToWebM } from "@/lib/local-renderer";

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5";
const aspectLabels: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5"];

export default function FreeStoryLab({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("রাতের শহরে একজন কিশোরী ধীরে ধীরে সামনে এগিয়ে যায়, বাতাসে চুল দুলছে।");
  const [duration, setDuration] = useState(10);
  const [aspect, setAspect] = useState<AspectRatio>("16:9");
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [imageUrl, downloadUrl]);

  const recipe = useMemo(() => {
    const trimmed = prompt.trim();
    return {
      title: trimmed ? trimmed.slice(0, 58) : "Untitled local scene",
      camera: trimmed.match(/(zoom|close|কাছ|জুম)/i) ? "Slow push-in" : "Gentle cinematic drift",
      mood: trimmed.match(/(night|রাত|dark|অন্ধকার)/i) ? "Midnight blue" : "Cinematic warm dusk",
      movement: trimmed.match(/(wind|বাতাস|rain|বৃষ্টি)/i) ? "Atmospheric motion" : "Subtle depth motion",
    };
  }, [prompt]);

  function selectFile(nextFile: File | undefined) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) { setNotice("শুধু image file দিন (JPG, PNG বা WebP)।"); return; }
    if (nextFile.size > 25 * 1024 * 1024) { setNotice("Free local render-এর জন্য image 25 MB-এর মধ্যে রাখুন।"); return; }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(nextFile); setImageUrl(URL.createObjectURL(nextFile)); setDownloadUrl(""); setNotice("");
  }

  async function handleRender() {
    if (!file || !imageUrl || !canvasRef.current) { setNotice("আগে একটি ছবি upload করুন।"); return; }
    setRendering(true); setProgress(0); setNotice("");
    try {
      const image = new Image();
      image.src = imageUrl;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("ছবিটি পড়া যায়নি")); });
      const blob = await renderPhotoToWebM({ image, canvas: canvasRef.current, durationSeconds: duration, aspectRatio: aspect, onProgress: setProgress });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(blob));
      setNotice("Local render সম্পন্ন। এটি API-generated AI video নয়—আপনার browser-এ তৈরি হয়েছে।");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Local render ব্যর্থ হয়েছে।"); }
    finally { setRendering(false); }
  }

  return <div className="story-lab-backdrop" role="dialog" aria-modal="true"><section className="story-lab"><header className="story-lab-header"><div><span className="eyebrow">Free-first workflow</span><h2><Sparkles size={18} /> Story Lab</h2><p>একটি ছবি, একটি prompt—তারপর browser-local animated scene।</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close Story Lab"><X size={18} /></button></header><div className="story-lab-grid"><div className="story-stage"><div className={`story-preview aspect-${aspect}`}>{imageUrl ? <img src={imageUrl} alt="Selected story reference" style={{ transform: `scale(${1.04 + progress * .12}) translate(${-progress * 2.5}%, ${-progress * 1.8}%)` }} /> : <button type="button" className="story-empty" onClick={() => fileRef.current?.click()}><ImagePlus size={30} /><strong>আপনার প্রথম ছবি দিন</strong><span>JPG, PNG বা WebP · সর্বোচ্চ 25 MB</span></button>}{imageUrl && <div className="story-overlay"><span>{recipe.mood}</span><b>{Math.round(progress * duration)}s / {duration}s</b></div>}</div><canvas ref={canvasRef} className="story-canvas" /><div className="story-stage-foot"><span><Film size={13} /> {rendering ? `Rendering ${Math.round(progress * 100)}%` : "Preview ready"}</span><span>{aspect} · {duration}s</span></div></div><div className="story-controls"><div className="story-field"><label>Reference image</label><button type="button" className="file-picker" onClick={() => fileRef.current?.click()}><FileImage size={16} /><span>{file?.name ?? "Choose an image"}</span><ImagePlus size={15} /></button><input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} /></div><div className="story-field"><label>Scene prompt <small>বাংলা অথবা English</small></label><textarea rows={5} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="যেমন: বৃষ্টিভেজা শহরে চরিত্রটি ধীরে হাঁটছে..." /></div><div className="story-options"><div><label>Duration</label><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{[5, 10, 15, 30, 60].map((value) => <option value={value} key={value}>{value} seconds</option>)}</select></div><div><label>Aspect ratio</label><select value={aspect} onChange={(event) => setAspect(event.target.value as AspectRatio)}>{aspectLabels.map((value) => <option value={value} key={value}>{value}</option>)}</select></div></div><div className="story-recipe"><span className="card-eyebrow"><Sparkles size={13} /> Local scene recipe</span><strong>{recipe.title}</strong><p>{recipe.camera} · {recipe.movement} · {recipe.mood}</p></div><button type="button" className="story-render" onClick={handleRender} disabled={rendering || !file}>{rendering ? <><Loader2 className="spin" size={15} /> Rendering locally…</> : <><Film size={15} /> Create local video</>}</button>{downloadUrl && <a className="story-download" href={downloadUrl} download={`motionforge-story-${Date.now()}.webm`}><Download size={15} /> Download WebM</a>}{notice && <p className={`story-notice ${notice.includes("সম্পন্ন") ? "success" : ""}`}>{notice}</p>}</div></div><footer className="story-lab-footer"><span>Free mode uses a cinematic Ken Burns animation in your browser.</span><span>AI generation, voice and long-form rendering need a later provider/worker.</span></footer></section></div>;
}
