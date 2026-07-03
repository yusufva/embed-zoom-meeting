import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action");
    const cookieStore = await cookies();

    // Handle logout action
    if (action === "logout") {
      cookieStore.delete("zoom_access_token");
      return NextResponse.json({ loggedIn: false });
    }

    const token = cookieStore.get("zoom_access_token")?.value;
    // console.log("Current Outbound Bearer Token String:", token);

    if (!token) {
      return NextResponse.json({ loggedIn: false });
    }

    // Fetch user details
    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log('userResponse', userResponse)

    if (!userResponse.ok) {
      // If token is invalid or expired, clear it
      console.warn("Zoom Access Token invalid or expired. Logging out user.");
      cookieStore.delete("zoom_access_token");
      return NextResponse.json({ loggedIn: false });
    }

    const userData = await userResponse.json();
    const displayName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userData.display_name || "Zoom Host";
    const email = userData.email;

    // Fetch ZAK token
    const zakRes = await fetch('https://api.zoom.us/v2/users/me/zak', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    // console.log('zakRes', zakRes)

    let zakToken = "";
    if (zakRes.ok) {
      const zakData = await zakRes.json();
      console.log('zakData', zakData)
      zakToken = zakData.token;
    } else {
      console.error("Failed to retrieve ZAK token:", await zakRes.text());
    }

    return NextResponse.json({
      loggedIn: true,
      displayName,
      email,
      zakToken,
    });
  } catch (err: any) {
    console.error("Error in profile endpoint:", err);
    return NextResponse.json({ loggedIn: false, error: err.message }, { status: 500 });
  }
}
