import { createSign, createVerify, randomBytes } from "node:crypto";
import { SnapshotPackage } from "./types";
import { generateHash, logger } from "./utils";

/**
 * Logic for signing and verifying soul snapshots
 */
export class SoulVerifier {
  private privateKey?: string;
  private publicKey?: string;

  constructor(keys?: { privateKey: string; publicKey: string }) {
    if (keys) {
      this.privateKey = keys.privateKey;
      this.publicKey = keys.publicKey;
    }
  }

  /**
   * Signs a snapshot package
   */
  public sign(pkg: SnapshotPackage): string {
    if (!this.privateKey) {
      logger.warn("No private key provided, generating dummy signature.");
      return `sig_${randomBytes(16).toString("hex")}`;
    }

    try {
      const sign = createSign("SHA256");
      sign.update(JSON.stringify(pkg.soul));
      sign.end();
      return sign.sign(this.privateKey, "hex");
    } catch (err) {
      logger.error(`Signing failed: ${err}`);
      throw new Error("Failed to sign snapshot");
    }
  }

  /**
   * Verifies the integrity and signature of a snapshot package
   */
  public verify(pkg: SnapshotPackage): boolean {
    const calculatedHash = generateHash(JSON.stringify(pkg.soul));
    
    if (pkg.meta.hash !== calculatedHash) {
      logger.error("Hash mismatch! Data has been tampered with.");
      return false;
    }

    if (!pkg.meta.signature) {
      logger.warn("Snapshot has no signature.");
      return true; // Still "valid" in terms of hash, but unauthenticated
    }

    if (!this.publicKey) {
      logger.warn("No public key provided, skipping signature verification.");
      return true;
    }

    try {
      const verify = createVerify("SHA256");
      verify.update(JSON.stringify(pkg.soul));
      verify.end();
      return verify.verify(this.publicKey, pkg.meta.signature, "hex");
    } catch (err) {
      logger.error(`Signature verification error: ${err}`);
      return false;
    }
  }

  /**
   * Checks for "Soul Drift" - semantic differences between snapshots
   */
  public detectDrift(original: SnapshotPackage, current: SnapshotPackage): number {
    // Simple heuristic: compare belief counts and trait values
    const beliefDrift = Math.abs(original.soul.beliefs.length - current.soul.beliefs.length);
    let traitDrift = 0;
    
    for (const t1 of original.soul.traits) {
      const t2 = current.soul.traits.find((t) => t.name === t1.name);
      if (t2) {
        traitDrift += Math.abs(t1.value - t2.value);
      } else {
        traitDrift += 0.5; // Penalty for missing trait
      }
    }

    return beliefDrift + traitDrift;
  }
}
