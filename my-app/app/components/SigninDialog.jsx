"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SigninDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-white">
        <DialogHeader>
          <DialogTitle>Sign in with Google</DialogTitle>
          <DialogDescription>
            Please sign in to continue building your AI project.
          </DialogDescription>

          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={() => {
              window.open("http://localhost:5000/auth/google", "_self");
              console.log("Trigger Google Sign-In");
              onClose(false);
            }}
          >
            Sign in with Google
          </button>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default SigninDialog;
