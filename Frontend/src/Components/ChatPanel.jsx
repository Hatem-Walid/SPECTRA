import { useState } from "react";
import { extractFields } from "../api";

/**
 * Free-text entry point shown before a form. The user describes their
 * case in one message; the backend extracts whatever fields it can and
 * flags the rest as missing_fields so the parent can pre-fill a form.
 *
 * @param {"insurance"|"intrusion"} modelType
 * @param {(extracted: object, missing: string[]) => void} onExtracted
 */
export default function ChatPanel({ modelType, onExtracted, onSkip }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await extractFields(modelType, message.trim());
      onExtracted(result.extracted, result.missing_fields);
    } catch (err) {
      setError("Couldn't reach the extraction service. Try the form instead.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 20,
        maxWidth: 480,
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0 }}>
        Describe the case in your own words — leave out anything you don't
        know yet, you can fill it in on the form after.
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="e.g. 30 year old male, smoker, bmi 27, two kids…"
        style={{
          width: "100%",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text-primary)",
          padding: 10,
          fontFamily: "inherit",
          fontSize: 14,
          resize: "vertical",
        }}
      />

      {error && (
        <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={loading || !message.trim()}
        >
          {loading ? "Reading…" : "Send"}
        </button>
        <button className="btn-ghost" onClick={onSkip}>
          Fill the form manually instead
        </button>
      </div>
    </div>
  );
}
