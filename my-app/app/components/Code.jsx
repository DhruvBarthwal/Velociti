import React, { useState } from 'react';
import Chat from './Chat';
import CodeEditor from './CodeEditor';



const Code = ({ id, initialIdea, setGeneratedFiles }) => {
  const [showCode, setShowCode] = useState(true); 
  const [userRequestForCode, setUserRequestForCode] = useState(
    initialIdea && initialIdea !== 'Idea not found.' ? initialIdea : ''
  );

  const handleNewUserMessageForCode = (messageText) => {
    if (messageText && messageText.trim() !== '') {
      setUserRequestForCode(messageText);
    }
  };

  const handleToggleChange = (event) => {
    setShowCode(!event.target.checked);
  };

  return (
    <div className='bg-zinc-950 backdrop-blur-2xl flex gap-4 p-3 h-[calc(100vh-65px)] w-full'>
      <Chat
        id={id}
        initialIdea={initialIdea}
        onNewUserMessageForCode={handleNewUserMessageForCode}
      />

      <div className="flex flex-col relative w-full">
        <div className="absolute top-1 right-1 z-30"> 
          <div className="container">
            <input
              type="checkbox"
              name="checkbox"
              id="checkbox"
              checked={!showCode}
              onChange={handleToggleChange}
            />
            <label htmlFor="checkbox" className="label">
              <div className="ball">
                {showCode ? ( 
                  <span className="text-lg"></span>
                ) : ( 
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
