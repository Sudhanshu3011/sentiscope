import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "https://sudhanshu1106shekhar-sentiscope-api.hf.space";

const EXAMPLES = [
  { label: "😍 Glowing",   text: "Absolutely love this! Best purchase I've made in years. Flawless quality and incredible value for money." },
  { label: "😠 Furious",   text: "Complete garbage. Broke after 2 days. Worst customer service. Never buying from them again." },
  { label: "😐 Mixed",     text: "It's decent for the price. Nothing special but gets the job done. Could be better honestly." },
  { label: "🎬 Cinematic", text: "A breathtaking masterpiece. The cinematography alone is worth the watch — pure visual poetry." },
];
const MODEL_ORDER = ["SVM", "Logistic Regression", "Random Forest", "DistilBERT"];
const isPos = (l = "") => l.includes("positive");
const isNeg = (l = "") => l.includes("negative");

// ── Responsive hook ───────────────────────────────────────────────────────────
function useW() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function useTheme(dark) {
  return {
    bg:      dark ? "#03040a"  : "#fafafe",
    card:    dark ? "#0d1424"  : "#ffffff",
    border:  dark ? "#1a2236"  : "#ede9ff",
    border2: dark ? "#242f45"  : "#ddd6fe",
    text:    dark ? "#f1f5f9"  : "#18115e",
    sub:     dark ? "#64748b"  : "#7c6fad",
    muted:   dark ? "#2a3a54"  : "#c4b5fd",
    accent:  dark ? "#a78bfa"  : "#7c3aed",
    accent2: dark ? "#818cf8"  : "#4f46e5",
    glow:    dark ? "rgba(167,139,250,0.12)" : "rgba(124,58,237,0.07)",
    posText: dark ? "#4ade80"  : "#15803d",
    posBg:   dark ? "rgba(74,222,128,0.07)"  : "#f0fdf4",
    posBd:   dark ? "rgba(74,222,128,0.22)"  : "#bbf7d0",
    negText: dark ? "#f87171"  : "#b91c1c",
    negBg:   dark ? "rgba(248,113,113,0.07)" : "#fff1f2",
    negBd:   dark ? "rgba(248,113,113,0.22)" : "#fecdd3",
  };
}

// ── Mesh background ───────────────────────────────────────────────────────────
function MeshBg({ dark }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      {[
        { s:500, x:"-8%",  y:"-12%", c:dark?"rgba(99,102,241,0.07)":"rgba(124,58,237,0.06)",  d:"20s" },
        { s:420, x:"58%",  y:"5%",   c:dark?"rgba(167,139,250,0.05)":"rgba(139,92,246,0.05)", d:"25s" },
        { s:360, x:"15%",  y:"55%",  c:dark?"rgba(79,70,229,0.06)":"rgba(99,102,241,0.04)",   d:"18s" },
        { s:300, x:"75%",  y:"65%",  c:dark?"rgba(139,92,246,0.05)":"rgba(167,139,250,0.06)", d:"22s" },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", width:o.s, height:o.s,
          left:o.x, top:o.y, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c},transparent 70%)`,
          animation:`orbFloat${i} ${o.d} ease-in-out infinite alternate`,
          filter:"blur(40px)",
        }}/>
      ))}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`linear-gradient(${dark?"rgba(167,139,250,0.022)":"rgba(124,58,237,0.022)"} 1px,transparent 1px),
                         linear-gradient(90deg,${dark?"rgba(167,139,250,0.022)":"rgba(124,58,237,0.022)"} 1px,transparent 1px)`,
        backgroundSize:"44px 44px",
        maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)",
      }}/>
    </div>
  );
}

// ── Plasma Wave — truly responsive, single merged effect ────────────────────
function PlasmaWave({ verdict, dark, active }) {
  const wrapRef  = useRef(null);
  const canRef   = useRef(null);
  const frameRef = useRef(null);
  const phaseRef = useRef(0);
  const sizeRef  = useRef({ w: 0, h: 80 });

  useEffect(() => {
    const wrap = wrapRef.current;
    const can  = canRef.current;
    if (!wrap || !can) return;

    const color = isPos(verdict) ? [74,222,128] : isNeg(verdict) ? [248,113,113] : [167,139,250];
    const freq  = isPos(verdict) ? 2.0 : isNeg(verdict) ? 3.2 : 1.6;
    const ctx   = can.getContext("2d");

    // ── Set canvas buffer size to match real pixel dimensions ──
    function syncSize() {
      const rect = wrap.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      const W    = Math.floor(rect.width);
      const H    = 80;
      if (W < 1) return;
      can.width         = W * dpr;
      can.height        = H * dpr;
      can.style.width   = W + "px";
      can.style.height  = H + "px";
      ctx.scale(dpr, dpr);
      sizeRef.current   = { w: W, h: H };
    }
    syncSize();

    // ── Watch container size changes ──
    const ro = new ResizeObserver(() => { syncSize(); });
    ro.observe(wrap);

    // ── Animation loop ──
    function draw() {
      const { w: W, h: H } = sizeRef.current;
      if (!W || !H) { frameRef.current = requestAnimationFrame(draw); return; }
      const amp = active ? H * 0.34 : H * 0.14;
      ctx.clearRect(0, 0, W, H);
      const [r, g, b] = color;

      // gradient fill under wave
      const grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, `rgba(${r},${g},${b},${active ? 0.09 : 0.03})`);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x++) {
        const t = (x / W) * Math.PI * 2 * freq + phaseRef.current;
        const y = H/2 + Math.sin(t)*amp*0.9 + Math.sin(t*1.7+1)*amp*0.3 + Math.sin(t*3.1+2)*amp*0.1;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

      // 3-layer glow wave
      [[2, 0.9, 10], [4.5, 0.35, 20], [9, 0.12, 28]].forEach(([lw, alpha, blur]) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth   = lw;
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
        ctx.shadowBlur  = blur;
        for (let x = 0; x <= W; x++) {
          const t = (x / W) * Math.PI * 2 * freq + phaseRef.current;
          const y = H/2 + Math.sin(t)*amp*0.9 + Math.sin(t*1.7+1)*amp*0.3 + Math.sin(t*3.1+2)*amp*0.1;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // pulse dot
      const px = W * 0.72;
      const pt = (px / W) * Math.PI * 2 * freq + phaseRef.current;
      const py = H/2 + Math.sin(pt)*amp*0.9 + Math.sin(pt*1.7+1)*amp*0.3;
      ctx.shadowColor = `rgba(${r},${g},${b},1)`; ctx.shadowBlur = 16;
      ctx.fillStyle   = `rgb(${r},${g},${b})`;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur  = 0;

      phaseRef.current -= active ? 0.05 : 0.015;
      frameRef.current  = requestAnimationFrame(draw);
    }

    cancelAnimationFrame(frameRef.current);
    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [verdict, dark, active]);

  return (
    <div ref={wrapRef} style={{ width:"100%", lineHeight:0 }}>
      <canvas ref={canRef}
        style={{ display:"block", borderRadius:10, opacity:0.96 }}/>
    </div>
  );
}

// ── SVG Gauge ─────────────────────────────────────────────────────────────────
function Gauge({ score, color, dark }) {
  if (score == null) return (
    <div style={{ fontSize:"0.6rem", fontFamily:"'Sora',sans-serif", color:dark?"#334155":"#94a3b8", marginTop:8 }}>
      no score
    </div>
  );
  const pct  = Math.round(score * 100);
  const r    = 18, cx = 24, cy = 24, circ = 2 * Math.PI * r;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
      <svg width={48} height={48} style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={dark?"#1e293b":"#f1f5f9"} strokeWidth={3.5}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={3.5}
          strokeDasharray={`${(pct/100)*circ} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 4px ${color}80)`, transition:"stroke-dasharray 1s ease" }}/>
        <text x={cx} y={cy+4} textAnchor="middle"
          style={{ fontSize:"8px", fontFamily:"'Sora',sans-serif", fontWeight:700, fill:color }}>
          {pct}%
        </text>
      </svg>
      <div style={{ fontSize:"0.6rem", fontFamily:"'Sora',sans-serif", color:dark?"#64748b":"#9ca3af", lineHeight:1.4 }}>
        confidence<br/>score
      </div>
    </div>
  );
}

// ── Model Card ────────────────────────────────────────────────────────────────
function ModelCard({ name, pred, index, dark }) {
  const T = useTheme(dark);
  const pos = isPos(pred.label), neg = isNeg(pred.label);
  const sc  = pos ? T.posText : neg ? T.negText : T.sub;
  const bg  = pos ? T.posBg   : neg ? T.negBg   : (dark?"rgba(148,163,184,0.05)":"#f9fafb");
  const bd  = pos ? T.posBd   : neg ? T.negBd   : T.border;
  const bar = pos ? "linear-gradient(90deg,#22c55e,#86efac)" : neg ? "linear-gradient(90deg,#ef4444,#fca5a5)" : `linear-gradient(90deg,${T.accent},${T.accent2})`;
  const [hov, setHov] = useState(false);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov ? (dark?"rgba(17,24,39,0.95)":"rgba(250,249,255,0.95)") : T.card,
        border:`1.5px solid ${hov ? bd : T.border}`,
        borderRadius:20, padding:"18px 18px",
        position:"relative", overflow:"hidden",
        boxShadow: hov
          ? (dark?`0 12px 40px rgba(0,0,0,0.5),0 0 0 1px ${bd}`:`0 12px 40px rgba(124,58,237,0.12),0 0 0 1px ${bd}`)
          : (dark?"0 4px 20px rgba(0,0,0,0.4)":"0 2px 12px rgba(0,0,0,0.04)"),
        transform: hov ? "translateY(-4px) scale(1.01)" : "none",
        transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        animation:`cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${index*90}ms both`,
        backdropFilter:"blur(8px)",
      }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:bar,
        boxShadow:pos?"0 0 10px rgba(34,197,94,0.5)":neg?"0 0 10px rgba(239,68,68,0.5)":"none",
        borderRadius:"20px 20px 0 0" }}/>
      {hov && <div style={{ position:"absolute", top:0, left:0, right:0, height:50,
        background:`linear-gradient(180deg,${bg},transparent)`,
        borderRadius:"18px 18px 0 0", pointerEvents:"none" }}/>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, position:"relative" }}>
        <div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.58rem", color:T.accent,
            letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:4 }}>{name}</div>
          <span style={{ background:dark?"rgba(167,139,250,0.1)":"rgba(124,58,237,0.07)",
            color:T.accent, borderRadius:6, padding:"2px 7px",
            fontSize:"0.56rem", fontFamily:"'Sora',sans-serif", fontWeight:600,
            border:`1px solid ${dark?"rgba(167,139,250,0.15)":"rgba(124,58,237,0.12)"}` }}>
            {pred.input_type === "raw" ? "raw" : "processed"}
          </span>
        </div>
        <div style={{ fontSize:"1.3rem", color:sc,
          filter:hov?`drop-shadow(0 0 8px ${sc}90)`:"none", transition:"filter 0.2s" }}>
          {pred.label==="strongly positive"?"✦✦":pred.label==="positive"?"✦":pred.label==="strongly negative"?"✕✕":pred.label==="negative"?"✕":"·"}
        </div>
      </div>

      <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:"1rem",
        color:sc, letterSpacing:"-0.01em", marginBottom:2,
        textShadow:hov?`0 0 20px ${sc}50`:"none", transition:"text-shadow 0.2s" }}>
        {pred.label.toUpperCase()}
      </div>
      <Gauge score={pred.score} color={pos?"#22c55e":neg?"#ef4444":T.accent} dark={dark}/>
    </div>
  );
}

// ── SHAP Tokens ───────────────────────────────────────────────────────────────
function ShapTokens({ tokens, dark }) {
  return (
    <div style={{ lineHeight:"2.6", fontSize:"0.95rem", wordBreak:"break-word" }}>
      {tokens.map((t, i) => {
        if (t.type === "positive") {
          const a = Math.min(t.score * 7, 0.9);
          return <span key={i} style={{ background:`rgba(34,197,94,${a*0.3})`,
            border:`1px solid rgba(34,197,94,${a*0.5})`, borderRadius:6,
            padding:"3px 6px", marginRight:3, marginBottom:4,
            color:dark?"rgba(134,239,172,1)":"rgba(21,128,61,1)",
            fontWeight:700, display:"inline-block",
            boxShadow:`0 0 8px rgba(34,197,94,${a*0.3})` }}>{t.token}</span>;
        }
        if (t.type === "negative") {
          const a = Math.min(t.score * 7, 0.9);
          return <span key={i} style={{ background:`rgba(239,68,68,${a*0.3})`,
            border:`1px solid rgba(239,68,68,${a*0.5})`, borderRadius:6,
            padding:"3px 6px", marginRight:3, marginBottom:4,
            color:dark?"rgba(252,165,165,1)":"rgba(185,28,28,1)",
            fontWeight:700, display:"inline-block",
            boxShadow:`0 0 8px rgba(239,68,68,${a*0.3})` }}>{t.token}</span>;
        }
        return <span key={i} style={{ color:dark?"#2a3a54":"#c4b5fd",
          marginRight:3, display:"inline-block" }}>{t.token}</span>;
      })}
    </div>
  );
}

// ── History Item ──────────────────────────────────────────────────────────────
function HistItem({ item, dark, onClick }) {
  const T = useTheme(dark);
  const c = isPos(item.verdict) ? T.posText : isNeg(item.verdict) ? T.negText : T.sub;
  const [h, setH] = useState(false);
  return (
    <div onClick={()=>onClick(item)}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:h?(dark?"rgba(17,24,39,0.8)":"rgba(248,247,255,0.9)"):T.card,
        border:`1px solid ${h?c:T.border}`, borderLeft:`3px solid ${c}`,
        borderRadius:12, padding:"10px 14px", cursor:"pointer",
        transition:"all 0.18s", marginBottom:8,
        transform:h?"translateX(3px)":"none" }}>
      <div style={{ fontSize:"0.63rem", fontWeight:700, color:c, fontFamily:"'Sora',sans-serif", marginBottom:3 }}>
        {item.verdict.toUpperCase()}
      </div>
      <div style={{ fontSize:"0.72rem", color:T.sub, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
        {item.input_text}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, dark, onDone }) {
  const T = useTheme(dark);
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:24, right:16, left:16, zIndex:9999,
      background:dark?"rgba(13,20,36,0.97)":"rgba(255,255,255,0.97)",
      backdropFilter:"blur(16px)", border:`1.5px solid ${T.border2}`,
      borderRadius:14, padding:"12px 20px",
      boxShadow:"0 8px 40px rgba(0,0,0,0.2)",
      fontFamily:"'Sora',sans-serif", fontSize:"0.78rem",
      color:T.accent, fontWeight:600,
      animation:"toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      display:"flex", alignItems:"center", gap:8, maxWidth:400, margin:"0 auto" }}>
      <span>✓</span> {msg}
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function TabBtn({ id, label, active, onClick, dark, isMobile }) {
  const T = useTheme(dark);
  return (
    <button onClick={()=>onClick(id)} style={{
      background:active ? `linear-gradient(135deg,${dark?"#6366f1":"#7c3aed"},${dark?"#4f46e5":"#4338ca"})` : "transparent",
      border:"none", cursor:"pointer",
      padding: isMobile ? "9px 12px" : "10px 20px",
      fontSize: isMobile ? "0.65rem" : "0.72rem",
      fontWeight:700, fontFamily:"'Sora',sans-serif",
      borderRadius:10, transition:"all 0.2s",
      color:active?"white":T.sub,
      boxShadow:active?`0 4px 16px ${dark?"rgba(99,102,241,0.4)":"rgba(124,58,237,0.3)"}`:"none",
      letterSpacing:"0.04em", textTransform:"uppercase", whiteSpace:"nowrap",
      flex: isMobile ? "1" : "none",
    }}>{label}</button>
  );
}

// // ── Pipeline Step ─────────────────────────────────────────────────────────────
// function PipStep({ n, title, desc, index, T }) {
//   const [h, setH] = useState(false);
//   return (
//     <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
//       style={{ flexShrink:0, display:"flex", alignItems:"center" }}>
//       <div style={{
//         background:h?"rgba(99,102,241,0.12)":"rgba(99,102,241,0.06)",
//         border:`1px solid ${h?T.accent:"rgba(99,102,241,0.15)"}`,
//         borderRadius:14, padding:"12px 14px", textAlign:"center", minWidth:105,
//         animation:`cardIn 0.4s ease ${index*55}ms both`,
//         transform:h?"translateY(-2px)":"none", transition:"all 0.2s",
//       }}>
//         <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.54rem", color:T.accent, fontWeight:800, letterSpacing:"0.1em", marginBottom:4 }}>STEP {n}</div>
//         <div style={{ fontSize:"0.76rem", fontWeight:700, color:T.text, marginBottom:2 }}>{title}</div>
//         <div style={{ fontSize:"0.6rem", color:T.sub, lineHeight:1.3 }}>{desc}</div>
//       </div>
//     </div>
//   );
// }

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function SentiScope() {
  const [dark,    setDark]    = useState(true);
  const [text,    setText]    = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [history, setHistory] = useState([]);
  const [toast,   setToast]   = useState(null);
  const [tab,     setTab]     = useState("results");
  const [showHist, setShowHist] = useState(false);
  const taRef = useRef(null);
  const T  = useTheme(dark);
  const vw = useW();
  const isMobile = vw < 640;
  const isTablet = vw < 960;

  const analyze = useCallback(async (inp) => {
    const t = (inp ?? text).trim(); if (!t) return;
    setLoading(true); setError(null); setResult(null); setTab("results");
    try {
      const res  = await fetch(`${API_BASE}/predict`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ text:t }) });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setResult(data);
      setHistory(h => [data, ...h].slice(0, 6));
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  }, [text]);

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [analyze]);

  const posPct = result ? Math.round((result.positive_votes / (result.positive_votes + result.negative_votes || 1)) * 100) : 0;
  const vColor = result ? (isPos(result.verdict) ? T.posText : isNeg(result.verdict) ? T.negText : T.sub) : T.sub;

  // Shared card style
  const card = {
    background: dark ? "rgba(13,20,36,0.75)" : "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
    border: `1.5px solid ${T.border}`,
    borderRadius: 22,
    padding: isMobile ? "18px 16px" : "22px 24px",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)" : "0 4px 24px rgba(124,58,237,0.06),inset 0 1px 0 rgba(255,255,255,0.9)",
  };

  const slabel = {
    fontFamily:"'Sora',sans-serif", fontSize:"0.6rem", fontWeight:700,
    letterSpacing:"0.16em", textTransform:"uppercase",
    color:T.accent, marginBottom:12,
    display:"flex", alignItems:"center", gap:8,
  };

  return (
    <div style={{
      minHeight:"100vh", background:T.bg, color:T.text,
      fontFamily:"'DM Sans',sans-serif",
      transition:"background 0.4s ease, color 0.4s ease",
      position:"relative", overflowX:"clip",
      "--t-bg":T.bg, "--t-card":T.card, "--t-border":T.border,
      "--t-border2":T.border2, "--t-text":T.text, "--t-sub":T.sub,
      "--t-muted":T.muted, "--t-accent":T.accent, "--t-accent2":T.accent2, "--t-glow":T.glow,
    }}>

      <style key={dark?"d":"l"}>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{
          -webkit-text-size-adjust:100%;
          text-size-adjust:100%;
        }
        body{
          overscroll-behavior:none;
          -webkit-overflow-scrolling:touch;
        }
        /* Prevent iOS bounce on outer container */
        #root{
          min-height:100dvh;
          position:relative;
        }
        /* Safe area for notched phones */
        header{
          padding-left: max(1rem, env(safe-area-inset-left));
          padding-right: max(1rem, env(safe-area-inset-right));
        }
        footer{
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        /* Bigger touch targets on mobile */
        @media(max-width:640px){
          button{ min-height:44px; }
          .example-pill{ min-height:44px; display:flex; align-items:center; }
        }
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:var(--t-muted);border-radius:3px;}

        @keyframes cardIn   {from{opacity:0;transform:scale(0.92) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp   {from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
        @keyframes spin     {to{transform:rotate(360deg)}}
        @keyframes toastIn  {from{opacity:0;transform:translateY(14px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes verdIn   {from{opacity:0;transform:scale(0.93) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes dotPulse {0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:0.4}}
        @keyframes glow     {0%,100%{box-shadow:0 0 20px var(--t-glow)}50%{box-shadow:0 0 40px var(--t-glow)}}
        @keyframes orbFloat0{from{transform:translate(0,0) scale(1)}to{transform:translate(28px,18px) scale(1.05)}}
        @keyframes orbFloat1{from{transform:translate(0,0) scale(1)}to{transform:translate(-18px,28px) scale(0.95)}}
        @keyframes orbFloat2{from{transform:translate(0,0) scale(1)}to{transform:translate(22px,-18px) scale(1.07)}}
        @keyframes orbFloat3{from{transform:translate(0,0) scale(1)}to{transform:translate(-26px,14px) scale(0.93)}}
        @keyframes shimmer  {0%{background-position:-200% 0}100%{background-position:200% 0}}

        .analyze-btn{
          background:linear-gradient(135deg,#7c3aed,#4338ca);
          color:white;border:none;border-radius:14px;
          padding:14px 32px;font-size:0.9rem;font-weight:700;
          font-family:'Sora',sans-serif;cursor:pointer;
          letter-spacing:0.05em;text-transform:uppercase;
          box-shadow:0 6px 24px rgba(124,58,237,0.45);
          transition:all 0.2s;position:relative;overflow:hidden;
          animation:glow 3s ease infinite;width:100%;
        }
        .analyze-btn::before{content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.14),transparent);border-radius:14px;}
        .analyze-btn:hover:not(:disabled){transform:translateY(-2px) scale(1.01);box-shadow:0 10px 36px rgba(124,58,237,0.6);}
        .analyze-btn:active:not(:disabled){transform:translateY(0) scale(0.99);}
        .analyze-btn:disabled{opacity:0.45;cursor:not-allowed;animation:none;}

        .ghost-btn{
          background:var(--t-glow);
          border:1.5px solid var(--t-border);
          color:var(--t-sub);border-radius:14px;
          padding:13px 20px;font-size:0.85rem;
          font-family:'Sora',sans-serif;cursor:pointer;
          transition:all 0.2s;font-weight:600;flex:1;
        }
        .ghost-btn:hover{border-color:var(--t-accent);color:var(--t-accent);}

        .example-pill{
          background:var(--t-card);border:1px solid var(--t-border);
          border-radius:12px;padding:11px 14px;
          font-size:0.8rem;color:var(--t-accent);
          cursor:pointer;transition:all 0.2s;
          font-family:'Sora',sans-serif;font-weight:600;
          width:100%;text-align:left;display:block;
        }
        .example-pill:hover{border-color:var(--t-accent);transform:translateX(3px);}

        .pip-step{
          background:var(--t-glow);
          border:1px solid var(--t-border);
          border-radius:14px;padding:12px 14px;
          text-align:center;min-width:105px;flex-shrink:0;
          transition:all 0.2s;
        }
        .pip-step:hover{border-color:var(--t-accent);transform:translateY(-2px);}

        .shimmer-box{
          background:linear-gradient(90deg,var(--t-muted) 25%,var(--t-border2) 50%,var(--t-muted) 75%);
          background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:14px;
        }

        textarea{
          width:100%;border:1.5px solid var(--t-border);
          border-radius:16px;padding:16px 18px;
          font-size:0.97rem;font-family:'DM Sans',sans-serif;
          color:var(--t-text);background:var(--t-card);
          resize:vertical;outline:none;line-height:1.72;
          transition:border-color 0.2s,box-shadow 0.2s;
          -webkit-appearance:none;
        }
        textarea:focus{border-color:var(--t-accent);box-shadow:0 0 0 3px var(--t-glow);}
        textarea::placeholder{color:var(--t-muted);}

        .slabel-bar::before{content:'';display:inline-block;width:14px;height:2px;
          background:var(--t-accent);border-radius:2px;}
      `}</style>

      <MeshBg dark={dark}/>

      {/* ── HEADER ── */}
      <header style={{
        position:"sticky", top:0, zIndex:100,
        background:dark?"rgba(3,4,10,0.82)":"rgba(250,250,254,0.88)",
        backdropFilter:"blur(24px)",
        borderBottom:`1px solid ${T.border}`,
      }}>
        <div style={{
          maxWidth:1240, margin:"0 auto",
          padding: isMobile ? "0 16px" : "0 2.5rem",
          display:"flex", alignItems:"center",
          justifyContent:"space-between", height: isMobile ? 58 : 68,
          gap:12,
        }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{
              width:isMobile?34:40, height:isMobile?34:40, borderRadius:12,
              background:"linear-gradient(135deg,#7c3aed,#4338ca)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:isMobile?"1rem":"1.2rem",
              boxShadow:"0 4px 16px rgba(124,58,237,0.45)",
            }}>⚡</div>
            <div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:isMobile?"1.1rem":"1.35rem",
                fontWeight:800, letterSpacing:"-0.03em",
                color:dark?"#c4b5fd":"#7c3aed" }}>SentiScope</div>
              {!isMobile && <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.52rem",
                color:T.sub, letterSpacing:"0.12em" }}>MULTI-MODEL SENTIMENT ENGINE</div>}
            </div>
          </div>

          {/* Model chips — scrollable row on tablet */}
          {!isMobile && (
            <div style={{ display:"flex", gap:5, alignItems:"center", overflowX:"auto", flexShrink:1, minWidth:0 }}>
              {["SVM","LogReg","RF","BERT"].map(m => (
                <span key={m} style={{
                  background:dark?"rgba(167,139,250,0.08)":"rgba(124,58,237,0.06)",
                  color:T.accent, border:`1px solid ${dark?"rgba(167,139,250,0.15)":"rgba(124,58,237,0.12)"}`,
                  borderRadius:7, padding:"3px 10px",
                  fontSize:"0.6rem", fontFamily:"'Sora',sans-serif", fontWeight:700,
                }}>{m}</span>
              ))}
            </div>
          )}

          {/* Right controls */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            {/* History toggle on mobile */}
            {isMobile && history.length > 0 && (
              <button onClick={()=>setShowHist(p=>!p)} style={{
                background:showHist?T.glow:"transparent",
                border:`1.5px solid ${T.border}`, borderRadius:10,
                padding:"8px 10px", cursor:"pointer", fontSize:"1rem",
                color:T.accent,
              }}>🕐</button>
            )}
            {/* Theme toggle */}
            <button onClick={()=>setDark(!dark)} style={{
              background:dark?"rgba(26,34,54,0.8)":"rgba(255,255,255,0.9)",
              backdropFilter:"blur(8px)",
              border:`1.5px solid ${T.border}`,
              borderRadius:50, padding: isMobile?"6px 8px":"7px 10px",
              cursor:"pointer", display:"flex", alignItems:"center", gap:6,
              transition:"all 0.3s",
            }}>
              <div style={{
                width:isMobile?22:26, height:isMobile?22:26, borderRadius:"50%",
                background:dark?"linear-gradient(135deg,#818cf8,#6366f1)":"linear-gradient(135deg,#fbbf24,#f59e0b)",
                boxShadow:dark?"0 0 10px rgba(99,102,241,0.6)":"0 0 10px rgba(251,191,36,0.5)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:isMobile?"12px":"14px",
              }}>{dark?"🌙":"☀️"}</div>
              {!isMobile && <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.66rem",
                fontWeight:700, color:T.sub, paddingRight:3 }}>{dark?"DARK":"LIGHT"}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{
        maxWidth:1240, margin:"0 auto",
        padding: isMobile ? "1.4rem 14px 4rem" : isTablet ? "1.8rem 1.5rem 4rem" : "2rem 2.5rem 5rem",
        position:"relative", zIndex:1,
      }}>

        {/* Hero */}
        <div style={{ marginBottom:22, animation:"fadeUp 0.5s ease" }}>
          {/* Badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:dark?"rgba(99,102,241,0.1)":"rgba(124,58,237,0.07)",
            border:`1px solid ${dark?"rgba(99,102,241,0.2)":"rgba(124,58,237,0.15)"}`,
            borderRadius:20, padding:"5px 14px", marginBottom:12,
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.accent, animation:"dotPulse 2s infinite" }}/>
            <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.62rem", fontWeight:600, color:T.accent, letterSpacing:"0.1em" }}>
              LIVE SENTIMENT ANALYSIS
            </span>
          </div>

          {/* Title + Wave side by side on tablet+, stacked on mobile */}
          <div style={{
            display:"flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent:"space-between",
            gap:16,
          }}>
            <div>
              <h1 style={{
                fontFamily:"'Sora',sans-serif",
                fontSize: isMobile ? "1.9rem" : " 2.8rem",
                fontWeight:800, letterSpacing:"-0.04em", lineHeight:1,
                marginBottom:10,
                color:dark?"#e2e8f0":"#1e1b4b",
                textShadow:dark?"0 0 40px rgba(167,139,250,0.45)":"0 2px 12px rgba(124,58,237,0.12)",
              }}>
                Understand<br/>Any Text
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.85rem", color:T.sub, lineHeight:1.6 }}>
                4 models · weighted voting · SHAP explainability
              </p>
            </div>

            {/* Waveform — full width on mobile, fixed width on desktop */}
            <div style={{
              width: isMobile ? "100%" : isTablet ? "280px" : "360px",
              flexShrink:0,
              background:dark?"rgba(13,20,36,0.6)":"rgba(255,255,255,0.8)",
              backdropFilter:"blur(12px)",
              border:`1px solid ${T.border}`,
              borderRadius:18, padding:"14px 16px",
              boxShadow:dark?"0 6px 28px rgba(0,0,0,0.3)":"0 4px 18px rgba(124,58,237,0.07)",
              minWidth:0,
            }}>
              <PlasmaWave verdict={result?.verdict||""} dark={dark} active={loading||!!result}/>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.56rem",
                color:T.sub, textAlign:"center", marginTop:7, letterSpacing:"0.1em" }}>
                SENTIMENT WAVEFORM
              </div>
            </div>
          </div>
        </div>

        {/* ── Input area ── */}
        <div style={{ ...card, marginBottom:16, animation:"fadeUp 0.5s ease 0.1s both" }}>
          <div style={{ ...slabel }} className="slabel-bar">INPUT TEXT</div>
          <textarea rows={isMobile ? 4 : 5}
            ref={taRef}
            placeholder="Paste a product review, tweet, or any text to analyze sentiment..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if ((e.metaKey||e.ctrlKey) && e.key==="Enter") { e.preventDefault(); analyze(); } }}
          />
          {/* Char counter */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"8px 0 14px" }}>
            <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.6rem", color:T.sub }}>
              {text.length} chars {!isMobile && "· ⌘+Enter to run"}
            </span>
            {text.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:60, height:3, borderRadius:3, background:T.muted, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:3, background:text.length>440?T.negText:T.accent,
                    width:`${Math.min((text.length/512)*100,100)}%`, transition:"width 0.2s" }}/>
                </div>
                <span style={{ fontSize:"0.58rem", fontFamily:"'Sora',sans-serif",
                  color:text.length>440?T.negText:T.sub }}>{512-text.length}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button className="analyze-btn" style={{ flex:"1 1 auto", minWidth:120 }}
              onClick={()=>analyze()} disabled={loading||!text.trim()}>
              {loading
                ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white",
                      borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }}/>
                    Analyzing...
                  </span>
                : "⚡ Analyze"}
            </button>
            <button className="ghost-btn" style={{ flex:"0 0 auto" }}
              onClick={()=>{setText("");setResult(null);setError(null);taRef.current?.focus();}}>
              ✕ Clear
            </button>
            {result && !isMobile && (
              <button className="ghost-btn" style={{ flex:"0 0 auto" }}
                onClick={()=>{ navigator.clipboard.writeText(JSON.stringify(result,null,2)); setToast("JSON copied!"); }}>
                ⎘ JSON
              </button>
            )}
          </div>
        </div>

        {/* ── Examples row ── */}
        <div style={{ marginBottom:16, animation:"fadeUp 0.5s ease 0.15s both" }}>
          <div style={{ ...slabel, marginBottom:10 }} className="slabel-bar">QUICK EXAMPLES</div>
          <div style={{
            display:"grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
            gap:8,
          }}>
            {EXAMPLES.map(ex => (
              <button key={ex.label} className="example-pill"
                onClick={()=>{ setText(ex.text); analyze(ex.text); }}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Mobile history drawer ── */}
        {isMobile && showHist && history.length > 0 && (
          <div style={{ ...card, marginBottom:16, animation:"fadeIn 0.25s ease" }}>
            <div style={{ ...slabel }} className="slabel-bar">HISTORY ({history.length})</div>
            {history.map((h, i) => (
              <HistItem key={i} item={h} dark={dark}
                onClick={(item)=>{ setText(item.input_text); setResult(item); setTab("results"); setShowHist(false); }}/>
            ))}
          </div>
        )}

        {/* ── Desktop: history inline below input ── */}
        {!isMobile && history.length > 0 && (
          <div style={{ ...card, padding:"16px 18px", marginBottom:16 }}>
            <div style={{ ...slabel, marginBottom:10 }} className="slabel-bar">HISTORY ({history.length})</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {history.map((h, i) => (
                <div key={i} onClick={()=>{ setText(h.input_text); setResult(h); setTab("results"); }}
                  style={{
                    background:T.card, border:`1px solid ${T.border}`,
                    borderLeft:`3px solid ${isPos(h.verdict)?T.posText:isNeg(h.verdict)?T.negText:T.sub}`,
                    borderRadius:12, padding:"8px 14px", cursor:"pointer",
                    flex:"1 1 200px", minWidth:0, transition:"all 0.18s",
                  }}>
                  <div style={{ fontSize:"0.62rem", fontWeight:700, fontFamily:"'Sora',sans-serif", marginBottom:3,
                    color:isPos(h.verdict)?T.posText:isNeg(h.verdict)?T.negText:T.sub }}>
                    {h.verdict.toUpperCase()}
                  </div>
                  <div style={{ fontSize:"0.72rem", color:T.sub, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {h.input_text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            background:dark?"rgba(239,68,68,0.07)":"#fff1f2",
            border:`1.5px solid ${dark?"rgba(239,68,68,0.2)":"#fecdd3"}`,
            borderRadius:16, padding:"14px 18px", marginBottom:16,
            color:dark?"#f87171":"#b91c1c",
            fontFamily:"'Sora',sans-serif", fontSize:"0.8rem", fontWeight:500,
          }}>
            ✕ {error} — ensure API is running at <strong>{API_BASE}</strong>
          </div>
        )}

        {/* ── Loading shimmer ── */}
        {loading && (
          <div style={{ marginBottom:20 }}>
            <div className="shimmer-box" style={{ height:44, marginBottom:12 }}/>
            <div style={{
              display:"grid",
              gridTemplateColumns: isMobile?"repeat(2,1fr)":isTablet?"repeat(2,1fr)":"repeat(4,1fr)",
              gap:12,
            }}>
              {[1,2,3,4].map(i => <div key={i} className="shimmer-box" style={{ height:130 }}/>)}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div style={{ animation:"fadeIn 0.35s ease" }}>

            {/* Tabs */}
            <div style={{
              display:"flex", gap:4, marginBottom:20,
              background:dark?"rgba(13,20,36,0.7)":"rgba(255,255,255,0.9)",
              backdropFilter:"blur(16px)",
              border:`1.5px solid ${T.border}`,
              borderRadius:16, padding:5,
              boxShadow:dark?"0 4px 18px rgba(0,0,0,0.3)":"0 2px 10px rgba(124,58,237,0.07)",
              width:"100%",
            }}>
              {[
                { id:"results",       label: isMobile ? "Results"  : "Model Results" },
                { id:"preprocessing", label: isMobile ? "Pipeline" : "Preprocessing" },
                { id:"shap",          label: "SHAP" },
              ].map(t => <TabBtn key={t.id} {...t} active={tab===t.id} onClick={setTab} dark={dark} isMobile={isMobile}/>)}
            </div>

            {/* ── Tab: Results ── */}
            {tab === "results" && (
              <div style={{ animation:"fadeUp 0.4s ease" }}>
                <div style={{ ...slabel, marginBottom:14 }} className="slabel-bar">MODEL PREDICTIONS</div>
                <div style={{
                  display:"grid",
                  gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)",
                  gap:12, marginBottom:18,
                }}>
                  {MODEL_ORDER.map((name, i) => {
                    const pred = result.predictions?.[name];
                    if (!pred) return null;
                    return <ModelCard key={name} name={name} pred={pred} index={i} dark={dark}/>;
                  })}
                </div>

                {/* Verdict */}
                <div style={{
                  ...card,
                  borderColor: isPos(result.verdict)?T.posBd:isNeg(result.verdict)?T.negBd:T.border,
                  background: dark
                    ? `linear-gradient(135deg,rgba(13,20,36,0.9),${isPos(result.verdict)?"rgba(34,197,94,0.04)":isNeg(result.verdict)?"rgba(239,68,68,0.04)":"rgba(13,20,36,0.9)"})`
                    : `linear-gradient(135deg,rgba(255,255,255,0.95),${isPos(result.verdict)?"rgba(34,197,94,0.03)":isNeg(result.verdict)?"rgba(239,68,68,0.03)":"white"})`,
                  animation:"verdIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.25s both",
                }}>
                  <div style={{ ...slabel, marginBottom:10 }} className="slabel-bar">
                    CONSENSUS VERDICT · DistilBERT ×2
                  </div>
                  <div style={{
                    display:"flex", alignItems:"flex-start",
                    justifyContent:"space-between",
                    flexDirection: isMobile ? "column" : "row",
                    gap:16, marginBottom:20,
                  }}>
                    <div style={{
                      fontFamily:"'Sora',sans-serif", fontWeight:800,
                      fontSize: isMobile ? "2.2rem" : "2.8rem",
                      color:vColor, lineHeight:1, letterSpacing:"-0.03em",
                      textShadow:dark?`0 0 40px ${vColor}40`:"none",
                    }}>
                      {result.verdict.toUpperCase()}
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {[
                        { n:result.positive_votes, l:"positive", bg:dark?"rgba(34,197,94,0.08)":"#f0fdf4",
                          c:T.posText, bd:dark?"rgba(34,197,94,0.2)":"#bbf7d0", a:"▲" },
                        { n:result.negative_votes, l:"negative", bg:dark?"rgba(239,68,68,0.08)":"#fff1f2",
                          c:T.negText, bd:dark?"rgba(239,68,68,0.2)":"#fecdd3", a:"▼" },
                      ].map(p => (
                        <div key={p.l} style={{
                          background:p.bg, color:p.c, border:`1.5px solid ${p.bd}`,
                          borderRadius:50, padding: isMobile?"8px 16px":"10px 22px",
                          fontFamily:"'Sora',sans-serif", fontSize:"0.8rem", fontWeight:700,
                        }}>{p.a} {p.n} {p.l}</div>
                      ))}
                    </div>
                  </div>
                  {/* Vote bar */}
                  <div style={{ height:9, borderRadius:9, background:dark?"#1a2236":"#ede9ff", overflow:"hidden", marginBottom:7,
                    boxShadow:"inset 0 2px 4px rgba(0,0,0,0.1)" }}>
                    <div style={{ height:"100%", width:`${posPct}%`,
                      background:"linear-gradient(90deg,#22c55e,#86efac)", borderRadius:9,
                      transition:"width 1.1s cubic-bezier(0.4,0,0.2,1)",
                      boxShadow:"0 0 14px rgba(34,197,94,0.45)" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.6rem", fontWeight:700, color:T.negText }}>← NEG</span>
                    <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.6rem", color:T.sub }}>{posPct}% positive</span>
                    <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.6rem", fontWeight:700, color:T.posText }}>POS →</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Preprocessing ── */}
            {tab === "preprocessing" && (
              <div style={{ animation:"fadeUp 0.4s ease" }}>
                <div style={{ ...slabel, marginBottom:14 }} className="slabel-bar">ML PIPELINE FLOW</div>

                {/* Classical pipeline */}
                <div style={{ ...card, marginBottom:12, overflowX:"auto" }}>
                  <div style={{ ...slabel, marginBottom:12 }} className="slabel-bar">Classical ML (SVM · LogReg · RF)</div>
                  <div style={{ display:"flex", alignItems:"center", gap:0, minWidth:"max-content" }}>
                    {[
                      { n:"01", t:"Raw Input",   d:"Original text" },
                      { n:"02", t:"Lowercase",   d:"Normalize case" },
                      { n:"03", t:"Clean",       d:"URLs, HTML" },
                      { n:"04", t:"Tokenize",    d:"Split words" },
                      { n:"05", t:"Stopwords",   d:"Remove common" },
                      { n:"06", t:"Lemmatize",   d:"run←running" },
                      { n:"07", t:"TF-IDF",      d:"Feature vec" },
                      { n:"08", t:"Predict",     d:"Label output" },
                    ].map((s, i, arr) => (
                      <div key={s.n} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                        <div className="pip-step" style={{ animation:`cardIn 0.4s ease ${i*55}ms both` }}>
                          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.52rem", color:T.accent, fontWeight:800, letterSpacing:"0.1em", marginBottom:4 }}>STEP {s.n}</div>
                          <div style={{ fontSize:"0.72rem", fontWeight:700, color:T.text, marginBottom:2 }}>{s.t}</div>
                          <div style={{ fontSize:"0.58rem", color:T.sub, lineHeight:1.3 }}>{s.d}</div>
                        </div>
                        {i < arr.length-1 && <div style={{ color:T.accent, padding:"0 7px", flexShrink:0, opacity:0.6, fontSize:"1rem" }}>→</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* DistilBERT pipeline */}
                <div style={{ ...card, marginBottom:14, overflowX:"auto" }}>
                  <div style={{ ...slabel, marginBottom:12 }} className="slabel-bar">DistilBERT (No Preprocessing)</div>
                  <div style={{ display:"flex", alignItems:"center", gap:0, minWidth:"max-content" }}>
                    {[
                      { n:"01", t:"Raw Text",     d:"No cleaning" },
                      { n:"02", t:"WordPiece",    d:"Subword tok" },
                      { n:"03", t:"[CLS] Token",  d:"Seq marker" },
                      { n:"04", t:"6× Attention", d:"Contextual" },
                      { n:"05", t:"Classifier",   d:"Softmax" },
                      { n:"06", t:"Confidence",   d:"Prob+label" },
                    ].map((s, i, arr) => (
                      <div key={s.n} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                        <div className="pip-step" style={{ animation:`cardIn 0.4s ease ${i*55}ms both` }}>
                          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.52rem", color:T.accent2, fontWeight:800, letterSpacing:"0.1em", marginBottom:4 }}>STEP {s.n}</div>
                          <div style={{ fontSize:"0.72rem", fontWeight:700, color:T.text, marginBottom:2 }}>{s.t}</div>
                          <div style={{ fontSize:"0.58rem", color:T.sub }}>{s.d}</div>
                        </div>
                        {i < arr.length-1 && <div style={{ color:T.accent, padding:"0 7px", flexShrink:0, opacity:0.6, fontSize:"1rem" }}>→</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw vs Processed */}
                <div style={{
                  display:"grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap:12,
                }}>
                  {[
                    { label:"Raw Input",  badge:"ORIGINAL", text:result.input_text,   mono:false },
                    { label:"Processed",  badge:"CLEANED",  text:result.cleaned_text, mono:true  },
                  ].map((p, i) => (
                    <div key={i} style={{ ...card, animation:`cardIn 0.4s ease ${i*100}ms both` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                        <div style={{ ...slabel, margin:0 }} className="slabel-bar">{p.label}</div>
                        <span style={{ background:dark?"rgba(167,139,250,0.1)":"rgba(124,58,237,0.07)",
                          color:T.accent, borderRadius:6, padding:"2px 8px",
                          fontSize:"0.56rem", fontFamily:"'Sora',sans-serif", fontWeight:700,
                          border:`1px solid ${dark?"rgba(167,139,250,0.15)":"rgba(124,58,237,0.12)"}` }}>{p.badge}</span>
                      </div>
                      <p style={{
                        fontSize:p.mono?"0.82rem":"0.91rem",
                        color:p.mono?(dark?"#a5b4fc":"#4338ca"):T.text,
                        lineHeight:1.72, wordBreak:"break-word",
                        fontFamily:p.mono?"'Sora',monospace":"'DM Sans',sans-serif",
                      }}>{p.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab: SHAP ── */}
            {tab === "shap" && (
              <div style={{ animation:"fadeUp 0.4s ease" }}>
                <div style={{ ...slabel, marginBottom:14 }} className="slabel-bar">TOKEN INFLUENCE · DISTILBERT SHAP</div>

                <div style={{ ...card, marginBottom:12 }}>
                  {/* Legend */}
                  <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                    {[
                      { c:T.posText, bg:`rgba(34,197,94,0.1)`,   bd:`rgba(34,197,94,0.25)`,   l:"positive push" },
                      { c:T.negText, bg:`rgba(239,68,68,0.1)`,   bd:`rgba(239,68,68,0.25)`,   l:"negative push" },
                      { c:T.sub,     bg:`rgba(148,163,184,0.07)`, bd:`rgba(148,163,184,0.15)`, l:"neutral" },
                    ].map(l => (
                      <div key={l.l} style={{ display:"flex", alignItems:"center", gap:6,
                        background:l.bg, border:`1px solid ${l.bd}`, borderRadius:8, padding:"4px 10px" }}>
                        <span style={{ fontSize:"0.65rem", color:l.c }}>■</span>
                        <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.62rem", fontWeight:700, color:l.c }}>{l.l}</span>
                      </div>
                    ))}
                  </div>
                  <ShapTokens tokens={result.shap_tokens||[]} dark={dark}/>
                </div>

                <div style={{ ...card, background:dark?"rgba(99,102,241,0.04)":"rgba(124,58,237,0.02)" }}>
                  <div style={{ ...slabel, marginBottom:10 }} className="slabel-bar">WHAT IS SHAP?</div>
                  <p style={{ fontSize:"0.85rem", color:T.sub, lineHeight:1.8 }}>
                    <strong style={{ color:T.text }}>SHAP</strong> (SHapley Additive exPlanations) shows how much each token contributed to the model's decision.{" "}
                    <strong style={{ color:T.posText }}>Green</strong> = pushed toward positive.{" "}
                    <strong style={{ color:T.negText }}>Red</strong> = pushed toward negative.{" "}
                    Brighter = stronger influence.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div style={{ textAlign:"center", padding: isMobile?"50px 0":"70px 0", animation:"fadeUp 0.5s ease 0.3s both" }}>
            <div style={{
              width:72, height:72, borderRadius:22,
              background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(79,70,229,0.08))",
              border:`1.5px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.8rem", margin:"0 auto 18px",
              boxShadow:`0 8px 30px ${T.glow}`,
            }}>⚡</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"1.05rem", fontWeight:700,
              color:T.text, marginBottom:6, letterSpacing:"-0.02em" }}>Ready to Analyze</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.78rem", color:T.sub }}>
              {isMobile ? "Type text above or pick an example" : "Type or paste text above, or pick a quick example →"}
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop:`1px solid ${T.border}`,
        padding: isMobile ? "14px 16px" : "16px 2.5rem",
        background:dark?"rgba(3,4,10,0.6)":"rgba(250,250,254,0.7)",
        backdropFilter:"blur(16px)", position:"relative", zIndex:1,
      }}>
        <div style={{ maxWidth:1240, margin:"0 auto",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:8 }}>
          <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.6rem", color:T.sub, letterSpacing:"0.05em" }}>
            {isMobile ? "SVM · LogReg · RF · DistilBERT" : "SVM · Logistic Regression · Random Forest · DistilBERT SST-2 · TF-IDF + Lemmatization"}
          </span>
          <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"0.6rem", color:T.sub }}>
            <span style={{ color:T.accent, fontWeight:600 }}>{API_BASE}</span>
          </span>
        </div>
      </footer>

      {toast && <Toast msg={toast} dark={dark} onDone={()=>setToast(null)}/>}
    </div>
  );
}