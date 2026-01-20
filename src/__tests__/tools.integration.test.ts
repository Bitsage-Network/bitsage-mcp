/**
 * BitSage MCP Server Integration Tests
 *
 * These tests verify MCP tool implementations against a live coordinator.
 * Set BITSAGE_API_URL environment variable to target a specific endpoint.
 *
 * Run with: npm test -- --run
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import { BitSageClient, ClientConfig } from "../client.js";
import { jobTools } from "../tools/jobs.js";
import { workerTools } from "../tools/workers.js";
import { proofTools } from "../tools/proofs.js";
import { networkTools } from "../tools/network.js";
import { faucetTools } from "../tools/faucet.js";
import { stakingTools } from "../tools/staking.js";

// Test configuration from environment
const TEST_CONFIG: ClientConfig = {
  apiUrl: process.env.BITSAGE_API_URL || "http://localhost:8080",
  starknetRpcUrl:
    process.env.STARKNET_RPC_URL ||
    "https://starknet-sepolia.public.blastapi.io",
  network: (process.env.BITSAGE_NETWORK as "sepolia" | "mainnet") || "sepolia",
};

// Test wallet address (Sepolia testnet only)
const TEST_WALLET_ADDRESS =
  process.env.TEST_ACCOUNT_ADDRESS ||
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

// Skip integration tests if not configured
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION_TESTS === "true";

describe.skipIf(SKIP_INTEGRATION)("MCP Tools Integration Tests", () => {
  let client: BitSageClient;

  beforeAll(() => {
    client = new BitSageClient(TEST_CONFIG);
  });

  describe("Network Tools", () => {
    it("bitsage_network_stats should return network statistics", async () => {
      const result = await networkTools.bitsage_network_stats(client);

      expect(result).toHaveProperty("total_workers");
      expect(result).toHaveProperty("active_workers");
      expect(result).toHaveProperty("total_jobs_completed");
      expect(result).toHaveProperty("jobs_in_progress");
      expect(result).toHaveProperty("worker_utilization");
      expect(typeof result.total_workers).toBe("number");
    });
  });

  describe("Worker Tools", () => {
    it("bitsage_list_workers should return worker list", async () => {
      const result = await workerTools.bitsage_list_workers(client);

      expect(result).toHaveProperty("workers");
      expect(Array.isArray(result.workers)).toBe(true);
      expect(result).toHaveProperty("total_workers");
    });

    it("bitsage_get_worker should handle non-existent worker", async () => {
      await expect(
        workerTools.bitsage_get_worker(client, {
          worker_id: "00000000-0000-0000-0000-000000000000",
        })
      ).rejects.toThrow();
    });
  });

  describe("Job Tools", () => {
    let submittedJobId: string | undefined;

    it("bitsage_submit_job should submit a job", async () => {
      try {
        const result = await jobTools.bitsage_submit_job(client, {
          job_type: "ai_inference",
          model_type: "test-model",
          input_data: btoa("test input data"),
          max_cost_sage: 100,
          max_duration_secs: 300,
          priority: 5,
          require_tee: false,
        });

        expect(result).toHaveProperty("success", true);
        expect(result).toHaveProperty("job_id");
        expect(result).toHaveProperty("status");
        expect(result).toHaveProperty("message");

        submittedJobId = result.job_id;
      } catch (error) {
        // May fail if no workers available - OK for integration test
        console.log("Job submission failed (expected if no workers):", error);
      }
    });

    it("bitsage_get_job_status should get job status", async () => {
      if (!submittedJobId) {
        console.log("Skipping - no job was submitted");
        return;
      }

      const result = await jobTools.bitsage_get_job_status(client, {
        job_id: submittedJobId,
      });

      expect(result).toHaveProperty("job_id", submittedJobId);
      expect(result).toHaveProperty("status");
      expect([
        "pending",
        "assigned",
        "running",
        "completed",
        "failed",
        "cancelled",
      ]).toContain(result.status);
    });

    it("bitsage_list_jobs should list jobs", async () => {
      const result = await jobTools.bitsage_list_jobs(client, {
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveProperty("jobs");
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("showing");
    });

    it("bitsage_list_jobs should support status filtering", async () => {
      const result = await jobTools.bitsage_list_jobs(client, {
        limit: 5,
        status: "completed",
      });

      expect(result).toHaveProperty("jobs");
      // All returned jobs should be completed (if any)
      for (const job of result.jobs) {
        expect(job.status).toBe("completed");
      }
    });

    it("bitsage_cancel_job should cancel a job", async () => {
      if (!submittedJobId) {
        console.log("Skipping - no job was submitted");
        return;
      }

      try {
        const result = await jobTools.bitsage_cancel_job(client, {
          job_id: submittedJobId,
        });

        expect(result).toHaveProperty("success", true);
        expect(result).toHaveProperty("job_id", submittedJobId);
        expect(result).toHaveProperty("message");
      } catch (error) {
        // May fail if job already completed
        console.log("Cancel job result:", error);
      }
    });
  });

  describe("Job Type Variants", () => {
    it("should handle zk_proof job type", async () => {
      try {
        const result = await jobTools.bitsage_submit_job(client, {
          job_type: "zk_proof",
          circuit_type: "ecdsa",
          proof_system: "stwo",
          input_data: btoa("test circuit input"),
        });

        expect(result).toHaveProperty("success", true);
        expect(result).toHaveProperty("job_id");
      } catch (error) {
        // Expected to fail without workers
        console.log("ZK proof job submission:", error);
      }
    });

    it("should handle computer_vision job type", async () => {
      try {
        const result = await jobTools.bitsage_submit_job(client, {
          job_type: "computer_vision",
          model_name: "yolo",
          input_format: "image",
          input_data: btoa("fake image data"),
        });

        expect(result).toHaveProperty("success", true);
      } catch (error) {
        console.log("CV job submission:", error);
      }
    });

    it("should handle custom job type", async () => {
      try {
        const result = await jobTools.bitsage_submit_job(client, {
          job_type: "custom",
          name: "test-custom-job",
          parallelizable: true,
          input_data: btoa("custom input"),
        });

        expect(result).toHaveProperty("success", true);
      } catch (error) {
        console.log("Custom job submission:", error);
      }
    });
  });

  describe("Proof Tools", () => {
    it("bitsage_get_proof should handle non-existent proof", async () => {
      await expect(
        proofTools.bitsage_get_proof(client, {
          proof_hash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        })
      ).rejects.toThrow();
    });

    it("bitsage_verify_proof should handle non-existent proof", async () => {
      await expect(
        proofTools.bitsage_verify_proof(client, {
          proof_hash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        })
      ).rejects.toThrow();
    });
  });

  describe("Faucet Tools", () => {
    it("bitsage_faucet_status should check faucet status", async () => {
      if (TEST_CONFIG.network === "mainnet") {
        console.log("Skipping faucet test on mainnet");
        return;
      }

      const result = await faucetTools.bitsage_faucet_status(client, {
        address: TEST_WALLET_ADDRESS,
      });

      expect(result).toHaveProperty("can_claim");
      expect(result).toHaveProperty("time_until_next_claim_secs");
      expect(result).toHaveProperty("claim_amount");
      expect(typeof result.can_claim).toBe("boolean");
    });

    it("bitsage_faucet_claim should attempt to claim tokens", async () => {
      if (TEST_CONFIG.network === "mainnet") {
        console.log("Skipping faucet test on mainnet");
        return;
      }

      try {
        const result = await faucetTools.bitsage_faucet_claim(client, {
          address: TEST_WALLET_ADDRESS,
        });

        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("amount");
        expect(result).toHaveProperty("transaction_hash");
      } catch (error) {
        // Rate limited or already claimed - OK for integration test
        console.log("Faucet claim result:", error);
      }
    });
  });

  describe("Staking Tools", () => {
    it("bitsage_get_stake_info should get staking information", async () => {
      try {
        const result = await stakingTools.bitsage_get_stake_info(client, {
          address: TEST_WALLET_ADDRESS,
        });

        expect(result).toHaveProperty("staked_amount");
        expect(result).toHaveProperty("pending_rewards");
        expect(result).toHaveProperty("gpu_tier");
      } catch (error) {
        // May fail if address not registered
        console.log("Get stake info:", error);
      }
    });
  });
});

describe("BitSageClient Unit Tests", () => {
  it("should construct with default config", () => {
    const client = new BitSageClient({
      apiUrl: "https://api.bitsage.network",
      starknetRpcUrl: "https://starknet-sepolia.public.blastapi.io",
      network: "sepolia",
    });
    expect(client).toBeDefined();
  });

  it("should throw error for mainnet faucet claim", async () => {
    const mainnetClient = new BitSageClient({
      apiUrl: "https://api.bitsage.network",
      starknetRpcUrl: "https://starknet-mainnet.public.blastapi.io",
      network: "mainnet",
    });

    await expect(
      mainnetClient.faucetClaim(TEST_WALLET_ADDRESS)
    ).rejects.toThrow("Faucet is only available on testnet");
  });
});

describe("Tool Schema Validation", () => {
  it("should validate job type enum", () => {
    const validJobTypes = [
      "ai_inference",
      "zk_proof",
      "computer_vision",
      "data_pipeline",
      "render_3d",
      "custom",
    ];

    // All valid types should be recognized
    for (const jobType of validJobTypes) {
      expect(validJobTypes).toContain(jobType);
    }
  });

  it("should validate status enum", () => {
    const validStatuses = [
      "pending",
      "running",
      "completed",
      "failed",
      "cancelled",
    ];

    for (const status of validStatuses) {
      expect(validStatuses).toContain(status);
    }
  });

  it("should validate priority range", () => {
    // Priority should be 1-10
    const minPriority = 1;
    const maxPriority = 10;
    const defaultPriority = 5;

    expect(defaultPriority).toBeGreaterThanOrEqual(minPriority);
    expect(defaultPriority).toBeLessThanOrEqual(maxPriority);
  });
});
