# BitSage MCP Server

MCP (Model Context Protocol) server that enables LLMs like Claude to interact with the BitSage Network for distributed compute operations.

## Features

- **Job Management**: Submit, monitor, and cancel compute jobs
- **Worker Discovery**: List and inspect available compute workers
- **Proof Verification**: Verify ZK proofs on-chain
- **Staking**: Stake SAGE tokens and claim rewards
- **Faucet**: Claim testnet tokens (Sepolia only)
- **Network Stats**: Monitor network health and utilization

## Installation

```bash
npm install @bitsage/mcp-server
```

Or run directly with npx:

```bash
npx @bitsage/mcp-server
```

## Configuration

Set environment variables:

```bash
# API endpoint (optional, defaults to production)
export BITSAGE_API_URL=https://api.bitsage.network

# Starknet RPC (optional)
export STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io

# Network: mainnet or sepolia (optional, defaults to sepolia)
export BITSAGE_NETWORK=sepolia
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bitsage": {
      "command": "npx",
      "args": ["@bitsage/mcp-server"],
      "env": {
        "BITSAGE_NETWORK": "sepolia"
      }
    }
  }
}
```

## Available Tools

### Job Management

| Tool | Description |
|------|-------------|
| `bitsage_submit_job` | Submit a compute job (AI inference, ZK proof, etc.) |
| `bitsage_get_job_status` | Get current status of a job |
| `bitsage_cancel_job` | Cancel a pending or running job |
| `bitsage_list_jobs` | List jobs with optional status filter |

### Worker Management

| Tool | Description |
|------|-------------|
| `bitsage_list_workers` | List available compute workers |
| `bitsage_get_worker` | Get details about a specific worker |

### Proof Verification

| Tool | Description |
|------|-------------|
| `bitsage_get_proof` | Get proof details by hash |
| `bitsage_verify_proof` | Verify a proof on-chain |

### Staking

| Tool | Description |
|------|-------------|
| `bitsage_stake` | Stake SAGE tokens |
| `bitsage_unstake` | Unstake SAGE tokens |
| `bitsage_claim_rewards` | Claim staking rewards |
| `bitsage_get_stake_info` | Get staking info for an address |

### Faucet (Testnet only)

| Tool | Description |
|------|-------------|
| `bitsage_faucet_claim` | Claim testnet SAGE tokens |
| `bitsage_faucet_status` | Check faucet cooldown status |

### Network

| Tool | Description |
|------|-------------|
| `bitsage_network_stats` | Get network statistics |

## Example Interactions

### Submit an AI Inference Job

```
User: Submit an AI inference job using llama-7b model with my prompt "What is the capital of France?"

Claude: I'll submit that job for you.
[Uses bitsage_submit_job tool]

The job has been submitted successfully:
- Job ID: abc123-def456
- Status: pending
- Estimated cost: 50 SAGE tokens
```

### Check Network Status

```
User: How many workers are available on the BitSage network?

Claude: Let me check the network stats.
[Uses bitsage_network_stats tool]

The BitSage network currently has:
- Total workers: 150
- Active workers: 89
- Worker utilization: 59.3%
- Jobs in progress: 42
- Total jobs completed: 15,234
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev
```

## License

MIT
