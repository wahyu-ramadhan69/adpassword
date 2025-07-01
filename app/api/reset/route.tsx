import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Lokasi path relatif ke root project
const SCRIPTS_DIR = path.resolve(process.cwd(), "scripts");
const CHECK_SCRIPT = path.join(SCRIPTS_DIR, "checkpassword.ps1");
const RESET_SCRIPT = path.join(SCRIPTS_DIR, "resetpassword.ps1");

export async function POST(req: NextRequest) {
  const { username, oldPassword, newPassword } = await req.json();

  if (!username || !oldPassword || !newPassword) {
    return NextResponse.json(
      { error: "username, oldPassword, and newPassword are required" },
      { status: 400 }
    );
  }

  try {
    // 1. Cek password lama
    const checkCommand = `powershell.exe -ExecutionPolicy Bypass -File "${CHECK_SCRIPT}" -username "${username}" -oldPassword "${oldPassword}"`;
    const { stdout: checkOut } = await execAsync(checkCommand);
    const checkResult = checkOut.trim().toLowerCase();

    if (checkResult !== "success") {
      return NextResponse.json(
        { error: "Password lama salah" },
        { status: 401 }
      );
    }

    // 2. Jalankan reset password
    const resetCommand = `powershell.exe -ExecutionPolicy Bypass -File "${RESET_SCRIPT}" -username "${username}" -newPlainPassword "${newPassword}"`;
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
