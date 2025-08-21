// src/pages/Chatbot/Chatbot.js
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Chatbot.css";

export default function Chatbot() {
  const { id } = useParams();
  const ideaId = id ? atob(id) : "unknown_idea";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const auth_token = `Bearer ${token || ""}`;

  // safe parse userId from token (best-effort)
  let userId = "unknown_user";
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload && payload.id) userId = payload.id;
    }
  } catch (e) {
    console.warn("Unable to parse token payload", e);
  }

  const [messages, setMessages] = useState([]); // { id, sender: 'user'|'bot', text, typing }
  const [input, setInput] = useState("");
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const currentBotIdRef = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/api/ws/chat`);

    ws.current.onopen = () => {
      try {
        ws.current.send(JSON.stringify({
          user_id: userId,
          idea_id: ideaId,
          message: "Hi",
          auth_token,
        }));
      } catch (e) {
        console.warn("WS send failed on open:", e);
      }
    };

    ws.current.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.warn("Failed to parse WS event data:", e, event.data);
        return;
      }

      if (!("response" in data)) return;
      const resp = data.response;
      const type = data.type || "final";
      if (typeof resp !== "string") return;

      if (type === "error") {
        const errorId = `err-${Date.now()}`;
        setMessages((prev) => [...prev, { id: errorId, sender: "bot", text: resp, typing: false }]);
        currentBotIdRef.current = null;
        return;
      }

      if (type === "stream") {
        if (currentBotIdRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.id === currentBotIdRef.current ? { ...m, text: m.text + resp } : m))
          );
        } else {
          const botId = `bot-${Date.now()}`;
          currentBotIdRef.current = botId;
          setMessages((prev) => [...prev, { id: botId, sender: "bot", text: resp, typing: true }]);
        }
        return;
      }

      if (type === "final") {
        if (currentBotIdRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.id === currentBotIdRef.current ? { ...m, text: resp, typing: false } : m))
          );
          currentBotIdRef.current = null;
        } else {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.sender === "bot" && last.text === resp) return prev;
            const botId = `bot-${Date.now()}`;
            return [...prev, { id: botId, sender: "bot", text: resp, typing: false }];
          });
        }
        return;
      }

      // fallback
      const botId = `bot-${Date.now()}`;
      setMessages((prev) => [...prev, { id: botId, sender: "bot", text: resp, typing: false }]);
      currentBotIdRef.current = null;
    };

    ws.current.onerror = (e) => {
      console.error("WebSocket error:", e);
      const errId = `err-${Date.now()}`;
      setMessages((prev) => [...prev, { id: errId, sender: "bot", text: "WebSocket error", typing: false }]);
    };

    ws.current.onclose = () => {
      // no-op
    };

    return () => {
      try { ws.current.close(); } catch (e) {}
    };
    // include stable values so eslint -- if present -- is satisfied
  }, [userId, ideaId, auth_token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: input, typing: false }]);
    currentBotIdRef.current = null;

    const payload = { user_id: userId, idea_id: ideaId, message: input, auth_token };
    try {
      ws.current.send(JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to send WS message:", e);
      const errId = `err-${Date.now()}`;
      setMessages((prev) => [...prev, { id: errId, sender: "bot", text: "Failed to send message", typing: false }]);
    }

    setInput("");
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") sendMessage(); };

  return (
    <div className="chat-container">
      <div className="chat-header">AI Idea Chatbot</div>

      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.sender}`}>
            <div className="message-text">
              {msg.text}{msg.typing && <span className="typing-cursor">|</span>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input type="text" value={input} placeholder="Type your message..." onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} aria-label="Type your message" />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
