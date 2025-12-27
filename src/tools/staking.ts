/**
 * Staking Tools
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BitSageClient } from "../client.js";

export const STAKING_TOOLS: Tool[] = [
  {
    name: "bitsage_stake",
    description: "Stake SAGE tokens to become a worker or increase stake",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Starknet wallet address",
        },
        amount: {
          type: "number",
          description: "Amount of SAGE tokens to stake",
        },
        gpu_tier: {
          type: "string",
          enum: ["consumer", "workstation", "data_center", "enterprise", "frontier"],
          description: "GPU tier for staking requirements",
        },
      },
      required: ["address", "amount", "gpu_tier"],
    },
  },
  {
    name: "bitsage_unstake",
    description: "Unstake SAGE tokens",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Starknet wallet address",
        },
        amount: {
          type: "number",
          description: "Amount of SAGE tokens to unstake",
        },
      },
      required: ["address", "amount"],
    },
  },
  {
    name: "bitsage_claim_rewards",
    description: "Claim accumulated staking rewards",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Starknet wallet address",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "bitsage_get_stake_info",
    description: "Get staking information for an address",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Starknet wallet address",
        },
      },
      required: ["address"],
    },
  },
];

export const stakingTools = {
  bitsage_stake: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const address = args.address as string;
    const amount = args.amount as number;
    const gpuTier = args.gpu_tier as string;

    const result = await client.stake(address, amount, gpuTier);

    return {
      success: true,
      transaction_hash: result.transaction_hash,
      message: `Staked ${amount} SAGE tokens successfully`,
    };
  },

  bitsage_unstake: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const address = args.address as string;
    const amount = args.amount as number;

    const result = await client.unstake(address, amount);

    return {
      success: true,
      transaction_hash: result.transaction_hash,
      message: `Unstaked ${amount} SAGE tokens successfully`,
    };
  },

  bitsage_claim_rewards: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const address = args.address as string;

    const result = await client.claimRewards(address);

    return {
      success: true,
      amount_claimed: result.amount_claimed,
      transaction_hash: result.transaction_hash,
      message: `Claimed ${result.amount_claimed} SAGE tokens in rewards`,
    };
  },

  bitsage_get_stake_info: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const address = args.address as string;

    const info = await client.getStakeInfo(address);

    return {
      staked_amount: info.staked_amount,
      pending_rewards: info.pending_rewards,
      gpu_tier: info.gpu_tier,
    };
  },
};
