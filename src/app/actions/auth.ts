"use server";

import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export async function loginAdmin(input: LoginInput) {
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Validasi gagal" };
  }

  const { username, password } = validation.data;

  try {
    // Look up username
    const adminResult = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username.trim()))
      .limit(1);

    if (adminResult.length === 0) {
      return { success: false, error: "Username atau password salah." };
    }

    const admin = adminResult[0];

    // Verify hash password using bcryptjs
    const isPasswordValid = bcrypt.compareSync(password, admin.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Username atau password salah." };
    }

    // Set session data
    const session = await getSession();
    session.username = admin.username;
    session.isLoggedIn = true;
    await session.save();

    return { success: true };
  } catch (error) {
    console.error("Admin login action failed:", error);
    return { success: false, error: "Terjadi kesalahan internal pada sistem." };
  }
}

export async function logoutAdmin() {
  try {
    const session = await getSession();
    session.destroy();
    return { success: true };
  } catch (error) {
    console.error("Admin logout action failed:", error);
    return { success: false, error: "Gagal memproses logout." };
  }
}
