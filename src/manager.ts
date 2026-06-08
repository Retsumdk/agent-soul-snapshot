import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { AgentSoul, SnapshotPackage, SnapshotMetadata } from "./types";
import { generateHash, getCurrentTimestamp, logger, formatBytes } from "./utils";
import { SoulVerifier } from "./verifier";

/**
 * High-level manager for soul snapshots
 */
export class SnapshotManager {
  private storageDir: string;
  private verifier: SoulVerifier;

  constructor(storageDir: string = "/home/workspace/.agent-memory/snapshots") {
    this.storageDir = storageDir;
    this.verifier = new SoulVerifier();
    
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Saves a soul to a snapshot file
   */
  public async save(soul: AgentSoul, fileName?: string): Promise<string> {
    const data = JSON.stringify(soul);
    const hash = generateHash(data);
    const ts = getCurrentTimestamp();
    
    const meta: SnapshotMetadata = {
      hash,
      timestamp: ts,
      agentId: soul.identity.id,
      byteSize: Buffer.byteLength(data),
    };

    const pkg: SnapshotPackage = { soul, meta };
    pkg.meta.signature = this.verifier.sign(pkg);

    const name = fileName || `soul-${soul.identity.id}-${Date.now()}.json`;
    const fullPath = join(this.storageDir, name);

    writeFileSync(fullPath, JSON.stringify(pkg, null, 2));
    logger.info(`Snapshot saved to ${fullPath} (${formatBytes(meta.byteSize)})`);
    
    return fullPath;
  }

  /**
   * Loads a soul from a snapshot file
   */
  public async load(filePath: string): Promise<AgentSoul> {
    const fullPath = existsSync(filePath) ? filePath : join(this.storageDir, filePath);
    
    if (!existsSync(fullPath)) {
      throw new Error(`Snapshot file not found: ${fullPath}`);
    }

    const content = readFileSync(fullPath, "utf-8");
    const pkg: SnapshotPackage = JSON.parse(content);

    if (!this.verifier.verify(pkg)) {
      throw new Error("Invalid snapshot: verification failed");
    }

    logger.info(`Loaded soul for agent ${pkg.soul.identity.name} from ${fullPath}`);
    return pkg.soul;
  }

  /**
   * Lists all available snapshots
   */
  public list(): string[] {
    const { readdirSync } = require("node:fs");
    return readdirSync(this.storageDir).filter((f: string) => f.endsWith(".json"));
  }

  /**
   * Deletes a snapshot
   */
  public delete(fileName: string): void {
    const { unlinkSync } = require("node:fs");
    const fullPath = join(this.storageDir, fileName);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
      logger.info(`Deleted snapshot: ${fileName}`);
    }
  }

  /**
   * Gets statistics about stored snapshots
   */
  public getStats() {
    const files = this.list();
    let totalSize = 0;
    for (const file of files) {
      const { statSync } = require("node:fs");
      totalSize += statSync(join(this.storageDir, file)).size;
    }

    return {
      count: files.length,
      totalSize: formatBytes(totalSize),
      directory: this.storageDir,
    };
  }
}
