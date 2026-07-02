import React, { Suspense } from "react";
import MeetingRoomClient from "./room-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zoom Meeting Room",
  description: "Active embedded Zoom meeting session.",
};

export default function MeetingRoomPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-sm">Loading meeting parameters...</p>
        </div>
      }
    >
      <MeetingRoomClient />
    </Suspense>
  );
}
