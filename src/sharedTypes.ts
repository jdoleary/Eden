import { pathOSAbsolute, pathOSRelative, pathWeb } from "./path.ts";

export const PROGRAM_NAME = 'eden-md';
export const templateName = 'template-page.html';
export const stylesName = 'styles.css';
export const configDirName = `${PROGRAM_NAME}-config`
export const configName = `${PROGRAM_NAME}.config.json`;
export const tableOfContentsURL = '/index.html';
export const tagsDirectoryName = 'tags';
export const edenEmbedClassName = 'eden-embed';
// For use in data attribute, hence the "-"
export const embedPathDataKey = 'embedpath';
export interface Metadata {
    publish: boolean;
    template: string;
    tags: string[];
    title: string;
    subtitle: string;
}
export type TableOfContentsEntry = {
    originalFilePath?: pathOSAbsolute,
    // If the document will be publicly available and converted to html
    publish: boolean,
    indent: number,
    pageName: string,
    relativePath: string,
    isDir: boolean,
    parentDir?: string,
    // The date when the item was created
    createdAt?: Date,
};
export type TableOfContents = TableOfContentsEntry[];

// The data for a markdown page, to be stored in garden.json and used throughout the app
// for fetching pages based on stats such as an array of the pages organized by most recently created
export interface Page {
    // webPath can be used as an `id` for Page since it is unique
    webPath: pathWeb;
    name: string;
    contents: string;
    metadata?: Metadata;
    createdAt?: number; // Date millis
    modifiedAt?: number; // Date millis
    blockEmbeds: string[];
}
// Garden.json
export interface Garden {
    pages: Page[],
    tags: Set<string>,
    // Html blocks key'd by id
    blocks: { [blockId: string]: string };

}
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
    rssInfo?: RSSInfo;
}

export interface RSSInfo {
    title: string,
    homepage: string,
    description: string,
    language: string
}