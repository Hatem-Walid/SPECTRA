import React, { useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import {
  extractFields,
  predictInsurance,
  predictIntrusion,
  predictLeafDisease,
  checkHealth,
} from "./api";

/* ============================================================
   Brand fonts — Fraunces (display) + Inter (UI)
   ============================================================ */
function useBrandFonts() {
  useEffect(() => {
    const id = "brand-fonts-link";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,550;9..144,650&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ============================================================
   Icons
   ============================================================ */
const icon = (children, extra = "") => ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${extra} ${className}`}
  >
    {children}
  </svg>
);

const PlusIcon = icon(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>);
const SearchIcon = icon(<><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.3" y2="16.3" /></>);
const ZapIcon = icon(<polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />);
const CodeIcon = icon(<><polyline points="8 7 3 12 8 17" /><polyline points="16 7 21 12 16 17" /></>);
const PanelIcon = icon(<><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><line x1="14.5" y1="4.5" x2="14.5" y2="19.5" /></>);
const RetryIcon = icon(<><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2-9.9L1 10" /></>);
const SendIcon = icon(<><line x1="21" y1="3" x2="11" y2="13" /><polygon points="21 3 14.5 21 11 13 3 9.5 21 3" /></>, "translate-x-[0.5px]");
const UploadIcon = icon(<><path d="M12 16V4" /><polyline points="6 9 12 3 18 9" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>);
const ChevronRightIcon = icon(<polyline points="9 6 15 12 9 18" />);
const XIcon = icon(<><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>);
const DollarIcon = icon(<><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.4-5 3.3 2.2 2.9 5 3.4 5 1.6 5 3.5-2.2 3.3-5 3.3-5-1.6-5-3.5" /></>);
const ShieldIcon = icon(<><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" /><path d="M9.5 12l1.8 1.8L15 10" /></>);
const LeafIcon = icon(<><path d="M4 17c7 1 13-3 15-11-8 0-14 3-15 11z" /><path d="M4 17c0-4 2.5-7 6-8.5" /></>);
const PlugIcon = icon(<><path d="M9 2v4" /><path d="M15 2v4" /><path d="M7 8h10l-1 5a4.5 4.5 0 0 1-8 0L7 8z" /><path d="M12 17v5" /></>);
const CopyIcon = icon(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>);
const CheckIcon = icon(<polyline points="20 6 9 17 4 12" />);
const MessageIcon = icon(<path d="M21 11.5a8.4 8.4 0 0 1-8.8 8.4A9 9 0 0 1 8 19l-4.5 1 1.3-4A8.4 8.4 0 1 1 21 11.5z" />);
const ImageIcon = icon(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.7" /><path d="M21 16.5l-5.5-5-8 8" /></>);

/* ============================================================
   Model config
   ============================================================ */
const TOOLS = [
  { id: "insurance", label: "Insurance Cost", short: "Cost estimate", Icon: DollarIcon, dataset: "Medical Cost Personal — regression" },
  { id: "intrusion", label: "Intrusion Detection", short: "Traffic check", Icon: ShieldIcon, dataset: "NSL-KDD — classification" },
  { id: "leaf", label: "Leaf Disease", short: "Leaf scan", Icon: LeafIcon, dataset: "Lettuce Diseases — image" },
];

const OPENERS = {
  insurance: "Tell me about the case (age, sex, BMI, smoker, region, kids) — I'll ask for anything missing.",
  intrusion: "Describe the connection you want classified — I'll ask for anything missing.",
  leaf: "Upload a photo of the leaf and I'll check it for disease.",
};

const EXAMPLES = {
  insurance: [
    { label: "Typical case example", text: "35 year old female, non-smoker, bmi 24, 1 child, region northwest" },
  ],
  intrusion: [
    { label: "Normal traffic sample", text: JSON.stringify({ duration: 0, protocol_type: "tcp", service: "http", flag: "SF", src_bytes: 181, dst_bytes: 5450, count: 8, srv_count: 8, same_srv_rate: 1.0, dst_host_srv_count: 9 }) },
    { label: "Attack traffic sample (DoS)", text: JSON.stringify({ duration: 0, protocol_type: "tcp", service: "private", flag: "S0", src_bytes: 0, dst_bytes: 0, count: 511, srv_count: 511, same_srv_rate: 1.0, dst_host_srv_count: 511 }) },
  ],
  leaf: [],
};

let uidCounter = 0;
const uid = () => `m${Date.now()}_${uidCounter++}`;

const openingMessage = (tool) => ({
  id: uid(),
  role: "assistant",
  kind: "text",
  content: OPENERS[tool],
});

/* ============================================================
   Brand orb
   ============================================================ */
function Orb({ size = 56, active = true }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #9db4ff 0%, #5f74e8 38%, #2c3570 72%, #10122a 100%)",
          boxShadow: active
            ? "0 0 22px 4px rgba(108,140,255,0.45), 0 0 60px 10px rgba(108,140,255,0.15)"
            : "0 0 10px 2px rgba(108,140,255,0.25)",
          animation: active ? "orb-breathe 2.6s ease-in-out infinite" : "none",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 90deg, transparent 0%, rgba(212,175,106,0.55) 18%, transparent 40%)",
          animation: active ? "orb-spin 3.4s linear infinite" : "none",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

/* ============================================================
   App
   ============================================================ */
export default function App() {
  useBrandFonts();

  const [booting, setBooting] = useState(true);
  const [activeTool, setActiveTool] = useState("insurance");
  const [threads, setThreads] = useState(() => ({
    insurance: [openingMessage("insurance")],
    intrusion: [openingMessage("intrusion")],
    leaf: [openingMessage("leaf")],
  }));

  // الذاكرة التراكمية لتخزين البيانات بين الرسائل وعدم تصفيرها
  const [sessionMemory, setSessionMemory] = useState({
    insurance: {},
    intrusion: {},
  });

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const [showExamples, setShowExamples] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [health, setHealth] = useState("idle");
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const scrollRef = useRef(null);

  const thread = threads[activeTool];
  const hasStarted = thread.some((m) => m.role === "user");

  /* ---------- boot splash: quiet backend warm-up ---------- */
  useEffect(() => {
    const start = Date.now();
    checkHealth()
      .then(() => setHealth("ok"))
      .catch(() => setHealth("error"))
      .finally(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 1100 - elapsed);
        setTimeout(() => {
          setBooting(false);
          setTimeout(() => setHealth("idle"), 1600);
        }, remaining);
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread, activeTool]);

  const pushMessage = (tool, msg) => {
    setThreads((prev) => ({ ...prev, [tool]: [...prev[tool], { id: uid(), ...msg }] }));
  };

  const setThread = (tool, updater) => {
    setThreads((prev) => ({ ...prev, [tool]: updater(prev[tool]) }));
  };

  const logHistory = (tool, label) => {
    setHistory((prev) => [{ id: uid(), tool, label, timestamp: Date.now() }, ...prev]);
  };

  /* ---------- chat-driven extraction (مع حفظ الذاكرة) ---------- */
  const runExtraction = async (tool, conversationForApi) => {
    setLoading(true);
    try {
      const currentMemory = sessionMemory[tool] || {};
      const res = await extractFields(tool, conversationForApi, currentMemory);

      pushMessage(tool, { role: "assistant", kind: "text", content: res.reply });

      if (res.data) {
        setSessionMemory((prev) => ({ ...prev, [tool]: res.data }));
      }

      if (res.ready) {
        await runPredict(tool, res.data);
        setSessionMemory((prev) => ({ ...prev, [tool]: {} }));
      }
    } catch (err) {
      pushMessage(tool, { role: "assistant", kind: "error", content: "Couldn't reach the assistant. Please try again." });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runPredict = async (tool, data) => {
    setLoading(true);
    try {
      if (tool === "insurance") {
        const payload = { ...data, age: Number(data.age), bmi: Number(data.bmi), children: Number(data.children) };
        const res = await predictInsurance(payload);
        pushMessage(tool, { role: "assistant", kind: "result", tool, content: res });
        logHistory(tool, `Insurance — $${Math.round(res.predicted_charges).toLocaleString()}`);
      } else if (tool === "intrusion") {
        const res = await predictIntrusion(data);
        pushMessage(tool, { role: "assistant", kind: "result", tool, content: res });
        logHistory(tool, `Intrusion — ${res.prediction} (${Math.round((res.confidence > 1 ? res.confidence : res.confidence * 100))}%)`);
      }
    } catch (err) {
      pushMessage(tool, { role: "assistant", kind: "error", content: `Prediction failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (rawText) => {
    const text = (rawText ?? inputMessage).trim();
    if (!text || loading || activeTool === "leaf") return;

    setInputMessage("");
    setShowExamples(false);

    if (manualMode) {
      pushMessage(activeTool, { role: "user", kind: "text", content: text });
      try {
        const data = JSON.parse(text);
        await runPredict(activeTool, data);
      } catch (err) {
        pushMessage(activeTool, { role: "assistant", kind: "error", content: `Couldn't parse that as JSON: ${err.message}` });
      }
      return;
    }

    const nextConversation = [...thread, { role: "user", content: text }]
      .filter((m) => m.kind !== "error" && m.kind !== "result")
      .map((m) => ({ role: m.role, content: m.content ?? "" }));

    pushMessage(activeTool, { role: "user", kind: "text", content: text });
    await runExtraction(activeTool, nextConversation);
  };

  const handleRetry = () => {
    const idx = [...thread].reverse().findIndex((m) => m.role === "user");
    if (idx === -1 || loading) return;
    const cutoff = thread.length - idx;
    const upToLastUser = thread.slice(0, cutoff);
    setThread(activeTool, () => upToLastUser);
    const conversationForApi = upToLastUser
      .filter((m) => m.kind !== "error" && m.kind !== "result")
      .map((m) => ({ role: m.role, content: m.content ?? "" }));
    runExtraction(activeTool, conversationForApi);
  };

  const handleNewChat = () => {
    setThread(activeTool, () => [openingMessage(activeTool)]);
    setSessionMemory((prev) => ({ ...prev, [activeTool]: {} }));
  };

  const handleExampleClick = (text) => handleSend(text);

  /* ---------- leaf image upload ---------- */
  const handleFileSelected = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const imageUrl = URL.createObjectURL(file);
    pushMessage("leaf", { role: "user", kind: "image", imageUrl });
    setLoading(true);
    try {
      const res = await predictLeafDisease(file);
      pushMessage("leaf", { role: "assistant", kind: "result", tool: "leaf", content: res });
      logHistory("leaf", `Leaf — ${res.prediction}`);
    } catch (err) {
      pushMessage("leaf", { role: "assistant", kind: "error", content: `Prediction failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- csv upload (insurance / intrusion fields) ---------- */
  const handleCsvSelected = (file) => {
    if (!file || activeTool === "leaf") return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "").trim();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        pushMessage(activeTool, { role: "assistant", kind: "error", content: "That CSV doesn't have a header row plus at least one data row." });
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim());
      const firstRow = lines[1].split(",").map((v) => v.trim());
      const pairs = headers.map((h, i) => `${h}: ${firstRow[i] ?? ""}`).join(", ");
      const summary = `Uploaded ${file.name} — using row 1 of ${lines.length - 1}: ${pairs}`;
      handleSend(summary);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (activeTool === "leaf") {
      handleFileSelected(file);
    } else if (file.name.toLowerCase().endsWith(".csv")) {
      handleCsvSelected(file);
    }
  };

  /* ---------- share / export ---------- */
  const handleExport = () => {
    const lastResult = [...thread].reverse().find((m) => m.kind === "result");
    if (!lastResult) return;
    const blob = new Blob([JSON.stringify(lastResult.content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTool}-result.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (id, data) => {
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  /* ---------- benchmark / health check ---------- */
  const handleHealthCheck = async () => {
    setHealth("checking");
    try {
      await checkHealth();
      setHealth("ok");
    } catch {
      setHealth("error");
    } finally {
      setTimeout(() => setHealth("idle"), 3000);
    }
  };

  const canExport = thread.some((m) => m.kind === "result");
  const activeToolInfo = TOOLS.find((t) => t.id === activeTool);

  const filteredHistory = history.filter((h) => h.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();
  const todayHistory = filteredHistory.filter((h) => isToday(h.timestamp));
  const earlierHistory = filteredHistory.filter((h) => !isToday(h.timestamp));

  const fontVars = { "--font-display": "'Fraunces', serif", "--font-ui": "'Inter', system-ui, sans-serif" };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center p-0 md:p-8 overflow-hidden"
      style={{
        ...fontVars,
        fontFamily: "var(--font-ui)",
        background: "radial-gradient(120% 120% at 15% 0%, #1a1f33 0%, #0c0e17 45%, #07080d 100%)",
      }}
    >
      <style>{`
        @keyframes orb-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes orb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-up { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        @keyframes dot-bounce { 0%,80%,100% { transform: translateY(0); opacity:.4 } 40% { transform: translateY(-3px); opacity:1 } }
        .brand-scroll::-webkit-scrollbar { width: 6px; }
        .brand-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .brand-scroll::-webkit-scrollbar-track { background: transparent; }
        .fade-up { animation: fade-up .35s ease both; }
      `}</style>

      {booting ? (
        <div className="flex flex-col items-center gap-5">
          <Orb size={72} />
          <div className="text-[13px] tracking-wide" style={{ color: "#8b92a5", fontFamily: "var(--font-ui)" }}>
            Warming up the models…
          </div>
        </div>
      ) : (
        <div className="w-full h-full md:h-[760px] md:max-w-[1180px] bg-[#0e111a]/90 backdrop-blur-xl md:rounded-[1.75rem] shadow-[0_30px_80px_rgba(0,0,0,0.55)] border border-white/[0.06] flex overflow-hidden relative">
          {/* ================= 1. Icon rail ================= */}
          <div className="w-14 md:w-16 flex flex-col items-center py-5 md:py-7 justify-between border-r border-white/[0.06] bg-[#0b0d15] shrink-0">
            <div className="flex flex-col items-center gap-4 md:gap-5">
              <button
                title="New chat"
                onClick={handleNewChat}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#0b0d15] shadow-[0_4px_16px_rgba(108,140,255,0.35)] hover:brightness-110 transition active:scale-95"
                style={{ background: "linear-gradient(135deg, #b9c6ff, #6c8cff)" }}
              >
                <PlusIcon size={17} />
              </button>

              <div className="flex flex-col gap-3 mt-1 text-[#5b6274]">
                <button
                  title="Search history"
                  onClick={() => setSearchOpen((v) => !v)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${searchOpen ? "border-[#6c8cff] text-[#b9c6ff]" : "border-white/[0.07] hover:text-white/80 hover:border-white/20"}`}
                >
                  <SearchIcon size={15} />
                </button>

                <div className="relative">
                  <button
                    title={EXAMPLES[activeTool].length ? "Quick commands" : "No quick commands for this model"}
                    disabled={!EXAMPLES[activeTool].length}
                    onClick={() => setShowExamples((v) => !v)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                      !EXAMPLES[activeTool].length
                        ? "opacity-30 cursor-not-allowed border-white/[0.07]"
                        : showExamples
                        ? "border-[#6c8cff] text-[#b9c6ff]"
                        : "border-white/[0.07] hover:text-white/80 hover:border-white/20"
                    }`}
                  >
                    <ZapIcon size={15} />
                  </button>
                  {showExamples && EXAMPLES[activeTool].length > 0 && (
                    <div className="absolute left-11 top-0 z-20 w-60 bg-[#161a26] border border-white/[0.08] rounded-xl shadow-2xl p-1.5 fade-up">
                      {EXAMPLES[activeTool].map((ex) => (
                        <button
                          key={ex.label}
                          onClick={() => handleExampleClick(ex.text)}
                          className="w-full text-left text-[11px] text-[#c7cbdb] hover:bg-white/[0.06] rounded-lg px-2.5 py-2 transition"
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  title={activeTool === "leaf" ? "Not available for the image model" : manualMode ? "Switch back to chat" : "Switch to manual JSON entry"}
                  disabled={activeTool === "leaf"}
                  onClick={() => setManualMode((v) => !v)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                    activeTool === "leaf"
                      ? "opacity-30 cursor-not-allowed border-white/[0.07]"
                      : manualMode
                      ? "border-[#6c8cff] text-[#b9c6ff]"
                      : "border-white/[0.07] hover:text-white/80 hover:border-white/20"
                  }`}
                >
                  <CodeIcon size={15} />
                </button>

                <button
                  title={panelOpen ? "Hide side panel" : "Show side panel"}
                  onClick={() => setPanelOpen((v) => !v)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${panelOpen ? "border-[#6c8cff] text-[#b9c6ff]" : "border-white/[0.07] hover:text-white/80 hover:border-white/20"}`}
                >
                  <PanelIcon size={15} />
                </button>
              </div>
            </div>

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold tracking-tight shrink-0"
              style={{ background: "linear-gradient(135deg,#2c3050,#171a29)", color: "#d4af6a", border: "1px solid rgba(212,175,106,0.35)" }}
            >
              ML
            </div>
          </div>

          {/* ================= 2. Conversation panel ================= */}
          <div
            className="flex-1 flex flex-col justify-between px-4 md:px-8 py-5 md:py-6 relative min-w-0"
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {dragActive && (
              <div className="absolute inset-2 z-30 rounded-2xl border-2 border-dashed border-[#6c8cff] bg-[#0b0d15]/90 backdrop-blur flex flex-col items-center justify-center gap-2 text-[#b9c6ff] text-[12px]">
                <UploadIcon size={22} />
                <span>{activeTool === "leaf" ? "Drop the leaf photo" : "Drop a CSV file"}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 shrink-0">
              <activeToolInfo.Icon size={13} className="text-[#6c8cff]" />
              <h2 className="text-[13px] font-medium text-[#c7cbdb] tracking-wide">{activeToolInfo.label}</h2>
            </div>

            {!hasStarted ? (
              /* ---------- welcome hero ---------- */
              <div className="flex-1 flex flex-col items-center justify-center gap-5 fade-up">
                <Orb size={64} />
                <div className="text-center">
                  <div className="text-[13px] text-[#5b6274] mb-1">Hello</div>
                  <h1
                    className="text-[26px] md:text-[30px] leading-snug text-[#eef0f7]"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 550 }}
                  >
                    What would you like to check?
                  </h1>
                </div>
                {EXAMPLES[activeTool].length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 max-w-md">
                    {EXAMPLES[activeTool].map((ex) => (
                      <button
                        key={ex.label}
                        onClick={() => handleExampleClick(ex.text)}
                        className="text-[11px] text-[#b9c6ff] border border-[#6c8cff]/30 bg-[#6c8cff]/[0.06] hover:bg-[#6c8cff]/[0.12] rounded-full px-3.5 py-1.5 transition"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto brand-scroll space-y-4 pt-4 pb-2 pr-1">
                {thread.map((m) => (
                  <MessageBubble key={m.id} message={m} onCopy={handleCopy} copied={copiedId === m.id} />
                ))}

                {loading && (
                  <div className="flex items-center gap-2.5 pl-1 fade-up">
                    <Orb size={22} />
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-[#8b92a5]"
                          style={{ animation: `dot-bounce 1.1s ${i * 0.15}s infinite ease-in-out` }}
                        />
                      ))}
                    </span>
                  </div>
                )}

                {!loading && thread.length > 1 && thread[thread.length - 1].role === "assistant" && (
                  <button onClick={handleRetry} className="flex items-center gap-1.5 text-[#5b6274] hover:text-[#c7cbdb] text-[11px] transition ml-7">
                    <RetryIcon size={12} /> Retry
                  </button>
                )}
              </div>
            )}

            {/* ---------- composer ---------- */}
            {activeTool === "leaf" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/[0.03] border border-dashed border-white/[0.14] rounded-2xl p-4 text-center text-[11px] text-[#8b92a5] cursor-pointer hover:border-[#6c8cff]/50 hover:text-[#c7cbdb] transition flex items-center justify-center gap-2 shrink-0"
              >
                <ImageIcon size={15} />
                Drop a leaf photo here or click to browse
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelected(e.target.files?.[0])} />
              </div>
            ) : (
              <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-1.5 px-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex items-center gap-1.5 shrink-0">
                <button
                  title="Upload CSV"
                  onClick={() => csvInputRef.current?.click()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5b6274] hover:text-[#b9c6ff] hover:bg-white/[0.05] transition shrink-0"
                >
                  <UploadIcon size={15} />
                  <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleCsvSelected(e.target.files?.[0])} />
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={manualMode ? 'Paste JSON, e.g. {"age":30,...}' : "Type your message…"}
                  disabled={loading}
                  className="w-full bg-transparent border-none outline-none text-[12px] text-[#e4e6ef] placeholder-[#5b6274] py-1"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !inputMessage.trim()}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-[#0b0d15] transition active:scale-95 disabled:opacity-30 shrink-0"
                  style={{ background: "linear-gradient(135deg, #b9c6ff, #6c8cff)" }}
                >
                  <SendIcon size={13} />
                </button>
              </div>
            )}
          </div>

          {/* ================= 3. Right panel ================= */}
          {panelOpen && (
            <div
              className="fixed md:static inset-0 z-40 md:z-auto flex justify-end md:block bg-black/50 md:bg-transparent"
              onClick={(e) => { if (e.target === e.currentTarget) setPanelOpen(false); }}
            >
              <div className="w-72 max-w-[85vw] md:w-64 md:max-w-none h-full md:h-auto bg-[#0d1019] md:bg-[#0d1019]/70 border-l border-white/[0.06] flex flex-col justify-between p-4 overflow-y-auto brand-scroll fade-up">
                <div className="space-y-4">
                  <div className="flex items-center justify-between md:hidden">
                    <span className="text-[11px] text-[#8b92a5] font-medium">Panel</span>
                    <button onClick={() => setPanelOpen(false)} className="text-[#5b6274] hover:text-white">
                      <XIcon size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#5b6274] bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <PlugIcon size={13} />
                      <span>Backend</span>
                    </div>
                    <button onClick={handleHealthCheck} className="flex items-center gap-1.5 hover:text-[#c7cbdb] transition">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: health === "ok" ? "#4ade80" : health === "error" ? "#f87171" : health === "checking" ? "#d4af6a" : "#5b6274",
                          boxShadow: health === "ok" ? "0 0 6px #4ade80" : health === "error" ? "0 0 6px #f87171" : "none",
                        }}
                      />
                      {health === "checking" ? "Checking…" : health === "ok" ? "Connected" : health === "error" ? "Unreachable" : "Test"}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {TOOLS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTool(t.id)}
                        className={`w-full flex items-center gap-2.5 p-2 px-2.5 rounded-xl text-[11px] font-medium border transition text-left ${
                          t.id === activeTool
                            ? "bg-[#6c8cff]/[0.12] border-[#6c8cff]/40 text-[#eef0f7]"
                            : "bg-white/[0.02] border-white/[0.05] text-[#a6acc0] hover:bg-white/[0.05] hover:border-white/[0.1]"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${t.id === activeTool ? "text-[#b9c6ff]" : "text-[#5b6274]"}`}>
                          <t.Icon size={13} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{t.label}</span>
                          <span className="block truncate text-[9px] text-[#5b6274]">{t.dataset}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={!canExport}
                    className="w-full text-[#0b0d15] py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #b9c6ff, #6c8cff)" }}
                  >
                    <UploadIcon size={12} className="rotate-180" />
                    Export result
                  </button>

                  {searchOpen && (
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search history…"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[10px] text-[#e4e6ef] placeholder-[#5b6274] outline-none focus:border-[#6c8cff]/50"
                    />
                  )}

                  <div className="space-y-3 pt-1 text-[10px]">
                    {todayHistory.length > 0 && (
                      <div>
                        <span className="text-[9px] font-medium text-[#5b6274] block mb-1.5 uppercase tracking-wide">Today</span>
                        <div className="text-[#a6acc0] space-y-1.5">
                          {todayHistory.map((h) => (
                            <button key={h.id} onClick={() => setActiveTool(h.tool)} className="w-full flex items-center gap-1.5 truncate hover:text-white text-left transition">
                              <MessageIcon size={11} className="text-[#5b6274] shrink-0" />
                              <span className="truncate">{h.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {earlierHistory.length > 0 && (
                      <div>
                        <span className="text-[9px] font-medium text-[#5b6274] block mb-1.5 uppercase tracking-wide">Earlier</span>
                        <div className="text-[#a6acc0] space-y-1.5">
                          {earlierHistory.map((h) => (
                            <button key={h.id} onClick={() => setActiveTool(h.tool)} className="w-full flex items-center gap-1.5 truncate hover:text-white text-left transition">
                              <MessageIcon size={11} className="text-[#5b6274] shrink-0" />
                              <span className="truncate">{h.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {filteredHistory.length === 0 && <p className="text-[#5b6274] text-[10px]">No predictions yet this session.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <Analytics />
    </div>
  );
}

/* ============================================================
   Message bubble — renders text / image / result / error kinds
   ============================================================ */
function BotAvatar() {
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
      style={{ background: "linear-gradient(135deg,#2c3050,#171a29)", border: "1px solid rgba(108,140,255,0.35)" }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#6c8cff", boxShadow: "0 0 4px #6c8cff" }} />
    </div>
  );
}

function MessageBubble({ message, onCopy, copied }) {
  const isUser = message.role === "user";

  if (message.kind === "image") {
    return (
      <div className="flex flex-col items-end fade-up">
        <img src={message.imageUrl} alt="Uploaded leaf" className="w-40 h-40 object-cover rounded-2xl border border-white/10 shadow-lg" />
      </div>
    );
  }

  if (message.kind === "error") {
    return (
      <div className="flex items-start gap-2 max-w-[340px] fade-up">
        <BotAvatar />
        <div className="bg-[#2a1418] border border-red-500/25 text-red-300 text-[11px] px-4 py-2.5 rounded-2xl rounded-tl-sm">{message.content}</div>
      </div>
    );
  }

  if (message.kind === "result") {
    return (
      <div className="flex items-start gap-2 max-w-[340px] fade-up">
        <BotAvatar />
        <ResultCard tool={message.tool} data={message.content} onCopy={() => onCopy(message.id, message.content)} copied={copied} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col fade-up ${isUser ? "items-end" : "items-start"}`}>
      <div className={isUser ? "flex flex-col items-end" : "flex items-start gap-2 max-w-[340px]"}>
        {!isUser && <BotAvatar />}
        <div
          className={
            isUser
              ? "text-[#0b0d15] text-[11px] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[280px] font-medium"
              : "bg-white/[0.04] border border-white/[0.06] text-[#d4d7e3] text-[11px] px-4 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed"
          }
          style={isUser ? { background: "linear-gradient(135deg,#b9c6ff,#6c8cff)" } : undefined}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ tool, data, onCopy, copied }) {
  const shell = "bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 relative group";
  const copyBtn = (
    <button onClick={onCopy} title="Copy result" className="absolute top-2.5 right-2.5 text-[#5b6274] hover:text-[#c7cbdb] opacity-0 group-hover:opacity-100 transition">
      {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
    </button>
  );

  if (tool === "insurance") {
    const charges = data.predicted_charges || data.charges || data || 0;
    return (
      <div className={shell}>
        {copyBtn}
        <div className="text-[9px] text-[#5b6274]">Estimated annual charges</div>
        <div className="text-lg font-semibold text-[#eef0f7]" style={{ fontFamily: "var(--font-display)" }}>
          ${Math.round(Number(charges)).toLocaleString()}
        </div>
      </div>
    );
  }

  if (tool === "intrusion") {
    // فحص مرن لكلمة normal حتى لو جاءت بحرف كابيتال أو رقم 0
    const predStr = String(data.prediction || "").toLowerCase().trim();
    const isNormal = predStr === "normal" || predStr === "0" || predStr.includes("safe");
    const displayLabel = isNormal ? "Normal Traffic (Safe)" : `Attack Detected (${data.prediction})`;

    return (
      <div className={`${shell} w-56`}>
        {copyBtn}
        <div className={`text-[12px] font-semibold mb-1.5 ${isNormal ? "text-emerald-400" : "text-red-400"}`}>
          {displayLabel}
        </div>
        <MiniBar label="Confidence" value={data.confidence} tone={isNormal ? "success" : "danger"} />
      </div>
    );
  }

  return (
    <div className={`${shell} w-56`}>
      {copyBtn}
      <div className="text-[12px] font-semibold text-[#e4e6ef] mb-2">{data.prediction}</div>
      {data.top_3?.map((item) => (
        <MiniBar key={item.label} label={item.label} value={item.confidence} />
      ))}
    </div>
  );
}

function MiniBar({ label, value, tone = "accent" }) {
  // حماية رياضية ذكية تحسب النسبة بدقة سواء جاء الرقم ككسر (0.75) أو كنسبة جاهزة (75)
  const num = typeof value === "number" && !isNaN(value) ? value : Number(value) || 0;
  const pct = Math.min(100, Math.max(0, Math.round(num > 1 ? num : num * 100)));

  const color = tone === "success" ? "#4ade80" : tone === "danger" ? "#f87171" : "#6c8cff";

  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[9px] text-[#8b92a5] mb-0.5">
        <span>{label}</span>
        <span className="font-mono text-[10px]">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
