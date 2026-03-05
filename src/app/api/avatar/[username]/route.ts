import { NextRequest, NextResponse } from "next/server";
import { generateAvatarSvg } from "@/lib/avatar";

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  if (!username) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const svg = generateAvatarSvg(username);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
