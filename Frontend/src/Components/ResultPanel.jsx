export function LoadingState({ label = "Running prediction…" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "var(--text-muted)",
        fontSize: 14,
        padding: "16px 0",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "2px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div
      style={{
        background: "rgba(248,113,113,0.08)",
        border: "1px solid var(--danger)",
        color: "var(--danger)",
        borderRadius: 8,
        padding: "12px 14px",
        fontSize: 14,
      }}
    >
      {message || "Something went wrong. Please try again."}
    </div>
  );
}

/**
 * A single labeled confidence bar. Verdict color (success/danger) is
 * left to the caller — this component only knows how to draw a bar
 * from a 0–1 confidence value.
 */
export function ConfidenceBar({ label, confidence, tone = "accent" }) {
  const pct = Math.round(confidence * 100);
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "danger"
      ? "var(--danger)"
      : "var(--accent)";

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: "var(--text-primary)",
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--text-muted)" }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
