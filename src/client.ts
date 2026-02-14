/**
 * BitSage API Client for MCP Server
 */

import { hash } from "starknet";

export interface ClientConfig {
  apiUrl: string;
  starknetRpcUrl: string;
  network: "mainnet" | "sepolia";
}

export interface JobType {
  type: string;
  [key: string]: unknown;
}

export interface SubmitJobRequest {
  job_type: JobType;
  input_data: string;
  max_cost_sage: number;
  max_duration_secs: number;
  priority: number;
  require_tee: boolean;
}

export interface JobResponse {
  job_id: string;
  status: string;
  estimated_cost_sage?: number;
  worker_id?: string;
  error_message?: string;
  result_hash?: string;
}

export interface WorkerInfo {
  id: string;
  address: string;
  gpu_model: string;
  gpu_tier: string;
  status: string;
  reputation: number;
}

export interface ProofDetails {
  proof_hash: string;
  job_id: string;
  verification_status: string;
}

export interface NetworkStats {
  total_workers: number;
  active_workers: number;
  total_jobs_completed: number;
  jobs_in_progress: number;
}

export interface StakeInfo {
  staked_amount: number;
  pending_rewards: number;
  gpu_tier: string;
}

export interface FaucetStatus {
  can_claim: boolean;
  time_until_next_claim_secs: number;
  claim_amount: number;
}

export class BitSageClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  // Job operations
  async submitJob(request: SubmitJobRequest): Promise<JobResponse> {
    return this.fetch("/api/jobs/submit", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getJobStatus(jobId: string): Promise<JobResponse> {
    return this.fetch(`/api/jobs/${jobId}`);
  }

  async cancelJob(jobId: string): Promise<{ success: boolean }> {
    return this.fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
  }

  async listJobs(params: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<{ jobs: JobResponse[]; total: number }> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.offset) query.set("offset", params.offset.toString());
    if (params.status) query.set("status", params.status);

    const queryStr = query.toString();
    return this.fetch(`/api/jobs${queryStr ? `?${queryStr}` : ""}`);
  }

  // Worker operations
  async listWorkers(): Promise<WorkerInfo[]> {
    return this.fetch("/api/workers");
  }

  async getWorker(workerId: string): Promise<WorkerInfo> {
    return this.fetch(`/api/workers/${workerId}`);
  }

  // Proof operations
  async getProof(proofHash: string): Promise<ProofDetails> {
    return this.fetch(`/api/proofs/${proofHash}`);
  }

  async verifyProof(proofHash: string): Promise<{ valid: boolean }> {
    return this.fetch(`/api/proofs/${proofHash}/verify`, { method: "POST" });
  }

  // Staking operations
  async stake(
    address: string,
    amount: number,
    gpuTier: string
  ): Promise<{ transaction_hash: string }> {
    return this.fetch("/api/staking/stake", {
      method: "POST",
      body: JSON.stringify({ address, amount, gpu_tier: gpuTier }),
    });
  }

  async unstake(
    address: string,
    amount: number
  ): Promise<{ transaction_hash: string }> {
    return this.fetch("/api/staking/unstake", {
      method: "POST",
      body: JSON.stringify({ address, amount }),
    });
  }

  async claimRewards(
    address: string
  ): Promise<{ amount_claimed: number; transaction_hash: string }> {
    return this.fetch("/api/staking/claim", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  }

  async getStakeInfo(address: string): Promise<StakeInfo> {
    return this.fetch(`/api/staking/info/${address}`);
  }

  // Network operations
  async getNetworkStats(): Promise<NetworkStats> {
    return this.fetch("/api/network/stats");
  }

  // Faucet operations
  async faucetClaim(
    address: string
  ): Promise<{ success: boolean; amount: number; transaction_hash: string }> {
    if (this.config.network === "mainnet") {
      throw new Error("Faucet is only available on testnet");
    }
    return this.fetch("/api/faucet/claim", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  }

  async faucetStatus(address: string): Promise<FaucetStatus> {
    return this.fetch(`/api/faucet/status/${address}`);
  }

  // ZKML Proving (proxied to prover server)

  private get proverUrl(): string {
    return process.env.BITSAGE_PROVER_URL || "http://localhost:8080";
  }

  private get zkmlVerifierAddress(): string {
    return (
      process.env.ZKML_VERIFIER_ADDRESS ||
      "0x005928ac548dc2719ef1b34869db2b61c2a55a4b148012fad742262a8d674fba"
    );
  }

  private async proverFetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.proverUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Prover API error (${response.status}): ${errorText}`);
    }
    return response.json() as Promise<T>;
  }

  async submitZkmlProof(req: {
    model_id: string;
    input?: number[];
    gpu?: boolean;
    security?: string;
  }): Promise<{ job_id: string; status: string }> {
    return this.proverFetch("/api/v1/prove", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  async getZkmlProofStatus(jobId: string): Promise<{
    job_id: string;
    status: string;
    progress_bps: number;
    elapsed_secs: number;
  }> {
    return this.proverFetch(`/api/v1/prove/${jobId}`);
  }

  async getZkmlProofResult(jobId: string): Promise<{
    calldata: string[];
    io_commitment: string;
    weight_commitment: string;
    layer_chain_commitment: string;
    estimated_gas: number;
    num_matmul_proofs: number;
    num_layers: number;
    prove_time_ms: number;
    tee_attestation_hash: string | null;
  }> {
    return this.proverFetch(`/api/v1/prove/${jobId}/result`);
  }

  async isZkmlProofVerified(proofHash: string): Promise<boolean> {
    try {
      const result = await this.starknetCall(
        this.zkmlVerifierAddress,
        "is_proof_verified",
        [proofHash]
      );
      return result === "0x1" || result === "1";
    } catch {
      return false;
    }
  }

  async getZkmlVerificationCount(modelId: string): Promise<number> {
    try {
      const result = await this.starknetCall(
        this.zkmlVerifierAddress,
        "get_verification_count",
        [modelId]
      );
      return Number(result ?? "0");
    } catch {
      return 0;
    }
  }

  async getZkmlModelCommitment(modelId: string): Promise<string | null> {
    try {
      const result = await this.starknetCall(
        this.zkmlVerifierAddress,
        "get_model_commitment",
        [modelId]
      );
      return result ?? null;
    } catch {
      return null;
    }
  }

  private async starknetCall(
    contractAddress: string,
    entryPoint: string,
    calldata: string[]
  ): Promise<string | null> {
    const url = this.config.starknetRpcUrl;
    // Convert function name to sn_keccak selector (felt252 hex)
    const selector = hash.getSelectorFromName(entryPoint);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "starknet_call",
        params: [
          {
            contract_address: contractAddress,
            entry_point_selector: selector,
            calldata,
          },
          "latest",
        ],
      }),
    });
    const json = (await response.json()) as {
      result?: string[];
      error?: { message: string };
    };
    if (json.error) throw new Error(json.error.message);
    return json.result?.[0] ?? null;
  }
}
