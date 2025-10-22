
import React, { useEffect, useState, useRef } from "react";
import "./ExpertChat.css";
import { useParams } from "react-router-dom";
import { useToast } from "../../../components/Popups/Popup";

const ExpertChat = () => {
    let { expertid, ideaid } = useParams();
    const expertId = atob(expertid);
    const ideaId = atob(ideaid);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [expert, setExpert] = useState({});
  const token = localStorage.getItem("token");
  const { showToast } = useToast();
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND}/expert/getchat/${expertId}/${ideaId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if(!data.success){
            showToast(data.message || "Failed to fetch chat history");
        }
        // alert(JSON.stringify(data));
        setExpert(data.expert || {});
        setMessages(data.chatHistory || []);
        // alert(JSON.stringify(data.chatHistory || []));
      } catch (err) {
        console.error(err);
      }
    };
    fetchChat();
  }, [ideaId, token]);

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
          body: JSON.stringify({ ideaId: ideaId,sender:"user", message: newMessage }),
        }
      );
      if(!res.ok){
          throw new Error("Network response was not ok");
      }
      const data = await res.json();
      if(!data.success){
          showToast(data.message || "Failed to send message");
      } 
      // alert(JSON.stringify(data));
      showToast("🎉 Message sent",true);
      setMessages([...messages, data.chat]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="expert-chat">
      <h2>Chat with {expert.name}</h2>
      <div className="chat-window">
        {messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((msg, idx) => {
            const timestamp = new Date(msg.timestamp); // Make sure msg.timestamp is a valid date
            const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const formattedDate = timestamp.toLocaleDateString();

            return (
              <div
                key={idx}
                className={`chat-message ${msg.sender === "expert" ? "expert" : "user"}`}
                style={{ position: "relative", paddingRight: "40px" }} // space for delete button
              >
                <div>{msg.message}</div>
                <small style={{ fontSize: "0.7rem", color: "#666" }}>
                  {formattedDate} {formattedTime}
                </small>
                {msg.sender === "user" && <button
                  onClick={() => handleDeleteMessage(msg._id)}
                  style={{
                    position: "absolute",
                    width: "30px",
                    height: "30px",
                    top: "5px",
                    right: "5px",
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
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ExpertChat;
