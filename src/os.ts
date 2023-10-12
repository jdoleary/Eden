import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { Config, configDirName } from "./sharedTypes.ts";
function getIgnoredDirectories(config: Config): string[] {
    return [...config.ignoreDirs, config.outDirRoot, configDirName];

}
export async function* getDirs(dir: string, config: Config): AsyncGenerator<{ dir: string, contents: Deno.DirEntry[] }, void, void> {
    const dirents = Deno.readDir(dir);
    // Yield top level directory first so its own contents will be included
    // ex: content.name: 'Butterfly Sweep.md'
    if (isDirectoryIgnored(dir, globalThis.parseDir, getIgnoredDirectories(config))) {
        return;
    }
    yield { dir: dir, contents: Array.from(Deno.readDirSync(dir)) };
    for await (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        // Ignore outDirRoot or else it will loop forever
        // Ignore both ignoreDirectories and staticServeDirectorys (we don't want static serve directories showing up in table of contents)
        if (isDirectoryIgnored(res, globalThis.parseDir, getIgnoredDirectories(config))) {
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
        if (isDirectoryIgnored(res, globalThis.parseDir, getIgnoredDirectories(config))) {
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
    return ['node_modules', ...ignoreDirs].some(ignore => {
        return path.relative(parseDir, dir).startsWith(ignore);
    }) || dir.split(path.sep).some(dirStep => /^\.[^\./]/.test(dirStep));
}
const testBaseDir = `C:${path.sep}base`;
[
    { dir: `${testBaseDir}${path.sep}Assets`, ignoreDirs: ['Assets'], expected: true },
    // allow unix-style current directory `.`
    { dir: `.`, ignoreDirs: [], expected: false },
    { dir: `./inside`, ignoreDirs: [], expected: false },
    // allow unix-style up-one-dir `../`
    { dir: `../`, ignoreDirs: [], expected: false },
    { dir: `../test`, ignoreDirs: [], expected: false },
    // ignore hidden directories (with leading '.')
    { dir: `${testBaseDir}${path.sep}.hidden`, ignoreDirs: [], expected: true },
    // Always ignore node_modules, this is hard-coded
    { dir: `${testBaseDir}${path.sep}node_modules`, ignoreDirs: [], expected: true },
    // TODO: Fix fuzzy matching 
    // { dir: `${testBaseDir}${path.sep}Assets2`, ignoreDirs: ['Assets'], expected: true },
    // { dir: `${testBaseDir}${path.sep}Assets2`, ignoreDirs: ['Assets/'], expected: false },
    // { dir: `${testBaseDir}${path.sep}Assets`, ignoreDirs: ['Assets/'], expected: true },
].map(({ dir, ignoreDirs, expected }) => {
    Deno.test({
        name: `pathToPageName: ${dir} `,
        fn() {
            const actual = isDirectoryIgnored(dir, testBaseDir, ignoreDirs);
            assertEquals(actual, expected);
        },
        only: false
    });
});