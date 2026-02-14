#!/usr/bin/env node
/**
 * BitSage MCP Server
 *
 * Enables LLMs to interact with BitSage Network for:
 * - Submitting compute jobs (AI inference, ZK proofs, etc.)
 * - Monitoring job status
 * - Managing workers and proofs
 * - Staking SAGE tokens
 * - Claiming testnet faucet tokens
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { jobTools, JOB_TOOLS } from "./tools/jobs.js";
import { workerTools, WORKER_TOOLS } from "./tools/workers.js";
import { proofTools, PROOF_TOOLS } from "./tools/proofs.js";
import { stakingTools, STAKING_TOOLS } from "./tools/staking.js";
import { faucetTools, FAUCET_TOOLS } from "./tools/faucet.js";
import { networkTools, NETWORK_TOOLS } from "./tools/network.js";
import { zkmlTools, ZKML_TOOLS } from "./tools/zkml.js";
import { BitSageClient, ClientConfig } from "./client.js";

// Configuration from environment
const config: ClientConfig = {
  apiUrl: process.env.BITSAGE_API_URL || "https://api.bitsage.network",
  starknetRpcUrl:
    process.env.STARKNET_RPC_URL ||
    "https://starknet-sepolia.public.blastapi.io",
  network: (process.env.BITSAGE_NETWORK as "mainnet" | "sepolia") || "sepolia",
};

// Initialize client
const client = new BitSageClient(config);

// Create MCP server
const server = new Server(
  {
    name: "bitsage-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Combine all tools
const ALL_TOOLS: Tool[] = [
  ...JOB_TOOLS,
  ...WORKER_TOOLS,
  ...PROOF_TOOLS,
  ...STAKING_TOOLS,
  ...FAUCET_TOOLS,
  ...NETWORK_TOOLS,
  ...ZKML_TOOLS,
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Job tools
    if (name in jobTools) {
      const result = await jobTools[name as keyof typeof jobTools](
        client,
        args as Record<string, unknown>
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    // Worker tools
    if (name in workerTools) {
      const result = await workerTools[name as keyof typeof workerTools](
        client,
        args as Record<string, unknown>
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    // Proof tools
    if (name in proofTools) {
      const result = await proofTools[name as keyof typeof proofTools](
        client,
        args as Record<string, unknown>
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    // Staking tools
    if (name in stakingTools) {
      const result = await stakingTools[name as keyof typeof stakingTools](
        client,
        args as Record<string, unknown>
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    // Faucet tools
    if (name in faucetTools) {
      const result = await faucetTools[name as keyof typeof faucetTools](
        client,
        args as Record<string, unknown>
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    // Network tools
    if (name in networkTools) {
      const result = await networkTools[name as keyof typeof networkTools](
        client,
        args as Record<string, unknown>
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    // ZKML tools
    if (name in zkmlTools) {
      const result = await zkmlTools[name as keyof typeof zkmlTools](
        client,
        args as Record<string, unknown>
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BitSage MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
