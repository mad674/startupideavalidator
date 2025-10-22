import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ApiKeyScreen.css";

// Provider logos (replace with your actual logos in /assets)
import groqLogo from "../../../assets/groq.png";
import openaiLogo from "../../../assets/openai.png";
import togetherLogo from "../../../assets/together.png";
import fireworksLogo from "../../../assets/fireworks.png";
import mistralLogo from "../../../assets/mistral.png";

export default function ApiKeyForm() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState("groq");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.6);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const token = localStorage.getItem("token");
  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : null;

  const providerModels = {
    groq: ["llama-3.1-8b-instant","llama-3.1-70b-versatile","llama-3.3-70b-versatile","openai/gpt-oss-20b","openai/gpt-oss-120b","llama3-groq-70b-8192-tool-use-preview"],
    openai: ["gpt-4o-mini","o4-mini","gpt-4o","gpt-3.5-turbo","gpt-oss-20b"],
    together: ["togethercomputer/llama-2-70b-chat","togethercomputer/mixtral-8x7b-instruct","togethercomputer/llama-3.2-11b-free"],
    fireworks: ["accounts/fireworks/models/llama-v2-70b-chat","accounts/fireworks/models/mixtral-8x7b-instruct"],
    mistral: ["mistral-large","mistral-medium","mistral-small"],
  };

  const providerLinks = {
    groq: "https://console.groq.com/keys",
    openai: "https://platform.openai.com/account/api-keys",
    together: "https://api.together.xyz/settings/keys",
    fireworks: "https://fireworks.ai/account/api-keys",
    mistral: "https://console.mistral.ai/api-keys",
  };

  const providerLogos = {
    groq: groqLogo,
    openai: openaiLogo,
    together: togetherLogo,
    fireworks: fireworksLogo,
    mistral: mistralLogo,
  };

  const providerUrls = {
    groq: "https://api.groq.com/openai/v1",
    openai: "https://api.openai.com/v1",
    together: "https://api.together.xyz/v1",
    fireworks: "https://api.fireworks.ai/inference/v1",
    mistral: "https://api.mistral.ai/v1",
  };

  useEffect(() => {
    const models = providerModels[provider] || [];
    const llamaModel = models.find((m) => m.toLowerCase().includes("llama"));
    setModel(llamaModel || models[0] || "");
  }, [provider]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!apiKey.trim()) return setError("API key is required");
    if (!userId || !token) return setError("Not authenticated. Please log in again.");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/user/save_api_key/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apikey: apiKey,
          provider_name: provider,
          model_name: model,
          provider_url: providerUrls[provider],
          temperature: temperature,
        }),
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || "Failed to save API key");
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      alert(JSON.parse(err.message).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-page">
      <div className="api-card">
        <h1 className="api-title">🔑 Connect Your API Key</h1>
        <p className="api-desc">
          Select a provider, choose a model, and paste your API key below. Your keys are securely stored and never shared.
        </p>

        {error && <div className="api-error">{error}</div>}

        <form onSubmit={handleSubmit} className="api-form">
          {/* Provider */}
          <label className="api-label">
            Provider
            <div className="provider-select-wrapper">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="api-select"
              >
                {Object.keys(providerModels).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <img src={providerLogos[provider]} alt={provider} className="provider-logo" />
            </div>
          </label>

          {/* Model */}
          <label className="api-label">
            Model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="api-select"
            >
              {providerModels[provider].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          {/* Temperature */}
          <label className="api-label">
            Temperature
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="api-input"
            />
          </label>

          {/* API Key */}
          <label className="api-label">
            <h7>API Key<span>*</span></h7>
            <div className="input-wrapper">
              <input
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="api-input"
                disabled={loading}
                required
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className="show-btn">
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <p className="api-info">
            👉 Get your <span className="font-semibold">{provider}</span> key{" "}
            <a href={providerLinks[provider]} target="_blank" rel="noreferrer" className="api-link">
              here
            </a>.
          </p>

          <button type="submit" disabled={loading} className="api-submit">
            {loading ? "Saving..." : "Verify & Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
