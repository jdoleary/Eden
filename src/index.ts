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
import { createDirectoryIndexFile, createTagDirIndexFile, createTagIndexFile } from "./htmlGenerators/indexFile.ts";
import { addContentsToTemplate, findTOCEntryFromFilepath } from "./htmlGenerators/useTemplate.ts";
import { getDirs, getFiles } from "./os.ts";
import { absoluteOsMdPathToWebPath, getConfDir, getOutDir, pageNameToPagePath, pathOSAbsolute, pathOSRelative, pathToPageName, pathWeb } from "./path.ts";
import { Config, configName, edenEmbedClassName, embedPathDataKey, FileName, Garden, Metadata, Page, PROGRAM_NAME, stylesName, TableOfContents, TableOfContentsEntry, tableOfContentsURL, tagsDirectoryName, templateName } from "./sharedTypes.ts";
import { host } from "./tool/httpServer.ts";
import { deploy, DeployableFile } from "./tool/publish.ts";
import { extractMetadata } from "./tool/metadataParser.ts";
import { logVerbose } from "./tool/console.ts";
import { defaultHtmlTemplatePage, defaultStyles } from './htmlGenerators/htmlTemplate.ts';
import { Backlinks, findBacklinks } from "./tool/backlinkFinder.ts";
import { makeRSSFeed } from "./tool/rss-feed-maker.ts";
import { timeAgoJs } from "./htmlGenerators/timeAgo.js";
import { embedBlocks, processBlockElementsWithID } from "./tool/editDOM.ts";

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
            names: ['overwrite-template'],
            type: 'boolean',
            description: 'Overwrites existing template files with the default.'
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
    const projectName = `my-digital-garden`;
    const config: Config = {
        projectName,
        outDirRoot: `${PROGRAM_NAME}-out`,
        parseDir,
        ignoreDirs: [
            "node_modules",
            ".obsidian",
        ],
        staticServeDirs,
        logVerbose: false,
        rssInfo: {
            title: projectName,
            description: 'My Digital Garden',
            homepage: 'https://example.com',
            language: 'en'
        }
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
    if (cliFlags['overwrite-template'] || !await exists(templatePath)) {
        console.log('Creating template in ', templatePath);
        await Deno.writeTextFile(templatePath, defaultHtmlTemplatePage);
    }

    // Copy timeAgo.js
    const timeAgoPath = path.join(getOutDir(config), 'timeAgo.js');
    // if (!await exists(timeAgoPath)) {
    console.log('Creating timeAgo.js in ', timeAgoPath);
    await Deno.writeTextFile(timeAgoPath, timeAgoJs);
    // }
    // Copy the default styles unless they already exist 
    // (which means they could be changed by the user in which case do not overwrite)
    const stylesPath = path.join(getConfDir(config.parseDir), stylesName)
    if (cliFlags['overwrite-template'] || !await exists(stylesPath)) {
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
        tableOfContents.push({ indent, pageName, relativePath: directoryPathSegment, isDir: true, publish: true });
        // Add files to table of contents for use later for "next" and "prev" buttons to know order of pages
        for (const content of d.contents) {
            if (content.isFile) {
                if (content.name.endsWith('.md')) {
                    tableOfContents.push({
                        originalFilePath: path.normalize(path.join(d.dir, content.name)),
                        indent: indent + 1,
                        parentDir: d.dir,
                        pageName: content.name.replace('.md', ''),
                        relativePath: pageNameToPagePath(directoryPathSegment, content.name), isDir: false,
                        // Defaults to true until it is changed later when the file's metadata is processed
                        publish: true
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

    const garden: Garden = {
        pages: [],
        tags: new Set(),
        blocks: {}
    }

    const convertingPerformanceStart = performance.now();
    console.log('Converting .md files to .html')
    const processPromises: Promise<Page | undefined>[] = [];
    for await (const f of getFiles(allFilesPath, config)) {
        try {
            processPromises.push(process(f, templateHtml, { allFilesNames, tableOfContents, config, backlinks, garden }));
        } catch (e) {
            console.error('error in process', e);
        }
    }
    try {
        garden.pages = (await Promise.all(processPromises)).flatMap(x => x ? [x] : []);
    } catch (e) {
        console.error('Error while processing files', e);
    }
    console.log('✅ Finished converting .md to .html in', performance.now() - convertingPerformanceStart, 'milliseconds.');

    logVerbose('Table of Contents:', tableOfContents);
    // Create table of contents
    // Note: Table of contents must be created AFTER all files are `process`ed so that
    // files with metadata `publish` can mutate the tableOfContents object
    const tocOutPath = path.join(getOutDir(config), tableOfContentsURL);

    const tableOfContentsHtml = await addContentsToTemplate(tableOfContents.filter(x => x.publish).map(x => {
        // -1 sets the top level pages flush with the left hand side
        const indentHTML: string[] = Array(x.indent - 1).fill('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
        return `<div>${indentHTML.join('')}<a href="${x.relativePath}">${x.pageName}</a></div>`;
    }).join(''), templateHtml, { config, tableOfContents, filePath: tocOutPath, relativePath: '', metadata: { title: 'Table of Contents' }, backlinks, isDir: true });
    await Deno.writeTextFile(tocOutPath, tableOfContentsHtml);

    // Create tag index pages
    // --
    // Create parent dir for tag index pages
    await Deno.mkdir(path.join(getOutDir(config), tagsDirectoryName), { recursive: true });
    // Create tag index pages
    const tagIndexPagePromies = [];
    for (const tag of garden.tags.keys()) {
        tagIndexPagePromies.push(createTagIndexFile(tag, garden, templateHtml, { tableOfContents, config, backlinks }));
    }
    await Promise.all(tagIndexPagePromies);
    // Create index page for all tags
    createTagDirIndexFile(garden, templateHtml, { tableOfContents, config, backlinks });

    // Create rss.xml
    if (config.rssInfo) {
        const rssOutPath = path.join(getOutDir(config), 'rss.xml');
        const rssXML = makeRSSFeed(tableOfContents, config.rssInfo);
        await Deno.writeTextFile(rssOutPath, rssXML);
    }

    // Iterate all .html files to find embed blocks and add the blocks' html into the garden object
    // TODO make async
    for (const { name, webPath, metadata } of garden.pages) {
        if (metadata && metadata.publish === false) {
            continue;
        }
        // TODO exclude --publish: false files from allFilesNames
        try {
            const filePath = path.join(getOutDir(config), webPath);
            const fileContent = await Deno.readTextFile(filePath);
            const newFileContent = processBlockElementsWithID(fileContent, name, garden);
            if (newFileContent) {
                await Deno.writeTextFile(filePath, newFileContent);
            }
        } catch (e) {
            console.error('Error populating garden.blocks', e);
        }
    }

    // Iterate all .html files to replace embed block references with the block content 
    // TODO make async
    for (const { name, webPath, metadata } of garden.pages) {
        if (metadata && metadata.publish === false) {
            continue;
        }
        try {
            const filePath = path.join(getOutDir(config), webPath);
            const fileContent = await Deno.readTextFile(filePath);
            const newFileContent = embedBlocks(fileContent, garden);
            if (newFileContent) {
                await Deno.writeTextFile(filePath, newFileContent);
            }
        } catch (e) {
            console.error('Error replacing embed block ref', e);
        }
    }


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
async function process(filePath: string, templateHtml: string, { allFilesNames, tableOfContents, config, backlinks, garden }: { allFilesNames: FileName[], tableOfContents: TableOfContents, config: Config, backlinks: Backlinks, garden: Garden }): Promise<Page | undefined> {
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
        const relativePath = path.relative(config.parseDir, filePath);
        // const obsidianStyleEmbedRegex = /!\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)\]\]/g;
        // Matches
        // ![[Features#^f3edfd]]
        // ![[images 2 again#^be171d]]
        // ![[test embed]]
        const obsidianStyleEmbedRegex = /!\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)(\#\^[\w\d]+)?\]\]/g;
        // Matches
        // ![[image.png]]
        // ![[image.webm]]
        const obsidianStyleImageEmbedRegex = /!\[\[([^\^#\[\]*"/\\<>\n\r\s:|?]+\.[\w\d])\]\]/g;
        // Matches
        // [[backlink]]
        const obsidianStyleBacklinkRegex = /\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)\]\]/g;
        // Replace embed syntax with something that will be easily recognized later and parsed as
        // a single token by rusty_markdown
        // Note: This is wrapped in code backticks so that the `if block` that searches for it is more specific
        // and more efficient
        fileContents = fileContents.replaceAll(obsidianStyleEmbedRegex, `\`${edenEmbedClassName}$1$2\``);
        // Convert all obsidianImageEmbeds to markdown image format
        fileContents = fileContents.replaceAll(obsidianStyleImageEmbedRegex, '![$1]($1)');
        // Find existing obsidian-style backlinks (works even with case insensitive)
        const existingBacklinks = (fileContents.match(obsidianStyleBacklinkRegex) || []).filter((x, i, array) => {
            // Filter for unique tags
            return array.indexOf(x) == i;
        }).map(x => {
            // Remove leading `[[` and trailing `]]`
            return x.replace(/^\[\[/, '').replace(/\]\]$/, '');
        });
        // Turn Obsidian style backlinks into actual links:
        existingBacklinks.forEach(backlinkText => {
            const foundBacklinkPath = allFilesNames.find(({ name }) => {
                if (name == path.parse(filePath).name) {
                    // Don't link to self
                    return false;
                }
                return name.toLowerCase() == backlinkText.toLowerCase();
            });
            if (foundBacklinkPath) {
                fileContents = fileContents.replaceAll(`[[${backlinkText}]]`, `[${backlinkText}](${foundBacklinkPath.webPath})`);
            }
        });

        const extracted = extractMetadata(fileContents);
        const { metadata, metadataCharacterCount }: { metadata: Metadata | undefined, metadataCharacterCount: number } = extracted || { metadata: {}, metadataCharacterCount: 0 };

        // Add tags to garden object
        if (metadata && metadata.tags) {
            metadata.tags.forEach(t => {
                garden.tags.add(t);
            })
        }


        // metadata: `publish`
        // Supports omitting a document from being rendered
        if (metadata && metadata.publish === false) {
            logVerbose('Skipping processing', filePath, 'Due to `metadata.publish == false`\n');
            const tocEntry = findTOCEntryFromFilepath(tableOfContents, filePath)
            if (tocEntry) {
                tocEntry.publish = false;
            } else {
                console.error('Unexpected, could not locate', filePath, 'in table of contents in order to set `publish` to false');
            }
            return;
        }

        // metadata: `template`
        // Supports using a custom template instead of default template
        if (metadata && metadata.template) {
            const defaultTemplatePath = path.join(getConfDir(config.parseDir), metadata.template);
            try {
                templateHtml = await Deno.readTextFile(defaultTemplatePath);
            } catch (_) {
                // Use default demplate
                console.warn(`Custom template ${metadata.template} not found.  Check for the existence of ${defaultTemplatePath}`);
            }


        }

        // Remove metadata so it doesn't get converted into the html
        fileContents = fileContents.slice(metadataCharacterCount);

        // Get file stat data on the harddrive
        let createdAt;
        let modifiedAt;
        try {
            const statInfo = await Deno.stat(path.join(config.parseDir, relativePath));
            if (statInfo.birthtime) {
                fileContents = fileContents.replace('{{created}}', `<span ${statInfo.birthtime ? `data-converttimeago="${statInfo.birthtime.getTime()}"` : ''}>${statInfo.birthtime?.toLocaleDateString()}</span>` || '');
                createdAt = statInfo.birthtime;
                const tocEntry = findTOCEntryFromFilepath(tableOfContents, filePath);
                if (tocEntry) {
                    tocEntry.createdAt = createdAt;
                }
            }
            modifiedAt = statInfo.mtime;
            fileContents = fileContents.replace('{{modified}}', `<span ${statInfo.mtime ? `data-converttimeago="${statInfo.mtime.getTime()}"` : ''}>${statInfo.mtime?.toLocaleDateString()}</span>` || '');
        } catch (e) {
            console.error('❌ Err: Failed to get file stat for ', filePath);
        }
        const page: Page = {
            webPath: absoluteOsMdPathToWebPath(filePath, config.parseDir),
            name: pathToPageName(filePath),
            contents: fileContents,
            metadata,
            createdAt: createdAt?.getTime(),
            modifiedAt: modifiedAt?.getTime(),
            blockEmbeds: [],
        }

        // Convert markdown to html
        const mdTokens = tokens(fileContents);
        const modifiedMdTokens: Token[] = [];
        let lastToken = undefined;
        for (let i = 0; i < mdTokens.length; i++) {
            const token = mdTokens[i];
            if (!token) {
                continue;
            }
            // if true, prevents token from just being added, unchanged to modifiedMdTokens list
            let isTokenModified = false;
            // Process softBreaks as newlines like Obsidian does
            // https://spec.commonmark.org/0.29/#softbreak
            if (token.type == 'softBreak') {
                isTokenModified = true;
                modifiedMdTokens.push({
                    type: 'html',
                    content: '<br>'
                });
                continue;

            }
            // TODO: This may need to be removed if I find a better solution for 
            // block embedding
            // if (token.type == 'text') {
            //     const blockEmbedIdRegex = /\s\^([\w\d]*)$/;
            //     const blockEmbedId = token.content.match(blockEmbedIdRegex)
            //     if (blockEmbedId) {
            //         console.log('jtest embed', blockEmbedId);
            //         // Now find the starting block and the ending block
            //         let startingBlock = undefined;
            //         for (let ti = i - 1; ti >= 0; ti--) {
            //             const testToken = mdTokens[ti];
            //             if (testToken && testToken.type == 'start' && testToken.tag == 'paragraph') {
            //                 startingBlock = testToken;
            //                 break;
            //             }
            //         }
            //         let endingBlock = undefined;
            //         for (let ti = i + 1; ti < mdTokens.length; ti++) {
            //             const testToken = mdTokens[ti];
            //             if (testToken && testToken.type == 'end' && testToken.tag == 'paragraph') {
            //                 endingBlock = testToken;
            //                 break;
            //             }


            //         }
            //         if (startingBlock && endingBlock) {
            //             // Change to html so that it can be referenced via an id (the embed block id)
            //             // TODO what if it's an image
            //             // startingBlock.type
            //             // startingBlock.

            //         }
            //     }
            // }
            // Parse embeds to html token type
            if (token.type == 'code' && token.content.startsWith(edenEmbedClassName)) {
                isTokenModified = true;
                // Token is a block embed and must be handled specially
                const embedPath = token.content.split(edenEmbedClassName).join('');
                page.blockEmbeds.push(embedPath);
                // Change to html
                // Later using deno-dom, this will be queried for by class and replaced with the html that it is referencing
                // Note: Using class here because this is the many-to-one embed reference whereas the block itself will have the id
                modifiedMdTokens.push({
                    type: 'html',
                    content: `<div class="${edenEmbedClassName}" data-${embedPathDataKey}="${embedPath}">${embedPath}</div>`
                });
            }
            if (lastToken && lastToken.type == 'start' && lastToken.tag == 'link' && lastToken.url.includes('http')) {
                if (token.type == 'text' || token.type == 'html') {
                    token.type = 'html';
                    const url = new URL(lastToken.url);
                    let origin = url.origin;

                    // Special case: handle missing favicon for youtu.be
                    if (origin === 'https://youtu.be') {
                        origin = 'https://youtube.com';
                    }

                    // Add the icon of the website before the link for user convenience
                    token.content = `<img class="inline-icon" src="https://s2.googleusercontent.com/s2/favicons?domain=${origin}"/>` + token.content;
                }
            }
            // Embed images:
            if (token.type == 'start' && token.tag == 'image') {
                // Implement youtube and twitter special embeds (Obsidian Syntax)
                if (token.url.startsWith('http')) {
                    // Youtube regex matches the following:
                    // https://youtu.be/
                    // http://youtu.be/
                    // https://youtube.com/
                    // http://youtube.com/
                    // https://youtu.be/aFBp0cZ79bQ?si=rdrrNxhVlJWzHpVw
                    // https://www.youtube.com/watch?v=aFBp0cZ79bQ
                    const youtubeRegex = /^https?:\/\/(www\.)?youtu\.?be(.com)?\/(watch\?v=)?(\w*)/;
                    const youtubeMatch = token.url.match(youtubeRegex);
                    const youtubeVideoId = youtubeMatch && youtubeMatch[4];
                    if (youtubeVideoId) {
                        // Important! Skip the next 2 tokens because we're going to replace them
                        // Images have "start", "text", and "end" tokens.  Once the "start" is detected
                        // we replace the next two
                        if (mdTokens[i + 1].type == 'text') {
                            // Note: the text tag is optional 
                            // and may not exist if there is no text inside the `[TEXTHERE](image.png)` TEXTHERE area of the token
                            // If it does exist, skip it with i++ since we'll be modifying the tag
                            i++;
                            if (mdTokens[i + 1].type != 'end') {
                                console.error('Unexpected next tag, "text" tag was skipped but "end" tag was not found.', mdTokens[i + 1]);
                                // revert skip
                                i--;
                            }
                        }
                        if (mdTokens[i + 1].type != 'end') {
                            console.error('Unexpected next tag, could not skip image "start"\'s following "end" tag.', mdTokens[i + 1]);
                        } else {
                            // i++ skips the "end" tag since we are modifying the tag in this block
                            i++;
                            isTokenModified = true;
                            modifiedMdTokens.push({
                                type: 'html',
                                content: `<iframe class="responsive-iframe" src="https://www.youtube.com/embed/${youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
                            });
                        }

                    }
                }
                const possibleNextToken: Token | undefined = mdTokens[i + 1];
                const possible2ndNextToken = mdTokens[i + 2];
                let imgWidth;
                let imgHeight;
                if (possibleNextToken && possibleNextToken.type == 'text') {
                    // Example matches
                    // Portrait|640
                    // Portrait|640x480
                    const imageSizeRegex = /\|(\d+)x?(\d*)$/;
                    const matches = possibleNextToken.content.match(imageSizeRegex);
                    if (matches) {
                        imgWidth = matches[1];
                        imgHeight = matches[2];
                    }
                }
                // Important! Skip the next 2 tokens because we're going to replace them
                // Images have "start", "text", and "end" tokens.  Once the "start" is detected
                // we replace the next two
                if (possibleNextToken && possibleNextToken.type == 'text') {
                    // Note: the text tag is optional 
                    // and may not exist if there is no text inside the `[TEXTHERE](image.png)` TEXTHERE area of the token
                    // If it does exist, skip it with i++ since we'll be modifying the tag
                    i++;
                    if (possible2ndNextToken.type != 'end') {
                        console.error('Unexpected next tag, "text" tag was skipped but "end" tag was not found.', mdTokens[i + 1]);
                        // revert skip
                        i--;
                    }
                }
                // Note: The "end" tag is REQUIRED and always expected.  It must exist and be skipped in order for the 
                // following image modification code to take place
                if (possible2ndNextToken && possible2ndNextToken.type != 'end') {
                    console.error('Unexpected next tag, could not skip image "start"\'s following "end" tag.', mdTokens[i + 1]);
                } else {
                    // i++ skips the "end" tag since we are modifying the tag in this block
                    i++;
                    isTokenModified = true;
                    // !imageRelativePath.startsWith('http') ensures that links to online images are served as is
                    // otherwise, ensure that images exist locally. This is needed because some .md editors such as Obsidian
                    // have an Assets directory (stored in .obsidian/app.json `attachmentFolderPath`) that provide an implicit
                    // path, so if the markdown is just converted to html as is, the path will be broken
                    // `!await exists` ensures that the image doesn't exist as the url relative to the outDir, in which case we drop into this
                    // block to try to find it
                    let imageUrl = token.url;
                    if (!token.url.startsWith('http') && !await exists(path.join(getOutDir(config), token.url))) {
                        imageUrl = `/${token.url}`;
                        let foundMissingImage = false;
                        for (const staticPath of config.staticServeDirs) {
                            const testPath = path.join(getOutDir(config), staticPath, token.url);
                            if (await exists(testPath)) {
                                // path.posix is needed because this is now a webPath
                                imageUrl = `/${path.posix.join(staticPath, token.url)}`;
                                foundMissingImage = true;
                                break;
                            }
                        }
                        if (!foundMissingImage) {
                            // Obsidian by default puts drag-n-dropped images in the root,
                            // if the image is not found in any of the staticServeDirs but 
                            // it is in the parseDir root
                            // then copy it to the root of the outDir
                            const pathAtParseRoot = path.join(config.parseDir, token.url);
                            if (await exists(pathAtParseRoot)) {
                                const newOutPath = path.join(getOutDir(config), token.url);
                                await copy(pathAtParseRoot, newOutPath);
                                // Convert to a relative path for web serve root
                                imageUrl = `/${token.url}`;
                                foundMissingImage = true;
                            } else {
                                console.error('⚠️ Missing image', imageUrl, 'check config staticServeDirs for missing directory.');
                            }
                        }

                    }
                    // All images get modified so that they can either have a modified imageUrl in the case where they are local and
                    // had to be "found" or if they have an explicit width and/or height, they need that added
                    modifiedMdTokens.push({
                        type: 'html',
                        content: `<img src="${imageUrl}" ${imgWidth ? `width="${imgWidth}px"` : ''} ${imgHeight ? `width="${imgHeight}px"` : ''}/>`
                    })

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

        htmlString = await addContentsToTemplate(htmlString, templateHtml, { config, tableOfContents, filePath, relativePath, metadata, backlinks, isDir: false });

        try {
            // Get the new path
            const outPath = path.join(getOutDir(config), relativePath);
            // Make the directory that the file will end up in
            await Deno.mkdir(path.parse(outPath).dir, { recursive: true });
            // Rename the file as .html
            // .replaceAll: Replace all spaces with underscores, so they become valid html paths
            // Note: Even though pageNameToPagePath returns `pathWeb` that is the path that we use 
            // for the htmlOutPath which is relative to the `ourDir` because that is the path that
            // it WILL become on the web (even though it's being saved to the harddrive now).
            const htmlOutPath = pageNameToPagePath(path.dirname(outPath), outPath);
            // Write the file
            await Deno.writeTextFile(htmlOutPath, htmlString);

            logVerbose('Written', htmlOutPath);
        } catch (e) {
            console.error(e);
        }
        return page;
    } else {
        logVerbose('non .md file types not handled yet:', filePath);
    }
    logVerbose('Done processing', filePath, '\n');
    return undefined;
}
