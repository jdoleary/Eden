import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { Config } from "./sharedTypes.ts";

export async function* getDirs(dir: string, config: Config): AsyncGenerator<{ dir: string, contents: Deno.DirEntry[] }, void, void> {
    const dirents = Deno.readDir(dir);
    // Yield top level directory first so its own contents will be included
    // ex: content.name: 'Butterfly Sweep.md'
    yield { dir: dir, contents: Array.from(Deno.readDirSync(dir)) };
    for await (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (config.ignoreDirs.some(dir => res.includes(dir))) {
            // Do not process a file in an ignore directory
            continue;
        }
        if (dirent.isDirectory) {
            yield* getDirs(res, config);
        }
    }
}
// from: https://stackoverflow.com/a/45130990/4418836
export async function* getFiles(dir: string, config: Config): AsyncGenerator<string, void, void> {
    const dirents = Deno.readDir(dir);
    for await (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (path.parse(res).base == 'manifest.json') {
            // Do not process the manifest itself
            continue;
        }
        if (config.ignoreDirs.some(dir => res.includes(dir))) {
            // Do not process a file in an ignore directory
            continue;
        }
        if (dirent.isDirectory) {
            yield* getFiles(res, config);
        } else {
            yield res;
        }
    }
}