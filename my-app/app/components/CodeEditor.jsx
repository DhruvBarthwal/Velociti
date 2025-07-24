"use client"; // This component needs client-side functionality

import React, { useState, useEffect } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack, // To programmatically update files
} from '@codesandbox/sandpack-react';

// Import icons from lucide-react
import { Eye, Code } from 'lucide-react'; // Import Eye and Code icons

// Define a default template for Sandpack (e.g., React)
const reactTemplate = {
  files: {
    '/App.js': `
import React, { useState } from 'react';
import TodoList from './TodoList';

export default function App() {
  const [todos, setTodos] = useState(['Learn React', 'Build a Todo App']);

  return (
    <div className="App">
      <h1>My Todo List</h1>
      <TodoList todos={todos} />
    </div>
  );
}
`,
    '/TodoList.js': `
import React from 'react';

export default function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>{todo}</li>
      ))}
    </ul>
  );
}
`,
    '/index.js': `
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
`,
    '/styles.css': `
body {
  font-family: sans-serif;
  padding: 20px;
  background-color: #282c34;
  color: white;
}
.App {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  background-color: #1e2025;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
h1 {
  color: #61dafb;
  text-align: center;
  margin-bottom: 20px;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  background-color: #3a3f47;
  padding: 10px 15px;
  margin-bottom: 8px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
`,
  },
  template: 'react',
  theme: 'dark',
  options: {
    showLineNumbers: true,
    showTabs: true,
    showConsole: true,
    showErrorScreen: true,
    showLoadingScreen: true,
  },
};

const CodeEditor = ({ topic }) => {
  const [generatedCodeFiles, setGeneratedCodeFiles] = useState(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [codeError, setCodeError] = useState(null);
  // State for toggling between code editor and preview
  const [showCode, setShowCode] = useState(true); // true for code, false for preview

  // --- DEBUG LOG: Topic prop received by CodeEditor ---
  console.log("CodeEditor: Topic prop received:", topic);
  // --- END DEBUG LOG ---

  // Function to fetch code from the backend
  const fetchCode = async (currentTopic) => {
    // --- DEBUG LOG: currentTopic inside fetchCode ---
    console.log("CodeEditor: fetchCode called with topic:", currentTopic);
    // --- END DEBUG LOG ---

    if (!currentTopic || currentTopic === 'Idea not found.') {
      setGeneratedCodeFiles(null); // Clear code if topic is invalid
      // --- DEBUG LOG: Invalid topic, clearing code ---
      console.log("CodeEditor: Invalid topic, clearing code.");
      // --- END DEBUG LOG ---
      return;
    }

    setIsLoadingCode(true);
    setCodeError(null);

    try {
      // Call your NEW backend API endpoint for code generation
      const response = await fetch('http://localhost:5000/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: currentTopic }),
      });

      // --- DEBUG LOG: Raw response from backend ---
      console.log("CodeEditor: Raw response status:", response.status);
      console.log("CodeEditor: Raw response headers:", response.headers);
      // Clone the response to read it twice if needed (once for status, once for body)
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log("CodeEditor: Raw response text:", responseText);
      // --- END DEBUG LOG ---

      if (!response.ok) {
        let errorData = {};
        try {
            errorData = JSON.parse(responseText); // Try parsing as JSON if not ok
        } catch (e) {
            errorData = { message: responseText || 'Unknown error format' }; // Fallback to raw text
        }
        throw new Error(errorData.message || `Backend code generation error: ${response.status}`);
      }

      const data = JSON.parse(responseText); // Parse from the text we already read
      // --- DEBUG LOG: Parsed data from backend ---
      console.log("CodeEditor: Parsed data from backend:", data);
      // --- END DEBUG LOG ---

      // Assuming the backend returns an object like { files: { '/App.js': '...', '/index.js': '...' } }
      if (data.files && typeof data.files === 'object') {
        setGeneratedCodeFiles(data.files);
        // --- DEBUG LOG: Generated code files set ---
        console.log("CodeEditor: Generated code files set:", data.files);
        // --- END DEBUG LOG ---
      } else {
        throw new Error('Invalid code response from backend: missing or malformed "files" property.');
      }

    } catch (error) {
      console.error('CodeEditor: Error fetching code:', error);
      setCodeError(`Failed to generate code: ${error.message}. Please try again.`);
      setGeneratedCodeFiles(null); // Clear previous code on error
    } finally {
      setIsLoadingCode(false);
    }
  };

  useEffect(() => {
    // Trigger code generation when the topic changes
    fetchCode(topic);
  }, [topic]); // Dependency on topic

  // If no code is generated yet, show a loading or placeholder
  if (isLoadingCode) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/10 backdrop-blur-lg rounded-2xl text-white">
        <p>Generating code for "{topic}"...</p>
      </div>
    );
  }

  if (codeError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-red-800/20 backdrop-blur-lg rounded-2xl text-white p-4">
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
    <div className="flex-1 h-full relative"> {/* Make this container relative for absolute positioning */}
      <div className="absolute right-0 z-30 flex rounded-[10px] overflow-hidden shadow-lg"> {/* Single button container */}
        <button
          onClick={() => setShowCode(!showCode)} // Toggle showCode state
          className="p-3 bg-zinc-700 text-white rounded-[6px] transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {showCode ? <Eye size={15} /> : <Code size={15} />} {/* Conditional icon */}
        </button>
      </div>
      <div className="flex-1 overflow-hidden rounded-lg"> {/* Add padding-top to account for button */}
        <SandpackProvider template="react" files={generatedCodeFiles} theme="dark">
          <SandpackLayout>
            {/* Conditionally render CodeEditor or Preview with transitions */}
            {/* Added overflow-x-auto to ensure horizontal scrolling for code editor */}
            <div className={`transition-opacity h-[530px] w-full duration-500 ${showCode ? 'opacity-100 block' : 'opacity-0 hidden'} overflow-x-auto`}>
              <SandpackCodeEditor className='h-full' />
            </div>
            <div className={`transition-opacity h-[530px] w-full rounded-[10px] duration-500 ${!showCode ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
              <SandpackPreview className='h-full' />
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
};

export default CodeEditor;
