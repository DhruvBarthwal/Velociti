'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('http://localhost:5000/auth/me', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.user) {
        router.replace('/'); 
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div className="p-4">Checking Auth...</div>;
  return children;
};

export default ProtectedRoute;
