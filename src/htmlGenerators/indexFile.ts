import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { pageNameToPagePath, pathToPageName } from "../path.ts";
import { Config, TableOfContents } from "../sharedTypes.ts";
import { addContentsToTemplate } from "./useTemplate.ts";

export async function createDirectoryIndexFile(d: { dir: string, contents: Deno.DirEntry[] }, outDir: string, tableOfContents: TableOfContents, config: Config) {
    try {
        const relativePath = path.relative(config.parseDir, d.dir);
        // Get the new path
        // ex: 'out'
        const outPath = path.join(outDir, relativePath);
        // Make the directory that the file will end up in
        await Deno.mkdir(outPath, { recursive: true });
        // Rename the file as .html
        // .replaceAll: Replace all spaces with underscores, so they become valid html paths
        // ex: 'out\index.html'
        const htmlOutPath = path.join(outPath, 'index.html').replaceAll(' ', '_');
        const htmlString = await addContentsToTemplate(d.contents.filter(x => x.name.endsWith('.md') || x.isDirectory).map(x => {
            const link = pageNameToPagePath(path.relative(config.parseDir, d.dir), x.name, x.isDirectory ? '' : '.html');
            return `<a href="${link}">${pathToPageName(link)}</a>`
        }).join('<br/>'), { config, tableOfContents, filePath: htmlOutPath, relativePath, titleOverride: '', metaData: null })
        // Write the file
        await Deno.writeTextFile(htmlOutPath, htmlString);
        if (config.logVerbose) {
            console.log('Written index file:', htmlOutPath);
        }
    } catch (e) {
        console.error(e);
    }

}