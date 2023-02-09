const path = require('path');
const { readdir, writeFile, readFile, mkdir } = require('fs').promises;
const { createHash } = require('node:crypto');
const { createReadStream } = require('node:fs');
const markdown = require('markdown').markdown;

const { version } = require('../package.json');

let parseDir = 'md2WebDefaultParseDir';
let outDir = 'md2WebDefaultOutDir';
// from: https://stackoverflow.com/a/45130990/4418836
async function* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else {
            yield res;
        }
    }
}
; (async () => {
    let config = {};
    try {
        config = JSON.parse(await readFile(path.join('md2web.config.json'))) || {};
    } catch (e) {
        console.log('Caught: Manifest non-existant or corrupt', e);
        return;
    }
    console.log('Got config:', config);
    parseDir = config.parseDir;
    outDir = config.outDir;
    if(!parseDir || !outDir){
        console.log('Config is invalid', config);
        return;
    }
    // Get previous manifest so it can only process the files that have changed
    let previousManifest = { files: {} };
    try {
        previousManifest = JSON.parse(await readFile(path.join(parseDir, 'manifest.json'))) || { files: {} };
    } catch (e) {
        console.log('Caught: Manifest non-existant or corrupt', e);
    }

    const files = {};
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

    for await (const f of getFiles(allFilesPath)) {
        if (path.parse(f).base == 'manifest.json') {
            // Do not process the manifest itself
            continue;
        }
        // Add file name path.relative to the domain
        // so, when I push to the `production` branch
        //(`git push production master`), all the file names
        // will be path.relative to where you can access them on the url
        // and since the url hosts the `build` directory statically,
        // this will list file names in the manifest as
        // `images/explain/cast.gif` instead of `build/images/explain.cast.gif`
        // WHEN YOU UPDATE MAKE SURE YOU ALSO UPDATE THE SERVER VERSION AND VERIFY THE VERSION NUMBER CHANGED.

        // https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options
        // Create a hash of the file contents:
        const hashAlg = createHash('sha256');
        const hash = await new Promise((resolve) => {
            const input = createReadStream(f);
            input.on('readable', () => {
                // Only one element is going to be produced by the
                // hash stream.
                const data = input.read();
                if (data)
                    hashAlg.update(data);
                else {
                    const digest = hashAlg.digest('hex')
                    console.log(`${digest} ${path.relative(__dirname, f)}`);
                    resolve(digest);
                }
            });
        });
        const filePath = path.relative((__dirname, parseDir), f);
        const hasChanged = previousManifest.files[filePath]?.hash !== hash;
        // TODO: not ready for hasChanged because a template changing will have to rerender all
        if (true || hasChanged) {
            console.log('File changed:', filePath);
            await process(f, allFilesNames);
        }
        files[filePath] = { hash };
    }
    writeFile(path.join(parseDir, 'manifest.json'), JSON.stringify(
        {
            version,
            files: files
        }
    ))
})();

async function process(filePath, allFilesNames) {
    console.log('\nProcess', filePath)
    let fileContents = (await readFile(filePath)).toString();
    if (path.parse(filePath).ext == '.md') {
        // Auto backlinking
        for (let { name, kpath } of allFilesNames) {
            if (name == path.parse(filePath).name) {
                // Don't link to self
                continue;
            }
            fileContents = fileContents.split(name).join(`[${name}](/${kpath})`);
        }


        // Convert markdown to html
        let html = markdown.toHTML(fileContents);

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
        for (let dir of searchDirectories.reverse()) {
            let templateContents = templateReplacer;
            try {
                templateContents = (await readFile(path.join(parseDir, dir, 'template'))).toString();
                console.log('Using template', path.join(parseDir, dir, 'template'));
            } catch (e) {
                // ignore, if file not found
            }
            // Add the template to the front
            // TODO: Optimizable
            const [templateStart, templateEnd] = templateContents.split(templateReplacer);
            html = (templateStart || '') + html + (templateEnd || '');
        }

        try {
            // Get the new path
            const outPath = path.join(outDir, relativePath);
            // Make the directory that the file will end up in
            await mkdir(path.parse(outPath).dir, { recursive: true });
            // Rename the file as .html
            const htmlOutPath = path.join(path.dirname(outPath), path.basename(outPath, path.extname(outPath)) + '.html')
            // Write the file
            await writeFile(htmlOutPath, html);
            console.log('Written', htmlOutPath);
        } catch (e) {
            console.error(e);
        }
    } else {
        console.log('non .md file types not handled yet:', filePath);
    }
    console.log('Done processing', filePath, '\n');


}