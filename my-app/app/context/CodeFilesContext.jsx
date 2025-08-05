import React, { createContext, useContext, useState } from 'react';

const CodeFilesContext = createContext();

export const CodeFilesProvider = ({ children }) => {
  const [generatedFiles, setGeneratedFiles] = useState({});

  return (
    <CodeFilesContext.Provider value={{ generatedFiles, setGeneratedFiles }}>
      {children}
    </CodeFilesContext.Provider>
  );
};

export const useCodeFiles = () => useContext(CodeFilesContext);