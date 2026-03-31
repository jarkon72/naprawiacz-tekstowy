import crypto from "crypto";

const SECRET = process.env.ADMIN_COOKIE_SECRET || "fallback_secret";

export function signAdmin(value: string) {
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("hex");

  return `${value}.${sig}`;
}

export function verifyAdmin(cookie?: string) {
  if (!cookie) return false;

  const [value, sig] = cookie.split(".");
  if (!value || !sig) return false;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("hex");

  return sig === expected && value === "1";
}