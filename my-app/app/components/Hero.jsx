"use client";
import React, { useState, useEffect } from "react";
import { GrSend } from "react-icons/gr";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import SigninDialog from "./SigninDialog";
import { useUser } from "../context/UserProvider";

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

  // Determine if the send button should be enabled and what its style should be
  const isSendButtonEnabled = !loading && text.trim().length > 0;
  const sendButtonClass = `absolute bottom-2 right-2 p-3 cursor-pointer rounded-[10px] transition ${
    isSendButtonEnabled
      ? (user ? "bg-green-800 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-500")
      : "bg-gray-400 cursor-not-allowed opacity-50" // Dim and disable if not enabled
  }`;

  return (
    <div className="h-full w-full pb-30 flex flex-col justify-center items-center">
      {/* Title */}
      <div
        className={`flex flex-col items-center gap-3 text-center transition-all duration-700 ease-out ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <h1 className="text-3xl font-semibold">
          What’s brewing in your mind today?
        </h1>
        <h1 className="text-[18px]">Build it now!</h1>
      </div>

      {/* Textarea Box */}
      <div
        className={`relative mt-6 w-[600px] h-[150px] bg-white/20 backdrop-blur-md rounded-[10px] py-3 pl-3 pr-3 shadow-md transition-all duration-700 ease-out ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <textarea
          placeholder={loading ? "Checking authentication..." : "Start typing your idea..."}
          value={text}
          disabled={loading} // Keep disabled while loading
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full bg-transparent outline-none text-white placeholder:text-white/70 resize-none custom-scroll disabled:opacity-50"
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