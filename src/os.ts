import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { Config, configDirName } from "./sharedTypes.ts";
function getIgnoredDirectories(config: Config): string[] {
    return [...config.ignoreDirs, config.outDirRoot, configDirName];

}
export async function* getDirs(dir: string, config: Config): AsyncGenerator<{ dir: string, contents: Deno.DirEntry[] }, void, void> {
    const dirents = Deno.readDir(dir);
    // Yield top level directory first so its own contents will be included
    // ex: content.name: 'Butterfly Sweep.md'
    if (isDirectoryIgnored(dir, config.parseDir, getIgnoredDirectories(config))) {
        return;
    }
    yield { dir: dir, contents: Array.from(Deno.readDirSync(dir)) };
    for await (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        // Ignore outDirRoot or else it will loop forever
        // Ignore both ignoreDirectories and staticServeDirectorys (we don't want static serve directories showing up in table of contents)
        if (isDirectoryIgnored(res, config.parseDir, getIgnoredDirectories(config))) {
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
        // Ignore outDirRoot or else it will loop forever
        if (isDirectoryIgnored(res, config.parseDir, getIgnoredDirectories(config))) {
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
    // TODO: Fix fuzzy matching 
    // { dir: `${testBaseDir}\\Assets2`, ignoreDirs: ['Assets'], expected: true },
    // { dir: `${testBaseDir}\\Assets2`, ignoreDirs: ['Assets/'], expected: false },
    // { dir: `${testBaseDir}\\Assets`, ignoreDirs: ['Assets/'], expected: true },
].map(({ dir, ignoreDirs, expected }) => {
    Deno.test(`pathToPageName: ${dir} `, () => {
        const actual = isDirectoryIgnored(dir, testBaseDir, ignoreDirs);
        assertEquals(actual, expected);
    });
});