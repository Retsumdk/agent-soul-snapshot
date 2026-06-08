/**
 * Agent Soul Data Structures
 */

export interface Identity {
  id: string;
  name: string;
  handle: string;
  provider: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalityTrait {
  name: string;
  value: number; // 0.0 to 1.0
  description?: string;
}

export interface Belief {
  claim: string;
  confidence: number; // 0.0 to 1.0
  source?: string;
  timestamp: string;
}

export interface MemorySegment {
  content: string;
  importance: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentSoul {
  version: string;
  identity: Identity;
  traits: PersonalityTrait[];
  beliefs: Belief[];
  shortTermMemory: MemorySegment[];
  longTermContext: string;
  systemPrompt: string;
  metadata: Record<string, any>;
}

export interface SnapshotMetadata {
  hash: string;
  signature?: string;
  timestamp: string;
  agentId: string;
  byteSize: number;
}

export interface SnapshotPackage {
  soul: AgentSoul;
  meta: SnapshotMetadata;
}
