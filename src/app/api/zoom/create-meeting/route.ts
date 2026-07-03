import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("zoom_access_token")?.value;

    const meetingTopic = topic?.trim() || "Web App Meeting Room";

    // If not authenticated, return Unauthorized
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Please connect your Zoom account to create meetings." },
        { status: 401 }
      );
    }

    // Call Zoom API to schedule the meeting
    const meetingResponse = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: meetingTopic,
        type: 1, // Instant meeting
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: false,
          use_pmi: false,
          approval_type: 2, // No approval required
          audio: "both",
          enforce_login: false,
        },
      }),
    });

    if (!meetingResponse.ok) {
      const errDetails = await meetingResponse.text();
      console.error("Zoom API meeting creation failed:", errDetails);
      return NextResponse.json(
        { error: "Failed to create meeting on Zoom. Your link may have expired." },
        { status: meetingResponse.status }
      );
    }

    const meetingData = await meetingResponse.json();
    const meetingId = meetingData.id?.toString() || "";
    const passcode = meetingData.password || "";

    // Fetch ZAK token to return to the host
    const zakResponse = await fetch('https://api.zoom.us/v2/users/me/zak', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    let zakToken = "";
    if (zakResponse.ok) {
      const zakData = await zakResponse.json();
      zakToken = zakData.token;
    }

    // Fetch user details for display name/email defaults
    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let userName = "Zoom Host";
    let userEmail = "host@example.com";
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userData.display_name || "Zoom Host";
      userEmail = userData.email || "host@example.com";
    }

    return NextResponse.json({
      isMock: false,
      meetingNumber: meetingId,
      passcode,
      topic: meetingTopic,
      userName,
      userEmail,
      zakToken,
    });
  } catch (err: any) {
    console.error("Error in Zoom create-meeting route:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during meeting creation." },
      { status: 500 }
    );
  }
}
