import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { Client } from "ldapts";

const execAsync = promisify(exec);

const SCRIPTS_DIR = path.resolve(process.cwd(), "scripts");
const RESET_SCRIPT = path.join(SCRIPTS_DIR, "resetpassword.ps1");

function setCorsHeaders(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return res;
}

async function checkUserPassword(
  username: string,
  password: string
): Promise<boolean> {
  const client = new Client({ url: "ldap://192.168.29.12:389" });
  const userBind = `BCAFWIFI\\${username}`;

  try {
    await client.bind(userBind, password);
    await client.unbind();
    return true;
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  const { username, oldPassword, newPassword } = await req.json();

  if (!username || !oldPassword || !newPassword) {
    return setCorsHeaders(
      NextResponse.json(
        { error: "username, oldPassword, and newPassword are required" },
        { status: 400 }
      )
    );
  }

  const isValid = await checkUserPassword(username, oldPassword);
  if (!isValid) {
    return setCorsHeaders(
      NextResponse.json({ error: "Password lama salah" }, { status: 401 })
    );
  }

  const resetCommand = `powershell.exe -ExecutionPolicy Bypass -File "${RESET_SCRIPT}" -username "${username}" -newPlainPassword "${newPassword}"`;

  try {
    const { stdout: resetOut } = await execAsync(resetCommand);
    const resetResult = resetOut.trim().toLowerCase();

    if (resetResult === "success") {
      return setCorsHeaders(NextResponse.json({ success: true }));
    } else {
      return setCorsHeaders(
        NextResponse.json(
          { error: `Gagal ubah password: ${resetResult}` },
          { status: 500 }
        )
      );
    }
  } catch (err: any) {
    return setCorsHeaders(
      NextResponse.json(
        { error: `Gagal proses: ${err.message}` },
        { status: 500 }
      )
    );
  }
}
