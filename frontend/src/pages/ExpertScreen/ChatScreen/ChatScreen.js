import React, { useState, useEffect, useRef } from "react";
import "./ChatScreen.css";
import { useParams } from "react-router-dom";
import { useToast } from "../../../components/Popups/Popup";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
const ChatScreen = () => {
  let { ideaId } = useParams();
  ideaId=atob(ideaId);
  const session = JSON.parse(localStorage.getItem("expertSession"));
  const token = `Bearer ${session?.token}`;
  const expertId = session?.expertId; 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const { showToast } = useToast();
    if(!expertId || !token){
      return <Navigate to="/expert/login" replace={true} />
    }
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/getchat/${expertId}/${ideaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(data.chatHistory || []);
      } catch (err) {
        console.error("Error fetching chat:", err);
      }
    };
    fetchChat();
  }, [ideaId, token, expertId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/expert/sendmsg/${expertId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ideaId: ideaId,sender:"expert", message: newMessage }),
        }
      );
      const data = await res.json();
      if(!data.success){
          showToast(data.message || "Failed to send message");
      } 
      showToast("🎉 Message sent",true);
      setMessages([...messages, data.chat]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };
    const handleDeleteMessage = async (messageId) => {
    // if (!window.confirm("Are you sure you want to delete this message?")) return;
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND}/expert/deleteMessage/${expertId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ideaId: ideaId, messageId: messageId }),
          }
        );
        if(!res.ok){
            throw new Error("Network response was not ok");
        }
        const data = await res.json();
        if(!data.success){
            showToast(data.message || "Failed to delete message");
        } 
        // alert(JSON.stringify(data));
        showToast("Message deleted successfully",true);
        setMessages(messages.filter((msg) => msg._id !== messageId));
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
  };
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-screen">
      <h2>Idea Chat</h2>
      <div className="chat-container">
        {messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((msg, index) => {
            const timestamp = new Date(msg.timestamp); // Make sure msg.timestamp is a valid date
            const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const formattedDate = timestamp.toLocaleDateString();
            return(
            <div
              key={index}
              className={`chat-message ${msg.sender === "expert" ? "expert" : "user"}`}
              style={{
                background: msg.sender === "expert" ? "linear-gradient(90deg,#2196f3,#21cbf3)" : "#e0e0e0",
                color: msg.sender === "expert" ? "#fff" : "#222",
                borderRadius: "24px",
                padding: "10px 18px",
                margin: "4px 0",
                maxWidth: "70%",
                alignSelf: msg.sender === "expert" ? "flex-end" : "flex-start",
                boxShadow: msg.sender === "expert" ? "0 2px 8px rgba(33,150,243,0.15)" : "0 2px 8px rgba(0,0,0,0.08)",
                fontWeight: 500,
                fontSize: "1rem",
              }}
            >
              <div>{msg.message}</div>
              <small style={{ fontSize: "0.7rem", color: "#666" }}>
                  {formattedDate} {formattedTime}
                </small>
                {msg.sender === "expert" && <button
                  onClick={() => handleDeleteMessage(msg._id)}
                  style={{
                    position: "absolute",
                    width: "50px",
                    height: "50px",
                    background: "transparent",
                    border: "none",
                    color: "red",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ×
                </button>}
            </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-input">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #bbb",
            fontSize: "1rem",
            flex: 1,
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(90deg,#43a047,#66bb6a)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(67,160,71,0.12)",
            transition: "background 0.2s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
