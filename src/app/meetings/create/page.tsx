import React, { Suspense } from "react";
import CreateClient from "./create-client";
import { cookies, headers } from "next/headers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Zoom Meeting",
  description: "Create and schedule embedded Zoom meeting rooms.",
};

export default async function CreatePage() {
  const cookieStore = await cookies();
  const hasToken = cookieStore.has("zoom_access_token");

  // Read config variables
  const clientId = process.env.ZOOM_API_CLIENT_ID || process.env.ZOOM_SDK_KEY || "";
  const clientSecret = process.env.ZOOM_API_CLIENT_SECRET || process.env.ZOOM_SDK_SECRET || "";
  const hasApiConfig = !!(clientId && clientSecret);

  // Dynamically build the redirect URI based on the current host headers
  const headersList = await headers();
  // const host = headersList.get("host") || "localhost:3000";

  // Use http for local loops, https for production
  // const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("::1");
  // const protocol = isLocal ? "http" : "https";
  const redirectUri = process.env.ZOOM_REDIRECT_URI as string;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-sm">Loading scheduler...</p>
        </div>
      }
    >
      <CreateClient
        hasToken={hasToken}
        hasApiConfig={hasApiConfig}
        clientId={clientId}
        redirectUri={redirectUri}
      />
    </Suspense>
  );
}
