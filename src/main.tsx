import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { applyTheme, loadPreferences } from '@/features/Users/Components/Profile/ProfilePreferencesTab';
import AppRouter from '@/router';
import '@/styles/app.css';
import '@/styles/legacy-redesign.css';

applyTheme(loadPreferences().theme);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

