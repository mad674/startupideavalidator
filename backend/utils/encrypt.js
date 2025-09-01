const crypto = require("crypto");

const SECRET_KEY = Buffer.from(process.env.ENC_SECRET_KEY || "12345678901234567890123456789012"); // 32 bytes

function encryptApiKey(apiKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, iv);

  let encrypted = cipher.update(apiKey, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return Buffer.concat([iv, encrypted]).toString("base64");
}

function decryptApiKey(encKey) {
  const raw = Buffer.from(encKey, "base64");
  const iv = raw.slice(0, 16);
  const encrypted = raw.slice(16);

  const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, iv);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

module.exports = { encryptApiKey, decryptApiKey };
