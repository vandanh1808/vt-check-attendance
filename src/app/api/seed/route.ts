import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to seed database";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
