"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import MyCustomMicrophone from "./MyCustomMicrophone";

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const MicButton = ({
  onTranscriptReady,
  onListeningChange,
  onManualStop,
  className,
  lang = "en-US",
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const stateSettersRef = useRef({
    setIsListening,
    onListeningChange,
    onTranscriptReady,
    onManualStop,
  });

  useEffect(() => {
    stateSettersRef.current = {
      setIsListening,
      onListeningChange,
      onTranscriptReady,
      onManualStop,
    };
  }, [setIsListening, onListeningChange, onTranscriptReady, onManualStop]);


  useEffect(() => {
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();

      recognition.continuous = false; 
      recognition.interimResults = false; 
      recognition.lang = lang;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        stateSettersRef.current.onTranscriptReady(transcript);
        console.log("MicButton: Transcript received:", transcript);
      };

      recognition.onend = () => {
        console.log("MicButton: recognition.onend fired. Setting isListening to false.");
        stateSettersRef.current.setIsListening(false);
        stateSettersRef.current.onListeningChange && stateSettersRef.current.onListeningChange(false);
      };

      recognition.onerror = (event) => {
        console.error("MicButton: Speech recognition error:", event.error);
        stateSettersRef.current.setIsListening(false);
        stateSettersRef.current.onListeningChange && stateSettersRef.current.onListeningChange(false);
        alert(`Speech recognition error: ${event.error}. Please try again.`);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("MicButton: Speech Recognition API not supported in this browser.");
      alert("Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Firefox.");
    }

    return () => {
      if (recognitionRef.current && stateSettersRef.current.isListening) {
        try {
          recognitionRef.current.stop();
          console.log("MicButton: Recognition stopped on cleanup (component unmount/lang change).");
        } catch (e) {
          console.error("MicButton: Error stopping recognition during cleanup:", e);
        }
      }
    };
  }, [lang]); 

  const handleMicToggle = useCallback(() => {
    if (!SpeechRecognitionAPI || disabled) {
      if (!SpeechRecognitionAPI) {
        alert("Speech Recognition API is not supported in this browser. Please use a compatible browser like Chrome, Edge, or Firefox.");
      }
      return;
    }

    if (recognitionRef.current) {
      if (isListening) {
        console.log("MicButton: User clicked to STOP. Current state isListening:", isListening);
        try {
          recognitionRef.current.stop();
          setIsListening(false);
          onListeningChange && onListeningChange(false); 
          onManualStop && onManualStop();
          console.log("MicButton: State set to not listening. Waiting for onend confirmation.");
        } catch (e) {
          console.error("MicButton: Error trying to stop recognition:", e);
          alert("Could not stop microphone. Please try refreshing the page.");
          setIsListening(false);
          onListeningChange && onListeningChange(false);
        }
      } else {
        console.log("MicButton: User clicked to START. Current state isListening:", isListening);
        try {
          if (recognitionRef.current && recognitionRef.current.state === 'listening') {
             recognitionRef.current.abort();
          }
          recognitionRef.current.start();
          setIsListening(true);
          onListeningChange && onListeningChange(true);
          console.log("MicButton: State set to listening. Recognition started.");
        } catch (e) {
          console.error("MicButton: Error trying to start recognition:", e);
          alert("Could not start microphone. Ensure permissions are granted and try again.");
        
          setIsListening(false);
          onListeningChange && onListeningChange(false);
        }
      }
    }
  }, [isListening, onListeningChange, onManualStop, disabled]);

  const buttonBgColor = isListening ? "#3498db" : ""; 

  return (
    <button
      onClick={handleMicToggle}
      className={`${className} flex items-center justify-center transition-colors duration-300 ease-in-out`}
      style={{
        backgroundColor: buttonBgColor,
        border: "none",
        cursor: "pointer",
      }}
      disabled={!SpeechRecognitionAPI || disabled}
    >
      {isListening ? (
        <MyCustomMicrophone className="size-5" color="black" /> 
      ) : (
        <MyCustomMicrophone className="size-5" color="white" /> 
      )}
    </button>
  );
};

export default MicButton;