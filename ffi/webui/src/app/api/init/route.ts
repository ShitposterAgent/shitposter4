import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch("http://127.0.0.1:3001/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Failed to connect to backend server" },
      { status: 500 }
    );
  }
}
