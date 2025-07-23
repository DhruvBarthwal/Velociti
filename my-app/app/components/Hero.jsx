'use client';
import React, { useState, useEffect } from 'react';
import { GrSend } from "react-icons/gr";
import SigninDialog from './SigninDialog';

const Hero = () => {
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSendClick = ()=>{
    if(text.trim().length>0){
      setOpenDialog(true);
    }
  };

  return (
    <div className="h-full w-full pb-30 flex flex-col justify-center items-center">
      {/* Title */}
      <div
        className={`flex flex-col items-center gap-3 text-center transition-all duration-700 ease-out ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <h1 className="text-3xl font-semibold">What’s brewing in your mind today?</h1>
        <h1 className="text-[18px]">Build it now!</h1>
      </div>

      {/* Textarea Box */}
      <div
        className={`relative mt-6 w-[600px] h-[150px] bg-white/20 backdrop-blur-md rounded-[10px] py-3 pl-3 pr-3 shadow-md transition-all duration-700 ease-out ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <textarea
          placeholder="Start typing your idea..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full bg-transparent outline-none text-white placeholder:text-white/70 resize-none custom-scroll"
        />

        {/* Show Send Button Only When Text Exists */}
        {text.trim().length > 0 && (
          <div
            onClick={handleSendClick} 
            className="absolute bottom-2 right-2 bg-green-800 p-3 cursor-pointer rounded-[10px] hover:bg-green-700 transition">
            <GrSend className="size-5" />
          </div>
        )}
      </div>
      <SigninDialog open={openDialog} onClose={()=>setOpenDialog(false)}/>
    </div>
  );
};

export default Hero;
