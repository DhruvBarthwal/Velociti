"use client";
import React, { useState, useEffect, useRef } from "react";
import { GrSend } from "react-icons/gr";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import SigninDialog from "./SigninDialog";
import { useUser } from "../context/UserProvider";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import { motion } from "framer-motion";

import MicButton from "../components/MicButton"; 

const Hero = () => {
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState(""); 
  const [openDialog, setOpenDialog] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();
  const { user, loading } = useUser();

  const [isMicListening, setIsMicListening] = useState(false); 
  const textAreaRef = useRef(null); 

  const [random] = useTypewriter({
    words: ["todo list ", "budget tracker app", "gym calories tracker"],
    loop: {},
  });
  const defaultPlaceholder = loading
    ? "Checking authentication..."
    : `Create a ${random}`;
  const [currentPlaceholder, setCurrentPlaceholder] =
    useState(defaultPlaceholder);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentPlaceholder(
      loading ? "Checking authentication..." : `Create a ${random}`
    );
  }, [loading, random]); 

  const saveToLocal = (id, content) => {
    localStorage.setItem(`workspace-${id}`, content);
  };

  const handleSendClick = () => {
    if (text.trim().length === 0) {
      return; 
    }

    if (loading || !user) {
      setOpenDialog(true);
      console.log(
        "Authentication not complete or no user found, opening sign-in dialog."
      );
      return;
    }

    console.log("User authenticated, showing loader...");
    setShowLoader(true);
    const id = nanoid();
    saveToLocal(id, text);

    setTimeout(() => {
      setShowLoader(false);
      router.push(`/workspace/${id}`);
    }, 4000);
  };

  const handleMicTranscriptReady = (transcript) => {
    setText((prevText) => prevText + (prevText ? " " : "") + transcript);

    if (textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(
        textAreaRef.current.value.length,
        textAreaRef.current.value.length
      );
    }
  };

  const handleMicListeningChange = (listeningStatus) => {
    setIsMicListening(listeningStatus);
  };

  const handleMicManualStop = () => {
    console.log(
      "Mic manually stopped by user. Clearing text and resetting placeholder."
    );
    setText(""); 
    setCurrentPlaceholder(defaultPlaceholder); 

    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };


  const isSendButtonEnabled = !loading && text.trim().length > 0;

  const isMicButtonActuallyEnabled =
    !loading && text.trim().length === 0 && !isMicListening;


  const buttonContainerClass = `absolute bottom-2 right-2 p-3 rounded-[10px] cursor-pointer`;

  let buttonBackgroundColorClass = "";
  if (text.trim().length > 0) {

    buttonBackgroundColorClass = isSendButtonEnabled
      ? user
        ? "bg-green-800 hover:bg-green-700"
        : "bg-gray-600 hover:bg-gray-500"
      : "bg-gray-400 cursor-not-allowed opacity-50";
  } else {

    buttonBackgroundColorClass = isMicButtonActuallyEnabled
      ? user
        ? "bg-black hover:bg-zinc-800"
        : "bg-gray-600 hover:bg-gray-500"
      : "bg-gray-400 cursor-not-allowed opacity-50";
  }

  return (
    <div className="h-full w-full pb-40 flex flex-col justify-center items-center">
      {showLoader ? (
        <div className="mt-5 flex flex-col items-center gap-2">
          <div className="loader"></div>{" "}
          <p className="text-lg mt-25 font-semibold text-gray-700">
            Loading...
          </p>
        </div>
      ) : (
        <>
          <div
            className={`flex flex-col items-center gap-3 mb-3 font-md leading-15 text-[70px] text-center transition-all duration-700 ease-out ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="flex justify-center items-center">
              <h1 className="font-semibold">Build with a </h1>
              <motion.span
                initial={{ width: 0 , opacity:0}}
                animate={{ width: '18vw', opacity:1 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
                style={{ display: "inline-block", transformOrigin: "left" }}
                className="inline-block bg-amber-500 text-black px-4 py-2 font-medium rounded-[15px] shadow-md ml-2 "
              >
                {" "}
                prompt
              </motion.span>
            </div>
            <h1 className="text-[23px]">
              The Smartest Way to Create Your Web Presence.
            </h1>
          </div>

          <div
            className={`relative mt-6 w-[600px] h-[100px] bg-white rounded-[12px] py-3 pl-3 pr-3 shadow-md transition-all duration-700 ease-out ${
              loaded ? "opacity-100 translate-y-0 " : "opacity-0 translate-y-10"
            }`}
          >
            <textarea
              ref={textAreaRef} 
              placeholder={currentPlaceholder} 
              value={text}
              disabled={loading}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-full pt-1 pr-12 scrollbar-hide bg-white text-black outline-none resize-none custom-scroll placeholder:text-black placeholder:text-[17px]"
            />

            {text.trim().length > 0 ? (
  
              <div
                onClick={isSendButtonEnabled ? handleSendClick : undefined}
                className={`${buttonContainerClass} ${buttonBackgroundColorClass}`}
              >
                <GrSend className="size-5" />
              </div>
            ) : (

              <MicButton
                onTranscriptReady={handleMicTranscriptReady}
                onListeningChange={handleMicListeningChange} 
                onManualStop={handleMicManualStop} 
                className={`${buttonContainerClass} ${buttonBackgroundColorClass}`}
                lang="en-US" 
                
                disabled={loading || isMicListening} 
              />
            )}
          </div>
        </>
      )}

      <SigninDialog open={openDialog} onClose={() => setOpenDialog(false)} />
    </div>
  );
};

export default Hero;
