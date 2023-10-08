import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { assertEquals } from "https://deno.land/std@0.196.0/testing/asserts.ts";
import { Config, configDirName } from "./sharedTypes.ts";

// Warning: Paths can get complicated because relative paths may be relative to cwd or parseDir
// or they may be relative to the web root if they are being used in the website
// use absolute paths whenever possible to prevent this confusion

const WEB_PATH_SEPARATOR = '/';
// confDir is where the config.json file, the html template and the default css are stored
export function getConfDir(parseDir: pathOSAbsolute): pathOSAbsolute {
    // confDir doesn't need to be scoped to a project name like outDir does,
    // because it lives in the parseDir and the parseDir represents a single project already 
    const confPath = path.join(parseDir, configDirName);
    const isAbsolute = path.isAbsolute(confPath);
    return isAbsolute ? confPath : path.resolve(confPath);
}
export function getOutDir(config: Config): pathOSAbsolute {
    // outDirRoot needs to be scoped to a project name because if this exe is run from
    // cli it might generate the outDir where the exe lives rather than in the parseDir
    const isAbsolute = path.isAbsolute(config.outDirRoot);
    const outDirPath = path.join(config.outDirRoot, config.projectName).replaceAll(' ', '_');
    return isAbsolute
        ? outDirPath
        : path.resolve(outDirPath)
}

const TEST_PARSE_DIR = 'C:/parseDir/';
[
    [`${TEST_PARSE_DIR}Submissions/Locks/Straight Ankle Lock.md`, '/Submissions/Locks/Straight_Ankle_Lock.html']
].map(([osPath, expectedPath]) => {

    Deno.test(`absoluteOsMdPathToWebPath: ${osPath} -> ${expectedPath} `, () => {
        const actual = absoluteOsMdPathToWebPath(osPath, TEST_PARSE_DIR);
        const expected = expectedPath;
        assertEquals(actual, expected);
    });
});
export function absoluteOsMdPathToWebPath(osPath: string, parseDir: string): pathWeb {
    // `'/' +`: Make absolute path so that deeply nested pages
    // can link out to non-relative paths
    let webPath = '/' + path.relative(parseDir, osPath).replaceAll('\\', '/').replaceAll(' ', '_');
    if (webPath.endsWith('.md')) {
        webPath = webPath.split('.md').join('.html');
    }
    return webPath;
}

[
    [`${path.sep}a`, 'name', 'a/name.html'],
    ['a', 'name', 'a/name.html'],
    [`a${path.sep}`, 'name', 'a/name.html'],
    ['a/b', 'name', 'a/b/name.html'],
    ['', 'test.md', 'test.html'],
].map(([relativePath, name, expectedPath]) => {

    Deno.test({
        name: `pageNameToPagePath: ${relativePath}, ${name} -> ${expectedPath} `,
        fn() {
            const actual = pageNameToPagePath(relativePath, name);
            const expected = expectedPath;
            assertEquals(actual, expected);
        }, only: false
    });
});
export function changeExtension(filePath: string, extension: string): string {
    const parsed = path.parse(filePath);
    parsed.base = parsed.base.replace(parsed.ext, extension);
    parsed.ext = extension;
    return path.format(parsed);
}
// returned pagePath is specifically for the web so seperator is always "/"
// Always returns a relative path (no leading "/") (pathWeb)
// For example, see tests above
export function pageNameToPagePath(relativePath: string, name: string, extension = '.html'): pathWeb {
    // .filter removes leading and trailing separators
    return [...relativePath.split(path.sep).filter(x => !!x), (path.basename(name, path.extname(name)) + extension)].join(WEB_PATH_SEPARATOR).replaceAll(' ', '_')
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
// Extracts a human-readable page name and replaces "_" with spaces.
export function pathToPageName(filepath: string): string {
    return path.parse(filepath).name.replaceAll('_', ' ');
}



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