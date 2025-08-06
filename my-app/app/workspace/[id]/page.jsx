// Filename: WorkspacePage.jsx
"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from 'next/navigation';
import History from "@/app/components/History";
import Code from "@/app/components/Code";
import Header2 from "@/app/components/Header2";
import axios from 'axios';

axios.defaults.withCredentials = true;

export default function WorkspacePage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [idea, setIdea] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [generatedFiles, setGeneratedFiles] = useState([]);

  useEffect(() => {
    if (id) {
      if (id === "new") {
        setIdea("");
      } else {
        const storedIdea = localStorage.getItem(`workspace-${id}`);
        if (storedIdea) {
          setIdea(storedIdea);
        } else {
          console.warn(`No idea found in local storage for ID: ${id}`);
          setIdea("Idea not found.");
        }
      }
    }
  }, [id]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/me');
        if (response.status === 200 && response.data) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        setIsConnected(false);
        console.warn("User not authenticated or backend is not running.", err);
      }
    };
    
    checkAuthStatus();
  }, []);

  const onUpload = async () => {
  // If no files are generated, add a dummy one
  let filesToUpload = generatedFiles;

  if (!repoUrl) {
    alert("❌ Please connect to a GitHub repo first.");
    return;
  }

  if (!generatedFiles || generatedFiles.length === 0) {
    filesToUpload = [
      {
        path: "dummy.txt",
        content: "This is a dummy file generated for testing upload functionality."
      }
    ];
  }

  setUploadStatus("loading");

  try {
    const response = await axios.post(
      'http://localhost:5000/api/upload-to-github',
      {
        repoUrl,
        generatedFiles: filesToUpload,
      },
      { withCredentials: true }
    );

    if (response.status === 200) {
      setUploadStatus("success");
      alert("✅ Files uploaded to GitHub!");
    } else {
      throw new Error(response.data.error || 'Upload failed with an unknown error.');
    }
  } catch (err) {
    console.error(err);
    setUploadStatus("error");
    alert(`❌ Upload failed. Details: ${err.message}`);
  }
};


  const handleConnectGithub = () => {
    window.location.href = `http://localhost:5000/auth/github?workspaceId=${id}`;
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-[-200px] h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-blue-400/20 blur-[180px]" />
        <div className="absolute top-1/2 right-[-200px] h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-purple-500/20 blur-[180px]" />
      </div>

      <div className="relative z-20 h-full pt-2 w-full flex flex-col">
        <Header2
          isConnected={isConnected}
          setIsConnected={setIsConnected}
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          onUpload={onUpload}
          uploadStatus={uploadStatus}
          setUploadStatus={setUploadStatus}
          onConnectGithub={handleConnectGithub}
        />
        <div className="flex-1 flex p-4">
          <History topic={idea} />
          <Code
            id={id}
            initialIdea={idea}
            setGeneratedFiles={setGeneratedFiles}
          />
        </div>
      </div>
    </div>
  );
}
