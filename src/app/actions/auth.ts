"use server";

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
    // Validate against environment variables — no DB lookup
    const envUsername = process.env.ADMIN_USERNAME;
    const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!envUsername || !envPasswordHash) {
      console.error("ADMIN_USERNAME or ADMIN_PASSWORD_HASH env vars not set.");
      return { success: false, error: "Konfigurasi admin belum lengkap." };
    }

    // Compare username (case-sensitive, trimmed)
    if (username.trim() !== envUsername.trim()) {
      return { success: false, error: "Username atau password salah." };
    }

    // Verify password against bcrypt hash from env
    const isPasswordValid = bcrypt.compareSync(password, envPasswordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Username atau password salah." };
    }

    // Set session data
    const session = await getSession();
    session.username = envUsername;
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
