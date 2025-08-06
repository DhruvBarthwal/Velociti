// Filename: Header2.jsx
import React, { useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa'; // Correct import for FaGithub
import { LuUpload, LuLoader2 } from 'lucide-react'; // 🚀 FIX: Correct import for LuUpload and LuLoader2

const Header2 = ({
  isConnected,
  setIsConnected,
  repoUrl,
  setRepoUrl,
  uploadStatus,
  setUploadStatus,
  onConnectGithub,
  onUpload
}) => {
  const [showConnectBox, setShowConnectBox] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  // Checks for a saved repo URL on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('repoUrl');
    if (savedUrl) {
      setRepoUrl(savedUrl);
      // setIsConnected(true); // This should be handled by WorkspacePage's auth check
    }
  }, [setRepoUrl]); // Removed setIsConnected from dependency array as it's handled by parent

  const handleConnectClick = () => {
    if (inputUrl) {
      localStorage.setItem('repoUrl', inputUrl);
      setRepoUrl(inputUrl);
      // setIsConnected(true); // This should be handled by WorkspacePage's auth check
      setShowConnectBox(false); // Close the box on successful connection
      setInputUrl('');
    }
  };

  return (
    <div className='header flex justify-between p-5 py-3 pb-1 relative'>
      <div className='ml-5'>
        <h1 className='font-semibold text-[30px]'>Velociti</h1>
      </div>

      <div className='mr-5 flex items-center gap-4 relative'>
        {/* Conditional rendering based on isConnected state from the parent */}
        {!isConnected ? (
          <button
            onClick={onConnectGithub}
            className='border p-2 flex justify-center items-center gap-2 rounded-[10px] cursor-pointer hover:bg-white hover:text-black hover:shadow-lg hover:transition duration-300'
          >
            <FaGithub /> Connect to GitHub
          </button>
        ) : (
          <button
            onClick={() => setShowConnectBox(!showConnectBox)}
            className='border border-white/20 p-2 bg-green-600 flex justify-center items-center gap-2 rounded-[10px] cursor-pointer hover:bg-white hover:text-black hover:shadow-lg hover:transition duration-300'
          >
            <FaGithub /> Sync with GitHub
          </button>
        )}

        {showConnectBox && isConnected && (
          <div className="absolute top-full right-0 mt-2 p-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl w-80 z-50">
            {repoUrl ? (
              <>
                <p className="text-sm text-zinc-400 mb-1">Connected to:</p>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-3 text-blue-400 hover:underline text-sm break-all"
                >
                  {repoUrl}
                </a>
                <button
                  onClick={onUpload}
                  disabled={uploadStatus === 'loading'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
                >
                  {uploadStatus === 'loading' ? (
                    <LuLoader2 className="animate-spin" />
                  ) : (
                    <>
                      <LuUpload />
                      Add Files
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400 mb-2">Enter GitHub Repo URL:</p>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="e.g., [https://github.com/user/repo](https://github.com/user/repo)"
                  className="w-full p-2 mb-2 rounded-lg bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleConnectClick}
                  disabled={!inputUrl}
                  className="w-full px-4 py-2 text-sm font-medium rounded-lg text-white bg-zinc-950 hover:bg-white hover:text-black disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
                >
                  Connect
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header2;
