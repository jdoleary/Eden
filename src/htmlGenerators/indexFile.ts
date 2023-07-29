import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { pageNameToPagePath, pathToPageName } from "../path.ts";
import { Config } from "../sharedTypes.ts";

export async function createDirectoryIndexFile(d: { dir: string, contents: Deno.DirEntry[] }, outDir: string, config: Config) {
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
        // Write the file
        await Deno.writeTextFile(htmlOutPath, `<h1>${relativePath}</h1>` + d.contents.map(x => {
            const link = pageNameToPagePath('', x.name, x.isDirectory ? '' : '.html');
            return `<a href="${link}">${pathToPageName(link)}</a>`
        }).join('<br/>'));
        if (config.logVerbose) {
            console.log('Written index file:', htmlOutPath);
        }
    } catch (e) {
        console.error(e);
    }

}