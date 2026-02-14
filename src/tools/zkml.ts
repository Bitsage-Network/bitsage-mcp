/**
 * ZKML Proving & Verification Tools
 *
 * Enables AI agents to submit ZKML proving jobs, track progress,
 * and check on-chain verification status.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BitSageClient } from "../client.js";

export const ZKML_TOOLS: Tool[] = [
  {
    name: "bitsage_submit_zkml_proof",
    description:
      "Submit a ZKML proof generation job. Returns a job_id to poll for status. " +
      "The model must already be loaded on the prover server.",
    inputSchema: {
      type: "object",
      properties: {
        model_id: {
          type: "string",
          description: "Model identifier (hex string from loading step)",
        },
        input: {
          type: "array",
          items: { type: "number" },
          description: "Optional flat array of f32 input values (random if omitted)",
        },
        gpu: {
          type: "boolean",
          description: "Use GPU acceleration (default: false)",
        },
        security: {
          type: "string",
          enum: ["auto", "tee", "zk-only"],
          description: "Security level (default: auto)",
        },
      },
      required: ["model_id"],
    },
  },
  {
    name: "bitsage_get_zkml_proof_status",
    description:
      "Get the current status and progress of a ZKML proving job.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: {
          type: "string",
          description: "The job ID returned by bitsage_submit_zkml_proof",
        },
      },
      required: ["job_id"],
    },
  },
  {
    name: "bitsage_get_zkml_proof_result",
    description:
      "Get the completed result of a ZKML proving job including calldata, " +
      "commitments, and gas estimate. Only available after job status is 'completed'.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: {
          type: "string",
          description: "The job ID returned by bitsage_submit_zkml_proof",
        },
      },
      required: ["job_id"],
    },
  },
  {
    name: "bitsage_verify_zkml_onchain",
    description:
      "Check if a ZKML proof or model has been verified on-chain via the " +
      "unified verifier contract (0x04807...).",
    inputSchema: {
      type: "object",
      properties: {
        proof_hash: {
          type: "string",
          description: "Proof hash to check verification status (hex string)",
        },
        model_id: {
          type: "string",
          description: "Model ID to check verification count and commitment",
        },
      },
    },
  },
];

export const zkmlTools = {
  bitsage_submit_zkml_proof: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const result = await client.submitZkmlProof({
      model_id: args.model_id as string,
      input: args.input as number[] | undefined,
      gpu: (args.gpu as boolean) ?? false,
      security: (args.security as string) ?? "auto",
    });

    return {
      job_id: result.job_id,
      status: result.status,
      message: `ZKML proving job submitted. Poll with bitsage_get_zkml_proof_status using job_id: ${result.job_id}`,
    };
  },

  bitsage_get_zkml_proof_status: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const jobId = args.job_id as string;
    const status = await client.getZkmlProofStatus(jobId);

    return {
      job_id: status.job_id,
      status: status.status,
      progress_percent: (status.progress_bps / 100).toFixed(1) + "%",
      elapsed_secs: status.elapsed_secs.toFixed(1),
      message:
        status.status === "completed"
          ? "Proof ready! Use bitsage_get_zkml_proof_result to fetch it."
          : status.status === "failed"
            ? "Proving failed."
            : `Proving in progress (${(status.progress_bps / 100).toFixed(1)}%)...`,
    };
  },

  bitsage_get_zkml_proof_result: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const jobId = args.job_id as string;
    const result = await client.getZkmlProofResult(jobId);

    return {
      calldata_length: result.calldata.length,
      io_commitment: result.io_commitment,
      weight_commitment: result.weight_commitment,
      layer_chain_commitment: result.layer_chain_commitment,
      estimated_gas: result.estimated_gas,
      num_matmul_proofs: result.num_matmul_proofs,
      num_layers: result.num_layers,
      prove_time_ms: result.prove_time_ms,
      tee_attestation_hash: result.tee_attestation_hash,
      message: `Proof generated in ${(result.prove_time_ms / 1000).toFixed(1)}s — ${result.calldata.length} felts, ~${result.estimated_gas} gas`,
    };
  },

  bitsage_verify_zkml_onchain: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const proofHash = args.proof_hash as string | undefined;
    const modelId = args.model_id as string | undefined;

    const result: Record<string, unknown> = {};

    if (proofHash) {
      result.proof_hash = proofHash;
      result.is_verified = await client.isZkmlProofVerified(proofHash);
    }

    if (modelId) {
      result.model_id = modelId;
      result.verification_count = await client.getZkmlVerificationCount(modelId);
      result.weight_commitment = await client.getZkmlModelCommitment(modelId);
    }

    if (!proofHash && !modelId) {
      return { error: "Provide at least one of proof_hash or model_id" };
    }

    return result;
  },
};
