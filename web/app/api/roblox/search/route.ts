import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  try {
    const searchRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`, {
      cache: "no-store",
    });
    const data = await searchRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Roblox search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
