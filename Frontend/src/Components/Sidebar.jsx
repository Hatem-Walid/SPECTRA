const TOOLS = [
  { id: "insurance", label: "Insurance Cost" },
  { id: "intrusion", label: "Intrusion Detection" },
  { id: "leaf", label: "Leaf Disease" },
];

export default function Sidebar({ activeTool, onSelect }) {
  return (
    <aside
      style={{
        width: 220,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 12px",
        gap: 4,
      }}
    >
      <div
        style={{
          color: "var(--text-muted)",
          fontSize: 12,
          padding: "0 12px 16px",
          letterSpacing: 0.2,
        }}
      >
        Models
      </div>

      {TOOLS.map((tool) => {
        const isActive = tool.id === activeTool;
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            style={{
              display: "flex",
              alignItems: "center",
              textAlign: "left",
              background: isActive ? "rgba(201,162,39,0.12)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-primary)",
              border: "none",
              borderLeft: isActive
                ? "2px solid var(--accent)"
                : "2px solid transparent",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {tool.label}
          </button>
        );
      })}
    </aside>
  );
}
