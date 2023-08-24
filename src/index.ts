// no-var allows setting global variables
// deno-lint-ignore-file no-var
declare global {
    var useLogVerbose: boolean;
    // will print extra instructions if running for the first time
    var firstRun: boolean;
}
// Initialize to false, will be set from cli flags
window.useLogVerbose = false;
// Initialize to false, will be set later in execution
window.firstRun = false;

import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { copy } from "https://deno.land/std@0.195.0/fs/copy.ts";
import { exists } from "https://deno.land/std@0.198.0/fs/exists.ts";
import { html, tokens, Token } from "https://deno.land/x/rusty_markdown/mod.ts";
import { parse } from "https://deno.land/std@0.194.0/flags/mod.ts";
import { createDirectoryIndexFile } from "./htmlGenerators/indexFile.ts";
import { addContentsToTemplate } from "./htmlGenerators/useTemplate.ts";
import { getDirs, getFiles } from "./os.ts";
import { absoluteOsMdPathToWebPath, getConfDir, getOutDir, pageNameToPagePath, pathOSRelative, pathToPageName, pathWeb } from "./path.ts";
import { Config, configName, FileName, PROGRAM_NAME, stylesName, TableOfContents, tableOfContentsURL, templateName } from "./sharedTypes.ts";
import { host } from "./tool/httpServer.ts";
import { deploy, DeployableFile } from "./tool/publish.ts";
import { extractMetadata } from "./tool/metadataParser.ts";
import { logVerbose } from "./tool/console.ts";
import { defaultHtmlTemplate, defaultStyles } from './htmlGenerators/htmlTemplate.ts';
import { Backlinks, findBacklinks } from "./tool/backlinkFinder.ts";

const VERSION = '0.1.0'

interface ManifestFiles {
    [filePath: string]: {
        hash: string
    }
}

interface Manifest {
    version: string;
    files: ManifestFiles;
}
interface CLIFlag {
    type: 'string' | 'boolean';
    names: string[];
    description: string;
}
async function main() {
    const rawCLIFlagOptions: CLIFlag[] = [
        {
            names: ['v', 'version'],
            type: 'boolean',
            description: 'Prints the version number of this program to stdout'
        },
        {
            names: ['h', 'help'],
            type: 'boolean',
            description: 'Prints help information to stdout'
        },
        {
            names: ['verbose'],
            type: 'boolean',
            description: 'Shows verbose logs'
        },
        {
            names: ['preview'],
            type: 'boolean',
            description: 'Starts a http server to preview the generated html and associated files locally.  Press Ctrl+c to close the http server.'
        },
        {
            names: ['parseDir'],
            type: 'string',
            description: 'Specifies which directory should have its files converted into a website.  This can also be defined in the config file.'
        },
        {
            names: ['publish'],
            type: 'boolean',
            description: 'Publishes the generated files to the web via Vercel.  Note: vercelToken is required to use --publish.'
        },
        {
            names: ['vercelToken'],
            type: 'string',
            description: 'Used in concert with --publish in order to publish the generated files to the web via Vercel.'
        },
    ]
    const cliFlagOptions: { boolean: string[], string: string[] } = {
        boolean: [],
        string: []
    };
    // Assemble cliFlagOptions
    for (const flag of rawCLIFlagOptions) {
        for (const name of flag.names) {
            cliFlagOptions[flag.type].push(name);
        }
    }
    const cliFlags = parse(Deno.args, cliFlagOptions);
    if (cliFlags.verbose) {
        globalThis.useLogVerbose = true;
    }
    if (cliFlags.v || cliFlags.version) {
        console.log(VERSION);
        return;
    } else {
        const [MAJOR, MINOR, PATCH] = VERSION.split('.');
        console.log(`\n${PROGRAM_NAME} v${VERSION} ${MAJOR == '0' ? 'Beta' : ''}`);
        console.log('Please send feedback, questions, or bug reports to jdoleary@gmail.com or Twitter:@nestfall\n');

        // Check for updates
        // updateUrl is coming from https://github.com/jdoleary/spellmasons-server-hub (I'm just reusing a server that I'm hosting for spellmasons)
        const updateUrl = 'https://server-hub-d2b2v.ondigitalocean.app/md2webUpdate';
        const res = await fetch(updateUrl);
        const updateData = await res.json();
        const [MAJOR_UPDATE, MINOR_UPDATE, PATCH_UPDATE] = updateData.version.split('.');
        if (MAJOR_UPDATE !== MAJOR || MINOR_UPDATE !== MINOR || PATCH_UPDATE !== PATCH) {
            console.log(`🎁 Update available: ${VERSION}->${updateData.version}\n${updateData.updateUrl}\n${updateData.message}\n\n`);
        }
    }
    if (cliFlags.h || cliFlags.help) {
        console.log('Usage:\n' + rawCLIFlagOptions.map(flag => `${flag.names.map(name => name.length == 1 ? `-${name}` : `--${name}${flag.type == 'string' ? ' VALUE' : ''}`).join(', ')}: ${flag.description}`).join('\n'));
        return;
    }
    // This will eventually be supplied via CLI
    const parseDir = cliFlags.parseDir || Deno.cwd();
    let staticServeDirs: string[] = [];
    let obsidianAttachmentFolderPath = '';
    try {
        const obsidianAppJsonText = await Deno.readTextFile(path.join(parseDir, '.obsidian', 'app.json'));
        const obsidianAppJson = JSON.parse(obsidianAppJsonText);
        if (obsidianAppJson && obsidianAppJson.attachmentFolderPath) {
            // This variable is used for firstTime logging later
            obsidianAttachmentFolderPath = obsidianAppJson.attachmentFolderPath;
            // Set obsidian's attachmentFolderPath as a staticServeDir so obsidian's images will work out of the box
            staticServeDirs = [obsidianAppJson.attachmentFolderPath]
        }
    } catch (_) {
        // Fully ignorable error, this file may not exist
    }

    // Default config
    const config: Config = {
        projectName: `my-digital-garden`,
        outDirRoot: `${PROGRAM_NAME}-out`,
        parseDir,
        ignoreDirs: [
            "node_modules",
            ".obsidian",
        ],
        staticServeDirs,
        logVerbose: false
    };
    // If there is no config file in parseDir, create one from the default
    const configPath = path.join(getConfDir(config.parseDir), configName)

    // Create the config directory if it doesn't exist
    if (!await exists(getConfDir(config.parseDir))) {
        // A missing confDir means that this is the first time this program is being
        // run on a parseDir
        window.firstRun = true;
        await Deno.mkdir(getConfDir(config.parseDir), { recursive: true });
    }

    if (!await exists(configPath)) {
        console.log('Creating config in ', configPath);
        await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
    }
    try {
        Object.assign(config, JSON.parse(await Deno.readTextFile(configPath)) || {});
        // Keep obsidian attachmentFolderPath as static serve dir
        config.staticServeDirs = [...config.staticServeDirs, ...staticServeDirs]
    } catch (e) {
        console.log('Caught: Manifest non-existant or corrupt', e);
        return;
    }
    logVerbose('Got config:', config);
    console.log(`Converting files in "${parseDir}" to website files at "${getOutDir(config)}"`);


    if (!config.parseDir || !config.outDirRoot) {
        console.error('❌ Config is invalid', config);
        return;
    }

    // Clean outDir
    try {
        await Deno.remove(getOutDir(config), { recursive: true });
    } catch (e) {
        logVerbose('Could not clean outDir:', e);
    }
    // Create the out directory if it doesn't exist
    if (!await exists(getOutDir(config))) {
        await Deno.mkdir(getOutDir(config), { recursive: true });
    }

    if (config.staticServeDirs.length) {
        // Copy assets such as images so they can be served
        for (const staticDir of config.staticServeDirs) {
            const absoluteStaticDir = path.join(config.parseDir, staticDir);
            try {
                await copy(absoluteStaticDir, path.join(getOutDir(config), staticDir));
            } catch (e) {
                if (e.name !== 'AlreadyExists') {
                    console.error('❌ Error occurred when copying assets to static dir', e);
                }

            }
            logVerbose('Statically serving contents of', `${staticDir} at /${staticDir}`);
        }
    }

    // Create the template files from defaults unless they already exist in the parseDir's config directory:
    const templatePath = path.join(getConfDir(config.parseDir), templateName);
    if (!await exists(templatePath)) {
        console.log('Creating template in ', templatePath);
        await Deno.writeTextFile(templatePath, defaultHtmlTemplate);
    }
    // Copy the default styles unless they already exist 
    // (which means they could be changed by the user in which case do not overwrite)
    const stylesPath = path.join(getConfDir(config.parseDir), stylesName)
    if (!await exists(stylesPath)) {
        console.log('Creating default styles in ', stylesPath);
        await Deno.writeTextFile(stylesPath, defaultStyles);
    }
    // Copy styles to outDir so it will be statically served
    if (await exists(stylesPath)) {
        logVerbose('Copying styles in parseDir to outDir.');
        await copy(stylesPath, path.join(getOutDir(config), stylesName));
    } else {
        console.error('Warning: styles.css is missing.  Output html will be without styles.');
    }
    // Get previous manifest so it can only process the files that have changed
    // To be used later once I add support for a changed template causing a waterfall change
    // let previousManifest: Manifest = { version: "0.0.0", files: {} };
    // try {
    //     previousManifest = JSON.parse(await Deno.readTextFile(path.join(config.parseDir, 'manifest.json'))) || { files: {} };
    // } catch (e) {
    //     console.log('Caught: Manifest non-existant or corrupt', e);
    // }
    // Get default html template
    // Todo: future enhancement, allow for defining different templates in a .md's metadata
    const templateReplacer = '{{content}}';
    let templateHtml = templateReplacer;
    const defaultTemplatePath = path.join(getConfDir(config.parseDir), templateName);
    try {
        templateHtml = await Deno.readTextFile(defaultTemplatePath);
    } catch (_) {
        // Use default demplate
        console.log(`Default template not found.  Check for the existence of ${defaultTemplatePath}`);
    }

    const tableOfContents: TableOfContents = [];

    const allFilesPath = path.join('.', config.parseDir);
    // Get a list of all file names to support automatic back linking
    const allFilesNames = [];
    for await (const f of getFiles(allFilesPath, config)) {
        const parsed = path.parse(f);
        if (parsed.ext == '.md') {
            allFilesNames.push({ name: parsed.name, webPath: absoluteOsMdPathToWebPath(f, config.parseDir) });
        }
    }

    // console.log('jtest allfilenames', allFilesNames, allFilesNames.length);
    // console.log('jtest table', tableOfContents.map(x => `${x.pageName}, ${x.isDir}`), tableOfContents.length);
    logVerbose('All markdown file names:', Array.from(allFilesNames));
    const backlinks = await findBacklinks(getFiles(allFilesPath, config), allFilesNames, config.parseDir);

    // Create index file for each directory
    for await (const d of getDirs(allFilesPath, config)) {
        const directoryPathSegment: pathOSRelative = path.relative(config.parseDir, d.dir).replaceAll(' ', '_');
        const pageNameSteps = directoryPathSegment.split('\\');
        const indent = pageNameSteps.length;
        const pageName = pathToPageName(directoryPathSegment);
        tableOfContents.push({ indent, pageName, relativePath: directoryPathSegment, isDir: true });
        // Add files to table of contents for use later for "next" and "prev" buttons to know order of pages
        for (const content of d.contents) {
            if (content.isFile) {
                if (content.name.endsWith('.md')) {
                    tableOfContents.push({
                        indent: indent + 1,
                        parentDir: d.dir,
                        pageName: content.name.replace('.md', ''),
                        relativePath: pageNameToPagePath(directoryPathSegment, content.name), isDir: false
                    });
                } else {
                    logVerbose('table of contents: skipping', content.name);
                }
            }

        }
        // Create an index page for every directory except for the parse dir (the table of contents better serves this)
        if (path.relative(config.parseDir, d.dir) != '') {
            createDirectoryIndexFile(d, templateHtml, { tableOfContents, config, backlinks });
        }
    }


    logVerbose('Table of Contents:', tableOfContents);
    // Create table of contents
    const tocOutPath = path.join(getOutDir(config), tableOfContentsURL);

    const tableOfContentsHtml = await addContentsToTemplate(tableOfContents.map(x => {
        // -1 sets the top level pages flush with the left hand side
        const indentHTML: string[] = Array(x.indent - 1).fill('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
        return `<div>${indentHTML.join('')}<a href="${x.relativePath}">${x.pageName}</a></div>`;
    }).join(''), templateHtml, { config, tableOfContents, filePath: tocOutPath, relativePath: '', titleOverride: 'Table of Contents', metadata: null, backlinks });

    await Deno.writeTextFile(tocOutPath, tableOfContentsHtml);


    const convertingPerformanceStart = performance.now();
    console.log('Converting .md files to .html')
    for await (const f of getFiles(allFilesPath, config)) {
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
        // const filePath = path.relative(path.join(__dirname, config.parseDir), f);

        // const hasChanged = previousManifest.files[filePath]?.hash !== hash;
        // TODO: not ready for hasChanged because a template changing will have to rerender all
        // if (hasChanged) {
        // console.log('File changed:', f);
        try {

            await process(f, templateHtml, { allFilesNames, tableOfContents, config, backlinks });
        } catch (e) {
            console.error('error in process', e);
        }
        // }
        // files[filePath] = { hash };
    }
    // Deno.writeTextFile(path.join(config.parseDir, 'manifest.json'), JSON.stringify(
    //     {
    //         VERSION,
    //         files: files
    //     }
    // ));
    console.log('✅ Finished converting .md to .html in', performance.now() - convertingPerformanceStart, 'milliseconds.');

    if (cliFlags.publish) {
        if (!cliFlags.vercelToken) {
            console.error('❌ Failed to publish: Vercel Token required to publish');
        } else {
            const deployableFiles: DeployableFile[] = [];
            // Get all contents of files in outDir to send to Vercel to publish
            for await (const absoluteFilePath of getFiles(getOutDir(config), config)) {
                const relativepath = path.relative(getOutDir(config), absoluteFilePath);
                // Tech Debt:These extensions corrupt the json currently
                const disallowedExtensions = ['.ai', '.psd'];
                const ext = path.parse(relativepath).ext;
                if (!disallowedExtensions.includes(ext)) {
                    const isTextFile = ['.txt', '.md', '.html', '.css', '.js', '.ts', '.jsx', '.tsx'].includes(ext);
                    if (isTextFile) {
                        const fileContent = await Deno.readTextFile(absoluteFilePath)
                        deployableFiles.push({ filePath: relativepath, fileContent });
                    } else {
                        const fileContent = await Deno.readFile(absoluteFilePath)
                        deployableFiles.push({ filePath: relativepath, fileContent });
                    }
                }
            }

            // Publish to Vercel
            deploy(config.projectName, deployableFiles, cliFlags.vercelToken)
        }
    }

    if (window.firstRun) {
        console.log(`Found .obsidian/app.json, automatically adding "${obsidianAttachmentFolderPath}" as staticServeDir in config`);
        console.log(`\n\n~~~First time setup~~~\nTemplate files have been created for you in ${getConfDir(config.parseDir)}.  You can modify the config file (${configName}) to change the behavior of this program or try modifying the ${templateName} or ${stylesName} to change the appearance of the generated website!\n`);
    }


    if (cliFlags.preview) {
        host(getOutDir(config));
    }
}
main().catch(e => {
    console.error(e);
}).then(() => {
    // If there are no args, this exe was probably executed via a double-click,
    // so we must prompt to leave the log open.  However, we must NOT prompt
    // if there are args (such as --preview) because that will prevent
    // the http server from serving content
    // and there's also no reason to prompt if it was triggered via the command line
    if (Deno.build.os === "windows" && Deno.args.length === 0) {

        prompt("Finished... Enter any key to exit.");
    }
});
async function process(filePath: string, templateHtml: string, { allFilesNames, tableOfContents, config, backlinks }: { allFilesNames: FileName[], tableOfContents: TableOfContents, config: Config, backlinks: Backlinks }) {
    // Dev, test single file
    // if (filePath !== 'C:\\ObsidianJordanJiuJitsu\\JordanJiuJitsu\\Submissions\\Strangles\\Triangle.md') {
    //     return;
    // }

    if (!config.parseDir) {
        console.error('parseDir is undefined');
        return;
    }
    if (!config.outDirRoot) {
        console.error('outDirRoot is undefined');
        return;
    }
    logVerbose('\nProcess', filePath)

    if (path.parse(filePath).ext == '.md') {
        let fileContents = await Deno.readTextFile(filePath);
        // Since pages are auto back linked, remove all obsidian link syntax
        // TODO make backlinks work
        fileContents = fileContents.replaceAll('[[', '');
        fileContents = fileContents.replaceAll(']]', '');

        const extracted = extractMetadata(fileContents);
        const { metadata, metadataCharacterCount } = extracted || { metadata: {}, metadataCharacterCount: 0 };
        // Remove metadata so it doesn't get converted into the html
        fileContents = fileContents.slice(metadataCharacterCount);

        // Convert markdown to html
        const mdTokens = tokens(fileContents);
        const modifiedMdTokens: Token[] = [];
        let lastToken = undefined;
        for (const token of mdTokens) {
            if (lastToken && lastToken.type == 'start' && lastToken.tag == 'link' && lastToken.url.includes('http')) {
                if (token.type == 'text' || token.type == 'html') {
                    token.type = 'html';
                    const url = new URL(lastToken.url);
                    // Add the icon of the website before the link for user convenience
                    token.content = `<img class="inline-icon" src="https://s2.googleusercontent.com/s2/favicons?domain=${url.origin}"/>` + token.content;
                }
            }
            // if true, prevents token from just being added, unchanged to modifiedMdTokens list
            let isTokenModified = false;
            // Add backlinks
            if (token.type == 'text') {
                for (const { name, webPath } of allFilesNames) {
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
                        const url = webPath;

                        for (let i = 0; i < splitToken.length; i++) {
                            const splitInstance = splitToken[i];
                            // backlink between each split instance
                            if (i > 0) {
                                modifiedMdTokens.push({
                                    type: 'start',
                                    tag: 'link',
                                    kind: 'inline',
                                    url,
                                    title: ''
                                });
                                modifiedMdTokens.push({
                                    type: 'html',
                                    content: `<span id="${name}">${name}</span>`
                                });
                                modifiedMdTokens.push({
                                    type: 'end',
                                    tag: 'link',
                                    kind: 'inline',
                                    url,
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
                    // .slice(1) removes leading ! in markdown
                    const imageRelativePath = token.content.slice(1);
                    let imageUrl = `/${token.content.slice(1)}`;
                    // !imageRelativePath.startsWith('http') ensures that links to online images are served as is
                    // otherwise, ensure that images exist locally. This is needed because some .md editors such as Obsidian
                    // have an Assets directory (stored in .obsidian/app.json `attachmentFolderPath`) that provide an implicit
                    // path, so if the markdown is just converted to html as is, the path will be broken
                    if (!imageRelativePath.startsWith('http') && !await exists(path.join(config.parseDir, imageRelativePath))) {
                        let foundMissingImage = false;
                        for (const staticPath of config.staticServeDirs) {
                            const testPath = path.join(config.parseDir, staticPath, imageRelativePath);
                            if (await exists(testPath)) {
                                imageUrl = `/${path.posix.join(staticPath, imageRelativePath)}`;
                                foundMissingImage = true;
                                break;
                            }
                        }
                        if (!foundMissingImage) {
                            console.error('⚠️ Missing image', imageUrl, 'check config staticServeDirs for missing directory.');
                        }
                    }
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
            .replaceAll('%20', ' ');

        const relativePath = path.relative(config.parseDir, filePath);
        htmlString = await addContentsToTemplate(htmlString, templateHtml, { config, tableOfContents, filePath, relativePath, metadata, titleOverride: '', backlinks });

        try {
            // Get the new path
            const outPath = path.join(getOutDir(config), relativePath);
            // Make the directory that the file will end up in
            await Deno.mkdir(path.parse(outPath).dir, { recursive: true });
            // Rename the file as .html
            // .replaceAll: Replace all spaces with underscores, so they become valid html paths
            const htmlOutPath = pageNameToPagePath(path.dirname(outPath), outPath);
            // Write the file
            await Deno.writeTextFile(htmlOutPath, htmlString);

            logVerbose('Written', htmlOutPath);
        } catch (e) {
            console.error(e);
        }
    } else {
        logVerbose('non .md file types not handled yet:', filePath);
    }
    logVerbose('Done processing', filePath, '\n');
}