import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { assertEquals } from "https://deno.land/std@0.196.0/testing/asserts.ts";

const WEB_PATH_SEPARATOR = '/';
// returned pagePath is specifically for the web so seperator is always "/"
// Always returns a relative path (no leading "/")
export function pageNameToPagePath(relativePath: string, name: string, extension = '.html') {
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