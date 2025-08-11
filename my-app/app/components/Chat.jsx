"use client"; 

import React, { useState, useEffect, useRef, useCallback } from "react"; 
import { GrSend } from "react-icons/gr";
import { nanoid } from "nanoid";
import MicButton from "./MicButton"; 
import { cn } from "@/lib/utils"; 

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 

const Chat = ({ id, initialIdea, onNewUserMessageForCode }) => {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatMicListening, setIsChatMicListening] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const chatTextAreaRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const initialMessageSentRef = useRef(false);

  const typeMessage = useCallback((text) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setIsTyping(true); 
    setTypingText(""); 
    let index = 0;
    const charsPerInterval = 2;

    typingIntervalRef.current = setInterval(() => {
      if (index < text.length) {
        setTypingText(prev => prev + text.slice(index, index + charsPerInterval));
        index += charsPerInterval;
      } else {
        clearInterval(typingIntervalRef.current); 
        typingIntervalRef.current = null;
        setIsTyping(false); 
        setTypingText(""); 
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: nanoid(), role: "model", text: text },
        ]);
      }
    }, 5);
  }, []); 

  const sendMessageToAI = useCallback(async (userMessage, currentChatHistory) => {
    setIsGenerating(true); 
    try {
      const historyForAPI = currentChatHistory.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatHistory: historyForAPI }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Backend error: ${response.status}`
        );
      }

      const data = await response.json();
      const aiResponseText = data.text;

      // Start typing animation
      typeMessage(aiResponseText);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      const errorMessage = "Oops! I couldn't get a response right now. Please try again.";
      typeMessage(errorMessage);
    } finally {
      setIsGenerating(false); // Always set generating to false after response (or error)
    }
  }, [typeMessage]); // Dependency on typeMessage to ensure it's always the latest memoized version


  // --- Local Storage Persistence and Initial Idea Handling ---
  useEffect(() => {
    if (initialMessageSentRef.current) return;

    const storedChat = localStorage.getItem(`chat-history-${id}`);
    let initialMsgs = [];

    if (storedChat) {
      try {
        initialMsgs = JSON.parse(storedChat);
        setMessages(initialMsgs);
        // If there are stored messages, check the last one to potentially send to onNewUserMessageForCode
        const lastUserMessage = initialMsgs
          .slice()
          .reverse()
          .find((msg) => msg.role === "user");
        if (lastUserMessage && onNewUserMessageForCode) {
          onNewUserMessageForCode(lastUserMessage.text);
        }
        initialMessageSentRef.current = true; // Mark as processed if history exists
      } catch (e) {
        console.error("Failed to parse stored chat history:", e);
        setMessages([]); // Clear corrupted history
        initialMessageSentRef.current = false; // Reset if corrupted
      }
    } else if (initialIdea && initialIdea !== "Idea not found.") {
      const firstUserMessage = {
        id: nanoid(),
        role: "user",
        text: initialIdea,
      };
      setMessages([firstUserMessage]); // Immediately set the initial user message
      initialMessageSentRef.current = true; // Mark as processed

      // Use setTimeout to allow React to render the initial message, then trigger AI
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" }); // Instant scroll for initial idea
        }
        // Pass the initial user message as the history for the AI call
        sendMessageToAI(initialIdea, [firstUserMessage]);
        if (onNewUserMessageForCode) {
          onNewUserMessageForCode(initialIdea);
        }
      }, 30); // Small delay to allow initial render
    }
  }, [id, initialIdea, onNewUserMessageForCode, sendMessageToAI]); // Dependencies for this effect


  // --- Persist messages to local storage ---
  useEffect(() => {
    // Only save to local storage if messages array is not empty
    if (messages.length > 0) {
      localStorage.setItem(`chat-history-${id}`, JSON.stringify(messages));
    } else {
      // If messages become empty, remove the item from local storage
      localStorage.removeItem(`chat-history-${id}`);
    }
  }, [messages, id]);

  // --- Auto-scrolling to the latest message ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Now only depends on 'messages' array updates

  // --- Microphone Callbacks for Chat Input ---
  const handleMicTranscriptReady = (transcript) => {
    setInput((prevInput) => prevInput + (prevInput ? " " : "") + transcript);
    // 🚀 FIX: Ensure typing animation is stopped if mic input is received
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setIsTyping(false);
    setTypingText("");

    if (chatTextAreaRef.current) {
      chatTextAreaRef.current.focus();
      const value = chatTextAreaRef.current.value;
      chatTextAreaRef.current.setSelectionRange(value.length, value.length);
    }
  };

  const handleMicListeningChange = (listeningStatus) => {
    setIsChatMicListening(listeningStatus);
  };

  const handleMicManualStop = () => {
    if (input.trim() === "") {
        setInput("");
    }
    if (chatTextAreaRef.current) {
        chatTextAreaRef.current.focus();
    }
    setIsChatMicListening(false);
  };

  // --- Event Handlers ---
  const handleSendMessage = async () => {
    if (input.trim() === "" || isGenerating || isTyping) return;

    const userMessage = input.trim();
    const newUserMessage = { id: nanoid(), role: "user", text: userMessage };

    // Use a functional update to ensure we have the very latest state for the API call
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newUserMessage];
      // Call AI function with the *full* updated history including the new user message
      sendMessageToAI(userMessage, updatedMessages); // Pass the updated history
      return updatedMessages; // Return the updated state
    });
    setInput(""); // Clear input field

    if (onNewUserMessageForCode) {
      onNewUserMessageForCode(userMessage);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (isTyping) {
      // 🚀 FIX: Clear interval when user starts typing
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setIsTyping(false);
      setTypingText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Determine if the send button should be enabled
  const isSendButtonEnabled = input.trim() !== "" && !isGenerating && !isTyping;

  // Determine if the microphone button should be enabled
  const isMicButtonEnabled = !isGenerating && !isChatMicListening && input.trim() === "" && !isTyping;

  const MarkdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-1 mt-1 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-[15px] md:text-[15px] font-bold text-blue-400" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-[15px] md:text-[15px] font-semibold text-purple-300" {...props} />,
    p: ({node, ...props}) => <p className="text-sm md:text-base leading-relaxed mb-1 text-gray-200" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-inside  text-gray-300" {...props} />,
    ul: ({node, ...props}) => <ul className="list-none list-inside leading-[12px]  text-gray-300" {...props} />,
    li: ({node, ...props}) => <li className="text-sm md:text-base" {...props} />,
    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
    em: ({node, ...props}) => <em className="italic text-gray-400" {...props} />,
    a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
    code: ({node, inline, ...props}) => {
      // Inline code
      if (inline) {
        return <code className="bg-gray-700 text-yellow-300 px-1 py-0.5 rounded text-xs" {...props} />;
      }
      // Code blocks
      return (
        <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto my-2 shadow-inner">
          <code className="text-sm text-green-300 block whitespace-pre-wrap" {...props} />
        </pre>
      );
    },
    // Add more components as needed for other markdown elements (e.g., table, img, blockquote)
  };


  return (
    <div className="flex flex-col h-full w-[450px] bg-zinc-950 backdrop-blur-lg rounded-2xl shadow-lg border-white/20 text-foreground">
      {/* Chat Messages Display Area */}
      <div className="flex-grow overflow-y-auto scrollbar-hide p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex mb-4 animate-fade-in", // Added a simple fade-in animation
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "px-2 py-3 rounded-2xl shadow-sm transition-all duration-300",
                msg.role === "user"
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white ml-12 max-w-[85%] shadow-md"
                  : "bg-zinc-800 text-gray-200 w-full mr-0 px-4 py-3 border border-zinc-700 shadow-xl" // Enhanced AI message styling
              )}
            >
              {/* 🚀 MODIFIED: Render message text using ReactMarkdown */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {/* 🚀 NEW: Typing Animation for AI Response */}
        {isTyping && (
          <div className="flex justify-start mb-4 animate-fade-in">
            <div className="bg-zinc-800 backdrop-blur-sm border border-zinc-700 text-gray-100 w-full mr-0 px-4 py-3 rounded-2xl shadow-xl">
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {typingText}
                <span className="inline-block w-1.5 h-4 bg-green-400 ml-1 animate-pulse-blink"></span> {/* Blinking cursor */}
              </div>
            </div>
          </div>
        )}

        {/* Loading State (when AI is thinking before typing starts) */}
        {isGenerating && !isTyping && ( // Only show loading if not already typing
          <div className="flex justify-start mb-4 animate-fade-in">
            <div className="bg-zinc-800 backdrop-blur-sm border border-zinc-700 text-gray-100 px-4 py-3 rounded-2xl shadow-xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-sm text-gray-400">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* For auto-scrolling */}
      </div>

      {/* Input Area */}
      <div className="mt-4 flex items-center p-2 mx-1 mb-1 bg-white/10 text-[14px] rounded-xl border border-white/20 focus-within:border-green-400 transition-all duration-300"> {/* Enhanced input container styling */}
        <textarea
          ref={chatTextAreaRef}
          className="flex-grow bg-transparent outline-none text-white placeholder:text-white/70 resize-none scrollbar-hide p-2"
          placeholder={
            isGenerating
              ? "AI is thinking..."
              : isChatMicListening
              ? "🎙️ Speak now..."
              : "Type your message..."
          }
          value={input}
          onChange={handleInputChange} // 🚀 MODIFIED: Use new handler
          onKeyPress={handleKeyPress}
          rows={1}
          style={{ maxHeight: "100px" }}
          disabled={isGenerating || isTyping} // 🚀 Disable input during typing too
        />
        {/* Conditional rendering for Send or Microphone component */}
        {input.trim() !== "" ? (
          // Send Button
          <button
            onClick={handleSendMessage}
            className={cn(
              "ml-2 p-2 rounded-full transition-all duration-300 transform",
              isSendButtonEnabled
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-green-500/25"
                : "bg-gray-600 cursor-not-allowed opacity-50"
            )}
            disabled={!isSendButtonEnabled}
          >
            <GrSend className="size-5 text-white" />
          </button>
        ) : (
          // Microphone Button Component
          <MicButton
            onTranscriptReady={handleMicTranscriptReady}
            onListeningChange={handleMicListeningChange}
            onManualStop={handleMicManualStop}
            className={cn(
              "ml-2 p-2 rounded-full transition-all duration-300 transform",
              isMicButtonEnabled
                ? "bg-zinc-700 hover:bg-zinc-600 hover:scale-105 shadow-lg" // Enhanced mic button styling
                : "bg-gray-600 cursor-not-allowed opacity-50"
            )}
            lang="en-US"
            disabled={!isMicButtonEnabled}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;
