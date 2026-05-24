import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://localhost:5000";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { orderId } = await params;
    const token = request.headers.get("authorization") || "";
    const body = await request.json();
    const action = request.nextUrl.searchParams.get("action");

    let endpoint = "";
    if (action === "link-roblox") {
      endpoint = `${API_BASE_URL}/api/shop/orders/${orderId}/link-roblox`;
    } else if (action === "delivery-slot") {
      endpoint = `${API_BASE_URL}/api/shop/orders/${orderId}/delivery-slot`;
    } else if (action === "confirm-delivery") {
      endpoint = `${API_BASE_URL}/api/shop/orders/${orderId}/confirm-delivery`;
    } else if (action === "create-ticket") {
      endpoint = `${API_BASE_URL}/api/shop/create-ticket`;
    } else if (action === "create-ticket-paypal-ff") {
      endpoint = `${API_BASE_URL}/api/shop/create-ticket-paypal-ff`;
    } else if (action === "create-ticket-ltc") {
      endpoint = `${API_BASE_URL}/api/shop/create-ticket-ltc`;
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const res = await fetch(endpoint, {
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
    console.error("Order action API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
