/**
 * Centralized Logger Service
 * Gunakan ini sebagai pengganti console.log standar.
 * Tingkat 'info' akan dibisukan saat production agar tidak membanjiri Vercel Logs.
 */
export const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("🔵 [INFO]", ...args);
    }
  },
  warn: (...args: unknown[]) => console.warn("🟠 [WARN]", ...args),
  error: (...args: unknown[]) => console.error("🔴 [ERROR]", ...args),
};