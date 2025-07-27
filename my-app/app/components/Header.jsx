"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserProvider";
import Image from "next/image";

const Header = () => {
  const { user, loading, refreshUser } = useUser();
  const router = useRouter();

  const handleSignIn = () => {
    window.open("http://localhost:5000/auth/google", "_self");
  };

  const handleSignOut = async () => {
    try {
      await fetch("http://localhost:5000/auth/logout", {
        method: "GET",
        credentials: "include",
      });
      await refreshUser();
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const profileImageUrl = user?.picture || "/images.png";

  return (
    <div className="flex justify-between p-5 items-center">
      <div>
        <h1 className="font-bold text-[30px]">Velociti</h1>
      </div>

      {loading ? (
        <div className="text-white">Loading user...</div>
      ) : user ? (
        <div className="flex items-center gap-4">
          <img
            src={profileImageUrl}
            alt={user?.name ? `${user.name}'s profile` : "Profile"}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images.png"; // Fallback to your local image
              // Removed the console.error here as the fallback is working as intended.
            }}
          />
          <span className="text-white font-medium">{user?.name}</span>
          <button
            onClick={handleSignOut}
            className="border border-white p-2 px-4 rounded-[10px] hover:bg-white hover:text-black hover:shadow-lg hover:transition duration-300"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="flex gap-5">
          <button
            onClick={handleSignIn}
            className="border border-white p-2 px-4 rounded-[10px] hover:bg-white hover:text-black hover:shadow-lg hover:transition duration-300"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
