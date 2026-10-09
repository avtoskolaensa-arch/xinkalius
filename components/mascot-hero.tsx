"use client";

import {useEffect, useId, useRef, useState} from "react";
import {MapPin, Pause, Play} from "lucide-react";

// Eye apertures are measured on the unchanged 2172 × 724 hero artwork.
// The outer curve covers the entire original iris when the pupil looks left.
const EYES = [
  {path: "M1523 292C1544 280 1576 264 1596 257C1600 266 1602 277 1595 285C1589 295 1581 302 1571 306C1552 316 1534 309 1523 292Z", x:1583, y:271},
  {path: "M1615 248C1636 233 1660 223 1684 219C1689 236 1682 254 1664 265C1644 279 1625 268 1615 248Z", x:1669, y:233},
];

export function MascotHero() {
  const section = useRef<HTMLElement>(null);
  const id = `eyes-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const running = inView && pageVisible && !reduced && !paused;

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduced(preference.matches);
    const syncVisibility = () => setPageVisible(document.visibilityState === "visible");
    syncPreference();
    syncVisibility();
    preference.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {threshold: 0});
    if (section.current) observer.observe(section.current);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  return <section ref={section} className={`coastal-hero mascot-hero ${running ? "motion-running" : "motion-still"}`} aria-label="ხინკალიუსი ბათუმში">
    <div className="hero-scene">
      <img src="/hero-open.webp" width="2172" height="724" alt="ხინკალიუსი და ბათუმის სანაპირო: ანბანის კოშკი, ეშმაკის ბორბალი, ალი და ნინო" fetchPriority="high"/>
      <svg className="mascot-eyes" viewBox="0 0 2172 724" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-white`} x1="0" y1="0" x2="0.3" y2="1"><stop stopColor="#c9b6a6"/><stop offset=".4" stopColor="#f0eae6"/><stop offset=".75" stopColor="#faf6ee"/><stop offset="1" stopColor="#d9c8b9"/></linearGradient>
          <radialGradient id={`${id}-iris`} cx=".6" cy=".32" r=".76"><stop stopColor="#674532"/><stop offset=".6" stopColor="#422b22"/><stop offset="1" stopColor="#211b18"/></radialGradient>
          {EYES.map((eye,index) => <clipPath key={index} id={`${id}-${index}`}><path d={eye.path}/></clipPath>)}
        </defs>
        {EYES.map((eye,index) => <g key={index} clipPath={`url(#${id}-${index})`}>
          <path d={eye.path} fill={`url(#${id}-white)`}/>
          <g className="mascot-pupil">
            <ellipse cx={eye.x} cy={eye.y} rx="15" ry="19" fill={`url(#${id}-iris)`}/>
            <ellipse cx={eye.x+2} cy={eye.y-2} rx="8" ry="12.5" fill="#17191a"/>
            <ellipse cx={eye.x+3} cy={eye.y-8} rx="3.4" ry="4.3" fill="#fff" opacity=".95"/>
            <circle cx={eye.x-5} cy={eye.y+6} r="1.4" fill="#b4aba4" opacity=".45"/>
          </g>
        </g>)}
      </svg>
      <img className="blink-frame" src="/hero-blink.webp" width="2172" height="724" alt="" aria-hidden="true"/>
    </div>
    <div className="shell hero-copy"><span className="hero-kicker"><MapPin size={15}/> ბათუმში, შენი გემოვნებით</span><h1>ბათუმს უხდება<br/><em>ხინკალი.</em></h1><a className="primary" href="#menu">აირჩიე შენი ხინკალი</a></div>
    {!reduced && <div className="mascot-controls"><button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)} aria-label={paused ? "მოძრაობის ჩართვა" : "მოძრაობის გამორთვა"}>{paused ? <Play size={13}/> : <Pause size={13}/>}<span>{paused ? "მოძრაობის ჩართვა" : "მოძრაობის გამორთვა"}</span></button></div>}
  </section>;
}
