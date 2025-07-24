"use client"; // This component needs client-side functionality

import React, { useState, useEffect, useRef } from "react";
import { GrSend } from "react-icons/gr"; // Assuming you have react-icons installed
import { nanoid } from "nanoid"; // For generating unique message IDs

// This component will receive the 'id' of the workspace and the 'initialIdea' (topic)
const Chat = ({ id, initialIdea }) => {
  // State to store all chat messages
  // Each message will be an object: { id: string, role: 'user' | 'model', text: string }
  const [messages, setMessages] = useState([]);
  // State for the current user input in the textarea
  const [input, setInput] = useState("");
  // State to indicate if the AI is currently generating a response
  const [isGenerating, setIsGenerating] = useState(false);

  // Ref for auto-scrolling to the bottom of the chat
  const messagesEndRef = useRef(null);

  // --- Local Storage Persistence ---
  useEffect(() => {
    // Load chat history from local storage when the component mounts or id changes
    const storedChat = localStorage.getItem(`chat-history-${id}`);
    if (storedChat) {
      try {
        setMessages(JSON.parse(storedChat));
      } catch (e) {
        console.error("Failed to parse stored chat history:", e);
        // If parsing fails, start with the initial idea
        setMessages(
          initialIdea ? [{ id: nanoid(), role: "user", text: initialIdea }] : []
        );
      }
    } else if (initialIdea) {
      // If no stored chat and an initial idea is provided, start with that idea
      setMessages([{ id: nanoid(), role: "user", text: initialIdea }]);
    } else {
      // If no stored chat and no initial idea, start with an empty chat
      setMessages([]);
    }
  }, [id, initialIdea]); // Re-run if workspace ID or initial idea changes

  useEffect(() => {
    // Save chat history to local storage whenever messages state changes
    if (messages.length > 0) {
      localStorage.setItem(`chat-history-${id}`, JSON.stringify(messages));
    } else {
      // If messages become empty, remove the entry from local storage
      localStorage.removeItem(`chat-history-${id}`);
    }
  }, [messages, id]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- AI Model Interaction ---
  const sendMessageToAI = async (userMessage) => {
    setIsGenerating(true);
    try {
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
      // Add the current user message to the history for the AI call
      chatHistory.push({ role: "user", parts: [{ text: userMessage }] });

      // Call your backend API endpoint to get AI response
      const response = await fetch("http://localhost:5000/api/chat", {
        // <-- IMPORTANT: This is your new backend endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatHistory }), // Send the full chat history to the backend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Backend error: ${response.status}`
        );
      }

      const data = await response.json();
      const aiResponseText = data.text; // Assuming your backend sends back { text: "AI response" }

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: nanoid(), role: "model", text: aiResponseText }, // <--- CHANGED ROLE FROM 'ai' TO 'model'
      ]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: nanoid(),
          role: "model",
          text: "Oops! I couldn't get a response right now. Please try again.",
        }, // <--- CHANGED ROLE FROM 'ai' TO 'model'
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Event Handlers ---
  const handleSendMessage = async () => {
    if (input.trim() === "" || isGenerating) return;

    const userMessage = input.trim();
    // Add user message to the chat display immediately
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: nanoid(), role: "user", text: userMessage },
    ]);
    setInput(""); // Clear input field

    // Send the message to the AI backend
    await sendMessageToAI(userMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Send on Enter, new line on Shift+Enter
      e.preventDefault(); // Prevent default new line
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-[370px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg border-white/20 text-foreground">
      {/* Chat Messages Display Area */}
      <div className="flex-grow overflow-y-auto scrollbar-hide  p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                msg.role === "user"
                  ? "bg-green-600 text-primary-foreground ml-12"
                  : "bg-card text-card-foreground border border-border mr-12"
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-card text-card-foreground border border-border mr-12">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* For auto-scrolling */}
      </div>

      {/* Input Area */}
      <div className="mt-4 flex items-center p-2 mx-1 mb-1 bg-white/20 text-[14px] rounded-xl">
        <textarea
          className="flex-grow bg-transparent outline-none text-white placeholder:text-white/70 resize-none scrollbar-hide p-2"
          placeholder={
            isGenerating ? "AI is thinking..." : "Type your message..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)} 
          onKeyPress={handleKeyPress}
          rows={1} // Start with one row
          style={{ maxHeight: "100px" }} // Max height for textarea
          disabled={isGenerating}
        />
        <button
          onClick={handleSendMessage}
          className={`ml-2 p-2 rounded-full transition ${
            input.trim() === "" || isGenerating
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={input.trim() === "" || isGenerating}
        >
          <GrSend className="size-5" />
        </button>
      </div>
    </div>
  );
};

export default Chat;
