import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { assertEquals } from "https://deno.land/std@0.196.0/testing/asserts.ts";
import { Config, configDir } from "./sharedTypes.ts";

// Warning: Paths can get complicated because relative paths may be relative to cwd or parseDir
// or they may be relative to the web root if they are being used in the website
// use absolute paths whenever possible to prevent this confusion

const WEB_PATH_SEPARATOR = '/';
// confDir is where the config.json file, the html template and the default css are stored
export function getConfDir(parseDir: pathOSAbsolute): pathOSAbsolute {
    // confDir doesn't need to be scoped to a project name like outDir does,
    // because it lives in the parseDir and the parseDir represents a single project already 
    const confPath = path.join(parseDir, configDir);
    const isAbsolute = path.isAbsolute(confPath);
    return isAbsolute ? confPath : path.resolve(confPath);
}
export function getOutDir(config: Config): pathOSAbsolute {
    // outDirRoot needs to be scoped to a project name because if this exe is run from
    // cli it might generate the outDir where the exe lives rather than in the parseDir
    const isAbsolute = path.isAbsolute(config.outDirRoot);
    const outDirPath = path.join(config.outDirRoot, config.projectName);
    return isAbsolute
        ? outDirPath
        : path.resolve(outDirPath)
}
// returned pagePath is specifically for the web so seperator is always "/"
// Always returns a relative path (no leading "/") (pathWeb)
// For example, see tests below
export function pageNameToPagePath(relativePath: string, name: string, extension = '.html'): pathWeb {
    // .filter removes leading and trailing separators
    return [...relativePath.split(path.sep).filter(x => !!x), (path.basename(name, path.extname(name)) + extension)].join(WEB_PATH_SEPARATOR).replaceAll(' ', '_')
}

[
    [`${path.sep}a`, 'name', 'a/name.html'],
    ['a', 'name', 'a/name.html'],
    [`a${path.sep}`, 'name', 'a/name.html'],
    ['a/b', 'name', 'a/b/name.html'],
    ['', 'test.md', 'test.html'],
].map(([relativePath, name, expectedPath]) => {

    Deno.test(`pageNameToPagePath: ${relativePath},${name} -> ${expectedPath} `, () => {
        const actual = pageNameToPagePath(relativePath, name);
        const expected = expectedPath;
        assertEquals(actual, expected);
    });
});

// Extracts a human-readable page name and replaces "_" with spaces.
export function pathToPageName(filepath: string): string {
    return path.parse(filepath).name.replaceAll('_', ' ');
}

[
    ['/test/nest/path_has_underscores.html', 'path has underscores'],
    ['./path with spaces.md', 'path with spaces'],
    ['just file_name.html', 'just file name'],
    ['/directory/two', 'two'],
].map(([path, expectedPageName]) => {

    Deno.test(`pathToPageName: ${path} -> ${expectedPageName} `, () => {
        const actual = pathToPageName(path);
        const expected = expectedPageName;
        assertEquals(actual, expected);
    });
});


// pathWeb is a path to be used for fetching data in the website such as
// "/Assets/image.png".
// They always use "/"
export type pathWeb = string;
// pathOSRelative is relative to the current working directory such as 
// "md2web-out\my-digital-garden"
export type pathOSRelative = string;
// pathOSAbsolute is fully absolute paths such as
// "C:\some-directory\somefile.md"
export type pathOSAbsolute = string;