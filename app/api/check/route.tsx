import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { username, oldPassword } = await req.json();

  if (!username || !oldPassword) {
    return NextResponse.json(
      { error: "Username and oldPassword are required" },
      { status: 400 }
    );
  }

  const scriptPath = "C:\\Scripts\\CheckPassword.ps1";
  const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -username "${username}" -oldPassword "${oldPassword}"`;

  try {
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    const status = stdout.trim();
    if (status === "success") {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
