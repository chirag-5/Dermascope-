import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'google-identity-script';

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

const GoogleLoginButton = ({ onSuccess, onError }) => {
  const buttonRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        setError('Google login is not configured.');
        return;
      }

      try {
        await loadGoogleScript();

        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await onSuccess(response.credential);
            } catch (err) {
              const message = err.response?.data?.message || err.message || 'Google sign-in failed';
              setError(message);
              onError?.(err);
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
        });
      } catch {
        setError('Unable to load Google sign-in.');
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [onError, onSuccess]);

  return (
    <div className="google-login-wrap">
      <div ref={buttonRef} />
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default GoogleLoginButton;