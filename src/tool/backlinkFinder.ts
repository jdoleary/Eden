import { BufReader } from "https://deno.land/std@0.199.0/io/buf_reader.ts";
import { absoluteOsMdPathToWebPath, pathOSAbsolute, pathWeb } from "../path.ts";
import { FileName } from "../sharedTypes.ts";

type Backlinks = {
    [webPath: pathWeb]: {
        text: string;
        lineNumber: number;
        // The file that the backlink is inside of 
        from: pathOSAbsolute;
    }[]
};

export async function findBacklinks(filePathsGenerator: AsyncGenerator<string, void, void>, allFileNames: FileName[], parseDir: string): Promise<Backlinks> {
    console.log('Finding backlinks...');
    const backlinkPerformanceStart = performance.now();
    const backlinks: Backlinks = {};
    for await (const filePath of filePathsGenerator) {
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
                            backlinks[webPath].push({ text: name, lineNumber: lineNumberCounter, from: filePath })
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
    console.log('jtest backlinks', backlinks);
    console.log('\n✅ Finished generating backlinks in', performance.now() - backlinkPerformanceStart, 'milliseconds.');
    return backlinks;
}