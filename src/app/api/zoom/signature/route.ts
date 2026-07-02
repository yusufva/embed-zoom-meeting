import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import { KJUR } from "jsrsasign";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { meetingNumber, role } = body;

    const sdkKey = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: "Zoom SDK Key or Secret is missing in environment variables." },
        { status: 500 }
      );
    }

    if (!meetingNumber) {
      return NextResponse.json(
        { error: "meetingNumber is required." },
        { status: 400 }
      );
    }

    // role defaults to 0 (participant) if not provided, else can be 1 (host)
    const numericRole = role === 1 || role === "1" ? 1 : 0;

    // Zoom signature requirements:
    // iat: Issued At (Unix timestamp in seconds), slightly backdated to handle clock skew
    // exp: Token Expiration (Unix timestamp in seconds)
    // tokenExp: Token Expiration (Unix timestamp in seconds, same as exp)
    const iat = Math.floor(Date.now() / 1000) - 60;
    const exp = iat + 60 * 60 * 2; // Token expires in 2 hours

    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      appKey: sdkKey,
      sdkKey: sdkKey,
      mn: meetingNumber.toString(),
      role: numericRole,
      iat: iat,
      exp: exp,
      tokenExp: exp,
    };

    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);

    // Sign the JWT signature using the SDK secret
    const signature = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);

    return NextResponse.json({ signature, sdkKey });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate signature" },
      { status: 500 }
    );
  }
}
