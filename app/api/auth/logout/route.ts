import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout berhasil" });

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0), // langsung expired
    path: "/",
  });

  return response;
}
