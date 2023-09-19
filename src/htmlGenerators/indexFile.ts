import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { getOutDir, pageNameToPagePath, pathToPageName } from "../path.ts";
import { Config, Garden, TableOfContents, tagsDirectoryName } from "../sharedTypes.ts";
import { addContentsToTemplate } from "./useTemplate.ts";
import { Backlinks } from "../tool/backlinkFinder.ts";

export async function createDirectoryIndexFile(d: { dir: string, contents: Deno.DirEntry[] }, templateHtml: string, { tableOfContents, config, backlinks }: { tableOfContents: TableOfContents, config: Config, backlinks: Backlinks }) {
    try {
        const relativePath = path.relative(globalThis.parseDir, d.dir);
        const title = path.parse(d.dir).name;
        // Get the new path
        // ex: 'out'
        const outPath = path.join(getOutDir(config), relativePath);
        // Make the directory that the file will end up in
        await Deno.mkdir(outPath, { recursive: true });
        // Rename the file as .html
        // .replaceAll: Replace all spaces with underscores, so they become valid html paths
        // ex: 'out\index.html'
        const htmlOutPath = path.join(outPath, 'index.html').replaceAll(' ', '_');
        const htmlString = await addContentsToTemplate(d.contents.filter(x => x.name.endsWith('.md') || x.isDirectory).map(x => {
            const link = pageNameToPagePath(path.relative(globalThis.parseDir, d.dir), x.name, x.isDirectory ? '' : '.html');
            return `<a href="/${link}">${pathToPageName(link)}</a>`
        }).join('<br/>'), templateHtml, { config, tableOfContents, filePath: htmlOutPath, relativePath, metadata: { title }, backlinks, isDir: true })
        // Write the file
        await Deno.writeTextFile(htmlOutPath, htmlString);
        if (config.logVerbose) {
            console.log('Written index file:', htmlOutPath);
        }
    } catch (e) {
        console.error(e);
    }

}
export function getWebPathOfTag(tag: string): string {
    return path.join(tagsDirectoryName, `${tag}.html`).replaceAll(' ', '_');
}
// An index file that shows all Pages that use the `tag`
export async function createTagIndexFile(tag: string, garden: Garden, templateHtml: string, { tableOfContents, config, backlinks }: { tableOfContents: TableOfContents, config: Config, backlinks: Backlinks }) {
    try {
        const relativePath = getWebPathOfTag(tag);
        const title = tag;
        // Rename the file as .html
        // .replaceAll: Replace all spaces with underscores, so they become valid html paths
        // ex: 'out\index.html'
        const htmlOutPath = path.join(getOutDir(config), relativePath);

        // Get all pages tagged with `tag`
        const taggedPages = garden.pages.filter(p => p.metadata?.tags && p.metadata.tags.includes(tag));

        const htmlString = await addContentsToTemplate(taggedPages.map(p => {
            return `<a href="${p.webPath}">${p.name}</a>`
        }).join('<br/>'), templateHtml, { config, tableOfContents, garden, filePath: htmlOutPath, relativePath, metadata: { title }, backlinks, isDir: true })
        // Write the file
        await Deno.writeTextFile(htmlOutPath, htmlString);
        if (config.logVerbose) {
            console.log('Written tag index file:', htmlOutPath);
        }
    } catch (e) {
        console.error(e);
    }
}
// This index file that lists all the tags
export async function createTagDirIndexFile(garden: Garden, templateHtml: string, { tableOfContents, config, backlinks }: { tableOfContents: TableOfContents, config: Config, backlinks: Backlinks }) {
    try {
        const relativePath = tagsDirectoryName;
        const title = 'Tags';
        // Rename the file as .html
        // .replaceAll: Replace all spaces with underscores, so they become valid html paths
        // ex: 'out\index.html'
        const htmlOutPath = path.join(getOutDir(config), relativePath, 'index.html');

        const tags = Array.from(garden.tags.keys());

        const htmlString = await addContentsToTemplate(tags.map(tag => {
            const tagPath = path.posix.join(tagsDirectoryName, `${tag}.html`).replaceAll(' ', '_');
            return `<a href="/${tagPath}">${tag}</a>`
        }).join('<br/>'), templateHtml, { config, tableOfContents, garden, filePath: htmlOutPath, relativePath, metadata: { title }, backlinks, isDir: true })
        // Write the file
        await Deno.writeTextFile(htmlOutPath, htmlString);
        if (config.logVerbose) {
            console.log('Written tag index file:', htmlOutPath);
        }
    } catch (e) {
        console.error(e);
    }

}