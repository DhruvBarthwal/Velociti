"use client"; // This component needs client-side functionality

import React, { useState, useEffect, useRef } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from '@codesandbox/sandpack-react';

// Removed the reactTemplate constant entirely, as we will dynamically provide files.

const CodeEditor = ({ topic, showCode }) => {
  const [generatedCodeFiles, setGeneratedCodeFiles] = useState(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [activeFile, setActiveFile] = useState(''); // State to manage which file is currently displayed

  console.log("CodeEditor: Topic prop received:", topic);

  // Function to fetch code from the backend
  const fetchCode = async (currentTopic) => {
    console.log("CodeEditor: fetchCode called with topic:", currentTopic);

    if (!currentTopic || currentTopic === 'Idea not found.') {
      setGeneratedCodeFiles(null);
      console.log("CodeEditor: Invalid topic, clearing code.");
      return;
    }

    setIsLoadingCode(true);
    setCodeError(null);
    setActiveFile(''); // Reset active file when fetching new code

    try {
      const response = await fetch('http://localhost:5000/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: currentTopic }),
      });

      console.log("CodeEditor: Raw response status:", response.status);
      const responseText = await response.text();
      console.log("CodeEditor: Raw response text:", responseText);

      if (!response.ok) {
        let errorData = {};
        try {
            errorData = JSON.parse(responseText); 
        } catch (e) {
            errorData = { message: responseText || 'Unknown error format' }; 
        }
        throw new Error(errorData.message || `Backend code generation error: ${response.status}`);
      }

      const data = JSON.parse(responseText); 
      console.log("CodeEditor: Parsed data from backend:", data);

      if (data.files && typeof data.files === 'object') {
        const filesForSandpack = { ...data.files }; 

        // Determine the main file dynamically
        let mainFile = '/index.jsx'; // Default assumption for React apps
        if (filesForSandpack['/index.js']) {
          mainFile = '/index.js';
        } else if (filesForSandpack['/index.jsx']) {
          mainFile = '/index.jsx';
        } else if (filesForSandpack['/App.js']) { 
          mainFile = '/App.js';
        } else if (filesForSandpack['/App.jsx']) { 
          mainFile = '/App.jsx';
        }

        // --- NEW: Client-side validation for "Hello World" content ---
        const appFileContent = filesForSandpack['/App.jsx'] || filesForSandpack['/App.js'];
        const isHelloWorld = appFileContent && (
            appFileContent.includes('return <h1>Hello world</h1>') ||
            appFileContent.includes('return <h1>Hello World</h1>') ||
            appFileContent.includes('return <div>Hello world</div>') ||
            appFileContent.includes('return <div>Hello World</div>')
        );

        console.log("CodeEditor: isHelloWorld detected:", isHelloWorld);
        // --- END NEW ---

        if (isHelloWorld) {
            setCodeError("The AI generated a basic 'Hello World' app. Please try again with a more specific request for the application's functionality.");
            setGeneratedCodeFiles(null); // Clear files to prevent rendering "Hello World"
        } else {
            setGeneratedCodeFiles(filesForSandpack); 
            setMainSandpackFile(mainFile); 
            console.log("CodeEditor: Generated code files set:", filesForSandpack);
        }
      } else {
        throw new Error('Invalid code response from backend: missing or malformed "files" property.');
      }

    } catch (error) {
      console.error('CodeEditor: Error fetching code:', error);
      setCodeError(`Failed to generate code: ${error.message}. Please try again.`);
      setGeneratedCodeFiles(null); 
    } finally {
      setIsLoadingCode(false);
    }
  };

  const [mainSandpackFile, setMainSandpackFile] = useState('/index.jsx'); 

  useEffect(() => {
    fetchCode(topic);
  }, [topic]);

  // If no code is generated yet, show a loading or placeholder
  if (isLoadingCode) {
    return (
      <div className="flex-1 flex w-full items-center text-center justify-center bg-white/10 backdrop-blur-lg rounded-2xl text-white">
        <p>Generating code for "{topic}"...</p>
      </div>
    );
  }

  if (codeError) {
    return (
      <div className="flex-1 flex items-center text-center justify-center bg-red-800/20 backdrop-blur-lg rounded-2xl text-white p-4">
        <p className="text-red-300">{codeError}</p>
      </div>
    );
  }

  // If no code generated and not loading/error, show initial message
  if (!generatedCodeFiles || Object.keys(generatedCodeFiles).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/10 backdrop-blur-lg rounded-2xl text-white">
        <p>Enter a topic in the chat to generate code.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full relative">
      <div className="flex-1 overflow-hidden rounded-lg h-full w-full">
        <SandpackProvider 
          template="react" 
          files={generatedCodeFiles} 
          theme="dark"
          options={{
            showLineNumbers: true,
            showTabs: true,
            showConsole: true,
            showErrorScreen: true,
            showLoadingScreen: true,
            mainFile: mainSandpackFile, 
          }}
        >
          <SandpackLayout className="flex-1 h-full w-full">
            <div className={`transition-opacity flex-1 w-full duration-500 ${showCode ? 'opacity-100 block' : 'opacity-0 hidden'} overflow-x-auto overflow-y-auto`}>
              <SandpackCodeEditor className='h-full' />
            </div>
            <div className={`transition-opacity h-[530px] w-full rounded-[10px] duration-500 ${!showCode ? 'opacity-100 block' : 'opacity-0 hidden'} overflow-y-auto`}>
              <SandpackPreview className='h-full' />
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
};

export default CodeEditor;
