// Start of the website: connects the router, messages, login state and the app shell.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/app/App.jsx';
import { isConfigured } from '@/core/supabase/client.js';
import { AuthProvider } from '@/core/auth/AuthContext.jsx';
import { ToastProvider } from '@/core/toast/ToastContext.jsx';
import './index.css';

function MissingConfig() {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-xl bg-white rounded-2xl shadow p-8 border border-amber-200">
        <h1 className="text-xl font-bold text-amber-700">Supabase is not connected yet</h1>
        <p className="mt-3 text-slate-600">
          The website could not find its two settings. In Vercel open your project, then
          <b> Settings → Environment Variables</b>, and add:
        </p>
        <pre className="mt-3 bg-slate-100 rounded p-3 text-sm overflow-x-auto">VITE_SUPABASE_URL{'\n'}VITE_SUPABASE_PUBLISHABLE_KEY</pre>
        <p className="mt-3 text-slate-600">Then open <b>Deployments → Redeploy</b>.</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    ) : (
      <MissingConfig />
    )}
  </React.StrictMode>
);
