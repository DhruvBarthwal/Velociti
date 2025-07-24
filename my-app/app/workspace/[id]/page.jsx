'use client'
import { useEffect, useState, use } from "react"; 
import Chat from "@/app/components/Chat";
import Code from "@/app/components/Code";
export default function WorkspacePage({ params }) {
    const resolvedParams = use(params); 
    const id = resolvedParams.id; 

    const [idea, setIdea] = useState('');

    useEffect(() => {
        if (id) {
            const storedIdea = localStorage.getItem(`workspace-${id}`);
            if (storedIdea) {
                setIdea(storedIdea);
            } else {
                console.warn(`No idea found in local storage for ID: ${id}`);
                setIdea('Idea not found.');
            }
        }
    }, [id]);

    return (
        <div className="">
            <h1 className="p-3 text-2xl font-bold text-center">Velociti</h1>
            <Chat topic = {id}/>
            <Code topic = {id}/>
        </div>
    );
}