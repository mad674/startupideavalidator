import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import CopyButton from "./CopyButton";
import "./Chatbot.css";

export default function Chatbot() {
  const { id } = useParams();
  const ideaId = id ? atob(id) : "unknown_idea";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";
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

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // Step 1: fetch API key first
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND}/user/getuserapikey/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch user details");
        const data = await res.json();
        setApiKey(data.api);
      } catch (err) {
        console.error("API key fetch failed:", err);
      }
    };

    fetchApiKey();
  }, [userId, token]);

  // Step 2: once apiKey is ready, open WebSocket
  useEffect(() => {
    if (!apiKey) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    ws.current = new WebSocket(`${protocol}://${process.env.REACT_APP_CHATBOT}/api/ws/chat`);

    ws.current.onopen = () => {
      ws.current.send(
        JSON.stringify({
          user_id: userId,
          idea_id: ideaId,
          message: "Hi",
          auth_token,
          api: apiKey,
        })
      );
    };

    ws.current.onmessage = (event) => {
      let botMessage = "";
      try {
        const data = JSON.parse(event.data);
        // backend might send {message: "..."} or {text: "..."}
        botMessage = data.message || data.text || event.data;
        if (data.type === "final" && data.response) {
          setMessages((prev) => [
            ...prev,
            { id: `bot-${Date.now()}`, sender: "bot", text: data.response },
          ]);
        }
      } catch {
        botMessage = event.data; // fallback if plain text
      }

      
    };

    ws.current.onclose = () => console.warn("WebSocket closed");
    ws.current.onerror = (err) => console.error("WebSocket error:", err);

    return () => {
      ws.current?.close();
    };
  }, [apiKey, ideaId, userId, auth_token]);

  // Step 3: send messages
  const sendMessage = () => {
    if (!input.trim() || !apiKey || !ws.current) return;

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: input },
    ]);

    const payload = {
      user_id: userId,
      idea_id: ideaId,
      message: input,
      auth_token,
      api: apiKey,
    };

    ws.current.send(JSON.stringify(payload));
    setInput("");
  };

  // auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-header">AI Idea Chatbot</div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.sender}`}>
            <p className="message-text text-sm ">{msg.text}</p>
            <CopyButton text={msg.text} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          placeholder={apiKey ? "Type your message..." : "Fetching API key..."}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={!apiKey}
        />
        <button onClick={sendMessage} disabled={!apiKey}>
          Send
        </button>
      </div>
    </div>
  );
}
