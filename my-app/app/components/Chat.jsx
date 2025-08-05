// app/components/Chat.jsx
"use client"; // Assuming this component also needs client-side features for the microphone

import React, { useState, useEffect, useRef } from "react";
import { GrSend } from "react-icons/gr"; // Assuming you have react-icons installed
import { nanoid } from "nanoid"; // For generating unique message IDs
import MicButton from "./MicButton"; // Import the MicButton component

// This component will receive the 'id' of the workspace and the 'initialIdea' (topic)
const Chat = ({ id, initialIdea, onNewUserMessageForCode }) => {
  // <--- Added onNewUserMessageForCode prop
  // State to store all chat messages
  // Each message will be an object: { id: string, role: 'user' | 'model', text: string }
  const [messages, setMessages] = useState([]);
  // State for the current user input in the textarea
  const [input, setInput] = useState("");
  // State to indicate if the AI is currently generating a response
  const [isGenerating, setIsGenerating] = useState(false);
  // State to track if the mic is actively listening in this chat component
  const [isChatMicListening, setIsChatMicListening] = useState(false);

  // Ref for auto-scrolling to the bottom of the chat
  const messagesEndRef = useRef(null);
  // Ref for the chat textarea to allow programmatic focusing
  const chatTextAreaRef = useRef(null);

  // --- Local Storage Persistence ---
  useEffect(() => {
    const storedChat = localStorage.getItem(`chat-history-${id}`);
    let initialMessages = [];
    let shouldSendMessageToAI = false;

    if (storedChat) {
      try {
        initialMessages = JSON.parse(storedChat);
        setMessages(initialMessages);
      } catch (e) {
        console.error("Failed to parse stored chat history:", e);
        // If parsing fails, treat as no stored chat
        initialMessages = [];
      }
    }

    if (
      initialMessages.length === 0 &&
      initialIdea &&
      initialIdea !== "Idea not found."
    ) {
      const firstUserMessage = {
        id: nanoid(),
        role: "user",
        text: initialIdea,
      };
      setMessages([firstUserMessage]);
      shouldSendMessageToAI = true; // Flag to send this message to AI
    } else if (initialMessages.length > 0) {
      const lastUserMessage = initialMessages
        .slice()
        .reverse()
        .find((msg) => msg.role === "user");
      if (lastUserMessage && onNewUserMessageForCode) {
        onNewUserMessageForCode(lastUserMessage.text);
      }
    }

    if (shouldSendMessageToAI) {
      setTimeout(() => {
        sendMessageToAI(initialIdea);
        if (onNewUserMessageForCode) {
          onNewUserMessageForCode(initialIdea);
        }
      }, 0);
    }
  }, [id, initialIdea]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat-history-${id}`, JSON.stringify(messages));
    } else {
      localStorage.removeItem(`chat-history-${id}`);
    }
  }, [messages, id]);

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
      if (
        !messages.some((msg) => msg.text === userMessage && msg.role === "user")
      ) {
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
      }

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Backend error: ${response.status}`
        );
      }

      const data = await response.json();
      const aiResponseText = data.text;

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: nanoid(), role: "model", text: aiResponseText },
      ]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: nanoid(),
          role: "model",
          text: "Oops! I couldn't get a response right now. Please try again.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Microphone Callbacks for Chat Input ---

  const handleMicTranscriptReady = (transcript) => {
    // Append the recognized transcript to the current input
    setInput((prevInput) => prevInput + (prevInput ? " " : "") + transcript);
    // Focus the textarea and put cursor at the end after adding transcription
    if (chatTextAreaRef.current) {
      chatTextAreaRef.current.focus();
      const value = chatTextAreaRef.current.value;
      chatTextAreaRef.current.setSelectionRange(value.length, value.length);
    }
  };

  const handleMicListeningChange = (listeningStatus) => {
    setIsChatMicListening(listeningStatus);
    // Optionally, you could change the placeholder here, e.g., "Speak now..."
  };

  const handleMicManualStop = () => {
    // When the mic is manually stopped, clear the input if no text was transcribed
    // or just ensure focus for typing if some text was added.
    if (input.trim() === "") {
        setInput(""); // Clear fully if nothing was spoken
    }
    if (chatTextAreaRef.current) {
        chatTextAreaRef.current.focus(); // Ensure textarea is focused
    }
    setIsChatMicListening(false); // Make sure listening state is reset
  };

  // --- Event Handlers ---
  const handleSendMessage = async () => {
    if (input.trim() === "" || isGenerating) return;

    const userMessage = input.trim();
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: nanoid(), role: "user", text: userMessage },
    ]);
    setInput(""); // Clear input field

    if (onNewUserMessageForCode) {
      onNewUserMessageForCode(userMessage);
    }

    await sendMessageToAI(userMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Determine if the send button should be enabled
  const isSendButtonEnabled = input.trim() !== "" && !isGenerating;

  // Determine if the microphone button should be enabled
  // It should be disabled if AI is generating, or if mic is already listening, or if text is present (prioritize send)
  const isMicButtonEnabled = !isGenerating && !isChatMicListening && input.trim() === "";

  return (
    <div className="flex flex-col h-full w-[450px] bg-zinc-700 backdrop-blur-lg rounded-2xl shadow-lg border-white/20 text-foreground">
      {/* Chat Messages Display Area */}
      <div className="flex-grow overflow-y-auto scrollbar-hide p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`px-4 py-3 rounded-2xl shadow-sm ${
                msg.role === "user"
                  ? "bg-green-700 text-primary-foreground ml-12 max-w-[85%]"
                  : "bg-blue-950 text-card-foreground  w-full mr-0"
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
                <span className="text-sm text-muted-foreground mr-7">
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
          ref={chatTextAreaRef} 
          className="flex-grow bg-transparent outline-none text-white placeholder:text-white/70 resize-none scrollbar-hide p-2"
          placeholder={
            isGenerating
              ? "AI is thinking..."
              : isChatMicListening
              ? "Speak now..."
              : "Type your message..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          style={{ maxHeight: "100px" }}
          disabled={isGenerating}
        />
        {/* Conditional rendering for Send or Microphone component */}
        {input.trim() !== "" ? (
          // Send Button
          <button
            onClick={handleSendMessage}
            className={`ml-2 p-2 rounded-full transition ${
              isSendButtonEnabled
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-500 cursor-not-allowed"
            }`}
            disabled={!isSendButtonEnabled}
          >
            <GrSend className="size-5" />
          </button>
        ) : (
          // Microphone Button Component
          <MicButton
            onTranscriptReady={handleMicTranscriptReady}
            onListeningChange={handleMicListeningChange}
            onManualStop={handleMicManualStop}
            className={`ml-2 p-2 rounded-full transition ${
              isMicButtonEnabled
                ? "bg-zinc-800 hover:bg-zinc-800" // Original black for mic idle, darker on hover
                : "bg-gray-500 cursor-not-allowed"
            }`}
            lang="en-US"
            disabled={!isMicButtonEnabled}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;