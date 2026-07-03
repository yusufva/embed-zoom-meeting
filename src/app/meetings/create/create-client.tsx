'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCookies } from 'next-client-cookies';

interface CreateClientProps {
  hasToken: boolean;
  hasApiConfig: boolean;
  clientId: string;
  redirectUri: string;
}

export default function CreateClient({ hasToken, hasApiConfig, clientId, redirectUri }: CreateClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cookies = useCookies();
  
  const [topic, setTopic] = useState('Weekly Team Alignment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ loggedIn: boolean; email?: string; displayName?: string } | null>(null);
  const [meetingDetails, setMeetingDetails] = useState<{
    meetingNumber: string;
    passcode: string;
    topic: string;
    userName: string;
    userEmail: string;
    zakToken: string;
    isMock: boolean;
  } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [hasTokenState, setHasTokenState] = useState(hasToken);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      cookies.set('zoom_access_token', token);
      setHasTokenState(true);
      router.replace('/meetings/create');
    }
  }, [searchParams, cookies, router]);

  useEffect(() => {
    if (hasTokenState) {
      fetch('/api/zoom/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.loggedIn) {
            setProfile(data);
          }
        })
        .catch((err) => console.error('Failed to load profile', err));
    }
  }, [hasTokenState]);

  const handleOAuthRedirect = () => {
    if (!clientId) {
      setError('Client ID is missing. Please configure your ZOOM_API_CLIENT_ID or ZOOM_SDK_KEY.');
      return;
    }

    // Omit the &scope= parameter entirely to let Zoom inherit the saved scopes natively
    // We add state=create so that the callback route knows to redirect back to /meetings/create
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=create`;

    window.location.href = authUrl;
  };

  const handleCreate = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // console.log("handlecreate")
    // e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/zoom/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create meeting room.');
      }

      const data = await res.json();
      setMeetingDetails(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during meeting creation.');
    } finally {
      setLoading(false);
    }
  };

  const formatMeetingId = (id: string) => {
    // Formats 1234567890 into 123 456 7890
    return id.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1 $2 $3');
  };

  const getDirectJoinUrl = (role: 'host' | 'participant') => {
    if (!meetingDetails) return '';
    const name = role === 'host' ? meetingDetails.userName : 'Guest';
    const email = role === 'host' ? meetingDetails.userEmail : 'guest@example.com';
    const roleNum = role === 'host' ? '1' : '0';
    const zak = role === 'host' ? meetingDetails.zakToken : '';

    const params = new URLSearchParams({
      meetingNumber: meetingDetails.meetingNumber,
      passcode: meetingDetails.passcode,
      userName: name,
      userEmail: email,
      role: roleNum,
      zak,
    });

    return `${window.location.origin}/meetings/room?${params.toString()}`;
  };

  const handleCopyInvite = () => {
    if (!meetingDetails) return;

    const joinUrl = getDirectJoinUrl('participant');
    const inviteText = `You have been invited to a Zoom Meeting:
Topic: ${meetingDetails.topic}
Meeting ID: ${formatMeetingId(meetingDetails.meetingNumber)}
Passcode: ${meetingDetails.passcode}

Join directly in our Web App:
${joinUrl}`;

    navigator.clipboard.writeText(inviteText);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
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
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
            Host Dashboard
          </h1>
          <p className="text-zinc-400 text-sm">
            Create Zoom meeting rooms programmatically
          </p>
        </div>



        {/* Form or success state card */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 bg-red-950/50 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium animate-shake">
              {error}
            </div>
          )}

          {!meetingDetails ? (
            /* Creation Form */
            !hasTokenState ? (
              /* OAuth Authorization Required */
              <div className="text-center py-4 space-y-5">
                <div className="text-zinc-300 text-sm leading-relaxed">
                  To schedule meetings, you need to sign in with your Zoom account to authorize scheduling permissions.
                </div>
                {!hasApiConfig && (
                  <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-amber-300 text-xs text-left">
                    ⚠️ API credentials not configured in `.env.local`. Sign-in will fall back to SDK keys if matching, or error.
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleOAuthRedirect}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-xl shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                  <span>Sign In with Zoom</span>
                </button>
              </div>
            ) : (
              /* Authorized: Create Form */
              <div className="space-y-6">
                {profile && (
                  <div className="py-2 px-3 bg-emerald-950/20 border border-emerald-500/25 rounded-xl text-[11px] text-emerald-400 flex items-center gap-1.5 shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Logged in as <strong>{profile.email}</strong></span>
                  </div>
                )}

                <div>
                  <label htmlFor="topic" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Meeting Topic
                  </label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Project Alignment"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 text-sm shadow-inner"
                    required
                  />
                </div>

                <button
                  type="button" // 👈 1. Change this from 'submit' to 'button' to bypass default form state bubbling
                  onClick={() => handleCreate()} // 👈 2. Force fire the handler explicitly on direct tap
                  // onClick={() => alert("Button is ALIVE and clickable!")}
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-xl shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <span>Create Meeting Room</span>
                  )}
                </button>
              </div>
            )
          ) : (
            /* Meeting Successfully Created! */
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Meeting Scheduled!</h3>
                <p className="text-xs text-zinc-500 mt-1">{meetingDetails.topic}</p>
              </div>

              {/* Invitation card details */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3 font-sans">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">Meeting ID:</span>
                  <span className="font-mono text-zinc-200 text-sm font-bold tracking-wide">
                    {formatMeetingId(meetingDetails.meetingNumber)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">Passcode:</span>
                  <span className="font-mono text-zinc-200 bg-zinc-900 border border-zinc-800 py-1 px-2.5 rounded-lg text-xs font-semibold">
                    {meetingDetails.passcode}
                  </span>
                </div>
              </div>

              {/* Copied visual feedback */}
              <button
                type="button"
                onClick={handleCopyInvite}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>{inviteCopied ? 'Copied Invitation!' : 'Copy Invitation Link'}</span>
              </button>

              <div className="space-y-3 pt-3 border-t border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => (window.location.href = getDirectJoinUrl('host'))}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Meeting as Host</span>
                </button>
                <button
                  type="button"
                  onClick={() => (window.location.href = getDirectJoinUrl('participant'))}
                  className="w-full py-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Join as Participant
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMeetingDetails(null)}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition underline cursor-pointer"
                >
                  Create another room
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/meetings"
            className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold transition inline-flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            &larr; Have a meeting ID? Join portal
          </a>
        </div>
      </div>
    </div>
  );
}
