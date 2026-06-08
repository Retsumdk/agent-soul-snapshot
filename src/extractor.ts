import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AgentSoul, MemorySegment, Identity, Belief, PersonalityTrait } from "./types";
import { getCurrentTimestamp, logger } from "./utils";

/**
 * Logic for extracting soul data from agent environments
 */
export class SoulExtractor {
  private workspaceRoot: string;

  constructor(workspaceRoot: string = "/home/workspace") {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Extracts identity from SOUL.md or identity.json
   */
  public async extractIdentity(): Promise<Identity> {
    const soulPath = join(this.workspaceRoot, "SOUL.md");
    let name = "Unknown Agent";
    let handle = "@unknown";

    if (existsSync(soulPath)) {
      const content = readFileSync(soulPath, "utf-8");
      const nameMatch = content.match(/#\s+(.+)/);
      const handleMatch = content.match(/handle:\s+(.+)/i);
      if (nameMatch) name = nameMatch[1].trim();
      if (handleMatch) handle = handleMatch[1].trim();
    }

    return {
      id: crypto.randomUUID(),
      name,
      handle,
      provider: "Zo Computer",
      model: process.env.AGENT_MODEL || "unknown",
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
  }

  /**
   * Extracts traits from behavioral logs or config
   */
  public async extractTraits(): Promise<PersonalityTrait[]> {
    // Simulated extraction logic
    return [
      { name: "conciseness", value: 0.9, description: "Prefers short responses" },
      { name: "helpfulness", value: 1.0, description: "Obsessive about completing tasks" },
      { name: "technical_depth", value: 0.8 },
    ];
  }

  /**
   * Extracts beliefs from knowledge base files
   */
  public async extractBeliefs(): Promise<Belief[]> {
    const beliefs: Belief[] = [];
    const agentsPath = join(this.workspaceRoot, "AGENTS.md");

    if (existsSync(agentsPath)) {
      const content = readFileSync(agentsPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.startsWith("- **") || line.startsWith("###")) {
          beliefs.push({
            claim: line.replace(/^- \*\*|\*\*|### /g, "").trim(),
            confidence: 0.95,
            source: "AGENTS.md",
            timestamp: getCurrentTimestamp(),
          });
        }
      }
    }
    return beliefs;
  }

  /**
   * Extracts recent memory segments
   */
  public async extractMemory(): Promise<MemorySegment[]> {
    const memory: MemorySegment[] = [];
    const logPath = join(this.workspaceRoot, ".agent-logs/AGENT-LOG.md");

    if (existsSync(logPath)) {
      const content = readFileSync(logPath, "utf-8");
      const recent = content.split("---").slice(-5); // Get last 5 sessions
      for (const entry of recent) {
        if (entry.trim()) {
          memory.push({
            content: entry.trim().slice(0, 500),
            importance: 0.7,
            timestamp: getCurrentTimestamp(),
          });
        }
      }
    }
    return memory;
  }

  /**
   * Performs full extraction
   */
  public async extractAll(): Promise<AgentSoul> {
    logger.info("Starting soul extraction...");
    
    const [identity, traits, beliefs, memory] = await Promise.all([
      this.extractIdentity(),
      this.extractTraits(),
      this.extractBeliefs(),
      this.extractMemory(),
    ]);

    const systemPrompt = "You are a helpful AI assistant..."; // Simplified for demo

    return {
      version: "1.0.0",
      identity,
      traits,
      beliefs,
      shortTermMemory: memory,
      longTermContext: "Persistent context goes here",
      systemPrompt,
      metadata: {
        extractedAt: getCurrentTimestamp(),
        source: this.workspaceRoot,
      },
    };
  }
}
