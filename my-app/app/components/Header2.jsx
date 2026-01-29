import React from 'react';
import { FaGithub } from 'react-icons/fa'; 
import { useUser } from '@/app/context/UserProvider';



const Header2 = ({ onConnectGithub }) => {
  const { user } = useUser();
  const profileImageUrl = user?.picture || "/images.png";

  return (
    <div className='header flex justify-between p-5 py-3 pb-1 relative'>
      <div className='ml-5'>
        <h1 className='velo font-semibold text-[30px] italic'>Velociti</h1>
      </div>

      <div className='mr-5 flex items-center gap-4 relative'>
        {user? (
        <div className="flex items-center gap-6">
          <img
            src={profileImageUrl}
            alt={user?.name ? `${user.name}'s profile` : "Profile"}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images.png"; 
            }}
          />
          <span className="text-white font-medium">{user?.name}</span>
        </div>
        ) : (
          <button
            onClick={onConnectGithub}
            className="border p-2 flex justify-center items-center gap-2 rounded-[10px] cursor-pointer hover:bg-white hover:text-black hover:shadow-lg hover:transition duration-300"
          >
            <FaGithub /> Connect to GitHub
          </button>
        )}
      </div>
    </div>
  );
};

export default Header2;
