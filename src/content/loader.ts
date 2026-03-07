import { readFile } from "node:fs/promises";
import { validateContentBundle } from "./schema.js";
import type { ContentBundle } from "./types.js";

export async function loadContentBundle(filePath: string): Promise<ContentBundle> {
  const raw = await readFile(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  const bundle = parsed as ContentBundle;
  validateContentBundle(bundle);
  return bundle;
}
