// app/api/admin/set-role/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This is a protected endpoint for assigning roles
// Only the super admin should be able to access this

export async function POST(req: Request) {

}