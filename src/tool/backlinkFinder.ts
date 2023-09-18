import { BufReader } from "https://deno.land/std@0.199.0/io/buf_reader.ts";
import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { absoluteOsMdPathToWebPath, pathOSAbsolute, pathOSRelative, pathToPageName, pathWeb } from "../path.ts";
import { FileName, Garden } from "../sharedTypes.ts";

export type Backlinks = {
    [webPath: pathWeb]: {
        text: string;
        backlinkName: string;
        lineNumber: number;
        // The file that the backlink is inside of 
        from: pathOSAbsolute;
    }[]
};

// filePath may be relative path (obsidian style)
// absolute web url
// or just file baseName
export function findFilePathFromBaseName(filePath: string | undefined, garden: Garden): string {
    if (filePath === undefined) {
        return '';
    }
    if (filePath.startsWith('http')) {
        return filePath;
    }
    const foundFile = garden.files.find(f => {
        return f.endsWith(filePath);
    })
    if (foundFile) {
        return `/${foundFile}`
    } else {
        console.error('⚠️ Missing image', filePath);
        return filePath
    }

}

export async function findBacklinks(filePathsGenerator: AsyncGenerator<string, void, void>, allFileNames: FileName[], parseDir: string): Promise<Backlinks> {
    console.log('Finding backlinks...');
    const backlinkPerformanceStart = performance.now();
    const backlinks: Backlinks = {};
    for await (const filePath of filePathsGenerator) {
        if (path.parse(filePath).ext != '.md') {
            // Only process .md files
            continue;
        }
        const filePathAsWebPath = absoluteOsMdPathToWebPath(filePath, parseDir);
        const f = await Deno.open(filePath);
        try {
            const bf = new BufReader(f);
            let lineResult;
            let lineNumberCounter = 0;
            while ((lineResult = await bf.readLine()) !== null) {
                if (lineResult && lineResult.line) {
                    lineNumberCounter++;
                    const line = new TextDecoder().decode(lineResult.line);
                    for (const { name, webPath } of allFileNames) {
                        if (filePathAsWebPath == webPath) {
                            // Don't check for backlinks in own file
                            continue;
                        }
                        if (line.includes(name)) {
                            if (!backlinks[webPath]) {
                                backlinks[webPath] = [];
                            }
                            backlinks[webPath].push({ text: pathToPageName(filePathAsWebPath), backlinkName: name, lineNumber: lineNumberCounter, from: filePathAsWebPath })
                        }
                    }
                }
            }
            f.close();
        } catch (e) {
            console.error(e);
            f.close();
        }
    }
    console.log('✅ Finished generating backlinks in', performance.now() - backlinkPerformanceStart, 'milliseconds.');
    return backlinks;
}