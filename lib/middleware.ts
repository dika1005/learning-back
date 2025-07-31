// lib/middleware.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers'; // Menggunakan cookies dari next/headers

const JWT_SECRET = process.env.JWT_SECRET!;

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export async function authenticateToken(request: NextRequest): Promise<DecodedToken | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

export async function authorizeRole(request: NextRequest, requiredRole: string): Promise<boolean> {
  const decodedToken = await authenticateToken(request);
  if (!decodedToken) return false;
  if (decodedToken.role !== requiredRole) return false;
  return true;
}