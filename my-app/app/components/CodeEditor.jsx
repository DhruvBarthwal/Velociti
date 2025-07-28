"use client"; // This component needs client-side functionality

import React, { useState, useEffect, useRef } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from '@codesandbox/sandpack-react';

const CodeEditor = ({ topic, showCode }) => {
  const [generatedCodeFiles, setGeneratedCodeFiles] = useState(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [activeFile, setActiveFile] = useState(''); 

  const [mainSandpackFile, setMainSandpackFile] = useState('/index.jsx'); 

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

        // Determine the main file dynamically, prioritizing .jsx over .js
        let determinedMainFile = '/index.jsx'; // Default assumption for React apps

        if (filesForSandpack['/index.jsx']) {
          determinedMainFile = '/index.jsx';
        } else if (filesForSandpack['/index.js']) {
          determinedMainFile = '/index.js';
        } 
        // If no index file, check for App files, prioritizing .jsx
        else if (filesForSandpack['/App.jsx']) { 
          determinedMainFile = '/App.jsx';
        } else if (filesForSandpack['/App.js']) { 
          determinedMainFile = '/App.js';
        }

        // --- Client-side validation for "Hello World" content ---
        const appFileContent = filesForSandpack['/App.jsx'] || filesForSandpack['/App.js'];
        const isHelloWorld = appFileContent && (
            appFileContent.includes('return <h1>Hello world</h1>') ||
            appFileContent.includes('return <h1>Hello World</h1>') ||
            appFileContent.includes('return <div>Hello world</div>') ||
            appFileContent.includes('return <div>Hello World</div>')
        );

        console.log("CodeEditor: isHelloWorld detected (client-side):", isHelloWorld);

        if (isHelloWorld) {
            setCodeError("The AI generated a basic 'Hello World' app. Please try again with a more specific request for the application's functionality.");
            setGeneratedCodeFiles(null); // Clear files to prevent rendering "Hello World"
        } else {
            setGeneratedCodeFiles(filesForSandpack); 
            setMainSandpackFile(determinedMainFile); // Update the main file state
            console.log("CodeEditor: Generated code files set:", filesForSandpack);
            console.log("CodeEditor: Main Sandpack file set to:", determinedMainFile);
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

  // Define a base set of files that mimic a standard Create React App structure.
  // This ensures Sandpack has all expected files, and our generated ones override them.
  const defaultReactTemplateFiles = {
    '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
    <link href="https://cdn.tailwindcss.com/3.4.0/tailwind.min.css" rel="stylesheet">
    <style>
      /* Ensure Tailwind classes work immediately */
      .bg-blue-500 { background-color: #3b82f6 !important; }
      .text-white { color: #ffffff !important; }
      .p-4 { padding: 1rem !important; }
      .m-4 { margin: 1rem !important; }
      .rounded { border-radius: 0.25rem !important; }
      .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important; }
      .flex { display: flex !important; }
      .items-center { align-items: center !important; }
      .justify-center { justify-content: center !important; }
      .text-center { text-align: center !important; }
      .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
      .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
      .font-bold { font-weight: 700 !important; }
      .mb-4 { margin-bottom: 1rem !important; }
      .mt-4 { margin-top: 1rem !important; }
      .min-h-screen { min-height: 100vh !important; }
      .w-full { width: 100% !important; }
      .h-full { height: 100% !important; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="/index.jsx"></script>
  </body>
</html>`,
    '/index.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    '/App.js': `import App from './App.jsx';\nexport default App;`, 
    '/App.jsx': `import React from 'react';
function App() {
  return (
    <div className="App">
      <h1>Loading your AI-generated app...</h1>
      <p>If you see this for more than a moment, there might be an issue.</p>
    </div>
  );
}

export default App;`,
    '/package.json': `{
  "name": "react-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`
  };

  // Create a mutable copy of the default files
  const finalFilesForSandpack = { ...defaultReactTemplateFiles };

  // Merge generated files, overriding defaults.
  if (generatedCodeFiles) {
      // Always ensure App.jsx content is used, and put it into finalFilesForSandpack['/App.jsx']
      if (generatedCodeFiles['/App.jsx']) {
          finalFilesForSandpack['/App.jsx'] = generatedCodeFiles['/App.jsx'];
          console.warn("CodeEditor: Using AI-provided /App.jsx content.");
      } else if (generatedCodeFiles['/App.js']) {
          // If AI only provided App.js, use its content for App.jsx
          finalFilesForSandpack['/App.jsx'] = generatedCodeFiles['/App.js'];
          console.warn("CodeEditor: Using AI-provided /App.js content for /App.jsx.");
      }
      
      // Ensure /App.js is always a wrapper that imports from /App.jsx
      // This handles cases where AI might not provide an App.js, or provides a boilerplate one.
      finalFilesForSandpack['/App.js'] = `import App from './App.jsx';\nexport default App;`;
      console.warn("CodeEditor: Ensured /App.js is a wrapper for /App.jsx.");

      // Merge other generated files (index.jsx, index.css, etc.)
      for (const filename in generatedCodeFiles) {
          // Only merge if not App.jsx or App.js, as those are handled specifically above
          if (filename !== '/App.jsx' && filename !== '/App.js') {
              // Ensure index.jsx correctly imports from './App' (which resolves to App.js)
              if (filename === '/index.jsx' && generatedCodeFiles[filename].includes("import App from './App.jsx';")) {
                  // If AI already explicitly imported .jsx, keep it that way.
                  finalFilesForSandpack[filename] = generatedCodeFiles[filename];
                  console.warn("CodeEditor: AI-generated /index.jsx already imports from './App.jsx'.");
              } else if (filename === '/index.jsx' && generatedCodeFiles[filename].includes("import App from './App';")) {
                  // If AI imported without extension, ensure it resolves to our App.js wrapper.
                  finalFilesForSandpack[filename] = generatedCodeFiles[filename];
                  console.warn("CodeEditor: AI-generated /index.jsx imports from './App' (resolves to wrapper).");
              } else {
                  finalFilesForSandpack[filename] = generatedCodeFiles[filename];
              }
          }
      }
  }

  // --- NEW LOG: Final files being passed to SandpackProvider ---
  console.log("\n--- CodeEditor: FINAL FILES PASSED TO SANDPACKPROVIDER ---");
  console.log(JSON.stringify(finalFilesForSandpack, null, 2));
  console.log("--- END CodeEditor: FINAL FILES PASSED TO SANDPACKPROVIDER ---\n");

  // Log the main file being used
  console.log("CodeEditor: Sandpack mainFile option set to:", mainSandpackFile);
  console.log("CodeEditor: Sandpack template option set to: react"); // Log the template being used


  return (
    <div className="flex-1 h-full relative">
      <div className="flex-1 overflow-hidden rounded-lg h-full w-[400px]">
        <SandpackProvider 
          // CRITICAL CHANGE: Add a key prop that changes when files change.
          // This forces SandpackProvider to remount and re-initialize its internal bundler,
          // preventing stale "Hello World" states.
          key={JSON.stringify(generatedCodeFiles)} // Reverted to more robust key
          template="react" // Keeping "react" template for proper React/Tailwind bundling
          files={finalFilesForSandpack} // Use the merged and cleaned files here
          theme="dark"
          options={{
            showLineNumbers: true,
            showTabs: true,
            showConsole: true,
            showErrorScreen: true,
            showLoadingScreen: true,
            mainFile: mainSandpackFile, // Use the state variable for the main file
            activeFile: mainSandpackFile, // Explicitly set active file
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
