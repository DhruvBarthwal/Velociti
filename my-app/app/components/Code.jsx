import React from 'react';
import Chat from './Chat'; // Assuming Chat.jsx is in the same directory
import CodeEditor from './CodeEditor'; // Assuming CodeEditor.jsx is in the same directory

// Code component now accepts 'id' and 'initialIdea' as props
const Code = ({ id, initialIdea }) => { // <--- Updated to accept 'id' and 'initialIdea'
  return (
    <div className='bg-white/10 backdrop-blur-2xl flex gap-4 p-3 h-[550px] w-[1090px] rounded-[12px] ml-6 '>
        {/* Pass 'id' and 'initialIdea' down to the Chat component */}
        <Chat id={id} initialIdea={initialIdea}/> {/* <--- Props passed to Chat */}
        {/* Pass 'initialIdea' (or 'topic') to CodeEditor if it needs it */}
        <CodeEditor topic={initialIdea}/> {/* <--- Props passed to CodeEditor */}
    </div>
  )
}

export default Code;
