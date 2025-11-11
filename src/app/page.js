'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from "./components/Login";
import { CircularProgress, Box } from '@mui/material';

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in, redirect to dashboard if so
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.emp_id) {
            // User is logged in, redirect to dashboard
            router.push('/dashboard');
            return;
          }
        }
        // User not logged in, show login page
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    
    // Listen for storage changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [router]);

  const handleLoginSuccess = (userData) => {
    console.log('Login successful:', userData);
    // Save user data to localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    // Navigate to dashboard after successful login
    router.push('/dashboard');
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
