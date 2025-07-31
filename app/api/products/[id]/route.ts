// app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

async function authenticateToken(
  request: NextRequest
): Promise<DecodedToken | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

async function authorizeRole(
  request: NextRequest,
  requiredRole: string
): Promise<boolean> {
  const decodedToken = await authenticateToken(request);
  if (!decodedToken) return false;
  if (decodedToken.role !== requiredRole) return false;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product detail" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const isAdmin = await authorizeRole(request, "admin");
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Access denied: Only admins can edit products" },
      { status: 403 }
    );
  }

  try {
    const { name, description, price, stock, image_url, category_id } =
      await request.json();
    if (
      !name ||
      typeof price !== "number" ||
      typeof stock !== "number" ||
      !category_id
    ) {
      return NextResponse.json(
        {
          error:
            "Name, price, stock, and category ID are required and must be in correct format",
        },
        { status: 400 }
      );
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: category_id },
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        image_url,
        category: {
          connect: { id: category_id },
        },
        updated_at: new Date(),
      },
    });
    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const err = error as { code?: string; meta?: { target?: string[] } };
      if (err.code === "P2025") {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      if (err.code === "P2002" && err.meta?.target?.includes("name")) {
        return NextResponse.json(
          { error: "Product with this name already exists" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const isAdmin = await authorizeRole(request, "admin");
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Access denied: Only admins can delete products" },
      { status: 403 }
    );
  }

  try {
    const deletedProduct = await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json(
      { message: "Product deleted successfully", product: deletedProduct },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const err = error as { code?: string };
      if (err.code === "P2025") {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
