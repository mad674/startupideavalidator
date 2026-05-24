
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // safe parse userId from token (best-effort)
  const SUPPORTED_FILES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
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

      try {

        const data = JSON.parse(event.data);

        // STREAMING RESPONSE
        if (data.type === "stream") {

          setMessages((prev) => {

            const updated = [...prev];

            const last = updated[updated.length - 1];

            if (last && last.sender === "bot-stream") {

              last.text += " " + data.response;

            } else {

              updated.push({
                id: `stream-${Date.now()}`,
                sender: "bot-stream",
                text: data.response,
              });
            }

            return [...updated];
          });

          return;
        }

        // FINAL RESPONSE
        if (data.type === "final") {

          setMessages((prev) => {

            const filtered = prev.filter(
              (m) => m.sender !== "bot-stream"
            );

            return [
              ...filtered,
              {
                id: `bot-${Date.now()}`,
                sender: "bot",
                text: data.response,
              },
            ];
          });
        }

      } catch (err) {

        console.error(err);
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
  const handleFileUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setUploadError("");

    // Validate file type
    if (!SUPPORTED_FILES.includes(file.type)) {

      setUploadError(
        "Unsupported file type. Only PDF, DOCX, and TXT are supported."
      );

      return;
    }

    try {

      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        `${process.env.REACT_APP_FASTAPI}/api/upload?user_id=${userId}&idea_id=${ideaId}`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setUploadedFiles((prev) => [
        ...prev,
        {
          filename: file.name,
          chunks: data.chunks,
        },
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: `upload-${Date.now()}`,
          sender: "bot",
          text: `✅ Uploaded "${file.name}" successfully.`,
        },
      ]);

    } catch (err) {

      setUploadError(err.message);

    } finally {

      setUploading(false);
    }
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
        <div className="upload-section">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            disabled={uploading}
          />

          {uploading && (
            <p className="upload-status">
              Uploading document...
            </p>
          )}

          {uploadError && (
            <p className="upload-error">
              {uploadError}
            </p>
          )}

          {uploadedFiles.length > 0 && (

            <div className="uploaded-files">

              {uploadedFiles.map((file, index) => (

                <small key={index}>

                  📄 {file.filename}

                </small>

              ))}

            </div>
          )}
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
