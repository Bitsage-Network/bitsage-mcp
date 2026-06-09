/**
 * Job Management Tools
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BitSageClient } from "../client.js";

export const JOB_TOOLS: Tool[] = [
  {
    name: "bitsage_submit_job",
    description:
      "Submit a compute job to BitSage network. Supports AI inference, ZK proofs, computer vision, data pipelines, 3D rendering, and custom jobs.",
    inputSchema: {
      type: "object",
      properties: {
        job_type: {
          type: "string",
          enum: [
            "ai_inference",
            "zk_proof",
            "computer_vision",
            "data_pipeline",
            "render_3d",
            "custom",
          ],
          description: "Type of compute job",
        },
        model_type: {
          type: "string",
          description: "Model type for AI inference (e.g., 'llama-7b', 'stable-diffusion')",
        },
        input_data: {
          type: "string",
          description: "Base64 encoded input data or URL to input file",
        },
        max_cost_sage: {
          type: "number",
          description: "Maximum SAGE tokens willing to spend",
          default: 100,
        },
        max_duration_secs: {
          type: "number",
          description: "Maximum execution time in seconds",
          default: 3600,
        },
        priority: {
          type: "number",
          description: "Priority 1-10 (higher = more urgent)",
          default: 5,
        },
        require_tee: {
          type: "boolean",
          description: "Require Trusted Execution Environment",
          default: false,
        },
      },
      required: ["job_type", "input_data"],
    },
  },
  {
    name: "bitsage_get_job_status",
    description: "Get the current status of a job by its ID",
    inputSchema: {
      type: "object",
      properties: {
        job_id: {
          type: "string",
          description: "The job ID to check",
        },
      },
      required: ["job_id"],
    },
  },
  {
    name: "bitsage_cancel_job",
    description: "Cancel a pending or running job",
    inputSchema: {
      type: "object",
      properties: {
        job_id: {
          type: "string",
          description: "The job ID to cancel",
        },
      },
      required: ["job_id"],
    },
  },
  {
    name: "bitsage_list_jobs",
    description: "List jobs with optional filtering by status",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of jobs to return",
          default: 10,
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
          default: 0,
        },
        status: {
          type: "string",
          enum: ["pending", "running", "completed", "failed", "cancelled"],
          description: "Filter by job status",
        },
      },
    },
  },
];

export const jobTools = {
  bitsage_submit_job: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const jobType = args.job_type as string;
    const inputData = args.input_data as string;
    const maxCost = (args.max_cost_sage as number) || 100;
    const maxDuration = (args.max_duration_secs as number) || 3600;
    const priority = (args.priority as number) || 5;
    const requireTee = (args.require_tee as boolean) || false;

    // Build job type object based on type
    const jobTypeObj: { type: string; [key: string]: unknown } = { type: jobType };

    switch (jobType) {
      case "ai_inference":
        jobTypeObj.model_type = args.model_type || "llama-7b";
        jobTypeObj.batch_size = args.batch_size || 1;
        break;
      case "zk_proof":
        jobTypeObj.circuit_type = args.circuit_type || "generic";
        jobTypeObj.proof_system = args.proof_system || "stwo";
        break;
      case "computer_vision":
        jobTypeObj.model_name = args.model_name || "yolo";
        jobTypeObj.input_format = args.input_format || "image";
        break;
      case "data_pipeline":
        jobTypeObj.pipeline_type = args.pipeline_type || "etl";
        jobTypeObj.tee_required = requireTee;
        break;
      case "render_3d":
        jobTypeObj.resolution = args.resolution || "1920x1080";
        jobTypeObj.frames = args.frames || 1;
        break;
      case "custom":
        jobTypeObj.name = args.name || "custom_job";
        jobTypeObj.parallelizable = args.parallelizable ?? true;
        break;
    }

    const result = await client.submitJob({
      job_type: jobTypeObj,
      input_data: inputData,
      max_cost_sage: maxCost,
      max_duration_secs: maxDuration,
      priority,
      require_tee: requireTee,
    });

    return {
      success: true,
      job_id: result.job_id,
      status: result.status,
      estimated_cost: result.estimated_cost_sage,
      message: `Job ${result.job_id} submitted successfully`,
    };
  },

  bitsage_get_job_status: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const jobId = args.job_id as string;
    const result = await client.getJobStatus(jobId);

    return {
      job_id: result.job_id,
      status: result.status,
      worker_id: result.worker_id,
      error_message: result.error_message,
      result_hash: result.result_hash,
    };
  },

  bitsage_cancel_job: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const jobId = args.job_id as string;
    await client.cancelJob(jobId);

    return {
      success: true,
      job_id: jobId,
      message: `Job ${jobId} cancelled successfully`,
    };
  },

  bitsage_list_jobs: async (
    client: BitSageClient,
    args: Record<string, unknown>
  ) => {
    const limit = (args.limit as number) || 10;
    const offset = (args.offset as number) || 0;
    const status = args.status as string | undefined;

    const result = await client.listJobs({ limit, offset, status });

    return {
      jobs: result.jobs.map((j) => ({
        job_id: j.job_id,
        status: j.status,
        worker_id: j.worker_id,
      })),
      total: result.total,
      showing: result.jobs.length,
    };
  },
};
