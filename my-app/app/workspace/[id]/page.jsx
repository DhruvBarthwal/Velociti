'use client'
import { useEffect, useState, use } from "react";
import Image from "next/image";
import History from "@/app/components/History"; // Assuming this path is correct
import Code from "@/app/components/Code";     // Assuming this path is correct

export default function WorkspacePage({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [idea, setIdea] = useState('');

    useEffect(() => {
        if (id) {
            // Handle the "new" ID for a new chat
            if (id === 'new') {
                setIdea(''); // No initial idea for a new chat
            } else {
                const storedIdea = localStorage.getItem(`workspace-${id}`);
                if (storedIdea) {
                    setIdea(storedIdea);
                } else {
                    console.warn(`No idea found in local storage for ID: ${id}`);
                    setIdea('Idea not found.');
                }
            }
        }
    }, [id]);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black text-white">
            {/* Background Image */}
            <Image
                src="/pexels-dariuskrs-2609107.jpg"
                alt="Background"
                fill
                style={{ objectFit: 'cover' }}
                className="z-0"
            />

            {/* Optional dark overlay */}
            <div className="absolute inset-0 bg-black/50 z-10" />

            {/* Foreground Content */}
            <div className="relative z-20 h-full w-full flex flex-col">
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
