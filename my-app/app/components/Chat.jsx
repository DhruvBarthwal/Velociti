// app/components/Chat.jsx
import React, { useState, useEffect, useRef } from "react";
import { GrSend } from "react-icons/gr"; // Assuming you have react-icons installed
import { nanoid } from "nanoid"; // For generating unique message IDs

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

  // Ref for auto-scrolling to the bottom of the chat
  const messagesEndRef = useRef(null);

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

    // If no messages were loaded from storage AND there's a valid initialIdea,
    // then this is either a brand new chat or a corrupted one.
    // In this case, we'll start the conversation with the initialIdea.
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
      // If messages were loaded, ensure the 'userRequestForCode' is also set for the editor
      // This handles cases where the page is refreshed and the editor needs the last user prompt
      const lastUserMessage = initialMessages
        .slice()
        .reverse()
        .find((msg) => msg.role === "user");
      if (lastUserMessage && onNewUserMessageForCode) {
        onNewUserMessageForCode(lastUserMessage.text);
      }
    }

    // If the flag is set, send the initial idea to the AI
    if (shouldSendMessageToAI) {
      // Use a timeout to ensure state update (setMessages) is processed before AI call
      // and to prevent this from blocking the initial render.
      setTimeout(() => {
        sendMessageToAI(initialIdea);
        // Also send this initial idea to the code editor
        if (onNewUserMessageForCode) {
          onNewUserMessageForCode(initialIdea);
        }
      }, 0);
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
      // Ensure it's not duplicated if it's the initial message already added to state
      if (
        !messages.some((msg) => msg.text === userMessage && msg.role === "user")
      ) {
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
      }

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

    // Call the prop function with the user's message for code generation
    if (onNewUserMessageForCode) {
      onNewUserMessageForCode(userMessage); // Pass the user's message here
    }

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
    <div className="flex flex-col h-full w-[450px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg border-white/20 text-foreground">
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
                  ? "bg-green-600 text-primary-foreground ml-12 max-w-[85%]"
                  : "bg-card text-card-foreground border border-border w-full mr-0"
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
