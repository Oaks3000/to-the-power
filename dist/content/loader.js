import { readFile } from "node:fs/promises";
import { validateContentBundle } from "./schema.js";
export async function loadContentBundle(filePath) {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const bundle = parsed;
    validateContentBundle(bundle);
    return bundle;
}
