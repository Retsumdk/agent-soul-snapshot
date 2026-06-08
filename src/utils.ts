import { createHash } from "node:crypto";

/**
 * Common utilities for soul snapshotting
 */

export function generateHash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function validateSoul(soul: any): boolean {
  const required = ["identity", "traits", "beliefs", "systemPrompt"];
  for (const field of required) {
    if (!soul[field]) return false;
  }
  return true;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Deep clones an object
 */
export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Truncates text for display
 */
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Simple logger wrapper
 */
export const logger = {
  info: (msg: string) => console.log(`[\x1b[32mINFO\x1b[0m] ${msg}`),
  warn: (msg: string) => console.warn(`[\x1b[33mWARN\x1b[0m] ${msg}`),
  error: (msg: string) => console.error(`[\x1b[31mERROR\x1b[0m] ${msg}`),
  debug: (msg: string) => {
    if (process.env.DEBUG) console.log(`[\x1b[34mDEBUG\x1b[0m] ${msg}`);
  },
};
