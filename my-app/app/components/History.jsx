"use client";
import React, { useEffect, useState } from 'react';
import { IoHomeOutline } from "react-icons/io5";
import { RiChatNewLine } from "react-icons/ri";
import Link from 'next/link';

const History = () => {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const loadTopics = () => {
      const loadedTopics = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('workspace-')) {
          const id = key.replace('workspace-', '');
          const content = localStorage.getItem(key);
          if (content) {
            loadedTopics.push({ id, content });
          }
        }
      }
      setTopics(loadedTopics.sort((a, b) => b.id.localeCompare(a.id)));
    };

    loadTopics();
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg border-white/30 shadow-lg p-4 h-[550px] w-[170px] rounded-2xl ml-6 text-white flex flex-col">
      <div className="mb-4 flex flex-col gap-2">
        <h1 className="text-[12px] font-semibold mb-2 opacity-70">MAIN MENU</h1>
        <Link href="/" className=" text-sm mb-1 flex  items-center gap-3 hover:text-gray-300 transition-colors">
           <IoHomeOutline /> Home
        </Link>
        <Link href="/workspace/new" className="flex items-center gap-3 text-sm hover:text-gray-300 transition-colors">
          <RiChatNewLine /> New Chat
        </Link>
      </div>

      <div className="flex-grow mt-6 overflow-y-auto custom-scroll">
        <h1 className="text-[12px] font-semibold mb-2 opacity-70">CHATS</h1>
        {topics.length > 0 ? (
          <ul className="space-y-2">
            {topics.map((topic) => (
              <li key={topic.id} className="text-sm truncate hover:text-gray-300 transition-colors">
                <Link href={`/workspace/${topic.id}`}>
                  {topic.content.length > 20 ? `${topic.content.substring(0, 17)}...` : topic.content}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs opacity-60">No chats yet.</p>
        )}
      </div>
    </div>
  );
};

export default History;
