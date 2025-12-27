/**
 * Proof Management Tools
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BitSageClient } from "../client.js";

export const PROOF_TOOLS: Tool[] = [
  {
    name: "bitsage_get_proof",
    description: "Get details about a ZK proof by its hash",
    inputSchema: {
      type: "object",
      properties: {
        proof_hash: {
          type: "string",
          description: "The proof hash to look up",
        },
      },
      required: ["proof_hash"],
    },
  },
  {
    name: "bitsage_verify_proof",
    description: "Verify a ZK proof on-chain",
    inputSchema: {
      type: "object",
      properties: {
        proof_hash: {
          type: "string",
          description: "The proof hash to verify",
        },
      },
      required: ["proof_hash"],
    },
  },
];

export const proofTools = {
  bitsage_get_proof: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const proofHash = args.proof_hash as string;
    const proof = await client.getProof(proofHash);

    return {
      proof_hash: proof.proof_hash,
      job_id: proof.job_id,
      verification_status: proof.verification_status,
    };
  },

  bitsage_verify_proof: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const proofHash = args.proof_hash as string;
    const result = await client.verifyProof(proofHash);

    return {
      proof_hash: proofHash,
      valid: result.valid,
      message: result.valid
        ? "Proof verified successfully"
        : "Proof verification failed",
    };
  },
};
