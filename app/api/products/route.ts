// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authorizeRole } from '@/lib/middleware'; // Pastikan path ini benar

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return NextResponse.json(products, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await authorizeRole(request, 'admin');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Access denied: Only admins can add products' }, { status: 403 });
  }

  try {
    const { name, description, price, stock, image_url, category_id } = await request.json();

    if (!name || typeof price !== 'number' || typeof stock !== 'number' || !category_id) {
      return NextResponse.json({ error: 'Name, price, stock, and category ID are required and must be in correct format' }, { status: 400 });
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: category_id },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        image_url,
        category: {
          connect: { id: category_id },
        },
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) { // Gunakan 'unknown' untuk penanganan error yang lebih aman
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002' &&
      'meta' in error &&
      (error as { meta?: { target?: string[] } }).meta?.target?.includes('name')
    ) {
      return NextResponse.json({ error: 'Product with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create new product' }, { status: 500 });
  }
}