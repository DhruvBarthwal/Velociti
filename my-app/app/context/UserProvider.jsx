// app/context/UserProvider.js
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
        // If the response is not OK (e.g., 401 Unauthorized, 403 Forbidden), it means no active session or an error
        console.warn('UserProvider: Auth check responded with non-OK status:', res.status, res.statusText);
        setUser(null); // Explicitly set user to null
        return; // Exit early
      }

      const data = await res.json();
      console.log("UserProvider: Raw response data:", data); // Add this for thorough debugging

      // THIS IS THE CRITICAL PART TO VERIFY
      // Your previous console.log "Fetched user: {_id: ...}" suggested the user object was `data` itself.
      // If your backend responds with just the user object, then `data` is correct.
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