'use client';

import React from 'react';

interface ZoomMeetingProps {
  meetingNumber: string;
  passcode: string;
  userName: string;
  userEmail?: string;
  role: number; // 0 for participant, 1 for host
}

export default function ZoomMeeting({
  meetingNumber,
  passcode,
  userName,
  userEmail = 'user@example.com',
  role,
}: ZoomMeetingProps) {

  // Construct the secure URL parameters to safely pass down to our isolated wrapper page
  const queryParams = new URLSearchParams({
    mn: meetingNumber.toString().replace(/\s+/g, ''), // Strip out any accidental spaces in the meeting ID
    pwd: passcode,
    name: userName,
    email: userEmail,
    role: role.toString(),
  });

  return (
    <div className="w-full h-screen bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col">
      <iframe
        src={`/zoom-frame.html?${queryParams.toString()}`}
        className="w-full h-screen border-0 flex-1"
        allow="camera; microphone; display-capture; fullscreen; clipboard-write"
      />
    </div>
  );
}