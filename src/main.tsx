import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import ClerkKeySetupScreen from './components/ClerkKeySetupScreen';

let PUBLISHABLE_KEY = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY || localStorage.getItem('clerk_temp_publishable_key');

if (PUBLISHABLE_KEY) {
  PUBLISHABLE_KEY = PUBLISHABLE_KEY.replace(/['"]/g, '').trim();
}

const isValidClerkKey = (key: string | null | undefined): boolean => {
  if (!key) return false;
  return (key.startsWith('pk_test_') || key.startsWith('pk_live_')) && key.length > 15;
};

const hasValidKey = isValidClerkKey(PUBLISHABLE_KEY);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {hasValidKey ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY!} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <ClerkKeySetupScreen />
    )}
  </StrictMode>,
);


