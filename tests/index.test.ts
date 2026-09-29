import { describe, test, expect } from "bun:test";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, rmSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { SoulCompressor } from "../src/compressor";
import { SoulVerifier } from "../src/verifier";
import { SnapshotManager } from "../src/manager";
import {
  formatBytes, truncate, validateSoul, clone, getCurrentTimestamp, generateHash,
} from "../src/utils";
import type { AgentSoul } from "../src/types";

function makeSoul(overrides: Partial<AgentSoul> = {}): AgentSoul {
  return {
    version: "1.0.0",
    identity: {
      id: "agent-1", name: "Test Agent", handle: "test-agent",
      provider: "test", model: "test-model",
      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    },
    traits: [
      { name: "curiosity", value: 0.8 },
      { name: "patience", value: 0.4 },
    ],
    beliefs: [
      { claim: "high-confidence belief", confidence: 0.95, timestamp: "2026-01-01T00:00:00Z" },
      { claim: "low-confidence belief", confidence: 0.3, timestamp: "2026-01-01T00:00:00Z" },
    ],
    shortTermMemory: [
      { content: "critical memory", importance: 0.9, timestamp: "2026-01-01T00:00:00Z" },
      { content: "trivial memory", importance: 0.1, timestamp: "2026-01-01T00:00:00Z" },
      { content: "middling memory", importance: 0.5, timestamp: "2026-01-01T00:00:00Z" },
    ],
    longTermContext: "context",
    systemPrompt: "prompt",
    metadata: {},
    ...overrides,
  };
}

describe("SoulCompressor", () => {
  test("drops low-confidence beliefs and prunes low-importance memory", () => {
    const out = new SoulCompressor().compress(makeSoul(), 0.5);
    expect(out.beliefs.some((b) => b.claim === "high-confidence belief")).toBe(true);
    expect(out.beliefs.some((b) => b.claim === "low-confidence belief")).toBe(false);
    expect(out.shortTermMemory.some((m) => m.content === "trivial memory")).toBe(false);
    expect(out.shortTermMemory.some((m) => m.content === "critical memory")).toBe(true);
  });

  test("does not mutate the input soul", () => {
    const soul = makeSoul();
    new SoulCompressor().compress(soul, 0.1);
    expect(soul.beliefs).toHaveLength(2);
    expect(soul.shortTermMemory).toHaveLength(3);
  });

  test("generateSeed includes identity and traits", () => {
    const seed = new SoulCompressor().generateSeed(makeSoul());
    expect(seed).toContain("Test Agent");
    expect(seed).toContain("curiosity(0.8)");
  });
});

describe("SoulVerifier", () => {
  test("verifies an untampered signed snapshot and rejects a tampered one", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const verifier = new SoulVerifier({
      privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      publicKey: publicKey.export({ type: "spki", format: "pem" }).toString(),
    });
    const soul = makeSoul();
    const data = JSON.stringify(soul);
    const pkg: any = {
      soul,
      meta: { hash: generateHash(data), timestamp: getCurrentTimestamp(), agentId: soul.identity.id, byteSize: Buffer.byteLength(data) },
    };
    pkg.meta.signature = verifier.sign(pkg);
    expect(verifier.verify(pkg)).toBe(true);

    const tampered = JSON.parse(JSON.stringify(pkg));
    tampered.soul.systemPrompt = "evil override";
    expect(verifier.verify(tampered)).toBe(false);
  });

  test("hash-only verification passes without a public key", () => {
    const verifier = new SoulVerifier();
    const soul = makeSoul();
    const data = JSON.stringify(soul);
    const pkg: any = {
      soul,
      meta: { hash: generateHash(data), timestamp: "t", agentId: "agent-1", byteSize: 1 },
    };
    expect(verifier.verify(pkg)).toBe(true);
  });

  test("detectDrift scores belief-count and trait deltas", () => {
    const verifier = new SoulVerifier();
    const a = { soul: makeSoul(), meta: {} as any };
    const b = { soul: makeSoul({
      beliefs: a.soul.beliefs.concat([{ claim: "extra", confidence: 0.9, timestamp: "t" }]),
      traits: [{ name: "curiosity", value: 0.4 }, { name: "patience", value: 0.4 }],
    }) as any };
    expect(verifier.detectDrift(a, b)).toBeCloseTo(1.4);
  });
});

describe("SnapshotManager", () => {
  test("save writes a loadable snapshot; load rejects missing files", async () => {
    const dir = mkdtempSync(join(tmpdir(), "soul-snap-"));
    try {
      const manager = new SnapshotManager(dir);
      const path = await manager.save(makeSoul(), "test-snapshot.json");
      expect(path.endsWith("test-snapshot.json")).toBe(true);
      const raw = JSON.parse(readFileSync(path, "utf-8"));
      expect(raw.meta.agentId).toBe("agent-1");
      expect(raw.soul.identity.name).toBe("Test Agent");
      expect(manager.load(path)).resolves.toMatchObject({ version: "1.0.0" });
      expect(manager.load("does-not-exist.json")).rejects.toThrow(/not found/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("utils", () => {
  test("formatBytes, truncate, validateSoul, clone", () => {
    expect(formatBytes(2048)).toContain("2");
    expect(truncate("abcdef", 4).length).toBeLessThanOrEqual(7);
    expect(validateSoul(makeSoul())).toBe(true);
    const original = makeSoul();
    const copy = clone(original);
    copy.traits[0].value = 0.1;
    expect(original.traits[0].value).toBe(0.8);
    expect(getCurrentTimestamp()).toBeTruthy();
  });
});
