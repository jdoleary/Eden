import { pathOSAbsolute, pathOSRelative, pathWeb } from "./path.ts";

export const templateName = 'template.html';
export const stylesName = 'styles.css';
export const configDirName = 'md2web-config'
export const configName = 'md2web.config.json';
export const tableOfContentsURL = '/index.html';
export type TableOfContents = { indent: number, pageName: string, relativePath: string, isDir: boolean, parentDir?: string }[];
export interface FileName {
    name: string;
    webPath: pathWeb;
}
export interface Config {
    projectName: string;
    parseDir: pathOSAbsolute;
    // If relative this path is relative to the currentWorkingDirectory 
    // Otherwise it is absolute
    outDirRoot: pathOSRelative;
    // These paths are relative to the parseDir
    ignoreDirs: pathOSRelative[];
    // These directories will be statically served so that their files are accessible from
    // the website root.  Useful for serving images or json for example.
    // These paths are relative to the parseDir
    staticServeDirs: string[];
    logVerbose?: boolean;
}