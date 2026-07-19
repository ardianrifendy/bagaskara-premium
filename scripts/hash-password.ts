#!/usr/bin/env npx tsx
/**
 * Script untuk men-generate hash bcrypt dari password yang diberikan.
 *
 * Penggunaan:
 *   npm run hash-password
 *
 * Script akan meminta input password dari stdin, kemudian menampilkan
 * hash bcrypt (salt rounds: 12) yang siap disalin ke variabel lingkungan
 * ADMIN_PASSWORD_HASH di berkas .env Anda.
 */

import * as bcrypt from "bcryptjs";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stderr, // prompts go to stderr so only the hash goes to stdout
});

function askPassword(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("Masukkan password yang ingin di-hash: ", (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const password = process.argv[2] || (await askPassword());
  rl.close();

  if (!password || password.trim().length === 0) {
    console.error("Error: Password tidak boleh kosong.");
    process.exit(1);
  }

  if (password.trim().length < 8) {
    console.error("Error: Password minimal 8 karakter untuk keamanan.");
    process.exit(1);
  }

  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(password.trim(), salt);

  console.log("");
  console.log("=== HASH BCRYPT ===");
  console.log(hash);
  console.log("===================");
  console.log("");
  console.log("Salin hash di atas ke variabel ADMIN_PASSWORD_HASH di berkas .env Anda:");
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  console.log("");

  process.exit(0);
}

main().catch((error) => {
  console.error("Gagal men-generate hash:", error);
  process.exit(1);
});
