import { useState } from "react";
import ChatPanel from "./ChatPanel";
import { LoadingState, ErrorState } from "./ResultPanel";
import { predictInsurance } from "../api";

const EMPTY_FORM = {
  age: "",
  sex: "",
  bmi: "",
  children: "",
  smoker: "",
  region: "",
};

export default function InsuranceForm() {
  const [mode, setMode] = useState("chat"); // "chat" | "form"
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runPrediction = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictInsurance(payload);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Called once Gemini has collected every field via the chat.
  const handleChatReady = (data) => {
    runPrediction({
      ...data,
      age: Number(data.age),
      bmi: Number(data.bmi),
      children: Number(data.children),
    });
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    runPrediction({
      ...formData,
      age: Number(formData.age),
      bmi: Number(formData.bmi),
      children: Number(formData.children),
    });
  };

  const startOver = () => {
    setFormData(EMPTY_FORM);
    setResult(null);
    setError(null);
    setMode("chat");
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Insurance Cost Prediction</h2>

      {mode === "chat" && !result && (
        <>
          <ChatPanel modelType="insurance" onReady={handleChatReady} />
          <button
            className="btn-ghost"
            style={{ marginTop: 12 }}
            onClick={() => setMode("form")}
          >
            Fill the form manually instead
          </button>
        </>
      )}

      {mode === "form" && !result && (
        <form onSubmit={handleFormSubmit} style={{ maxWidth: 420 }}>
          <div className="field">
            <label htmlFor="age">Age</label>
            <input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleFieldChange("age", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="sex">Sex</label>
            <select
              id="sex"
              value={formData.sex}
              onChange={(e) => handleFieldChange("sex", e.target.value)}
              required
            >
              <option value="" disabled>Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="bmi">BMI</label>
            <input
              id="bmi"
              type="number"
              step="0.1"
              value={formData.bmi}
              onChange={(e) => handleFieldChange("bmi", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="children">Children</label>
            <input
              id="children"
              type="number"
              min="0"
              value={formData.children}
              onChange={(e) => handleFieldChange("children", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="smoker">Smoker</label>
            <select
              id="smoker"
              value={formData.smoker}
              onChange={(e) => handleFieldChange("smoker", e.target.value)}
              required
            >
              <option value="" disabled>Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="region">Region</label>
            <select
              id="region"
              value={formData.region}
              onChange={(e) => handleFieldChange("region", e.target.value)}
              required
            >
              <option value="" disabled>Select…</option>
              <option value="northeast">Northeast</option>
              <option value="northwest">Northwest</option>
              <option value="southeast">Southeast</option>
              <option value="southwest">Southwest</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Predicting…" : "Predict"}
            </button>
            <button className="btn-ghost" type="button" onClick={startOver}>
              Back to chat
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 24, maxWidth: 420 }}>
        {loading && <LoadingState label="Estimating charges…" />}
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
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Estimated annual charges
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "var(--accent)" }}>
              ${result.predicted_charges.toLocaleString()}
            </div>
            <button className="btn-ghost" style={{ marginTop: 12 }} onClick={startOver}>
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
