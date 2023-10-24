// no-var allows setting global variables
// deno-lint-ignore-file no-var
declare global {
    var useLogVerbose: boolean;
    // will print extra instructions if running for the first time
    var firstRun: boolean;
    var garden: Garden;
    var parseDir: pathOSAbsolute;
}
// Initialize to false, will be set from cli flags
window.useLogVerbose = false;
// Initialize to false, will be set later in execution
window.firstRun = false;

// @deno-types="../types/markdown-it/index.d.ts"
import MarkdownIt from "https://esm.sh/markdown-it@13.0.1";
import pluginCheckboxes from "https://esm.sh/markdown-it-task-lists@2.1.1";
import pluginHighlight from "https://esm.sh/markdown-it-mark@3.0.1";
import pluginFootnote from "https://esm.sh/markdown-it-footnote@3.0.3";
import pluginAnchor from "https://esm.sh/markdown-it-anchor@8.6.7";
import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { assertSnapshot } from "https://deno.land/std@0.201.0/testing/snapshot.ts";
import { copy } from "https://deno.land/std@0.195.0/fs/copy.ts";
import { exists } from "https://deno.land/std@0.198.0/fs/exists.ts";
import { parse } from "https://deno.land/std@0.194.0/flags/mod.ts";
import { createDirectoryIndexFile, createTagDirIndexFile, createTagIndexFile, getWebPathOfTag } from "./htmlGenerators/indexFile.ts";
import { addContentsToTemplate, findTOCEntryFromFilepath } from "./htmlGenerators/useTemplate.ts";
import { getDirs, getFiles } from "./os.ts";
import { absoluteOsMdPathToWebPath, changeExtension, getConfDir, getOutDir, pageNameToPagePath, pathOSAbsolute, pathOSRelative, pathToArrayOfNames, pathToPageName, pathWeb } from "./path.ts";
import { Config, configName, edenEmbedClassName, embedPathDataKey, FileName, Garden, Metadata, Page, PROGRAM_NAME, stylesName, TableOfContents, TableOfContentsEntry, tableOfContentsURL, tagsDirectoryName, templateName } from "./sharedTypes.ts";
import { host } from "./tool/httpServer.ts";
import { deploy, DeployableFile } from "./tool/publish.ts";
import { extractMetadata } from "./tool/metadataParser.ts";
import { logVerbose } from "./tool/console.ts";
import { defaultHtmlTemplatePage, defaultStyles } from './htmlGenerators/htmlTemplate.ts';
import { Backlinks, findBacklinks, findFilePathFromBaseName } from "./tool/backlinkFinder.ts";
import { makeRSSFeed } from "./tool/rss-feed-maker.ts";
import { timeAgoJs } from "./htmlGenerators/timeAgo.js";
import { embedBlocks, processBlockElementsWithID } from "./tool/editDOM.ts";
import { CLIFlag, getCliFlagOptions, rawCLIFlagOptions } from "./cliOptions.ts";
import plugins from "./tool/mdPlugins.ts";
import { obsidianStyleBacklinkRegex, obsidianStyleComment, obsidianStyleEmbedBlockRegex, obsidianStyleEmbedFileRegex, obsidianStyleEmbedPageRegex, obsidianTags } from "./tool/regexCollection.ts";
import { NavItem, findNavItem, removeHiddenPages } from "./tool/navigation.ts";
import { isUpdateNewer } from "./tool/updateAvailable.ts";

// When updating VERSION, also update executable/metadata.json's version
// this tells the app when a new version is available
const VERSION = '0.4.2';
// When updating VERSION, also update executable/metadata.json's version
// this tells the app when a new version is available

interface ManifestFiles {
    [filePath: string]: {
        hash: string
    }
}

interface Manifest {
    version: string;
    files: ManifestFiles;
}
export default async function main() {
    const cliFlags = parse(Deno.args, getCliFlagOptions());
    if (cliFlags.verbose) {
        globalThis.useLogVerbose = true;
    }
    if (cliFlags.v || cliFlags.version) {
        console.log(VERSION);
        return;
    } else {
        const [MAJOR, _MINOR, _PATCH] = VERSION.split('.');
        console.log(`\n${PROGRAM_NAME} v${VERSION} ${MAJOR == '0' ? 'Beta' : ''}`);
        console.log('Please send feedback, questions, or bug reports to jdoleary@gmail.com or Twitter:@nestfall\n');

        if (cliFlags.checkForUpdates) {
            // Check for updates
            try {
                const updateUrl = 'https://eden.nyc3.digitaloceanspaces.com/metadata.json';
                const res = await fetch(updateUrl);
                const updateData = await res.json();
                if (isUpdateNewer(VERSION, updateData.version)) {
                    console.log(`🎁 Update available: ${VERSION}->${updateData.version}\n${updateData.updateUrl}\n${updateData.message}\n\n`);
                }
            } catch (e) {
                console.warn('WARN: Unable to check for updates', e);
            }
        }
    }
    if (cliFlags.h || cliFlags.help) {
        const getFlagPrintedName = (flag: CLIFlag) => {
            return `${flag.names.map(name => {
                return name.length == 1 ? `-${name}` : `--${name}${flag.type == 'string' ? ' VALUE' : ''}`;
            }).join(', ')}`
        }
        const longestNameOption = rawCLIFlagOptions.sort((a, b) => getFlagPrintedName(b).length - getFlagPrintedName(a).length)[0];
        const longestNameOptionLength = longestNameOption ? longestNameOption.names.join('').length : 0;
        console.log(`
NAME
        eden - process a directory of .md files and output static html

SYNOPSIS
        eden [OPTIONS] [PARSE DIRECTORY]

DESCRIPTION
        Eden parses a directory of markdown files into static html.  It outputs an eden-md-config directory inside of the pared directory which contains files used for customizing the behavior of eden and the outputted html.

        The options are as follows:

        ${rawCLIFlagOptions.map(flag => {
            const printedName = getFlagPrintedName(flag);
            return `${new Array(longestNameOptionLength + ': '.length).fill(' ').slice(printedName.length).join('')}${printedName}:  ${flag.description}`;
        }).join('\n\n        ')}

EXAMPLES
        The command:
            eden C:\\my-obsidian-notes
        will parse the my-obsidian-notes directory into static html in C:\\my-obsidian-notes\\eden-md-out.

        The command:
            eden
        will parse current working directory into static html.
`);
        return;
    }
    const unnamedParseDirArg = cliFlags._[0] !== undefined ? cliFlags._[0].toString() : undefined;
    globalThis.parseDir = cliFlags.parseDir || unnamedParseDirArg || Deno.cwd();

    // Default config
    const projectName = `my-digital-garden`;
    const config: Config = {
        projectName,
        outDirRoot: `${PROGRAM_NAME}-out`,
        ignoreDirs: [],
        logVerbose: false,
        rssInfo: {
            title: projectName,
            description: 'My Digital Garden',
            homepage: 'https://example.com',
            language: 'en'
        }
    };
    // If there is no config file in parseDir, create one from the default
    const configPath = path.join(getConfDir(globalThis.parseDir), configName)

    // Create the config directory if it doesn't exist
    if (!await exists(getConfDir(globalThis.parseDir))) {
        // A missing confDir means that this is the first time this program is being
        // run on a parseDir
        window.firstRun = true;
        await Deno.mkdir(getConfDir(globalThis.parseDir), { recursive: true });
    }

    if (!await exists(configPath)) {
        console.log('Creating config in ', configPath);
        await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
    }
    try {
        Object.assign(config, JSON.parse(await Deno.readTextFile(configPath)) || {});
    } catch (e) {
        console.log('Caught: Config file non-existant or corrupt', e);
        return;
    }
    logVerbose('Got config:', config);
    console.log(`Converting files in "${parseDir}" to website files at "${getOutDir(config)}"`);

    const markdownIt = new MarkdownIt({
        html: true,
        linkify: true,
    })
        .use(pluginCheckboxes)
        .use(pluginFootnote)
        .use(pluginAnchor)
        .use(pluginHighlight);
    plugins(markdownIt, config);

    if (!globalThis.parseDir || !config.outDirRoot) {
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

    // Create the template files from defaults unless they already exist in the parseDir's config directory:
    const templatePath = path.join(getConfDir(globalThis.parseDir), templateName);
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
    const stylesPath = path.join(getConfDir(globalThis.parseDir), stylesName)
    if (cliFlags['overwrite-template'] || !await exists(stylesPath)) {
        console.log('Creating default styles in ', stylesPath);
        await Deno.writeTextFile(stylesPath, defaultStyles(config));
    }
    // Copy styles to outDir so it will be statically served
    if (await exists(stylesPath)) {
        logVerbose('Copying styles in parseDir to outDir.');
        await copy(stylesPath, path.join(getOutDir(config), stylesName));
    } else {
        console.error('Warning: eden.css is missing.  Output html will be without styles.');
    }
    // Get previous manifest so it can only process the files that have changed
    // To be used later once I add support for a changed template causing a waterfall change
    // let previousManifest: Manifest = { version: "0.0.0", files: {} };
    // try {
    //     previousManifest = JSON.parse(await Deno.readTextFile(path.join(globalThis.parseDir, 'manifest.json'))) || { files: {} };
    // } catch (e) {
    //     console.log('Caught: Manifest non-existant or corrupt', e);
    // }
    // Get default html template
    // Todo: future enhancement, allow for defining different templates in a .md's metadata
    const templateReplacer = '{{content}}';
    let templateHtml = templateReplacer;
    const defaultTemplatePath = path.join(getConfDir(globalThis.parseDir), templateName);
    try {
        templateHtml = await Deno.readTextFile(defaultTemplatePath);
    } catch (_) {
        // Use default demplate
        console.log(`Default template not found.  Check for the existence of ${defaultTemplatePath}`);
    }

    const tableOfContents: TableOfContents = [];

    // Get a list of all file names to support automatic back linking
    const allFilesNames = [];
    for await (const f of getFiles(globalThis.parseDir, config)) {
        const parsed = path.parse(f);
        if (parsed.ext == '.md') {
            allFilesNames.push({ name: parsed.name, webPath: absoluteOsMdPathToWebPath(f, globalThis.parseDir) });
        }
    }

    // console.log('jtest allfilenames', allFilesNames, allFilesNames.length);
    // console.log('jtest table', tableOfContents.map(x => `${x.pageName}, ${x.isDir}`), tableOfContents.length);
    logVerbose('All markdown file names:', Array.from(allFilesNames));
    const backlinks = await findBacklinks(getFiles(globalThis.parseDir, config), allFilesNames, globalThis.parseDir);

    // Create index file for each directory
    const nav: NavItem[] = [];
    for await (const d of getDirs(globalThis.parseDir, config)) {
        const directoryPathSegment: pathOSRelative = path.relative(globalThis.parseDir, d.dir).replaceAll(' ', '_');
        const pageNameSteps = directoryPathSegment.split(path.sep);
        const indent = pageNameSteps.length;
        const pageName = pathToPageName(directoryPathSegment);
        const parentNavItem = findNavItem(nav, pageNameSteps.slice(0, -1));
        // Note: `hidden` will be updated once the page is processed and the metadata is inspected
        const dirNavItem: NavItem = { name: pageName, hidden: false, isDir: true, webPath: '/' + path.posix.join(pageNameSteps.join('/'), 'index.html'), children: [] };
        // Add directory to nav if it is non-empty
        if (d.contents.filter(c => c.isDirectory || c.name.endsWith('.md')).length) {
            if (parentNavItem) {
                parentNavItem.children.push(dirNavItem)
            } else {
                nav.push(dirNavItem);
            }
        }
        tableOfContents.push({ indent, pageName, relativePath: directoryPathSegment, isDir: true, hidden: false });
        // Add files to table of contents for use later for "next" and "prev" buttons to know order of pages
        for (const content of d.contents) {
            if (content.isFile) {
                if (content.name.endsWith('.md')) {
                    const name = content.name.replace('.md', '')
                    const relativePath = pageNameToPagePath(directoryPathSegment, content.name);
                    // Note: `hidden` will be updated once the page is processed and the metadata is inspected
                    dirNavItem.children.push({ name, hidden: false, isDir: false, webPath: '/' + relativePath, children: [] });
                    tableOfContents.push({
                        originalFilePath: path.normalize(path.join(d.dir, content.name)),
                        indent: indent + 1,
                        parentDir: d.dir,
                        pageName: name,
                        relativePath,
                        isDir: false,
                        hidden: false,
                    });
                } else {
                    logVerbose('table of contents: skipping', content.name);
                }
            }

        }
        // Create an index page for every directory except for the parse dir (the table of contents better serves this)
        if (path.relative(globalThis.parseDir, d.dir) != '') {
            // Only create Directory Index Files for directories that are non-empty
            if (dirNavItem.children.length) {
                createDirectoryIndexFile(d, templateHtml, { tableOfContents, config, backlinks });
            }
        }
    }

    const garden: Garden = {
        pages: [],
        tags: new Set(),
        files: [],
        blocks: {}
    }

    //@ts-ignore todo type global
    globalThis.garden = garden;

    // Copy all non-md mfiles in parseDir to out dir
    for await (const filePath of getFiles(globalThis.parseDir, config)) {
        // Copy file to outDir so it is made available
        // This is mostly useful for images that need to be served but it may be desireable to include .md
        // files
        try {
            // Skip markdown files since they will be converted into html
            if (filePath.endsWith('.md')) {
                continue;
            }
            const fileOutPath = path.join(getOutDir(config), path.relative(globalThis.parseDir, filePath)).replaceAll(' ', '_');
            await Deno.mkdirSync(path.parse(fileOutPath).dir.replaceAll(' ', '_'), { recursive: true });
            await copy(filePath, fileOutPath, { overwrite: true });
            garden.files.push(path.relative(getOutDir(config), fileOutPath).split(path.sep).join('/'));
        } catch (e) {
            if (e.name !== 'AlreadyExists') {
                console.error('❌ Error occurred when copying assets to static dir', e);
            }
        }
    }

    const convertingPerformanceStart = performance.now();
    console.log('Converting .md files to .html...');
    const processPromises: Promise<Page | undefined>[] = [];
    for await (const f of getFiles(globalThis.parseDir, config)) {
        try {
            processPromises.push(process(f, { allFilesNames, tableOfContents, nav, config, backlinks, garden, markdownIt }));
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

    // Now that all pages have been processed, remove unpublished pages from nav
    removeHiddenPages(nav, garden);

    // Output all pages now that nav has had hidden pages removed:
    const outputPagePromises: Promise<void>[] = [];
    for (const page of garden.pages) {
        outputPagePromises.push(outputPage(page, templateHtml, { allFilesNames, tableOfContents, nav, config, backlinks, garden, markdownIt }))

    }
    await Promise.all(outputPagePromises);

    logVerbose('Table of Contents:', tableOfContents);
    // Create table of contents
    // Note: Table of contents must be created AFTER all files are `process`ed so that
    // files with metadata `publish` can mutate the tableOfContents object
    const tocOutPath = path.join(getOutDir(config), tableOfContentsURL);

    const tableOfContentsHtml = await addContentsToTemplate(tableOfContents.filter(x => !x.hidden).map(x => {
        // -1 sets the top level pages flush with the left hand side
        const indentHTML: string[] = Array(x.indent - 1).fill('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
        return `<div>${indentHTML.join('')}<a href="${x.relativePath}">${x.pageName}</a></div>`;
    }).join(''), templateHtml, { config, tableOfContents, garden, nav, filePath: tocOutPath, relativePath: '', metadata: { title: 'Table of Contents' }, backlinks, isDir: true });
    await Deno.writeTextFile(tocOutPath, tableOfContentsHtml);

    // Create Homepage
    // Sort pages by newest
    let homepageContents = `<style>
    table td:first-child {
        padding-right:1.4em;
        text-align:right;
        color:#777;
    }
</style>`;
    const homepagePath = 'index.html';
    if (garden.pages.length) {

        const sortedPages = garden.pages.filter(p => !!p.createdAt).sort((p1, p2) => (p2.createdAt || 0) - (p1.createdAt || 0))
        const latestPage = sortedPages[0];
        const thumbnail = latestPage.metadata?.thumbnail ? `<img height="256px" src="${findFilePathFromBaseName(latestPage.metadata.thumbnail, garden)}"/> ` : '';
        // `.createdAt as number` because createdAt is guarunteed to exist due to above .filter on garden.pages
        const tagsHtml = garden.tags.size > 0 ? `<h4> Tags </h4>
${Array.from(garden.tags).map(t => `<a href="${getWebPathOfTag(t)}">${t}</a>`).join('<span>, </span>')}
<hr>
        `: '';
        const latestHtml = latestPage.metadata?.summary ? `
${thumbnail}
<a href="${latestPage.webPath}"><h3>${latestPage.name}</h3></a>
<div>${new Date(latestPage.createdAt as number).toDateString()}</div>
<div>${latestPage.metadata?.summary || ''}</div>
<hr>
        `: '';
        homepageContents += `
${latestHtml}
${tagsHtml}
<h4>Pages </h4>
<table>
    <tbody>
    ${sortedPages.map(p => `<tr><td><span data-converttimeago="${p.createdAt as number}">${new Date(p.createdAt as number).toDateString()}</span></td><td><a href="${p.webPath}"><span class="gray">${pathToArrayOfNames(p.webPath).join(' / ')} / </span>${p.name}</a><td></tr>`).join('')}
    </tbody>
</table>
            `
    }
    const homepageOutPath = path.join(getOutDir(config), homepagePath);
    const homepageHTML = await addContentsToTemplate(homepageContents, templateHtml, { config, tableOfContents, garden, nav, filePath: homepageOutPath, relativePath: '', metadata: { title: '' }, backlinks, isDir: true });
    await Deno.writeTextFile(homepageOutPath, homepageHTML);

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
    if (config.rssInfo && config.rssInfo.homepage !== 'https://example.com') {
        const rssOutPath = path.join(getOutDir(config), 'rss.xml');
        const rssXML = makeRSSFeed(tableOfContents, config.rssInfo);
        await Deno.writeTextFile(rssOutPath, rssXML);
    }

    // Create garden.json
    const gardenOutPath = path.join(getOutDir(config), 'garden.json');
    // Sanitize garden of _internal
    for (const page of garden.pages) {
        delete page._internal;
    }
    await Deno.writeTextFile(gardenOutPath, JSON.stringify(garden, null, 2));

    const startTranscludingEmbeddableBlocks = performance.now();
    console.log('Transcluding embeddable blocks...');
    // Iterate all .html files to find embed blocks and add the blocks' html into the garden object
    // TODO make async
    for (const { name, webPath, metadata } of garden.pages) {
        if (metadata && metadata.hidden) {
            continue;
        }
        // TODO exclude --hidden: true files from allFilesNames
        const filePath = path.join(getOutDir(config), webPath);
        try {
            const fileContent = await Deno.readTextFile(filePath);
            const newFileContent = processBlockElementsWithID(fileContent, name, garden);
            if (newFileContent) {
                await Deno.writeTextFile(filePath, newFileContent);
            }
        } catch (e) {
            if (e.name == 'NotFound') {
                console.error('Error populating garden.blocks', filePath);
            } else {
                console.error('Error populating garden.blocks', e);
            }
        }
    }

    // Iterate all .html files to replace embed block references with the block content 
    // TODO make async
    for (const { name, webPath, metadata } of garden.pages) {
        if (metadata && metadata.hidden) {
            continue;
        }
        const filePath = path.join(getOutDir(config), webPath);
        try {
            const fileContent = await Deno.readTextFile(filePath);
            const newFileContent = embedBlocks(fileContent, garden, webPath, config);
            if (newFileContent) {
                await Deno.writeTextFile(filePath, newFileContent);
            }
        } catch (e) {
            if (e.name == 'NotFound') {
                console.error('Error: Could not replace embed block ref', filePath)
            } else {
                console.error('Error replacing embed block ref', e);
            }
        }
    }
    console.log('✅ Finished transcluding embeddable blocks', performance.now() - startTranscludingEmbeddableBlocks, 'milliseconds.');


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
        console.log(`\n\n~~~First time setup~~~\nTemplate files have been created for you in ${getConfDir(globalThis.parseDir)}.  You can modify the config file (${configName}) to change the behavior of this program or try modifying the ${templateName} or ${stylesName} to change the appearance of the generated website!\n`);
    }


    if (cliFlags.preview) {
        host(getOutDir(config));
    }

    if (Deno.env.get('MODE') == 'test') {
        Deno.test("snapshot: garden", async function (t): Promise<void> {
            await assertSnapshot(t, garden);
        });
        for (const { webPath } of allFilesNames) {
            const outContents = await Deno.readTextFile(path.join(getOutDir(config), webPath));
            Deno.test(`snapshot: ${webPath}`, async function (t): Promise<void> {
                await assertSnapshot(t, outContents);
            });

        }

    }
}
async function process(filePath: string, { allFilesNames, tableOfContents, nav, config, backlinks, garden, markdownIt }: { allFilesNames: FileName[], tableOfContents: TableOfContents, nav: NavItem[], config: Config, backlinks: Backlinks, garden: Garden, markdownIt: MarkdownIt }): Promise<Page | undefined> {
    // Dev, test single file
    // if (filePath !== 'C:\\ObsidianJordanJiuJitsu\\JordanJiuJitsu\\Core Concepts.md') {
    // if (filePath !== 'C:\\git\\eden-markdown\\sample\\obsidian-custom-markdown-syntax.md') {
    //     return;
    // }

    if (!globalThis.parseDir) {
        console.error('parseDir is undefined');
        return;
    }
    if (!config.outDirRoot) {
        console.error('outDirRoot is undefined');
        return;
    }
    logVerbose('\nProcess', filePath);

    if (path.parse(filePath).ext == '.md') {
        let fileContents = await Deno.readTextFile(filePath);
        const relativePath = path.relative(globalThis.parseDir, filePath);
        // Remove all comments
        fileContents = fileContents.replaceAll(obsidianStyleComment, '');
        // Replace embed file syntax with markdown image format
        fileContents = fileContents.replaceAll(obsidianStyleEmbedFileRegex, '![$1]($2)');

        // Support tags to tag index pages
        fileContents = fileContents.replaceAll(obsidianTags, '[#$1](/tags/$1.html)');

        // Replace embed block syntax with something that will be easily recognized later and parsed as
        // a single token by rusty_markdown (note: As of 2023.09.06 rusty_markdown has been replaced with markdown-it
        // so there may be a better way to do this)
        // Note: This is wrapped in code backticks so that the `if block` that searches for it is more specific
        // and more efficient
        fileContents = fileContents.replaceAll(obsidianStyleEmbedBlockRegex, `\`${edenEmbedClassName}$1$2\``);
        fileContents = fileContents.replaceAll(obsidianStyleEmbedPageRegex, `\`${edenEmbedClassName}$1\``);
        // Find existing obsidian-style backlinks (works even with case insensitive)
        const existingBacklinks = (fileContents.match(obsidianStyleBacklinkRegex) || []).filter((x, i, array) => {
            // Filter for unique tags
            return array.indexOf(x) == i;
        }).map(x => {
            return new RegExp(obsidianStyleBacklinkRegex).exec(x);
        }).flatMap(x => x ? [x] : []);
        // Turn Obsidian style backlinks into actual links:
        existingBacklinks.forEach(([wholeString, backlinkText, modifiedTitle, blockId]) => {

            const foundBacklinkPath = allFilesNames.find(({ name }) => {
                if (name == path.parse(filePath).name) {
                    // Don't link to self
                    return false;
                }
                return name.toLowerCase() == backlinkText.toLowerCase();
            });
            if (foundBacklinkPath) {
                const title = modifiedTitle ? modifiedTitle : backlinkText;
                // .replaceAll(' ', '-') from https://developers.google.com/style/headings-targets#add-a-custom-anchor
                fileContents = fileContents.replaceAll(wholeString, `[${title}](${foundBacklinkPath.webPath}${blockId ? `#${blockId.replaceAll(' ', '-')}` : ''})`);
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


        // metadata: `hidden`
        // Supports omitting a document from being rendered
        if (metadata && metadata.hidden) {
            logVerbose('Skipping processing', filePath, 'Due to `metadata.hidden`\n');
            const tocEntry = findTOCEntryFromFilepath(tableOfContents, filePath)
            if (tocEntry) {
                tocEntry.hidden = true;
            } else {
                console.error('Unexpected, could not locate', filePath, 'in table of contents in order to set `hidden` to true');
            }
            // Return, do not process a hidden file
            return;
        }

        // Remove metadata so it doesn't get converted into the html
        fileContents = fileContents.slice(metadataCharacterCount);

        // Get file stat data on the harddrive
        let createdAt;
        let modifiedAt;
        try {
            const statInfo = await Deno.stat(path.join(globalThis.parseDir, relativePath));
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

        let htmlString = markdownIt.render(fileContents);
        htmlString = htmlString
            .replaceAll('%20', ' ');

        const page: Page = {
            webPath: absoluteOsMdPathToWebPath(filePath, globalThis.parseDir),
            name: pathToPageName(filePath),
            contents: htmlString,
            metadata,
            createdAt: createdAt?.getTime(),
            modifiedAt: modifiedAt?.getTime(),
            blockEmbeds: [],
            _internal: {
                filePath
            }
        }
        return page;
    } else {
        logVerbose('non .md file types not handled yet:', filePath);
    }
    logVerbose('Done processing', filePath, '\n');
    return undefined;
}

async function outputPage(page: Page, templateHtml: string, { allFilesNames, tableOfContents, nav, config, backlinks, garden, markdownIt }: { allFilesNames: FileName[], tableOfContents: TableOfContents, nav: NavItem[], config: Config, backlinks: Backlinks, garden: Garden, markdownIt: MarkdownIt }): Promise<void> {
    if (!page._internal) {
        console.error('Page missing _internal');
        return;
    }
    const relativePath = path.relative(globalThis.parseDir, page._internal.filePath);

    // metadata: `template`
    // Supports using a custom template instead of default template
    if (page.metadata && page.metadata.template) {
        const defaultTemplatePath = path.join(getConfDir(globalThis.parseDir), page.metadata.template);
        try {
            templateHtml = await Deno.readTextFile(defaultTemplatePath);
        } catch (_) {
            // Use default demplate
            console.warn(`Custom template ${page.metadata.template} not found.  Check for the existence of ${defaultTemplatePath}`);
        }
    }

    const htmlString = await addContentsToTemplate(page.contents, templateHtml, { config, tableOfContents, garden, nav, filePath: page._internal.filePath, relativePath, metadata: page.metadata, backlinks, isDir: false });

    try {
        // Get the new path
        const outPath = path.join(getOutDir(config), relativePath);
        // Make the directory that the file will end up in
        await Deno.mkdir(path.parse(outPath).dir.replaceAll(' ', '_'), { recursive: true });
        // Rename the file as .html
        // .replaceAll: Replace all spaces with underscores, so they become valid html paths
        // Note: Even though pageNameToPagePath returns `pathWeb` that is the path that we use 
        // for the htmlOutPath which is relative to the `ourDir` because that is the path that
        // it WILL become on the web (even though it's being saved to the harddrive now).
        const htmlOutPath = changeExtension(outPath, '.html').replaceAll(' ', '_');
        // Write the file
        await Deno.writeTextFile(htmlOutPath, htmlString);

        logVerbose('Written', htmlOutPath);
    } catch (e) {
        console.error(e);
    }
}