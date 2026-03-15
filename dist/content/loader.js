import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateContentBundle } from "./schema.js";
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
function isManifest(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (typeof value.version === "string" &&
        typeof value.generatedAt === "string" &&
        isStringArray(value.packs));
}
function assertPack(value, pathLabel) {
    if (!isRecord(value) || typeof value.id !== "string") {
        throw new Error(`Invalid content pack at ${pathLabel}: missing id`);
    }
    const arrayKeys = ["challenges", "npcs", "scenes", "eventCards", "briefings"];
    for (const key of arrayKeys) {
        if (!Array.isArray(value[key])) {
            throw new Error(`Invalid content pack at ${pathLabel}: ${key} must be an array`);
        }
    }
}
async function loadManifestBundle(manifest, manifestPath) {
    const manifestDir = dirname(manifestPath);
    const merged = {
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
        const parsedPack = JSON.parse(rawPack);
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
export async function loadContentBundle(filePath) {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (isManifest(parsed)) {
        return loadManifestBundle(parsed, filePath);
    }
    const bundle = parsed;
    validateContentBundle(bundle);
    return bundle;
}
