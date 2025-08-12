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
    <div className="history bg-white/5  backdrop-blur-lg  scrollbar-hide shadow-lg p-4 h-[calc(100vh-65px)] w-[220px]  text-white flex flex-col font-sans">
      <div className=" flex flex-col gap-2">
        <h1 className="text-xs font-semibold tracking-wider mb-2 text-white/80">MAIN MENU</h1>
        <Link href="/" className="text-sm font-medium flex items-center gap-3 hover:text-gray-300 transition-colors">
          <IoHomeOutline /> Home
        </Link>
        <Link href="/workspace/new" className="text-sm font-medium flex items-center gap-3 hover:text-gray-300 transition-colors">
          <RiChatNewLine /> New Chat
        </Link>
      </div>

      <div className="flex-grow mt-6 overflow-y-auto scrollbar-hide">
        <h1 className="text-xs font-semibold tracking-wider mb-2 text-white/70">CHATS</h1>
        {topics.length > 0 ? (
          <ul className="space-y-2">
            {topics.map((topic) => (
              <li key={topic.id} className="text-sm font-medium truncate hover:text-gray-300 transition-colors">
                <Link href={`/workspace/${topic.id}`}>
                  {topic.content.length > 20 ? `${topic.content.substring(0, 23)}...` : topic.content}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs font-light opacity-50">No chats yet.</p>
        )}
      </div>
    </div>
  );
};

export default History;
