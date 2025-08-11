'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/auth/me', {
        credentials: 'include',
      });

      if (!res.ok) {
        console.warn('UserProvider: Auth check responded with non-OK status:', res.status, res.statusText);
        setUser(null); // Explicitly set user to null
        return; // Exit early
      }

      const data = await res.json();
      console.log("UserProvider: Raw response data:", data); // Add this for thorough debugging

      if (data && data._id) { // Assuming _id is a reliable indicator of a user object
        setUser(data);
        console.log("UserProvider: User successfully loaded:", data);
      }
      // If your backend nests it like { user: { _id: ... } } then use:
      else if (data && data.user && data.user._id) {
        setUser(data.user);
        console.log("UserProvider: User successfully loaded (nested):", data.user);
      }
      else {
        // If data is empty or doesn't contain a valid user structure
        setUser(null);
        console.log("UserProvider: No valid user data found in response.");
      }
    } catch (error) {
      console.error('UserProvider: Auth check failed during fetch:', error);
      setUser(null); // On any fetch error, ensure user is null
    } finally {
      setLoading(false); // Always set loading to false after the fetch attempt completes (success or failure)
    }
  }, []);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUserStatus }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);