/**
 * Worker Management Tools
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BitSageClient } from "../client.js";

export const WORKER_TOOLS: Tool[] = [
  {
    name: "bitsage_list_workers",
    description:
      "List available compute workers in the BitSage network with their capabilities and status",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "bitsage_get_worker",
    description: "Get detailed information about a specific worker",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: {
          type: "string",
          description: "The worker ID to look up",
        },
      },
      required: ["worker_id"],
    },
  },
];

export const workerTools = {
  bitsage_list_workers: async (client: BitSageClient) => {
    const workers = await client.listWorkers();

    return {
      total_workers: workers.length,
      workers: workers.map((w) => ({
        id: w.id,
        gpu_model: w.gpu_model,
        gpu_tier: w.gpu_tier,
        status: w.status,
        reputation: w.reputation,
      })),
    };
  },

  bitsage_get_worker: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const workerId = args.worker_id as string;
    const worker = await client.getWorker(workerId);

    return {
      id: worker.id,
      address: worker.address,
      gpu_model: worker.gpu_model,
      gpu_tier: worker.gpu_tier,
      status: worker.status,
      reputation: worker.reputation,
    };
  },
};
