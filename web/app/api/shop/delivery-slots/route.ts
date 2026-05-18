import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization") || "";
    const timezone = request.nextUrl.searchParams.get("timezone") || "";
    const manage = request.nextUrl.searchParams.get("manage");

    // Public customer endpoint when timezone is provided, owner manage endpoint otherwise
    const endpoint = manage === "1" && token
      ? `${API_BASE_URL}/api/shop/delivery-slots/manage`
      : `${API_BASE_URL}/api/shop/delivery-slots${timezone ? `?timezone=${encodeURIComponent(timezone)}` : ""}`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Delivery slots API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization") || "";
    const body = await request.json();
    const res = await fetch(`${API_BASE_URL}/api/shop/delivery-slots/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Create delivery slots API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
