import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { Config } from "./sharedTypes.ts";

export async function* getDirs(dir: string, config: Config): AsyncGenerator<{ dir: string, contents: Deno.DirEntry[] }, void, void> {
    const dirents = Deno.readDir(dir);
    // Yield top level directory first so its own contents will be included
    // ex: content.name: 'Butterfly Sweep.md'
    yield { dir: dir, contents: Array.from(Deno.readDirSync(dir)) };
    for await (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (isDirectoryIgnored(res, config.parseDir, config.ignoreDirs)) {
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
        if (isDirectoryIgnored(res, config.parseDir, config.ignoreDirs)) {
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

import { assertEquals } from "https://deno.land/std@0.196.0/testing/asserts.ts";
function isDirectoryIgnored(dir: string, parseDir: string, ignoreDirs: string[]): boolean {
    return ignoreDirs.some(ignore => {
        return path.relative(parseDir, dir).startsWith(ignore);
    });

}
const testBaseDir = 'C:\\base';
[
    { dir: `${testBaseDir}\\Assets`, ignoreDirs: ['Assets'], expected: true },
    { dir: `${testBaseDir}\\Assets2`, ignoreDirs: ['Assets'], expected: false },
].map(({ dir, ignoreDirs, expected }) => {
    Deno.test(`pathToPageName: ${dir} `, () => {
        const actual = isDirectoryIgnored(dir, testBaseDir, ignoreDirs);
        assertEquals(actual, expected);
    });
});