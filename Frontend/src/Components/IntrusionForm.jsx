import { useState } from "react";
import ChatPanel from "./ChatPanel";
import { LoadingState, ErrorState, ConfidenceBar } from "./ResultPanel";
import { predictIntrusion } from "../api";

/**
 * PLACEHOLDER field list — replace with the real NSL-KDD shortlist once
 * finalized, and keep this in sync with backend/gemini_client.py's
 * FIELD_SCHEMAS["intrusion"] and backend/schemas.py's IntrusionInput.
 */
const FIELDS = [
  { key: "duration", label: "Duration", type: "number" },
  { key: "protocol_type", label: "Protocol", type: "select", options: ["tcp", "udp", "icmp"] },
  { key: "src_bytes", label: "Source bytes", type: "number" },
  { key: "dst_bytes", label: "Destination bytes", type: "number" },
  { key: "count", label: "Connection count", type: "number" },
];

const SAMPLE_NORMAL = { duration: 0, protocol_type: "tcp", src_bytes: 215, dst_bytes: 45076, count: 1 };
const SAMPLE_ATTACK = { duration: 0, protocol_type: "tcp", src_bytes: 0, dst_bytes: 0, count: 511 };
const emptyForm = () => Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

export default function IntrusionForm() {
  const [mode, setMode] = useState("chat");
  const [formData, setFormData] = useState(emptyForm());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runPrediction = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictIntrusion(payload);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatReady = (data) => runPrediction(data);
  const loadSample = (sample) => runPrediction(sample);

  const handleFieldChange = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleFormSubmit = (e) => {
    e.preventDefault();
    runPrediction(formData);
  };

  const startOver = () => {
    setFormData(emptyForm());
    setResult(null);
    setError(null);
    setMode("chat");
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Network Intrusion Detection</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className="btn-ghost" onClick={() => loadSample(SAMPLE_NORMAL)}>
          Load normal sample
        </button>
        <button className="btn-ghost" onClick={() => loadSample(SAMPLE_ATTACK)}>
          Load attack sample
        </button>
      </div>

      {mode === "chat" && !result && (
        <>
          <ChatPanel modelType="intrusion" onReady={handleChatReady} />
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => setMode("form")}>
            Fill the form manually instead
          </button>
        </>
      )}

      {mode === "form" && !result && (
        <form onSubmit={handleFormSubmit} style={{ maxWidth: 420 }}>
          {FIELDS.map(({ key, label, type, options }) => (
            <div key={key} className="field">
              <label htmlFor={key}>{label}</label>
              {type === "select" ? (
                <select
                  id={key}
                  value={formData[key]}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  required
                >
                  <option value="" disabled>Select…</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={key}
                  type="number"
                  value={formData[key]}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  required
                />
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Classifying…" : "Predict"}
            </button>
            <button className="btn-ghost" type="button" onClick={startOver}>
              Back to chat
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 24, maxWidth: 420 }}>
        {loading && <LoadingState label="Classifying traffic…" />}
        {error && <ErrorState message={error} />}
        {result && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 12,
                color: result.prediction === "normal" ? "var(--success)" : "var(--danger)",
              }}
            >
              {result.prediction}
            </div>
            <ConfidenceBar
              label="Confidence"
              confidence={result.confidence}
              tone={result.prediction === "normal" ? "success" : "danger"}
            />
            <button className="btn-ghost" style={{ marginTop: 12 }} onClick={startOver}>
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
