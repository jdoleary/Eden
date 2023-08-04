
export const tableOfContentsURL = '/table_of_contents.html';
export type TableOfContents = { indent: number, pageName: string, relativePath: string, isDir: boolean, parentDir?: string }[];
export interface Config {
    parseDir: string;
    outDir: string;
    ignoreDirs: string[];
    // Where assets such as images are stored.
    assetDir?: string;
    logVerbose?: boolean;
}