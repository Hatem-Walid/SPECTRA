import React, { useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import {
  extractFields,
  predictInsurance,
  predictIntrusion,
  predictLeafDisease,
  checkHealth,
} from "../api";

/* ============================================================
   Icons
   ============================================================ */
const icon = (children) => ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const PlusIcon = icon(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>);
const SearchIcon = icon(<><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.3" y2="16.3" /></>);
const ZapIcon = icon(<polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />);
const CodeIcon = icon(<><polyline points="8 7 3 12 8 17" /><polyline points="16 7 21 12 16 17" /></>);
const PanelIcon = icon(<><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><line x1="9.5" y1="4.5" x2="9.5" y2="19.5" /></>);
const RetryIcon = icon(<><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2-9.9L1 10" /></>);
const SendIcon = icon(<><line x1="21" y1="3" x2="11" y2="13" /><polygon points="21 3 14.5 21 11 13 3 9.5 21 3" /></>);
const UploadIcon = icon(<><path d="M12 16V4" /><polyline points="6 9 12 3 18 9" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>);
const DownloadIcon = icon(<><path d="M12 4v12" /><polyline points="6 11 12 17 18 11" /><path d="M4 19v0a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" /></>);
const XIcon = icon(<><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>);
const ArrowLeftIcon = icon(<><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>);
const DollarIcon = icon(<><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.4-5 3.3 2.2 2.9 5 3.4 5 1.6 5 3.5-2.2 3.3-5 3.3-5-1.6-5-3.5" /></>);
const ShieldIcon = icon(<><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" /><path d="M9.5 12l1.8 1.8L15 10" /></>);
const LeafIcon = icon(<><path d="M4 17c7 1 13-3 15-11-8 0-14 3-15 11z" /><path d="M4 17c0-4 2.5-7 6-8.5" /></>);
const PlugIcon = icon(<><path d="M9 2v4" /><path d="M15 2v4" /><path d="M7 8h10l-1 5a4.5 4.5 0 0 1-8 0L7 8z" /><path d="M12 17v5" /></>);
const CopyIcon = icon(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>);
const CheckIcon = icon(<polyline points="20 6 9 17 4 12" />);
const MessageIcon = icon(<path d="M21 11.5a8.4 8.4 0 0 1-8.8 8.4A9 9 0 0 1 8 19l-4.5 1 1.3-4A8.4 8.4 0 1 1 21 11.5z" />);
const ImageIcon = icon(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.7" /><path d="M21 16.5l-5.5-5-8 8" /></>);
const FileTypeIcon = icon(<><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>);

/* ============================================================
   Model config
   ============================================================ */
const TOOLS = [
  { id: "insurance", label: "Insurance Cost", short: "Cost estimate", Icon: DollarIcon, dataset: "Medical Cost Personal, regression" },
  { id: "intrusion", label: "Intrusion Detection", short: "Traffic check", Icon: ShieldIcon, dataset: "NSL-KDD, classification" },
  { id: "leaf", label: "Leaf Disease", short: "Leaf scan", Icon: LeafIcon, dataset: "Lettuce Diseases, image" },
];

const OPENERS = {
  insurance: "Tell me about the case (age, sex, BMI, smoker, region, kids) and I'll ask for anything missing.",
  intrusion: "Describe the connection you want classified and I'll ask for anything missing.",
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

const LEAF_LABELS = {
  Bacterial: "Bacterial Leaf Spot",
  Downy_mildew_on_lettuce: "Downy Mildew",
  Healthy: "Healthy",
  Powdery_mildew_on_lettuce: "Powdery Mildew",
  Septoria_blight_on_lettuce: "Septoria Leaf Spot",
  Shepherd_purse_weeds: "Shepherd's Purse (Weed)",
  Viral: "Viral Infection",
  Wilt_and_leaf_blight_on_lettuce: "Wilt & Leaf Blight",
};

function formatLeafLabel(rawLabel) {
  if (!rawLabel) return "Unknown";
  if (LEAF_LABELS[rawLabel]) return LEAF_LABELS[rawLabel];
  return rawLabel.replace(/_on_lettuce$/i, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

let uidCounter = 0;
const uid = () => `m${Date.now()}_${uidCounter++}`;

const openingMessage = (tool) => ({
  id: uid(),
  role: "assistant",
  kind: "text",
  content: OPENERS[tool],
});

const HEALTH_UI = {
  idle: { label: "Test", dot: "" },
  checking: { label: "Checking…", dot: "dot--wait" },
  ok: { label: "Connected", dot: "dot--ok" },
  error: { label: "Unreachable", dot: "dot--bad" },
};

export default function Dashboard({ onBackToHome }) {
  const [activeTool, setActiveTool] = useState("insurance");
  const [dir, setDir] = useState("next"); // slide direction when switching tools
  const [threads, setThreads] = useState(() => ({
    insurance: [openingMessage("insurance")],
    intrusion: [openingMessage("intrusion")],
    leaf: [openingMessage("leaf")],
  }));

  const [sessionMemory, setSessionMemory] = useState({ insurance: {}, intrusion: {} });
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
  const [health, setHealth] = useState("checking");
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const scrollRef = useRef(null);

  const thread = threads[activeTool];
  const hasStarted = thread.some((m) => m.role === "user");
  const activeIndex = TOOLS.findIndex((t) => t.id === activeTool);
  const activeToolInfo = TOOLS[activeIndex];

  useEffect(() => {
    checkHealth()
      .then(() => setHealth("ok"))
      .catch(() => setHealth("error"));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread, activeTool]);

  const closeOnMobile = () => {
    if (window.innerWidth < 768) setPanelOpen(false);
  };

  const selectTool = (id) => {
    if (id === activeTool) return;
    const to = TOOLS.findIndex((t) => t.id === id);
    setDir(to > activeIndex ? "next" : "prev");
    setActiveTool(id);
    closeOnMobile();
  };

  const pushMessage = (tool, msg) => {
    setThreads((prev) => ({ ...prev, [tool]: [...prev[tool], { id: uid(), ...msg }] }));
  };

  const setThread = (tool, updater) => {
    setThreads((prev) => ({ ...prev, [tool]: updater(prev[tool]) }));
  };

  const logHistory = (tool, label) => {
    setHistory((prev) => [{ id: uid(), tool, label, timestamp: Date.now() }, ...prev]);
  };

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
        logHistory(tool, `Insurance: $${Math.round(res.predicted_charges).toLocaleString()}`);
      } else if (tool === "intrusion") {
        const res = await predictIntrusion(data);
        pushMessage(tool, { role: "assistant", kind: "result", tool, content: res });
        logHistory(tool, `Intrusion: ${res.prediction} (${Math.round(res.confidence > 1 ? res.confidence : res.confidence * 100)}%)`);
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
    closeOnMobile();
  };

  const handleFileSelected = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const imageUrl = URL.createObjectURL(file);
    pushMessage("leaf", { role: "user", kind: "image", imageUrl });
    setLoading(true);
    try {
      const res = await predictLeafDisease(file);
      pushMessage("leaf", { role: "assistant", kind: "result", tool: "leaf", content: res });
      logHistory("leaf", `Leaf: ${formatLeafLabel(res.prediction)}`);
    } catch (err) {
      pushMessage("leaf", { role: "assistant", kind: "error", content: `Prediction failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

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
      const summary = `Uploaded ${file.name}, using row 1 of ${lines.length - 1}: ${pairs}`;

      pushMessage(activeTool, { role: "user", kind: "file", fileName: file.name });

      const nextConversation = [...thread, { role: "user", content: summary }]
        .filter((m) => m.kind !== "error" && m.kind !== "result")
        .map((m) => ({ role: m.role, content: m.content ?? "" }));

      runExtraction(activeTool, nextConversation);
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

  const handleHealthCheck = async () => {
    setHealth("checking");
    try {
      await checkHealth();
      setHealth("ok");
    } catch {
      setHealth("error");
    }
  };

  const canExport = thread.some((m) => m.kind === "result");

  const filteredHistory = history.filter((h) => h.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();
  const todayHistory = filteredHistory.filter((h) => isToday(h.timestamp));
  const earlierHistory = filteredHistory.filter((h) => !isToday(h.timestamp));

  const historyGroup = (title, items) =>
    items.length > 0 && (
      <div className="side-group">
        <small>{title}</small>
        {items.map((h) => (
          <button key={h.id} className="side-item" onClick={() => selectTool(h.tool)}>
            <MessageIcon size={14} className="shrink-0" />
            <span>{h.label}</span>
          </button>
        ))}
      </div>
    );

  return (
    <div className="dash">
      <div className="dash__bg" aria-hidden="true">
        <div className="dash__blob dash__blob--gold" />
        <div className="dash__blob dash__blob--clay" />
        <div className="dash__blob dash__blob--cream" />
      </div>

      <div className="dash__shell">
        {panelOpen && <div className="dash__scrim" onClick={() => setPanelOpen(false)} />}

        {/* ---------- Sidebar ---------- */}
        <aside className={`dash__side ${panelOpen ? "" : "dash__side--closed"}`}>
          <div className="dash__side-inner">
            <div className="flex items-center justify-between">
              <div className="brand">
                <span className="brand__mark" />
                <span className="brand__name">Spectra</span>
              </div>
              <button className="iconbtn only-mobile" onClick={() => setPanelOpen(false)} title="Close">
                <XIcon size={16} />
              </button>
            </div>

            <button className="btn-gold" onClick={handleNewChat}>
              <PlusIcon size={16} /> New chat
            </button>

            {EXAMPLES[activeTool].length > 0 && (
              <div>
                <div className="side-label">
                  <span>Try an example</span>
                  <ZapIcon size={13} />
                </div>
                {EXAMPLES[activeTool].map((ex) => (
                  <button
                    key={ex.label}
                    className="side-item"
                    onClick={() => {
                      handleSend(ex.text);
                      closeOnMobile();
                    }}
                  >
                    <span>{ex.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-0">
              <div className="side-label">
                <span>History</span>
                <button
                  className={`iconbtn ${searchOpen ? "is-on" : ""}`}
                  style={{ width: 28, height: 28 }}
                  title="Search history"
                  onClick={() => setSearchOpen((v) => !v)}
                >
                  <SearchIcon size={13} />
                </button>
              </div>

              {searchOpen && (
                <input
                  autoFocus
                  className="side-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history…"
                />
              )}

              {historyGroup("Today", todayHistory)}
              {historyGroup("Earlier", earlierHistory)}
              {filteredHistory.length === 0 && <p className="side-empty">No predictions yet this session.</p>}
            </div>

            <div className="flex flex-col gap-2">
              <button className="status" onClick={handleHealthCheck} title="Test the backend connection">
                <span className="flex items-center gap-2">
                  <PlugIcon size={14} /> Backend
                </span>
                <span className="flex items-center gap-2">
                  <span className={`dot ${HEALTH_UI[health].dot}`} />
                  {HEALTH_UI[health].label}
                </span>
              </button>

              {onBackToHome && (
                <button className="btn-glass" onClick={onBackToHome}>
                  <ArrowLeftIcon size={15} /> Back to home
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ---------- Main ---------- */}
        <main
          className="dash__main"
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {dragActive && (
            <div className="dropveil">
              <UploadIcon size={24} />
              <span>{activeTool === "leaf" ? "Drop the leaf photo" : "Drop a CSV file"}</span>
            </div>
          )}

          <header className="dash__head">
            <button
              className={`iconbtn ${panelOpen ? "is-on" : ""}`}
              title={panelOpen ? "Hide side panel" : "Show side panel"}
              onClick={() => setPanelOpen((v) => !v)}
            >
              <PanelIcon size={17} />
            </button>

            <nav className="tabs" role="tablist" aria-label="Models">
              <span className="tabs__thumb" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={t.id === activeTool}
                  className={`tab ${t.id === activeTool ? "is-active" : ""}`}
                  onClick={() => selectTool(t.id)}
                  title={t.label}
                >
                  <t.Icon size={15} />
                  <span>{t.short}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                className={`iconbtn ${manualMode ? "is-on" : ""}`}
                disabled={activeTool === "leaf"}
                title={activeTool === "leaf" ? "Not available for the image model" : manualMode ? "Switch back to chat" : "Switch to manual JSON entry"}
                onClick={() => setManualMode((v) => !v)}
              >
                <CodeIcon size={16} />
              </button>
              <button className="iconbtn" disabled={!canExport} title="Export last result" onClick={handleExport}>
                <DownloadIcon size={16} />
              </button>
              <button className="iconbtn hide-sm" title="New chat" onClick={handleNewChat}>
                <PlusIcon size={16} />
              </button>
            </div>
          </header>

          {/* Sliding page: re-mounts on tool change so the slide plays */}
          <div key={activeTool} className={`pane pane--${dir}`}>
            <div className="pane__meta">
              <activeToolInfo.Icon size={14} />
              <b>{activeToolInfo.label}</b>
              <span>{activeToolInfo.dataset}</span>
            </div>

            {!hasStarted ? (
              <div className="hero">
                <div>
                  <h1>
                    What would you like to{" "}
                    <span className="pill">
                      <video src="/hero.mp4" autoPlay muted loop playsInline />
                    </span>{" "}
                    <em className="gx">check?</em>
                  </h1>
                  <p>{OPENERS[activeTool]}</p>
                </div>
                {EXAMPLES[activeTool].length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: 460 }}>
                    {EXAMPLES[activeTool].map((ex) => (
                      <button key={ex.label} className="chip" onClick={() => handleSend(ex.text)}>
                        {ex.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div ref={scrollRef} className="msgs">
                {thread.map((m) => (
                  <MessageBubble key={m.id} message={m} onCopy={handleCopy} copied={copiedId === m.id} />
                ))}

                {loading && (
                  <div className="typing">
                    <span>{[0, 1, 2].map((i) => <i key={i} style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
                  </div>
                )}

                {!loading && thread.length > 1 && thread[thread.length - 1].role === "assistant" && (
                  <button className="linkbtn" onClick={handleRetry}>
                    <RetryIcon size={13} /> Retry
                  </button>
                )}
              </div>
            )}

            {activeTool === "leaf" ? (
              <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={17} />
                Drop a leaf photo here or click to browse
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelected(e.target.files?.[0])} />
              </div>
            ) : (
              <div className="composer">
                <button className="iconbtn" style={{ border: 0, background: "transparent" }} title="Upload CSV" onClick={() => csvInputRef.current?.click()}>
                  <UploadIcon size={16} />
                  <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleCsvSelected(e.target.files?.[0])} />
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={manualMode ? 'Paste JSON, e.g. {"age":30,...}' : "Type your message…"}
                  disabled={loading}
                />
                <button className="send" onClick={() => handleSend()} disabled={loading || !inputMessage.trim()} title="Send">
                  <SendIcon size={16} />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <Analytics />
    </div>
  );
}

function BotAvatar() {
  return <div className="avatar" />;
}

function MessageBubble({ message, onCopy, copied }) {
  const isUser = message.role === "user";

  if (message.kind === "image") {
    return (
      <div className="row row--user">
        <img src={message.imageUrl} alt="Uploaded leaf" className="thumb" />
      </div>
    );
  }

  if (message.kind === "file") {
    return (
      <div className="row row--user">
        <div className="filechip">
          <FileTypeIcon size={16} />
          <span className="truncate">{message.fileName}</span>
        </div>
      </div>
    );
  }

  if (message.kind === "error") {
    return (
      <div className="row">
        <BotAvatar />
        <div className="bubble bubble--err">{message.content}</div>
      </div>
    );
  }

  if (message.kind === "result") {
    return (
      <div className="row">
        <BotAvatar />
        <ResultCard tool={message.tool} data={message.content} onCopy={() => onCopy(message.id, message.content)} copied={copied} />
      </div>
    );
  }

  return (
    <div className={`row ${isUser ? "row--user" : ""}`}>
      {!isUser && <BotAvatar />}
      <div className={`bubble ${isUser ? "bubble--user" : "bubble--ai"}`}>{message.content}</div>
    </div>
  );
}

function ResultCard({ tool, data, onCopy, copied }) {
  const copyBtn = (
    <button className="copybtn" onClick={onCopy} title="Copy result">
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
    </button>
  );

  if (tool === "insurance") {
    const charges = data.predicted_charges || data.charges || data || 0;
    return (
      <div className="result">
        {copyBtn}
        <div className="result__label">Estimated annual charges</div>
        <div className="result__value">${Math.round(Number(charges)).toLocaleString()}</div>
      </div>
    );
  }

  if (tool === "intrusion") {
    const predStr = String(data.prediction || "").toLowerCase().trim();
    const isNormal = predStr === "normal" || predStr === "0" || predStr.includes("safe");
    const displayLabel = isNormal ? "Normal traffic (safe)" : `Attack detected (${data.prediction})`;

    return (
      <div className="result">
        {copyBtn}
        <div className={`result__verdict ${isNormal ? "is-ok" : "is-bad"}`}>{displayLabel}</div>
        <MiniBar label="Confidence" value={data.confidence} tone={isNormal ? "success" : "danger"} />
      </div>
    );
  }

  const mainLabel = formatLeafLabel(data.prediction);
  const isHealthy = mainLabel.toLowerCase() === "healthy";

  return (
    <div className="result">
      {copyBtn}
      <div className={`result__verdict ${isHealthy ? "is-ok" : ""}`}>{mainLabel}</div>
      {data.top_3?.map((item) => (
        <MiniBar key={item.label} label={formatLeafLabel(item.label)} value={item.confidence} />
      ))}
    </div>
  );
}

function MiniBar({ label, value, tone = "accent" }) {
  const num = typeof value === "number" && !isNaN(value) ? value : Number(value) || 0;
  const pct = Math.min(100, Math.max(0, Math.round(num > 1 ? num : num * 100)));

  return (
    <div className="bar">
      <div className="bar__top">
        <b>{label}</b>
        <span>{pct}%</span>
      </div>
      <div className="bar__track">
        <div className={`bar__fill ${tone === "accent" ? "" : `bar__fill--${tone}`}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}