"use client";

import React, { useState, useEffect } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";

const CodeEditor = ({ topic, showCode }) => {
  const [generatedCodeFiles, setGeneratedCodeFiles] = useState(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [mainSandpackFile, setMainSandpackFile] = useState("/index.jsx");

  const fetchCode = async (currentTopic) => {
    if (!currentTopic || currentTopic === "Idea not found.") {
      setGeneratedCodeFiles(null);
      return;
    }

    setIsLoadingCode(true);
    setCodeError(null);

    try {
      const response = await fetch("http://localhost:5000/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: currentTopic }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText || "Unknown error format" };
        }
        throw new Error(
          errorData.message ||
            `Backend code generation error: ${response.status}`
        );
      }

      const data = JSON.parse(responseText);

      if (data.files && typeof data.files === "object") {
        const filesForSandpack = { ...data.files };

        let determinedMainFile = "/index.jsx";

        if (filesForSandpack["/index.jsx"]) {
          determinedMainFile = "/index.jsx";
        } else if (filesForSandpack["/index.js"]) {
          determinedMainFile = "/index.js";
        } else if (filesForSandpack["/App.jsx"]) {
          determinedMainFile = "/App.jsx";
        } else if (filesForSandpack["/App.js"]) {
          determinedMainFile = "/App.js";
        }

        const appFileContent =
          filesForSandpack["/App.jsx"] || filesForSandpack["/App.js"];
        const isHelloWorld =
          appFileContent &&
          (appFileContent.includes("return <h1>Hello world</h1>") ||
            appFileContent.includes("return <h1>Hello World</h1>") ||
            appFileContent.includes("return <div>Hello world</div>") ||
            appFileContent.includes("return <div>Hello World</div>"));

        if (isHelloWorld) {
          setCodeError(
            "The AI generated a basic 'Hello World' app. Please try again with a more specific request for the application's functionality."
          );
          setGeneratedCodeFiles(null);
        } else {
          setGeneratedCodeFiles(filesForSandpack);
          setMainSandpackFile(determinedMainFile);
        }
      } else {
        throw new Error(
          'Invalid code response from backend: missing or malformed "files" property.'
        );
      }
    } catch (error) {
      setCodeError(
        `Failed to generate code: ${error.message}. Please try again.`
      );
      setGeneratedCodeFiles(null);
    } finally {
      setIsLoadingCode(false);
    }
  };

  useEffect(() => {
    fetchCode(topic);
  }, [topic]);

  if (isLoadingCode) {
    return (
      <div className="flex flex-col w-full h-full items-center text-center justify-center bg-white/10 backdrop-blur-lg rounded-2xl text-white">
        <div className="loader1"></div>
        <div className="text-[18px] text-white/20">Creating your template...</div>
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

  if (!generatedCodeFiles || Object.keys(generatedCodeFiles).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/10 backdrop-blur-lg rounded-2xl text-white">
        <p>Enter a topic in the chat to generate code.</p>
      </div>
    );
  }

  const defaultReactTemplateFiles = {
    "/index.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    "/App.js": `import App from './App.jsx';\nexport default App;`,
    "/App.jsx": `import React from 'react';
function App() {
  return (
    <div className="App">
      <h1>Loading your AI-generated app...</h1>
      <p>If you see this for more than a moment, there might be an issue.</p>
    </div>
  );
}

export default App;`,
    "/package.json": `{
  "name": "react-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.4.2",
    "framer-motion": "^10.0.0",
    "react-icons": "^4.7.1",
    "react-slick": "^0.30.2",
    "slick-carousel": "^1.8.1",
    "@hookform/resolvers": "^3.3.4",
    "yup": "^1.3.3",
    "react-hook-form": "^7.51.3",
    "swiper": "^11.1.0",
    "lucide-react": "^0.258.0",
    "@heroicons/react": "^2.1.5",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "tailwindcss": "^3.3.3",
    "@headlessui/react": "^1.7.17",
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-tooltip": "^1.0.7",
    "zustand": "^4.4.1",
    "react-query": "^3.39.3",
    "axios": "^1.5.0",
    "d3": "^7.8.5",
    "recharts": "^2.8.0",
    "react-hook-form": "^7.46.1",
    "yup": "^1.2.0"
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
}`,
  };

  // Define an object with all image file paths and their Base64 content


  const finalFilesForSandpack = {
    ...defaultReactTemplateFiles,
  };

  if (generatedCodeFiles) {
    if (generatedCodeFiles["/App.jsx"]) {
      finalFilesForSandpack["/App.jsx"] = generatedCodeFiles["/App.jsx"];
    } else if (generatedCodeFiles["/App.js"]) {
      finalFilesForSandpack["/App.jsx"] = generatedCodeFiles["/App.js"];
    }

    finalFilesForSandpack[
      "/App.js"
    ] = `import App from './App.jsx';\nexport default App;`;

    for (const filename in generatedCodeFiles) {
      if (filename !== "/App.jsx" && filename !== "/App.js") {
        finalFilesForSandpack[filename] = generatedCodeFiles[filename];
      }
    }
  }

  return (
    <div className="flex-1 h-full relative">
      <div className="overflow-hidden rounded-lg h-full w-full">
        <SandpackProvider
          key={JSON.stringify(generatedCodeFiles)}
          template="react"
          files={finalFilesForSandpack}
          theme="dark"
          options={{
            showLineNumbers: true,
            showTabs: true,
            showConsole: true,
            showErrorScreen: true,
            showLoadingScreen: true,
            mainFile: mainSandpackFile,
            activeFile: mainSandpackFile,
            externalResources: ["https://cdn.tailwindcss.com"],
          }}
        >
          <SandpackLayout className="h-full w-full">
            {showCode && (
              <div className="h-[800px] flex-shrink-0 w-[150px]">
                <SandpackFileExplorer className="h-full" />
              </div>
            )}

            <div
              className={`
              transition-opacity duration-500 
              ${showCode ? "opacity-100 block" : "opacity-0 hidden"} 
              flex-1 h-full w-[200px]
            `}
            >
              <SandpackCodeEditor className="h-[800px] " />
            </div>

            <div
              className={`
              transition-opacity duration-500 scrollbar-hide 
              ${!showCode ? "opacity-100 block" : "opacity-0 hidden"} 
              h-[800px] w-full rounded-[10px] overflow-y-auto
            `}
            >
              <SandpackPreview className=" preview scrollbar-hide h-full " />
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
};

export default CodeEditor;