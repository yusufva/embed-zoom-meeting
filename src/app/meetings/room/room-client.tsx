'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ZoomMeeting from '@/components/ZoomMeeting';

export default function MeetingRoomClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const meetingNumber = searchParams.get('meetingNumber') || '';
  const passcode = searchParams.get('passcode') || '';
  const userName = searchParams.get('userName') || '';
  const userEmail = searchParams.get('userEmail') || 'user@example.com';
  const roleVal = searchParams.get('role') || '0';
  const role = roleVal === '1' ? 1 : 0;
  const zak = searchParams.get('zak') || '';

  if (!meetingNumber || !userName) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100 p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Room Request</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Meeting ID and display name are required to connect to the meeting.
          </p>
          <button
            onClick={() => router.push('/meetings')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
          <h1 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
            Zoom Meeting: <span className="font-mono text-indigo-400">{meetingNumber}</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span className="text-zinc-400 font-medium">{userName}</span>
            <span className="text-zinc-600 font-mono text-[10px]">{role === 1 ? 'Host' : 'Participant'}</span>
          </div>
          <button
            onClick={() => router.push('/meetings?left=true')}
            className="px-4 py-1.5 bg-red-950/40 hover:bg-red-950 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-white rounded-full text-xs font-semibold transition cursor-pointer"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main viewport */}
      <main className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto justify-center items-center">
        <div className="w-full h-full max-w-5xl aspect-video min-h-[600px] shadow-2xl relative animate-in fade-in duration-1000">
          <ZoomMeeting
            meetingNumber={meetingNumber}
            passcode={passcode}
            userName={userName}
            userEmail={userEmail}
            role={role}
            zak={zak}
          />
        </div>
      </main>
    </div>
  );
}
