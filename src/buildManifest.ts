import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { mkdir } from "https://deno.land/std@0.177.0/fs/mod.ts";
// import { createHash } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { html, tokens } from "https://deno.land/x/rusty_markdown/mod.ts";
// const VERSION = '0.1'

let parseDir: string | undefined = 'md2WebDefaultParseDir';
let outDir: string | undefined = 'md2WebDefaultOutDir';
let ignoreDirs: string[] = [];

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
// from: https://stackoverflow.com/a/45130990/4418836
async function* getFiles(dir: string): AsyncGenerator<string, void, void> {
    const dirents = Deno.readDir(dir);
    for await (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (path.parse(res).base == 'manifest.json') {
            // Do not process the manifest itself
            continue;
        }
        if (ignoreDirs.some(dir => res.includes(dir))) {
            // Do not process a file in an ignore directory
            continue;
        }
        if (dirent.isDirectory) {
            yield* getFiles(res);
        } else {
            yield res;
        }
    }
}
interface ManifestFiles {
    [filePath: string]: {
        hash: string
    }
}

interface Manifest {
    version: string;
    files: ManifestFiles;
}
interface Config {
    parseDir?: string;
    outDir?: string;
    ignoreDirs?: string[];
}
async function main() {
    let config: Config = {};
    try {
        config = JSON.parse(await Deno.readTextFile(path.join('md2web.config.json'))) || {};
    } catch (e) {
        console.log('Caught: Manifest non-existant or corrupt', e);
        return;
    }
    console.log('Got config:', config);
    parseDir = config.parseDir;
    outDir = config.outDir;
    ignoreDirs = config.ignoreDirs || [];
    if (!parseDir || !outDir) {
        console.log('Config is invalid', config);
        return;
    }
    // Get previous manifest so it can only process the files that have changed
    // To be used later once I add support for a changed template causing a waterfall change
    // let previousManifest: Manifest = { version: "0.0.0", files: {} };
    // try {
    //     previousManifest = JSON.parse(await Deno.readTextFile(path.join(parseDir, 'manifest.json'))) || { files: {} };
    // } catch (e) {
    //     console.log('Caught: Manifest non-existant or corrupt', e);
    // }

    // const files: ManifestFiles = {};
    const allFilesPath = path.join('.', parseDir);

    // Get a list of all file names to support automatic back linking
    const allFilesNames = [];
    for await (const f of getFiles(allFilesPath)) {
        const parsed = path.parse(f);
        if (parsed.ext == '.md') {
            allFilesNames.push({ name: parsed.name, kpath: path.relative(parseDir, f.split('.md').join('.html')) });
        }
    }
    console.log('All markdown file names:', Array.from(allFilesNames));

    // for await (const f of getFiles(allFilesPath)) {

    //     // Add file name path.relative to the domain
    //     // so, when I push to the `production` branch
    //     //(`git push production master`), all the file names
    //     // will be path.relative to where you can access them on the url
    //     // and since the url hosts the `build` directory statically,
    //     // this will list file names in the manifest as
    //     // `images/explain/cast.gif` instead of `build/images/explain.cast.gif`
    //     // WHEN YOU UPDATE MAKE SURE YOU ALSO UPDATE THE SERVER VERSION AND VERIFY THE VERSION NUMBER CHANGED.

    //     // https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options
    //     // Create a hash of the file contents:
    //     const hashAlg = createHash('sha256');
    //     const hash: string = await new Promise<string>((resolve) => {
    //         const input = createReadStream(f);
    //         input.on('readable', () => {
    //             // Only one element is going to be produced by the
    //             // hash stream.
    //             const data = input.read();
    //             if (data)
    //                 hashAlg.update(data);
    //             else {
    //                 const digest = hashAlg.digest('hex')
    //                 console.log(`${digest} ${path.relative(__dirname, f)}`);
    //                 resolve(digest);
    //             }
    //         });
    //     });
    //     const filePath = path.relative(path.join(__dirname, parseDir), f);

    //     // const hasChanged = previousManifest.files[filePath]?.hash !== hash;
    //     // TODO: not ready for hasChanged because a template changing will have to rerender all
    //     // if (hasChanged) {
    //     console.log('File changed:', filePath);
    //     await process(f, allFilesNames);
    //     // }
    //     files[filePath] = { hash };
    // }
    // writeFile(path.join(parseDir, 'manifest.json'), JSON.stringify(
    //     {
    //         VERSION,
    //         files: files
    //     }
    // ))
};
main();
interface FileName {
    name: string;
    kpath: string;
}
async function process(filePath: string, allFilesNames: FileName[]) {
    if (!parseDir) {
        console.error('parseDir is undefined');
        return;
    }
    if (!outDir) {
        console.error('parseDir is undefined');
        return;
    }
    console.log('\nProcess', filePath)
    let fileContents = (await Deno.readTextFile(filePath)).toString();

    if (path.parse(filePath).ext == '.md') {
        // Auto backlinking
        for (const { name, kpath } of allFilesNames) {
            if (name == path.parse(filePath).name) {
                // Don't link to self
                continue;
            }
            // .replaceAll: Replace all spaces with underscores, so they become valid html paths
            fileContents = fileContents.replaceAll(name, `[${name}](/${kpath.replaceAll(' ', '_')})`);
        }


        // Convert markdown to html
        let htmlString = html(tokens(fileContents));

        // Get all nested templates and add to html
        const relativePath = path.relative(parseDir, filePath);
        const relativeDirectories = path.parse(relativePath).dir;
        // Empty string is for directoryParse base dir
        const eachDirectory = ['', ...relativeDirectories.split(path.sep)];
        const templateReplacer = '/* {{CONTENT}} */';
        const searchDirectories = [];
        for (let i = 0; i < eachDirectory.length; i++) {
            const lookForTemplateFileInDir = eachDirectory.slice(0, i + 1).join(path.sep);
            searchDirectories.push(lookForTemplateFileInDir);
        }
        for (const dir of searchDirectories.reverse()) {
            let templateContents = templateReplacer;
            try {
                templateContents = (await Deno.readTextFile(path.join(parseDir, dir, 'template'))).toString();
                console.log('Using template', path.join(parseDir, dir, 'template'));
            } catch (e) {
                // ignore, if file not found
            }
            // Add the template to the front
            // TODO: Optimizable
            const [templateStart, templateEnd] = templateContents.split(templateReplacer);
            htmlString = (templateStart || '') + htmlString + (templateEnd || '');
        }

        try {
            // Get the new path
            const outPath = path.join(outDir, relativePath);
            // Make the directory that the file will end up in
            await MAKE_DIR(path.parse(outPath).dir, { recursive: true });
            // Rename the file as .html
            // .replaceAll: Replace all spaces with underscores, so they become valid html paths
            const htmlOutPath = path.join(path.dirname(outPath), path.basename(outPath, path.extname(outPath)) + '.html').replaceAll(' ', '_');
            // Write the file
            await Deno.writeTextFile(htmlOutPath, htmlString);
            console.log('Written', htmlOutPath);
        } catch (e) {
            console.error(e);
        }
    } else {
        console.log('non .md file types not handled yet:', filePath);
    }
    console.log('Done processing', filePath, '\n');


}