import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🔥 POST: Tambah Produk
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      stock,
      category_id,
      image_url,
    } = body;

    if (!name || !price || !stock || !category_id) {
      return NextResponse.json(
        { error: "Field wajib tidak lengkap" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        category_id,
        image_url,
      },
    });

    return NextResponse.json(
      { message: "Produk berhasil ditambahkan", product },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan produk" },
      { status: 500 }
    );
  }
}

// 🔍 GET: Ambil Semua Produk
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true, // ikutkan data kategori
      },
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil produk" },
      { status: 500 }
    );
  }
}
