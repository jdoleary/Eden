
export const templateName = 'template.html';
export const stylesName = 'styles.css';
export const configName = 'md2web.config.json';
export const tableOfContentsURL = '/Table_of_Contents.html';
export type TableOfContents = { indent: number, pageName: string, relativePath: string, isDir: boolean, parentDir?: string }[];
export interface Config {
    projectName: string;
    parseDir: string;
    outDir: string;
    ignoreDirs: string[];
    // These directories will be statically served so that their files are accessible from
    // the website root.  Useful for serving images or json for example.
    // These paths are relative to the parseDir
    staticServeDirs: string[];
    logVerbose?: boolean;
}