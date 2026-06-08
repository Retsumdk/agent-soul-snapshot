#!/usr/bin/env bun
import { Command } from "commander";
import { SoulExtractor } from "./extractor";
import { SoulCompressor } from "./compressor";
import { SnapshotManager } from "./manager";
import { logger, formatBytes, truncate } from "./utils";
import { join } from "node:path";

const program = new Command();
const manager = new SnapshotManager();
const extractor = new SoulExtractor();
const compressor = new SoulCompressor();

program
  .name("agent-soul-snapshot")
  .description("Captures and manages behavioral identity and belief state for agent migration")
  .version("1.0.0");

/**
 * Capture Command
 */
program
  .command("capture")
  .description("Capture the current agent soul and save it to a snapshot")
  .option("-o, --output <file>", "Output file name")
  .option("-c, --compress <ratio>", "Compression ratio (0.1 to 1.0)", "1.0")
  .action(async (options) => {
    try {
      let soul = await extractor.extractAll();
      const ratio = parseFloat(options.compress);
      
      if (ratio < 1.0) {
        soul = compressor.compress(soul, ratio);
      }

      const path = await manager.save(soul, options.output);
      logger.info(`✅ Successfully captured soul! Snapshot: ${path}`);
      
      const seed = compressor.generateSeed(soul);
      logger.info(`🌱 Generated soul seed: "${truncate(seed, 80)}"`);
    } catch (err) {
      logger.error(`Capture failed: ${err}`);
      process.exit(1);
    }
  });

/**
 * List Command
 */
program
  .command("list")
  .description("List all available soul snapshots")
  .action(() => {
    const snapshots = manager.list();
    if (snapshots.length === 0) {
      logger.info("No snapshots found.");
      return;
    }

    logger.info(`Found ${snapshots.length} snapshots:`);
    snapshots.forEach((s) => console.log(`  - ${s}`));
  });

/**
 * Inspect Command
 */
program
  .command("inspect <file>")
  .description("View details of a specific soul snapshot")
  .action(async (file) => {
    try {
      const soul = await manager.load(file);
      console.log("\x1b[1m--- Agent Soul Details ---\x1b[0m");
      console.log(`Name:      ${soul.identity.name}`);
      console.log(`Handle:    ${soul.identity.handle}`);
      console.log(`Model:     ${soul.identity.model}`);
      console.log(`Traits:    ${soul.traits.map(t => t.name).join(", ")}`);
      console.log(`Beliefs:   ${soul.beliefs.length}`);
      console.log(`Memory:    ${soul.shortTermMemory.length} segments`);
      console.log(`Version:   ${soul.version}`);
      console.log("\x1b[1m--------------------------\x1b[0m");
    } catch (err) {
      logger.error(`Inspection failed: ${err}`);
      process.exit(1);
    }
  });

/**
 * Delete Command
 */
program
  .command("delete <file>")
  .description("Delete a soul snapshot")
  .action((file) => {
    try {
      manager.delete(file);
      logger.info(`✅ Snapshot ${file} deleted.`);
    } catch (err) {
      logger.error(`Delete failed: ${err}`);
      process.exit(1);
    }
  });

/**
 * Stats Command
 */
program
  .command("stats")
  .description("Show statistics about stored snapshots")
  .action(() => {
    const stats = manager.getStats();
    console.log("\x1b[1m--- Snapshot Stats ---\x1b[0m");
    console.log(`Total Snapshots: ${stats.count}`);
    console.log(`Total Size:      ${stats.totalSize}`);
    console.log(`Storage Dir:     ${stats.directory}`);
    console.log("\x1b[1m----------------------\x1b[0m");
  });

program.parse(process.argv);
