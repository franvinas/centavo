import fs from "fs";
import path from "path";

const logoBase64 = fs.readFileSync(
  path.join(process.cwd(), "public/icons/icon-192.png"),
  "base64",
);

interface OTPEmailParams {
  otp: string;
  email: string;
}

export function getOTPEmailText({ otp }: OTPEmailParams): string {
  return `Your Centavo verification code is: ${otp}

This code expires in 5 minutes.

If you didn't request this code, you can safely ignore this email.`;
}

export function getOTPEmailHtml({ otp }: OTPEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f4f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="420" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding-bottom:24px;">
          <img src="data:image/png;base64,${logoBase64}" alt="Centavo" width="48" height="48" style="display:block;border-radius:12px;" />
        </td></tr>
        <tr><td align="center" style="font-size:20px;font-weight:600;color:#1a1a1a;padding-bottom:8px;">
          Your verification code
        </td></tr>
        <tr><td align="center" style="font-size:14px;color:#6b6b6b;padding-bottom:28px;">
          Enter this code to sign in to Centavo
        </td></tr>
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="background:#f5f4f1;border:1px solid #e0ddd8;border-radius:8px;padding:12px 24px;display:inline-block;font-size:32px;font-weight:bold;color:#1a1a1a;letter-spacing:8px;">${otp}</div>
        </td></tr>
        <tr><td align="center" style="font-size:13px;color:#999;padding-bottom:8px;">
          This code expires in 5 minutes.
        </td></tr>
        <tr><td align="center" style="font-size:13px;color:#999;">
          If you didn&rsquo;t request this code, you can safely ignore this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
