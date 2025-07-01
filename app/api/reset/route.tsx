import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { Client } from "ldapts";

const execAsync = promisify(exec);

// Lokasi path relatif ke root project
const SCRIPTS_DIR = path.resolve(process.cwd(), "scripts");
const RESET_SCRIPT = path.join(SCRIPTS_DIR, "resetpassword.ps1");

// Fungsi untuk validasi password lama via LDAP bind
async function checkUserPassword(
  username: string,
  password: string
): Promise<boolean> {
  const client = new Client({
    url: "ldap://192.168.29.12:389",
  });

  const userBind = `BCAFWIFI\\${username}`;

  try {
    await client.bind(userBind, password);
    await client.unbind();
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { username, oldPassword, newPassword } = await req.json();

  if (!username || !oldPassword || !newPassword) {
    return NextResponse.json(
      { error: "username, oldPassword, and newPassword are required" },
      { status: 400 }
    );
  }

  // 1. Validasi password lama via LDAP
  const isValid = await checkUserPassword(username, oldPassword);
  if (!isValid) {
    return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
  }

  // 2. Jalankan reset password script
  const resetCommand = `powershell.exe -ExecutionPolicy Bypass -File "${RESET_SCRIPT}" -username "${username}" -newPlainPassword "${newPassword}"`;

  try {
    const { stdout: resetOut } = await execAsync(resetCommand);
    const resetResult = resetOut.trim().toLowerCase();

    if (resetResult === "success") {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: `Gagal ubah password: ${resetResult}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: `Gagal proses: ${err.message}` },
      { status: 500 }
    );
  }
}
