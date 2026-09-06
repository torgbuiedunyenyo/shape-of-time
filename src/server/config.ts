export const config = {
  databaseUrl: process.env.DATABASE_URL,
  schema: process.env.DATABASE_SCHEMA ?? "world",
  generationEnabled: process.env.GENERATION_ENABLED === "true",
  preparationEnabled: process.env.PREPARATION_ENABLED === "true",
  contextRenewalTokens: 250_000,
  budget: Number(process.env.PROVIDER_BUDGET_USD ?? "0"),
  textModel: "gpt-6-astra" as const,
  effort: "xhigh" as const,
  imageModel: "gpt-image-2-2026-04-21" as const,
  port: Number(process.env.PORT ?? "3000"),
};
if (!/^[a-z][a-z0-9_]*$/.test(config.schema))
  throw new Error("Invalid DATABASE_SCHEMA");
