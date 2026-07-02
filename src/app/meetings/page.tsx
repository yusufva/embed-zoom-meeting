import React from "react";
import JoinClient from "./join-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zoom Integration Portal",
  description: "Secure onboarding page to join or host embedded Zoom meetings.",
};

export default async function MeetingsPage() {
  // Read Zoom configuration server-side to hide secrets from client
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;
  
  const hasConfig = !!(sdkKey && sdkSecret);
  const sdkKeySnippet = sdkKey 
    ? `${sdkKey.slice(0, 4)}...${sdkKey.slice(-4)}` 
    : "";

  return <JoinClient hasConfig={hasConfig} sdkKeySnippet={sdkKeySnippet} />;
}
