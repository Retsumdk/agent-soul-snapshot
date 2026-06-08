import { AgentSoul, MemorySegment, Belief } from "./types";
import { logger, clone } from "./utils";

/**
 * Logic for compressing and minifying agent soul data
 */
export class SoulCompressor {
  /**
   * Compresses the soul by removing redundant or low-importance information
   */
  public compress(soul: AgentSoul, ratio: number = 0.5): AgentSoul {
    logger.info(`Compressing soul data (target ratio: ${ratio})...`);
    const result = clone(soul);

    // 1. Filter low confidence beliefs
    result.beliefs = this.filterBeliefs(result.beliefs, 0.7);

    // 2. Truncate memory based on importance
    result.shortTermMemory = this.pruneMemory(result.shortTermMemory, ratio);

    // 3. Minify long term context (simulated)
    if (result.longTermContext.length > 1000) {
      result.longTermContext = result.longTermContext.slice(0, 1000) + "... [truncated]";
    }

    logger.info("Compression complete.");
    return result;
  }

  /**
   * Removes beliefs with confidence below threshold
   */
  private filterBeliefs(beliefs: Belief[], threshold: number): Belief[] {
    const before = beliefs.length;
    const filtered = beliefs.filter((b) => b.confidence >= threshold);
    const removed = before - filtered.length;
    if (removed > 0) {
      logger.debug(`Removed ${removed} low-confidence beliefs.`);
    }
    return filtered;
  }

  /**
   * Prunes memory segments based on importance and desired retention ratio
   */
  private pruneMemory(memory: MemorySegment[], ratio: number): MemorySegment[] {
    const targetCount = Math.ceil(memory.length * ratio);
    if (targetCount >= memory.length) return memory;

    const pruned = [...memory]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, targetCount)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    logger.debug(`Pruned memory from ${memory.length} to ${pruned.length} segments.`);
    return pruned;
  }

  /**
   * Generates a "seed" prompt that summarizes the soul for quick loading
   */
  public generateSeed(soul: AgentSoul): string {
    const traits = soul.traits.map((t) => `${t.name}(${t.value})`).join(", ");
    const beliefs = soul.beliefs.slice(0, 3).map((b) => b.claim).join("; ");
    
    return `Identity: ${soul.identity.name} (${soul.identity.handle}). Traits: ${traits}. Core Beliefs: ${beliefs}.`;
  }
}
