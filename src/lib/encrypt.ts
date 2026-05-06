import CryptoJS from "crypto-js";

const SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "fallback-key";

export function encryptField(value: string): string {
  if (!value || value.trim() === "") return "";
  return CryptoJS.AES.encrypt(value, SECRET).toString();
}

export function decryptField(value: string): string {
  if (!value || value.trim() === "") return "";
  try {
    const bytes = CryptoJS.AES.decrypt(value, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return value;
  }
}
