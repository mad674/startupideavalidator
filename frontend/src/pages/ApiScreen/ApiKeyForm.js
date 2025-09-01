import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ApiKeyForm() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState("groq"); // default provider
  const [model, setModel] = useState(""); // will be set dynamically

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const token = localStorage.getItem("token");
  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : null;

  // Available models by provider
  const providerModels = {
    groq: ["llama-3.1-8b-instant","llama-3.1-70b-versatile", "llama-3.3-70b-versatile","openai/gpt-oss-20b","openai/gpt-oss-120b","llama3-groq-70b-8192-tool-use-preview"],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    together: ["togethercomputer/llama-2-70b-chat", "togethercomputer/mixtral-8x7b-instruct"],
    fireworks: ["accounts/fireworks/models/llama-v2-70b-chat", "accounts/fireworks/models/mixtral-8x7b-instruct"],
    mistral: ["mistral-large", "mistral-medium", "mistral-small"],
  };

  // Provider Docs Links
  const providerLinks = {
    groq: "https://console.groq.com/keys",
    openai: "https://platform.openai.com/account/api-keys",
    together: "https://api.together.xyz/settings/keys",
    fireworks: "https://fireworks.ai/account/api-keys",
    mistral: "https://console.mistral.ai/api-keys",
  };
  const providerUrls = {
    groq: "https://api.groq.com/openai/v1",
    openai: "https://api.openai.com/v1",
    together: "https://api.together.xyz/v1",
    fireworks: "https://api.fireworks.ai/inference/v1",
    mistral: "https://api.mistral.ai/v1",
  };

  // Auto-select default model (prefer llama if present)
  useEffect(() => {
    const models = providerModels[provider] || [];
    const llamaModel = models.find((m) => m.toLowerCase().includes("llama"));
    setModel(llamaModel || models[0] || "");
  }, [provider]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    if (!userId || !token) {
      setError("Not authenticated. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/user/save_api_key/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ apikey: apiKey, provider_name: provider, model_name: model,provider_url:providerUrls[provider],temperature:0.6 }),
        }
      );

      if (!res.ok) {
        const errMsg = await res.text();
        // alert(errMsg);
        throw new Error(errMsg || "Failed to save API key");
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("API key save failed:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          🔑 Connect Your API Key
        </h1>

        {/* Info */}
        <p className="text-sm text-gray-600 mb-4">
          Select a provider, choose a model, and paste your API key below. We
          never share your keys — they are securely stored for your account only.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Provider Select */}
          <label className="text-sm font-medium text-gray-700">
            Provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="together">Together AI</option>
              <option value="fireworks">Fireworks AI</option>
              <option value="mistral">Mistral</option>
            </select>
          </label>

          {/* Model Select */}
          <label className="text-sm font-medium text-gray-700">
            Model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {providerModels[provider].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          {/* API Key Input */}
          <label className="text-sm font-medium text-gray-700">
            API Key
            <div className="relative mt-2">
              <input
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 text-xs"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {/* Provider Link */}
          <p className="text-xs text-gray-500">
            👉 You can get your{" "}
            <span className="font-semibold capitalize">{provider}</span> key{" "}
            <a
              style={{ color: "#2563EB", textDecoration: "underline" }}
              href={providerLinks[provider]}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              here
            </a>
            .
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            {loading ? "Saving..." : "verify & Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
