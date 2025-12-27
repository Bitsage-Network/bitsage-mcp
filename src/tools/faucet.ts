/**
 * Faucet Tools (Testnet only)
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BitSageClient } from "../client.js";

export const FAUCET_TOOLS: Tool[] = [
  {
    name: "bitsage_faucet_claim",
    description:
      "Claim testnet SAGE tokens from the faucet (Sepolia testnet only)",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Starknet wallet address to receive tokens",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "bitsage_faucet_status",
    description: "Check faucet claim status and cooldown for an address",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Starknet wallet address to check",
        },
      },
      required: ["address"],
    },
  },
];

export const faucetTools = {
  bitsage_faucet_claim: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const address = args.address as string;

    const result = await client.faucetClaim(address);

    return {
      success: result.success,
      amount: result.amount,
      transaction_hash: result.transaction_hash,
      message: result.success
        ? `Claimed ${result.amount} SAGE tokens successfully`
        : "Faucet claim failed",
    };
  },

  bitsage_faucet_status: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const address = args.address as string;

    const status = await client.faucetStatus(address);

    return {
      can_claim: status.can_claim,
      time_until_next_claim_secs: status.time_until_next_claim_secs,
      claim_amount: status.claim_amount,
      message: status.can_claim
        ? `You can claim ${status.claim_amount} SAGE tokens now`
        : `Next claim available in ${Math.ceil(status.time_until_next_claim_secs / 60)} minutes`,
    };
  },
};
