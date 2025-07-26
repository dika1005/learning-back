// app/api/admin/only-admin/route.ts

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // lanjutkan kodenya kalau admin
    return NextResponse.json({ message: "Admin akses diterima" });
  } catch {
    return NextResponse.json({ message: "Token tidak valid" }, { status: 401 });
  }
}
