import React, { useState } from 'react';
import Chat from './Chat';
import CodeEditor from './CodeEditor';

const Code = ({ id, initialIdea }) => {
  const [showCode, setShowCode] = useState(true); // State for toggling code/preview view
  // New state to hold the user's request for code generation
  // Initialize with initialIdea if it's a valid string, otherwise empty
  const [userRequestForCode, setUserRequestForCode] = useState(
    initialIdea && initialIdea !== 'Idea not found.' ? initialIdea : ''
  );

  // Function to be passed to Chat.jsx to update the code generation topic
  const handleNewUserMessageForCode = (messageText) => {
    // Only update if the message is from the user and has content
    if (messageText && messageText.trim() !== '') {
      setUserRequestForCode(messageText);
    }
  };

  return (
    <div className='bg-white/10 backdrop-blur-2xl flex gap-4 p-3 h-[calc(100vh-100px)] w-full rounded-[12px] ml-6 mr-3 border border-white/30'>
      {/* Pass the new handler to Chat component */}
      <Chat
        id={id}
        initialIdea={initialIdea}
        onNewUserMessageForCode={handleNewUserMessageForCode} // <--- NEW PROP
      />

      {/* Container for CodeEditor with a fixed width */}
      <div className="flex flex-col relative w-full">
        {/* Toggle buttons for Code/Preview view */}
        <div className="absolute top-2 right-2 z-30 flex rounded-lg overflow-hidden">
          <button
            onClick={() => setShowCode(true)}
            className={`px-4 py-2 transition-all duration-300 ${
              showCode ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setShowCode(false)}
            className={`px-4 py-2 transition-all duration-300 ${
              !showCode ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Preview
          </button>
        </div>
        {/* Pass userRequestForCode as the topic prop to CodeEditor */}
        <CodeEditor topic={userRequestForCode} showCode={showCode} /> {/* <--- UPDATED PROP */}
      </div>
    </div>
  );
};

export default Code;
