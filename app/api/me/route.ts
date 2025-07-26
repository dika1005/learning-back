import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

type JwtPayload = {
  id: number;
  // add other fields if needed
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id.toString() },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // 👉 Cek apakah admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden. Admin only." },
        { status: 403 }
      );
    }

    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ message: "Token tidak valid" }, { status: 401 });
  }
}
