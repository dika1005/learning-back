import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export function verifyAdmin(token: string): boolean {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return decoded?.role === "admin";
  } catch (err) {
    return false;
  }
}
