/**
 * Network Statistics Tools
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BitSageClient } from "../client.js";

export const NETWORK_TOOLS: Tool[] = [
  {
    name: "bitsage_network_stats",
    description:
      "Get overall BitSage network statistics including worker count, job throughput, and utilization",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export const networkTools = {
  bitsage_network_stats: async (client: BitSageClient) => {
    const stats = await client.getNetworkStats();

    return {
      total_workers: stats.total_workers,
      active_workers: stats.active_workers,
      total_jobs_completed: stats.total_jobs_completed,
      jobs_in_progress: stats.jobs_in_progress,
      worker_utilization: `${((stats.active_workers / stats.total_workers) * 100).toFixed(1)}%`,
    };
  },
};
