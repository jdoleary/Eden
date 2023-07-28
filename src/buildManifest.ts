import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { copy } from "https://deno.land/std@0.195.0/fs/copy.ts";
// import { createHash } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { html, tokens, Token } from "https://deno.land/x/rusty_markdown/mod.ts";
// const VERSION = '0.1'

let parseDir = 'md2WebDefaultParseDir';
let outDir: string | undefined = 'md2WebDefaultOutDir';
let ignoreDirs: string[] = [];

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
async function* getDirs(dir: string): AsyncGenerator<{ dir: string, contents: Deno.DirEntry[] }, void, void> {
    const dirents = Deno.readDir(dir);
    // Yield top level directory first so its own contents will be included
    yield { dir: dir, contents: Array.from(Deno.readDirSync(dir)) };
    for await (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (ignoreDirs.some(dir => res.includes(dir))) {
            // Do not process a file in an ignore directory
            continue;
        }
        if (dirent.isDirectory) {
            yield* getDirs(res);
        }
    }
}
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
    // Where assets such as images are stored.
    assetDir?: string;
}
type TableOfContents = { indent: number, pageName: string, relativePath: string, isDir: boolean, parentDir?: string }[];
const logVerbose = false;
async function createDirectoryIndexFile(d: { dir: string, contents: Deno.DirEntry[] }, outDir: string) {
    try {
        const relativePath = path.relative(parseDir, d.dir);
        // Get the new path
        const outPath = path.join(outDir, relativePath);
        // Make the directory that the file will end up in
        await Deno.mkdir(outPath, { recursive: true });
        // Rename the file as .html
        // .replaceAll: Replace all spaces with underscores, so they become valid html paths
        const htmlOutPath = path.join(outPath, 'index.html').replaceAll(' ', '_');
        // Write the file
        await Deno.writeTextFile(htmlOutPath, `<h1>${relativePath}</h1>` + d.contents.map(x => {
            const pageName = x.name.split('.md').join('');
            let link = pageName.split(' ').join('_');
            link = x.isDirectory ? link : link + '.html';
            return `<a href="${link}">${pageName}</a>`
        }).join('<br/>'));
        if (logVerbose) {
            console.log('Written index file:', htmlOutPath);
        }
    } catch (e) {
        console.error(e);
    }

}
const OUT_ASSETS_DIR_NAME = 'md2webAssets';
async function main() {
    let config: Config = {};
    try {
        config = JSON.parse(await Deno.readTextFile(path.join('md2web.config.json'))) || {};
    } catch (e) {
        console.log('Caught: Manifest non-existant or corrupt', e);
        return;
    }
    console.log('Got config:', config);
    if (config.parseDir) {
        parseDir = config.parseDir;
    } else {
        console.warn('WARN: no parseDir in config');
    }
    outDir = config.outDir;

    ignoreDirs = config.ignoreDirs || [];
    if (!parseDir || !outDir) {
        console.log('Config is invalid', config);
        return;
    }

    // Clean outDir
    await Deno.remove(outDir, { recursive: true });

    if (config.assetDir) {
        // Copy assets such as images so they can be served
        await copy(config.assetDir, path.join(outDir, OUT_ASSETS_DIR_NAME));
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
    const tableOfContents: TableOfContents = [];

    const allFilesPath = path.join('.', parseDir);
    // Create base index file
    await createDirectoryIndexFile({ dir: allFilesPath, contents: Array.from(Deno.readDirSync(allFilesPath)) }, outDir);
    // Create index file for each directory
    for await (const d of getDirs(allFilesPath)) {
        const relativePath = path.relative(parseDir, d.dir);
        const pageNameSteps = relativePath.split('\\');
        const indent = pageNameSteps.length;
        const pageName = pageNameSteps.slice(-1)[0] || '';
        tableOfContents.push({ indent, pageName, relativePath, isDir: true });
        // Add files to table of contents for use later for "next" and "prev" buttons to know order of pages
        for (const content of d.contents) {
            if (content.isFile) {
                tableOfContents.push({ indent: indent + 1, parentDir: d.dir, pageName: content.name.replace('.md', ''), relativePath: path.relative(parseDir, path.resolve(parseDir, relativePath, './' + pageNameToPagePath(content.name))), isDir: false });
            }
        }
        createDirectoryIndexFile(d, outDir);
    }
    if (logVerbose) {
        console.log('Table of Contents:', tableOfContents);
    }
    // Create table of contents
    const tocOutPath = path.join(outDir, 'table_of_contents.html');

    await Deno.writeTextFile(tocOutPath, tableOfContents.map(x => {
        // -1 sets the top level pages flush with the left hand side
        const indentHTML: string[] = Array(x.indent - 1).fill('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
        return `<div>${indentHTML.join('')}<a href="${x.relativePath}">${x.pageName}</a></div>`;
    }).join(''));

    // Get a list of all file names to support automatic back linking
    const allFilesNames = [];
    for await (const f of getFiles(allFilesPath)) {
        const parsed = path.parse(f);
        if (parsed.ext == '.md') {
            allFilesNames.push({ name: parsed.name, kpath: path.relative(parseDir, f.split('.md').join('.html')) });
        }
    }
    // console.log('jtest allfilenames', allFilesNames, allFilesNames.length);
    // console.log('jtest table', tableOfContents.map(x => `${x.pageName}, ${x.isDir}`), tableOfContents.length);
    if (logVerbose) {
        console.log('All markdown file names:', Array.from(allFilesNames));
    }

    for await (const f of getFiles(allFilesPath)) {

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
        // const hashAlg = createHash('sha256');
        // const hash: string = await new Promise<string>((resolve) => {
        //     const input = createReadStream(f);
        //     input.on('readable', () => {
        //         // Only one element is going to be produced by the
        //         // hash stream.
        //         const data = input.read();
        //         if (data)
        //             hashAlg.update(data);
        //         else {
        //             const digest = hashAlg.digest('hex')
        //             console.log(`${digest} ${path.relative(__dirname, f)}`);
        //             resolve(digest);
        //         }
        //     });
        // });
        // const filePath = path.relative(path.join(__dirname, parseDir), f);

        // const hasChanged = previousManifest.files[filePath]?.hash !== hash;
        // TODO: not ready for hasChanged because a template changing will have to rerender all
        // if (hasChanged) {
        // console.log('File changed:', f);
        try {

            await process(f, allFilesNames, tableOfContents);
        } catch (e) {
            console.error('error in process', e);
        }
        // }
        // files[filePath] = { hash };
    }
    // Deno.writeTextFile(path.join(parseDir, 'manifest.json'), JSON.stringify(
    //     {
    //         VERSION,
    //         files: files
    //     }
    // ));
}
main();
interface FileName {
    name: string;
    kpath: string;
}
async function process(filePath: string, allFilesNames: FileName[], tableOfContents: TableOfContents) {
    // Dev, test single file
    // if (filePath !== 'C:\\ObsidianJordanJiuJitsu\\JordanJiuJitsu\\Submissions\\Strangles\\Triangle.md') {
    //     return;
    // }

    if (!parseDir) {
        console.error('parseDir is undefined');
        return;
    }
    if (!outDir) {
        console.error('parseDir is undefined');
        return;
    }
    if (logVerbose) {
        console.log('\nProcess', filePath)
    }
    let fileContents = (await Deno.readTextFile(filePath)).toString();

    if (path.parse(filePath).ext == '.md') {



        // Since pages are auto back linked, remove all obsidian link syntax
        fileContents = fileContents.replaceAll('[[', '');
        fileContents = fileContents.replaceAll(']]', '');
        // Convert markdown to html
        const mdTokens = tokens(fileContents);
        const modifiedMdTokens: Token[] = [];
        let lastToken = undefined;
        for (const token of mdTokens) {
            // Add external link svg to external links to show that they are external
            if (lastToken && lastToken.type == 'start' && lastToken.tag == 'link' && lastToken.url.includes('http')) {
                if (token.type == 'text') {
                    token.content = 'EXTERNAL_LINK_SVG' + token.content;
                }
            }
            // if true, prevents token from just being added, unchanged to modifiedMdTokens list
            let isTokenModified = false;
            // Add backlinks
            if (token.type == 'text') {
                for (let { name, kpath } of allFilesNames) {
                    // Make absolute path so that deeply nested pages
                    // can link out to non-relative paths
                    kpath = '/' + kpath;
                    if (name == path.parse(filePath).name) {
                        // Don't link to self
                        continue;
                    }
                    if (token.content.includes(name)) {
                        // Make backlink:
                        // Set isTokenModified so the current token won't be added
                        // since it must now be split
                        isTokenModified = true;
                        const splitToken = token.content.split(name);

                        for (let i = 0; i < splitToken.length; i++) {
                            const splitInstance = splitToken[i];
                            // backlink between each split instance
                            if (i > 0) {
                                modifiedMdTokens.push({
                                    type: 'start',
                                    tag: 'link',
                                    kind: 'inline',
                                    url: kpath.replaceAll('\\', '/').replaceAll(' ', '_'),
                                    title: ''
                                });
                                modifiedMdTokens.push({
                                    type: 'text',
                                    content: name
                                });
                                modifiedMdTokens.push({
                                    type: 'end',
                                    tag: 'link',
                                    kind: 'inline',
                                    url: kpath,
                                    title: ''
                                });
                            }

                            // re-add the text that was around the keyword
                            modifiedMdTokens.push({
                                type: 'text',
                                content: splitInstance
                            });

                        }

                    }
                }
                // Embed images:
                // ---
                // TODO: Fix hacky support for embedding pngs.  The lib doesn't parse image tags for
                // some reason
                if (token.content.startsWith('!') && token.content.endsWith('.png')) {
                    isTokenModified = true;
                    const imageUrl = `/${OUT_ASSETS_DIR_NAME}/${token.content.slice(1)}`;
                    // Remove leading "!"
                    modifiedMdTokens.push({
                        type: 'start',
                        tag: 'image',
                        kind: 'inline',
                        url: imageUrl,
                        title: ''
                    });
                    modifiedMdTokens.push({
                        type: 'text',
                        content: '',
                    });
                    modifiedMdTokens.push({
                        type: 'end',
                        tag: 'image',
                        kind: 'inline',
                        url: imageUrl,
                        title: ''
                    });


                }

            }
            if (!isTokenModified) {
                modifiedMdTokens.push(token);
            }
            lastToken = token;

        }
        let htmlString = html(modifiedMdTokens);
        htmlString = htmlString
            .replaceAll('EXTERNAL_LINK_SVG', externalLinkSVG)
            .replaceAll('%20', ' ');

        // Get all nested templates and add to html
        const relativePath = path.relative(parseDir, filePath);
        // Prepend page title to top of content
        const pageTitle = (relativePath.split('\\').slice(-1)[0] || '').replaceAll('.md', '');
        htmlString = `<h1>${pageTitle}</h1>` + htmlString;
        // Add footer "next" and "prev" buttons
        const tableOfContentsPages = tableOfContents.filter(x => !x.isDir);
        const currentPage = tableOfContentsPages.find(x => x.pageName == pageTitle);
        const currentIndex = currentPage ? tableOfContentsPages.indexOf(currentPage) : -1;
        if (currentIndex !== -1) {
            const previous = tableOfContentsPages[currentIndex - 1];
            htmlString += `<div class="nextPrevButtons flex space-between">`;
            // Add next and previous buttons to page
            // If other page is in a different chapter, show the chapter before a ":"
            htmlString += `${previous ? `<a href="\\${previous.relativePath}">${previous.parentDir !== currentPage?.parentDir ? path.parse(previous.parentDir || '').name + ':' : ''} ${previous.pageName}</a>` : ''}`;
            const next = tableOfContentsPages[currentIndex + 1];
            htmlString += `${next ? `<a href="\\${next.relativePath}">${next.parentDir !== currentPage?.parentDir ? path.parse(next.parentDir || '').name + ':' : ''} ${next.pageName}</a>` : ''}`;
            htmlString += `</div>`;

        }

        const relativeDirectories = path.parse(relativePath).dir;
        // Empty string is for directoryParse base dir
        const eachDirectory = ['', ...relativeDirectories.split(path.sep)];
        const templateReplacer = '/* {{CONTENT}} */';
        const searchDirectories: string[] = [];
        for (let i = 0; i < eachDirectory.length; i++) {
            const lookForTemplateFileInDir = eachDirectory.slice(0, i + 1).join(path.sep);
            searchDirectories.push(lookForTemplateFileInDir);
        }
        // .filter removes duplicate root
        let isRoot = true;
        for (const dir of searchDirectories.filter(x => x !== path.sep).reverse()) {
            // Start templateContents as just the templateReplacer so that if there is no template it will still
            // include the page contents alone.  But there should always be a template even if it's `templateDefault`
            // which is included in this project
            let templateContents = templateReplacer;
            try {
                templateContents = (await Deno.readTextFile(path.join(parseDir, dir, 'template'))).toString();
                console.log('Using template override', path.join(parseDir, dir, 'template'));
            } catch (e) {
                // Use default demplate
                templateContents = isRoot ? (await Deno.readTextFile(path.join('templateDefault'))).toString() || templateReplacer : templateReplacer;
            }
            isRoot = false;
            // Add the template to the front
            // TODO: Optimizable
            const [templateStart, templateEnd] = templateContents.split(templateReplacer);
            htmlString = (templateStart || '') + htmlString + (templateEnd || '');
        }
        const title = filePath.split(path.sep).slice(-1)[0];

        htmlString = htmlString.replace('/* {{TITLE}} */', `<title>${title}</title>`);
        const breadcrumbs = [`<a href="/"' class="nav-item">Home</a>`, ...relativePath.split(path.sep).map(currentPathStep => {
            const preUrl = relativePath.split(currentPathStep)[0];
            const url = path.join('/', preUrl, currentPathStep);
            if (currentPathStep == title) {
                return `<div class="nav-item no-link"><span>${currentPathStep}</span></div>`;
            }
            return `<a class="nav-item" href=${url}>${currentPathStep}</a>`;
        })].join('<span class="center-dot">·</span>');
        htmlString = htmlString.replace('/* {{BREADCRUMBS}} */', breadcrumbs);

        try {
            // Get the new path
            const outPath = path.join(outDir, relativePath);
            // Make the directory that the file will end up in
            await Deno.mkdir(path.parse(outPath).dir, { recursive: true });
            // Rename the file as .html
            // .replaceAll: Replace all spaces with underscores, so they become valid html paths
            const htmlOutPath = path.join(path.dirname(outPath), pageNameToPagePath(outPath));
            // Write the file
            await Deno.writeTextFile(htmlOutPath, htmlString);

            if (logVerbose) {
                console.log('Written', htmlOutPath);
            }
        } catch (e) {
            console.error(e);
        }
    } else {
        console.log('non .md file types not handled yet:', filePath);
    }
    if (logVerbose) {
        console.log('Done processing', filePath, '\n');
    }


}
function pageNameToPagePath(name: string) {
    return (path.basename(name, path.extname(name)) + '.html').replaceAll(' ', '_')
}
const externalLinkSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1em" height="1em" version="1.1" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
 <g fill="black">
  <path d="m345.6 997.2h432c79.199 0 144-64.801 144-144v-264c0-13.199-10.801-24-24-24-13.199 0-24 10.801-24 24v264c0 52.801-43.199 96-96 96h-432c-52.801 0-96-43.199-96-96v-432c0-52.801 43.199-96 96-96h264c13.199 0 24-10.801 24-24s-10.801-24-24-24h-264c-79.199 0-144 64.801-144 144v432c0 79.199 64.797 144 144 144z"/>
  <path d="m998.4 446.4v-219.6-4.8008-1.1992c0-1.1992 0-2.3984-1.1992-3.6016l-1.1992-1.1992c0-1.1992-1.1992-2.3984-1.1992-2.3984-1.1992-2.3984-3.6016-4.8008-7.1992-7.1992-1.1992-1.1992-2.3984-1.1992-3.6016-1.1992v-0.003906l-3.6016-1.1992h-1.1992-4.8008-219.6c-13.199 0-24 10.801-24 24s10.801 24 24 24h162l-351.6 349.2c-9.6016 9.6016-9.6016 24 0 33.602 9.6016 9.6016 24 9.6016 33.602 0l351.6-350.4v162c0 13.199 10.801 24 24 24 13.199-0.003906 23.996-10.801 23.996-24.004z"/>
 </g>
</svg>`