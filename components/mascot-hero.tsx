"use client";

import {useCallback, useEffect, useId, useRef, useState} from "react";
import {MapPin, Pause, Play, RotateCcw, Sparkles} from "lucide-react";

type Scene = "idle" | "snack" | "cheer";
const ATLAS = "/mascot/snack-sprites.webp";
const BACKDROP = "/mascot/hero-clean.webp";
const FRAME_MS = [300, 350, 350, 450, 500, 300, 450, 300, 350, 400, 600, 450, 400, 350, 600, 450];
// Source bounds and shoe anchors keep hand poses from shifting the whole body.
const FRAMES = [
  [9,19,313,316,166,316], [332,21,628,316,478.5,316],
  [639,22,938,316,790.5,316], [948,19,1247,316,1100,316],
  [11,327,314,627,166,627], [329,329,627,628,480,628],
  [639,332,939,626,791.5,626], [952,328,1249,626,1104.5,626],
  [12,643,317,939,166,939], [329,642,627,940,479.5,940],
  [639,643,937,940,791.5,940], [950,642,1249,939,1105,939],
  [26,950,316,1250,166.5,1250], [330,950,628,1249,481.5,1249],
  [649,946,937,1249,791.5,1249], [948,952,1250,1250,1104,1250],
];
let prepared: Promise<void> | null = null;

function prepareArtwork() {
  if (!prepared) prepared = Promise.all([ATLAS, BACKDROP].map(src => new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Artwork unavailable"));
    image.src = src;
  }))).then(() => undefined).catch(error => { prepared = null; throw error; });
  return prepared;
}

export function MascotHero({cartCount = 0}: {cartCount?: number}) {
  const section = useRef<HTMLElement>(null);
  const maskId = `mascot-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const previousCount = useRef(cartCount);
  const intent = useRef(0);
  const mounted = useRef(true);
  const [scene, setScene] = useState<Scene>("idle");
  const [frame, setFrame] = useState(0);
  const [loading, setLoading] = useState(false);
  const [artworkReady, setArtworkReady] = useState(false);
  const [error, setError] = useState("");
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const motionAllowed = !reduced && !paused;
  const running = motionAllowed && inView && pageVisible;
  const active = artworkReady && scene !== "idle";

  const stop = useCallback(() => {
    intent.current += 1;
    setLoading(false);
    setScene("idle");
    setFrame(0);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduced(preference.matches);
    const syncVisibility = () => setPageVisible(document.visibilityState === "visible");
    syncPreference();
    syncVisibility();
    preference.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.05), {threshold: 0.05});
    if (section.current) observer.observe(section.current);
    return () => {
      mounted.current = false;
      intent.current += 1;
      observer.disconnect();
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => { if (!motionAllowed) stop(); }, [motionAllowed, stop]);

  const play = useCallback(async (next: Exclude<Scene, "idle">) => {
    if (!motionAllowed) return;
    const request = ++intent.current;
    setError("");
    setLoading(true);
    try {
      await prepareArtwork();
      if (!mounted.current || request !== intent.current) return;
      setArtworkReady(true);
      setFrame(next === "cheer" ? 14 : 0);
      setScene(next);
      if (next === "snack") setHasPlayed(true);
    } catch {
      if (mounted.current && request === intent.current) setError("ანიმაცია ვერ ჩაიტვირთა. კიდევ სცადე.");
    } finally {
      if (mounted.current && request === intent.current) setLoading(false);
    }
  }, [motionAllowed]);

  useEffect(() => {
    const added = cartCount > previousCount.current;
    previousCount.current = cartCount;
    if (added && running && scene === "idle" && !loading) void play("cheer");
  }, [cartCount, running, scene, loading, play]);

  useEffect(() => {
    if (!running || scene === "idle") return;
    const timer = window.setTimeout(() => {
      if (scene === "cheer" || frame === FRAME_MS.length - 1) stop();
      else setFrame(value => value + 1);
    }, scene === "cheer" ? 1600 : FRAME_MS[frame]);
    return () => clearTimeout(timer);
  }, [scene, frame, running, stop]);

  useEffect(() => {
    if (!active && !loading) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") stop(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, loading, stop]);

  const [left, top, right, bottom, anchorX, anchorY] = FRAMES[frame];
  const playLabel = loading ? "იტვირთება…" : active ? "გაჩერება" : hasPlayed ? "კიდევ ერთხელ" : "დააჭირე კაცუნას";

  return <section ref={section} className={`coastal-hero mascot-hero ${active ? "mascot-active" : ""} ${running ? "motion-running" : "motion-still"}`} aria-label="ხინკალიუსი ბათუმში">
    <div className="hero-scene">
      <img className="mascot-poster" src="/hero-open.webp" width="2172" height="724" alt="ხინკალიუსი და ბათუმის სანაპირო: ანბანის კოშკი, ეშმაკის ბორბალი, ალი და ნინო" fetchPriority="high"/>
      <img className="blink-frame" src="/hero-blink.webp" width="2172" height="724" alt="" aria-hidden="true"/>
      {artworkReady && <>
        <img className="mascot-backdrop" src={BACKDROP} width="2172" height="724" alt="" aria-hidden="true"/>
        <div className={`mascot-sprite ${scene === "cheer" ? "mascot-cheer" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 340 340" width="340" height="340">
            <defs><filter id={maskId} filterUnits="userSpaceOnUse" x={left} y={top} width={right-left} height={bottom-top} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="table" tableValues="0 0 0 0 0 0 0.5 0.8 0.95 1 1"/></feComponentTransfer></filter></defs>
            <g transform={`translate(${166-anchorX} ${320-anchorY})`}><image href={ATLAS} width="1256" height="1256" filter={`url(#${maskId})`}/></g>
          </svg>
        </div>
      </>}
      {!active && <svg className="box-steam" viewBox="0 0 60 80" fill="none" aria-hidden="true"><path d="M15 70C-2 48 35 34 17 10"/><path d="M32 76C14 52 52 39 34 13"/><path d="M48 68C31 48 66 32 48 5"/></svg>}
      {scene === "cheer" && <span className="mascot-reply" aria-hidden="true">კარგი არჩევანია!</span>}
    </div>
    <button type="button" className="mascot-touch" aria-label={active || loading ? "ხინკალიუსის ანიმაციის გაჩერება" : "ხინკალიუსი: ხინკლუკა და ლუდი — ანიმაციის ნახვა"} disabled={!motionAllowed} onClick={() => active || loading ? stop() : void play("snack")}>
      <span className="mascot-play-label">{loading ? <span className="mascot-loading-dot"/> : active ? <Pause size={13}/> : hasPlayed ? <RotateCcw size={13}/> : <Play size={13}/>} {playLabel}</span>
    </button>
    <div className="shell hero-copy"><span className="hero-kicker"><MapPin size={15}/> ბათუმში, შენი გემოვნებით</span><h1>ბათუმს უხდება<br/><em>ხინკალი.</em></h1><a className="primary" href="#menu">აირჩიე შენი ხინკალი</a></div>
    <div className="mascot-controls">
      {!reduced && <button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)} aria-label={paused ? "მოძრაობის ჩართვა" : "მოძრაობის გამორთვა"}>{paused ? <Play size={13}/> : <Pause size={13}/>}<span>{paused ? "მოძრაობის ჩართვა" : "მოძრაობის გამორთვა"}</span></button>}
      {reduced && <span><Sparkles size={13}/> მშვიდი რეჟიმი</span>}
    </div>
    <span className="sr-only" role="status" aria-live="polite">{loading ? "ხინკალიუსის ანიმაცია იტვირთება" : scene === "cheer" ? "ხინკალიუსს შენი არჩევანი მოეწონა!" : scene === "snack" ? "ხინკალიუსის პატარა შესვენება: ხინკალი და ლუდი" : ""}</span>
    {error && <div className="mascot-error" role="status">{error}</div>}
  </section>;
}
