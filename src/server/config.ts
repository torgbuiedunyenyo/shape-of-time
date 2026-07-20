import { z } from "zod";

const environmentSchema = z
  .object({
    ASSET_DRIVER: z.enum(["filesystem", "s3"]).optional(),
    ASSET_FILESYSTEM_ROOT: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1).optional(),
    GENERATION_ENABLED: z.enum(["true", "false"]).optional(),
    HOST: z.string().min(1).optional(),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    PORT: z.coerce.number().int().min(1).max(65_535).optional(),
    RAILWAY_GIT_COMMIT_SHA: z.string().regex(/^[a-f0-9]{40}$/).optional(),
    RAILWAY_DEPLOYMENT_ID: z.string().min(1).optional(),
    RAILWAY_ENVIRONMENT_ID: z.string().min(1).optional(),
    RAILWAY_PROJECT_ID: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_BUCKET: z.string().min(1).optional(),
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  })
  .superRefine((environment, context) => {
    const onRailway =
      environment.RAILWAY_PROJECT_ID !== undefined ||
      environment.RAILWAY_ENVIRONMENT_ID !== undefined ||
      environment.RAILWAY_DEPLOYMENT_ID !== undefined;
    const nodeEnvironment = onRailway ? "production" : (environment.NODE_ENV ?? "development");
    const assetDriver = environment.ASSET_DRIVER ?? "filesystem";
    if (nodeEnvironment === "production" && assetDriver !== "s3") {
      context.addIssue({
        code: "custom",
        message: "production requires ASSET_DRIVER=s3; local filesystem fallback is forbidden",
        path: ["ASSET_DRIVER"],
      });
    }
    if (nodeEnvironment === "production" && environment.DATABASE_URL === undefined) {
      context.addIssue({ code: "custom", message: "DATABASE_URL is required in production", path: ["DATABASE_URL"] });
    }
    if (nodeEnvironment === "production" && environment.RAILWAY_GIT_COMMIT_SHA === undefined) {
      context.addIssue({
        code: "custom",
        message: "RAILWAY_GIT_COMMIT_SHA is required in production",
        path: ["RAILWAY_GIT_COMMIT_SHA"],
      });
    }
    if (assetDriver === "s3") {
      for (const key of [
        "S3_ACCESS_KEY_ID",
        "S3_BUCKET",
        "S3_ENDPOINT",
        "S3_REGION",
        "S3_SECRET_ACCESS_KEY",
      ] as const) {
        if (environment[key] === undefined) {
          context.addIssue({ code: "custom", message: `${key} is required when ASSET_DRIVER=s3`, path: [key] });
        }
      }
      if (environment.S3_ENDPOINT !== undefined && !environment.S3_ENDPOINT.startsWith("https://")) {
        context.addIssue({ code: "custom", message: "S3_ENDPOINT must use HTTPS", path: ["S3_ENDPOINT"] });
      }
    }
    const generationEnabled = environment.GENERATION_ENABLED === "true";
    if (generationEnabled) {
      for (const key of ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"] as const) {
        if (environment[key] === undefined) {
          context.addIssue({
            code: "custom",
            message: `${key} is required when GENERATION_ENABLED=true`,
            path: [key],
          });
        }
      }
    }
  });

export interface AppConfig {
  assetDriver: "filesystem" | "s3";
  assetFilesystemRoot: string;
  databaseUrl: string;
  gitCommitSha?: string;
  generation?: {
    anthropicApiKey: string;
    openAiApiKey: string;
  };
  host: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  nodeEnvironment: "development" | "test" | "production";
  port: number;
  s3?: {
    accessKeyId: string;
    bucket: string;
    endpoint: string;
    region: string;
    secretAccessKey: string;
  };
}

export function parseConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const parsed = environmentSchema.parse(environment);
  const onRailway =
    parsed.RAILWAY_PROJECT_ID !== undefined ||
    parsed.RAILWAY_ENVIRONMENT_ID !== undefined ||
    parsed.RAILWAY_DEPLOYMENT_ID !== undefined;
  const assetDriver = parsed.ASSET_DRIVER ?? "filesystem";
  const base: AppConfig = {
    assetDriver,
    assetFilesystemRoot: parsed.ASSET_FILESYSTEM_ROOT ?? ".local/assets",
    databaseUrl:
      parsed.DATABASE_URL ??
      "postgresql://shape_of_time:shape_of_time@127.0.0.1:55432/shape_of_time",
    host: parsed.HOST ?? "0.0.0.0",
    logLevel: parsed.LOG_LEVEL ?? "info",
    nodeEnvironment: onRailway ? "production" : (parsed.NODE_ENV ?? "development"),
    port: parsed.PORT ?? 3000,
  };
  if (parsed.GENERATION_ENABLED === "true") {
    base.generation = {
      anthropicApiKey: parsed.ANTHROPIC_API_KEY!,
      openAiApiKey: parsed.OPENAI_API_KEY!,
    };
  }
  if (parsed.RAILWAY_GIT_COMMIT_SHA !== undefined) base.gitCommitSha = parsed.RAILWAY_GIT_COMMIT_SHA;
  if (assetDriver === "s3") {
    base.s3 = {
      accessKeyId: parsed.S3_ACCESS_KEY_ID!,
      bucket: parsed.S3_BUCKET!,
      endpoint: parsed.S3_ENDPOINT!,
      region: parsed.S3_REGION!,
      secretAccessKey: parsed.S3_SECRET_ACCESS_KEY!,
    };
  }
  return base;
}
