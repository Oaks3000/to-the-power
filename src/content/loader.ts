import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateContentBundle } from "./schema.js";
import type { ContentBundle, ContentManifest, ContentPack } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isManifest(value: unknown): value is ContentManifest {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.version === "string" &&
    typeof value.generatedAt === "string" &&
    isStringArray(value.packs)
  );
}

function assertPack(value: unknown, pathLabel: string): asserts value is ContentPack {
  if (!isRecord(value) || typeof value.id !== "string") {
    throw new Error(`Invalid content pack at ${pathLabel}: missing id`);
  }
  const arrayKeys = ["challenges", "npcs", "scenes", "eventCards", "briefings"] as const;
  for (const key of arrayKeys) {
    if (!Array.isArray(value[key])) {
      throw new Error(`Invalid content pack at ${pathLabel}: ${key} must be an array`);
    }
  }
}

async function loadManifestBundle(manifest: ContentManifest, manifestPath: string): Promise<ContentBundle> {
  const manifestDir = dirname(manifestPath);
  const merged: ContentBundle = {
    version: manifest.version,
    generatedAt: manifest.generatedAt,
    challenges: [],
    npcs: [],
    scenes: [],
    eventCards: [],
    briefings: []
  };

  for (const packRef of manifest.packs) {
    const packPath = resolve(manifestDir, packRef);
    const rawPack = await readFile(packPath, "utf8");
    const parsedPack: unknown = JSON.parse(rawPack);
    assertPack(parsedPack, packRef);
    merged.challenges.push(...parsedPack.challenges);
    merged.npcs.push(...parsedPack.npcs);
    merged.scenes.push(...parsedPack.scenes);
    merged.eventCards.push(...parsedPack.eventCards);
    merged.briefings.push(...parsedPack.briefings);
  }

  validateContentBundle(merged);
  return merged;
}

export async function loadContentBundle(filePath: string): Promise<ContentBundle> {
  const raw = await readFile(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (isManifest(parsed)) {
    return loadManifestBundle(parsed, filePath);
  }

  const bundle = parsed as ContentBundle;
  validateContentBundle(bundle);
  return bundle;
}
