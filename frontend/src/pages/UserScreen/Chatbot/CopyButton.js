import React, { useState } from "react";
import "./Chatbot.css"; // Make sure this CSS file exists

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="copy-icon-btn"
      title={copied ? "Copied!" : "Copy"}
    >{copied ? "✓" : "copy"}
    </button>
  );
}
