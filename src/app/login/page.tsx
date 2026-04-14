'use client';

import React from 'react';
import Auth from '@/components/Auth';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>
        <Auth />
      </div>
    </div>
  );
};

export default LoginPage;