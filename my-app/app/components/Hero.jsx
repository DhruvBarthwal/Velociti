"use client";
import React, { useState, useEffect } from "react";
import { GrSend } from "react-icons/gr";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import SigninDialog from "./SigninDialog";
import { useUser } from "../context/UserProvider";
import { useTypewriter, Cursor } from "react-simple-typewriter";

const Hero = () => {
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const saveToLocal = (id, content) => {
    localStorage.setItem(`workspace-${id}`, content);
  };

  const handleSendClick = () => {
    if (text.trim().length === 0) {
      return;
    }

    // This check is now the absolute final guard before proceeding.
    // If loading is true, we still explicitly return.
    // If loading is false but user is null, we open the dialog.
    if (loading || !user) {
      setOpenDialog(true);
      console.log("Authentication not complete or no user found, opening sign-in dialog.");
      return;
    }

    console.log("User authenticated, proceeding to workspace.");
    const id = nanoid();
    saveToLocal(id, text);
    router.push(`/workspace/${id}`);
  };

  const [random]= useTypewriter({
    words: ['todo list ','budget tracker app','gym calories tracker'],
    loop: {},
  });

  // Determine if the send button should be enabled and what its style should be
  const isSendButtonEnabled = !loading && text.trim().length > 0;
  const sendButtonClass = `absolute bottom-2 right-2 p-3 cursor-pointer rounded-[10px] transition ${
    isSendButtonEnabled
      ? (user ? "bg-green-800 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-500")
      : "bg-gray-400 cursor-not-allowed opacity-50" // Dim and disable if not enabled
  }`;

  return (
    <div className="h-full w-full pb-40 flex flex-col justify-center items-center">
      {/* Title */}
      <div
        className={`flex flex-col items-center gap-3 mb-3 font-md leading-15 text-[70px] text-center transition-all duration-700 ease-out ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <h1>Build with a prompt</h1>
        <h1 className="text-[30px]">Say it. Ship it.</h1>
      </div>

      {/* Textarea Box */}
      <div
        className={`relative mt-6 w-[600px] h-[60px] bg-white rounded-[12px] py-3 pl-3 pr-3 shadow-md transition-all duration-700 ease-out ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <textarea
          placeholder={loading ? "Checking authentication..." : `Create a ${random}`}
          value={text}
          disabled={loading} // Keep disabled while loading
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full pt-1 bg-white text-black outline-none placeholder: resize-none custom-scroll placeholder:text-black placeholder:text-[17px]"
        />

        {/* Unified Send Button */}
        {text.trim().length > 0 && ( // Only show if there's text
          <div
            onClick={isSendButtonEnabled ? handleSendClick : undefined} // Only assign onClick if enabled
            className={sendButtonClass}
          >
            <GrSend className="size-5" />
          </div>
        )}
      </div>

      <SigninDialog open={openDialog} onClose={() => setOpenDialog(false)} />
    </div>
  );
};

export default Hero;