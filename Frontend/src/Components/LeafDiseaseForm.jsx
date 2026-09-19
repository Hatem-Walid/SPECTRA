import { useRef, useState } from "react";
import { LoadingState, ErrorState, ConfidenceBar } from "./ResultPanel";
import { predictLeafDisease } from "../api";

export default function LeafDiseaseForm() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const setSelectedFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    setSelectedFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictLeafDisease(file);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Lettuce Leaf Disease Detection</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 420 }}>
        This tool works from a photo — drop one in below rather than
        describing it in text.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          maxWidth: 420,
          minHeight: 200,
          border: `1px dashed ${dragActive ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 10,
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 20,
          textAlign: "center",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Selected leaf"
            style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 6 }}
          />
        ) : (
          <>
            <div style={{ color: "var(--text-primary)", marginBottom: 4 }}>
              Drop a leaf photo here
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              or click to browse
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0])}
          style={{ display: "none" }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!file || loading}
        >
          {loading ? "Analyzing…" : "Predict"}
        </button>
        {file && (
          <button
            className="btn-ghost"
            onClick={() => {
              setFile(null);
              setPreview(null);
              setResult(null);
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ marginTop: 24, maxWidth: 420 }}>
        {loading && <LoadingState label="Analyzing leaf image…" />}
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
                color: "var(--text-primary)",
              }}
            >
              {result.prediction}
            </div>
            {result.top_3?.map((item) => (
              <ConfidenceBar
                key={item.label}
                label={item.label}
                confidence={item.confidence}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
