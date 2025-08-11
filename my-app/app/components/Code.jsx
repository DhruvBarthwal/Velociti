import React, { useState } from 'react';
import Chat from './Chat';
import CodeEditor from './CodeEditor';



const Code = ({ id, initialIdea, setGeneratedFiles }) => {
  const [showCode, setShowCode] = useState(true); // State for toggling code/preview view
  // State to hold the user's request for code generation
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

  // Handler for the custom toggle's change event
  const handleToggleChange = (event) => {
    // If the checkbox is checked, it means we want to show the preview (showCode = false)
    // If the checkbox is unchecked, it means we want to show the code (showCode = true)
    setShowCode(!event.target.checked);
  };

  return (
    <div className='bg-white/10 backdrop-blur-2xl flex gap-4 p-3 h-[calc(100vh-100px)] w-full rounded-[12px] ml-6 mr-3 border border-white/30'>
      <Chat
        id={id}
        initialIdea={initialIdea}
        onNewUserMessageForCode={handleNewUserMessageForCode}
      />

      {/* Container for CodeEditor */}
      <div className="flex flex-col relative w-full">
        {/* Custom Toggle for Code/Preview view */}
        <div className="absolute top-1 right-1 z-30"> 
          <div className="container">
            <input
              type="checkbox"
              name="checkbox"
              id="checkbox"
              // The checkbox is 'checked' when we are showing the preview (showCode is false)
              checked={!showCode}
              onChange={handleToggleChange}
            />
            <label htmlFor="checkbox" className="label">
              <div className="ball">
                {/* Conditionally render icon based on current view */}
                {showCode ? ( // If currently showing code, the toggle's "ball" shows the "Preview" eye icon
                  <span className="text-lg"></span>
                ) : ( // If currently showing preview, the toggle's "ball" shows the "Code" icon
                  <span className="text-sm"></span>
                )}
              </div>
            </label>
          </div>
        </div>


        <CodeEditor
          topic={userRequestForCode}
          showCode={showCode}
          setGeneratedFiles={setGeneratedFiles}
        />
      </div>
    </div>
  );
};

export default Code;
