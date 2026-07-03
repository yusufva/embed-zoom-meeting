'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useCookies } from 'next-client-cookies';

interface JoinClientProps {
  hasConfig: boolean;
  sdkKeySnippet: string;
}

export default function JoinClient({ hasConfig, sdkKeySnippet }: JoinClientProps,) {
  const router = useRouter();
  const [meetingNumber, setMeetingNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState<'0' | '1'>('0'); // '0' = Participant, '1' = Host
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ loggedIn: boolean; email?: string; displayName?: string; zakToken?: string } | null>(null);
  const params = useSearchParams()
  const token = params.get('token');
  const cookies = useCookies()

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('/api/zoom/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          if (data.loggedIn) {
            if (data.displayName) setUserName(data.displayName);
            if (data.email) setUserEmail(data.email);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    }
    checkProfile();
  }, []);

  useEffect(() => {
    if (token) {
      cookies.set('zoom_access_token', token);
      // router.push('/meetings');
    }
  }, [token]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/zoom/profile?action=logout');
      if (res.ok) {
        setProfile({ loggedIn: false });
        setUserName('');
        setUserEmail('');
      }
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  const formatMeetingNumber = (val: string) => {
    // Remove all non-digits
    const clean = val.replace(/\D/g, '');
    // Keep max 11 digits
    return clean.slice(0, 11);
  };

  const handleMeetingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMeetingNumber(formatMeetingNumber(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!meetingNumber || meetingNumber.length < 9) {
      setError('Meeting ID must be a valid 9-11 digit number.');
      return;
    }

    if (!userName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    setLoading(true);

    // Build URL query parameters
    const params = new URLSearchParams({
      meetingNumber: meetingNumber.trim(),
      passcode: passcode.trim(),
      userName: userName.trim(),
      userEmail: userEmail.trim() || 'participant@example.com',
      role,
    });

    // Navigate to the secure meeting room
    router.push(`/meetings/room?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-16 bg-zinc-950 text-zinc-100 font-sans relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 shadow-xl shadow-black/40">
            <svg className="w-8 h-8 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
            Zoom Portal
          </h1>
          <p className="text-zinc-400 text-sm">
            Embed and join Zoom meetings natively in your app
          </p>
        </div>

        {/* Configuration status alert */}
        {!hasConfig && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-500/20 rounded-2xl text-amber-300 text-xs leading-relaxed flex gap-3 items-start shadow-lg">
            <svg className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <span className="font-bold">Missing SDK Key:</span> `ZOOM_SDK_KEY` or `ZOOM_SDK_SECRET` is not set in `.env.local`. Signature generation will fail.
            </div>
          </div>
        )}

        {/* OAuth Profile Status Alert */}
        {profile && (
          profile.loggedIn ? (
            <div className="mb-6 py-2.5 px-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-xs flex justify-between items-center shadow-lg animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected to Zoom as <strong className="text-zinc-200">{profile.email}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1 bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-500/20 text-emerald-300 rounded-full font-semibold transition cursor-pointer text-[10px]"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="mb-6 py-2.5 px-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-xs flex justify-between items-center shadow-lg animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span>Hosting meetings requires Zoom sign-in</span>
              </div>
              <a
                href="/meetings/create"
                className="px-2.5 py-1 bg-indigo-900/45 hover:bg-indigo-900 border border-indigo-500/20 text-indigo-300 rounded-full font-semibold transition cursor-pointer text-[10px]"
              >
                Sign In
              </a>
            </div>
          )
        )}

        {/* Join form card */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium animate-shake">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="meetingNumber" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Meeting ID
              </label>
              <input
                id="meetingNumber"
                type="text"
                value={meetingNumber}
                onChange={handleMeetingNumberChange}
                placeholder="e.g. 1234567890"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 text-sm shadow-inner"
                required
              />
            </div>

            <div>
              <label htmlFor="passcode" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Meeting Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode if required"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 text-sm shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="userName" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Your Display Name
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Name shown in meeting"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 text-sm shadow-inner"
                required
              />
            </div>

            <div>
              <label htmlFor="userEmail" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Email Address <span className="text-zinc-600">(Optional)</span>
              </label>
              <input
                id="userEmail"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 text-sm shadow-inner"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                Join Role
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('0')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold transition duration-200 cursor-pointer text-center ${role === '0'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                >
                  Participant
                </button>
                <button
                  type="button"
                  onClick={() => setRole('1')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold transition duration-200 cursor-pointer text-center ${role === '1'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                >
                  Host
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-xl shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Join Meeting</span>
              )}
            </button>
          </form>

          <div className="text-center mt-5 pt-3 border-t border-zinc-800/50">
            <a
              href="/meetings/create"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition inline-flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              Need to host? Create a meeting room &rarr;
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Powered by Zoom Meeting Web SDK v6
        </p>
      </div>
    </div>
  );
}
