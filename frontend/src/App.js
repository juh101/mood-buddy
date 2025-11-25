import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import "./App.css";

function App() {
  const [mood, setMood] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const webcamRef = useRef(null);

  const moodQuestions = {
    happy: "You look happy! What made you smile today? 😊",
    sad: "You seem a bit low. Want to share what's on your mind? 💙",
    angry: "You look frustrated. What happened? 😤",
    surprised: "You look surprised! Was it a good surprise? 😮",
    neutral: "How are you feeling inside right now? 😶"
  };

  // TEMP: Random mood until AI vision added
  const detectMood = () => {
    const moods = ["happy", "sad", "angry", "surprised", "neutral"];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];

    setMood(randomMood);

    setMessages([
      { sender: "system", text: `Mood detected: ${randomMood.toUpperCase()}` },
      { sender: "bot", text: moodQuestions[randomMood] }
    ]);
  };

  // REAL AI MESSAGE HANDLER
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user's message
    const updatedMessages = [...messages, { sender: "user", text: input }];
    setMessages(updatedMessages);
    setInput("");

    try {
      // Call backend AI
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          mood: mood
        })
      });

      const data = await response.json();

      // Add AI response
      setMessages(prev => [...prev, { sender: "bot", text: data.reply }]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Sorry, I couldn't connect right now." }
      ]);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Mood Buddy</h1>
      <p className="subtitle">Your friendly emotional check-in buddy 💛</p>

      <div className="layout">

        {/* LEFT: CAMERA */}
        <div className="left-panel">
          <h2>Your Camera</h2>

          <div className="webcam-box">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
            />
          </div>

          <button className="detect-btn" onClick={detectMood}>Detect Mood</button>
        </div>

        {/* RIGHT: CHAT */}
        <div className="right-panel">
          <h2>Conversation</h2>

          <div className="chat-window">
            {messages.map((msg, i) => (
              <div key={i} className={`bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="input-row">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage}>Send</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
