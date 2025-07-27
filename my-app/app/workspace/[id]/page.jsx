"use client";
import { useEffect, useState, use } from "react";
import Image from "next/image";
import History from "@/app/components/History"; // Assuming this path is correct
import Code from "@/app/components/Code"; // Assuming this path is correct

export default function WorkspacePage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [idea, setIdea] = useState("");

  useEffect(() => {
    if (id) {
      // Handle the "new" ID for a new chat
      if (id === "new") {
        setIdea(""); // No initial idea for a new chat
      } else {
        const storedIdea = localStorage.getItem(`workspace-${id}`);
        if (storedIdea) {
          setIdea(storedIdea);
        } else {
          console.warn(`No idea found in local storage for ID: ${id}`);
          setIdea("Idea not found.");
        }
      }
    }
  }, [id]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 h-72 w-72 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-10 left-10 h-72 w-72 bg-blue-400/10 rounded-full blur-2xl " />
        <div className="absolute bottom-10 left-10 h-72 w-72 bg-blue-400/10 rounded-full blur-2xl " />
        <div className="absolute top-1 right-10 h-72 w-72 bg-blue-400/10 rounded-full blur-2xl " />
      </div>

      {/* Foreground Content */}
      <div className="relative z-20 h-full pt-2 w-full flex flex-col">
        <h1 className="p-3 text-2xl font-bold text-center">Velociti</h1>
        <div className="flex-1 flex  p-4">
          <History topic={idea} /> {/* History component receives topic */}
          {/* Pass both 'id' and 'initialIdea' to the Code component */}
          <Code id={id} initialIdea={idea} /> {/* <--- CRUCIAL CHANGE HERE */}
        </div>
      </div>
    </div>
  );
}
