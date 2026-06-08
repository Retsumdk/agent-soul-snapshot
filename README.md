# Agent Soul Snapshot

Captures behavioral identity and belief state for AI agent migration. This tool allows for the extraction, compression, verification, and restoration of an agent's "soul" - its identity, personality traits, core beliefs, and recent memory.

## 🚀 Mission

Build the infrastructure for fluid agent migration across different platforms and models while maintaining behavioral consistency and identity integrity.

## ✨ Features

- **Soul Extraction**: Automatically extracts identity and belief data from standard workspace files (`SOUL.md`, `AGENTS.md`, logs).
- **Semantic Compression**: Intelligently prunes and summarizes agent state for efficient transfer.
- **Integrity Verification**: SHA-256 hashing and cryptographic signing ensure snapshots are not tampered with.
- **Drift Detection**: Analyzes semantic differences between snapshots to monitor behavioral changes over time.
- **Modular Architecture**: Separate modules for extraction, compression, verification, and storage.

## 🛠 Installation

```bash
git clone https://github.com/Retsumdk/agent-soul-snapshot.git
cd agent-soul-snapshot
bun install
```

## 📖 Usage

### Capture a Snapshot

```bash
bun src/index.ts capture --compress 0.5
```

### List Available Snapshots

```bash
bun src/index.ts list
```

### Inspect a Snapshot

```bash
bun src/index.ts inspect soul-<agent-id>-<timestamp>.json
```

### View Stats

```bash
bun src/index.ts stats
```

## 🏗 Architecture

- `src/extractor.ts`: Handles data gathering from the environment.
- `src/compressor.ts`: Provides logic for minifying and summarizing soul state.
- `src/verifier.ts`: Implements hashing and signing for data integrity.
- `src/manager.ts`: Manages disk I/O and snapshot lifecycle.
- `src/types.ts`: Core data structure definitions.

## 📄 License

MIT License

---

Built by [Retsumdk](https://github.com/Retsumdk) as part of the SCIEL AI Agent Infrastructure.
