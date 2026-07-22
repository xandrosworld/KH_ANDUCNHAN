import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useBranding } from '../contexts/BrandingContext';

function readCallbackParams(): URLSearchParams {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const query = window.location.search.startsWith('?') ? window.location.search.slice(1) : window.location.search;
  return new URLSearchParams(hash || query);
}

export default function OAuthCallbackPage() {
  const { logoUrl, siteName } = useBranding();
  const params = useMemo(() => readCallbackParams(), []);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token') || '';
    const callbackError = params.get('error') || '';

    if (callbackError) {
      setError(callbackError);
      return;
    }

    if (!token) {
      setError('Khong nhan duoc phien dang nhap. Vui long thu lai.');
      return;
    }

    localStorage.setItem('svp_token', token);
    localStorage.removeItem('svp_active_role');
    window.history.replaceState(null, '', '/oauth/callback');
    window.location.replace('/select-role');
  }, [params]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8f2] px-4 py-8 text-[#25202a]">
      <section className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-[0_18px_60px_rgba(88,40,20,0.12)]">
        <img src={logoUrl} alt={siteName} className="mx-auto mb-4 h-14 w-14 rounded-full object-contain" />
        {error ? (
          <>
            <h1 className="text-xl font-black text-[#c40012]">Chua dang nhap duoc</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#626976]">{error}</p>
            <a
              href="/"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#c40012] px-5 text-sm font-black text-white"
            >
              Quay lai dang nhap
            </a>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c40012]" />
            <h1 className="mt-4 text-xl font-black">Dang hoan tat dang nhap</h1>
            <p className="mt-2 text-sm font-semibold text-[#626976]">Vui long doi trong giay lat...</p>
          </>
        )}
      </section>
    </main>
  );
}
