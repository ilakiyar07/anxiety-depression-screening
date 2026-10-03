import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Verifying administrative access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <h2 className="text-xl font-bold text-rose-800">Access Restricted</h2>
        <p className="text-rose-600 mt-2">
          Administrative privileges are required to view this portal.
        </p>
        <a href="/dashboard" className="inline-block mt-4 px-5 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition">
          Return to User Dashboard
        </a>
      </div>
    );
  }

  return children;
}
