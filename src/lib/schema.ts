/**
 * Zod schemas for JSON import/export validation.
 * Keeps imported scenarios safe before they reach the pure engine.
 */
import { z } from 'zod';
import { SystemState } from '../engine/types';

export const SCHEMA_VERSION = 1;

const processSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
});

const resourceSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  totalInstances: z.number().int().min(1).max(10),
});

const edgeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['request', 'assignment']),
  from: z.string().min(1),
  to: z.string().min(1),
  count: z.number().int().min(1),
});

const matrixSchema = z.array(z.array(z.number().int().min(0)));

const systemStateSchema = z.object({
  processes: z.array(processSchema).max(20),
  resources: z.array(resourceSchema).max(20),
  edges: z.array(edgeSchema),
  allocation: matrixSchema.optional(),
  max: matrixSchema.optional(),
  need: matrixSchema.optional(),
  request: matrixSchema.optional(),
  available: z.array(z.number().int().min(0)).optional(),
});

export const exportEnvelopeSchema = z.object({
  schemaVersion: z.number().int(),
  name: z.string(),
  scenario: systemStateSchema,
});

export type ExportEnvelope = z.infer<typeof exportEnvelopeSchema>;

export function toExportEnvelope(name: string, scenario: SystemState): ExportEnvelope {
  return {
    schemaVersion: SCHEMA_VERSION,
    name,
    scenario,
  };
}

export function serializeScenario(name: string, scenario: SystemState): string {
  return JSON.stringify(toExportEnvelope(name, scenario), null, 2);
}

export interface ImportResult {
  ok: boolean;
  name?: string;
  scenario?: SystemState;
  error?: string;
}

/**
 * Parses and validates a JSON export string. Never throws — returns a readable error.
 */
export function parseScenarioJson(json: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    return { ok: false, error: `Not valid JSON: ${(err as Error).message}` };
  }

  // Accept either a bare scenario or a wrapped envelope.
  const candidate =
    raw && typeof raw === 'object' && 'scenario' in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>)
      : { schemaVersion: SCHEMA_VERSION, name: 'Imported scenario', scenario: raw };

  const parsed = exportEnvelopeSchema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join('.') ?? 'scenario';
    return { ok: false, error: `Invalid scenario at "${path}": ${issue?.message ?? 'unknown error'}` };
  }

  return {
    ok: true,
    name: parsed.data.name,
    scenario: parsed.data.scenario as SystemState,
  };
}
