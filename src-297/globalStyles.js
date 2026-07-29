// ── Global font + CSS injection — imported once for its side effects ────────
// (import "./globalStyles" at the top of App.jsx; no exports needed)

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

const globalCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; }
  body { background: #07080f; color: #e8e4d8; font-family: 'DM Sans', sans-serif; }
  @media (max-width: 768px) {
    html { font-size: 14px; }
    .desktop-only { display: none !important; }
  }
  @media (min-width: 769px) {
    .mobile-only { display: none !important; }
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 3px; }
  input, textarea, button, select { font-family: inherit; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes rsvpIn { 0% { opacity:0; transform:scale(0.88) translateY(6px); } 40% { opacity:1; transform:scale(1) translateY(0); } 85% { opacity:1; } 100% { opacity:0; } }
  .fadeUp { animation: fadeUp 0.4s ease both; }
`;
const styleEl = document.createElement("style");
styleEl.textContent = globalCSS;
document.head.appendChild(styleEl);
