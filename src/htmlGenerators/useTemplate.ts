import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { Config, TableOfContents, tableOfContentsURL, templateName } from "../sharedTypes.ts";

export async function addContentsToTemplate(htmlString: string, config: Config, tableOfContents: TableOfContents, filePath: string, relativePath: string, titleOverride = ''): Promise<string> {
    // Get all nested templates and add to html
    // Prepend page title to top of content
    const pageTitle = (relativePath.split('\\').slice(-1)[0] || '').replaceAll('.md', '');
    // The wrapping div separates the text from the nextPrev buttons so the buttons can be
    // at the bottom of the page
    htmlString = `<div><h1>${titleOverride || pageTitle}</h1>${htmlString}</div>`;
    // Add footer "next" and "prev" buttons
    const currentPage = tableOfContents.find(x => x.pageName == pageTitle);
    const currentIndex = currentPage ? tableOfContents.indexOf(currentPage) : -1;
    if (currentIndex !== -1) {
        const previous = tableOfContents[currentIndex - 1];
        htmlString += `<div class="footer flex space-between">`;
        // Add next and previous buttons to page
        // If other page is in a different chapter, show the chapter before a ":"
        htmlString += `${(previous && previous.pageName)
            ? `<a class="nextPrevButtons" href="\\${previous.relativePath}">← ${previous.parentDir !== currentPage?.parentDir
                ? path.parse(previous.parentDir || '').name + ':'
                : ''} ${previous.pageName}</a>`
            : `<a class="nextPrevButtons ${titleOverride == 'Table of Contents' ? 'hidden' : ''}" href="${tableOfContentsURL}">Table of Contents</a>`}`;
        // Add pageNumber
        htmlString += `<div class="pageNumber"><a href="${tableOfContentsURL}">${currentIndex + 1}</a></div>`;
        const next = tableOfContents[currentIndex + 1];
        htmlString += `${next ? `<a class="nextPrevButtons" href="\\${next.relativePath}">${next.pageName} →</a>` : ''}`;
        htmlString += `</div>`;
    }

    const relativeDirectories = path.parse(relativePath).dir;
    // Empty string is for directoryParse base dir
    const eachDirectory = ['', ...relativeDirectories.split(path.sep)];
    const templateReplacer = '{{content}}';
    const searchDirectories: string[] = [];
    for (let i = 0; i < eachDirectory.length; i++) {
        const lookForTemplateFileInDir = eachDirectory.slice(0, i + 1).join(path.sep);
        searchDirectories.push(lookForTemplateFileInDir);
    }
    // .filter removes duplicate root
    for (const dir of searchDirectories.filter(x => x !== path.sep).reverse()) {
        // Start templateContents as just the templateReplacer so that if there is no template it will still
        // include the page contents alone.  But there should always be a template even if it's `templateDefault`
        // which is included in this project
        let templateContents = templateReplacer;
        try {
            templateContents = (await Deno.readTextFile(path.join(config.parseDir, dir, templateName))).toString();
        } catch (_) {
            // Use default demplate
            const isRoot = dir == '';
            if (isRoot) {
                console.log('Template not found at ', dir)
            }
        }
        // Add the template to the front
        // TODO: Optimizable
        const [templateStart, templateEnd] = templateContents.split(templateReplacer);
        htmlString = (templateStart || '') + htmlString + (templateEnd || '');
    }
    const title = filePath.split(path.sep).slice(-1)[0];

    htmlString = htmlString.replace('{{title}}', `<title>${title}</title>`);
    let breadcrumbs = '';
    if (relativePath) {
        breadcrumbs = [`<a href="${tableOfContentsURL}"' class="nav-item">Home</a>`, ...relativePath.split(path.sep).map(currentPathStep => {
            const preUrl = relativePath.split(currentPathStep)[0];
            const url = path.join('/', preUrl, currentPathStep);
            if (currentPathStep == title) {
                // No breadcrumb for current title
                return '';
            }
            return `<a class="nav-item" href=${url}>${currentPathStep}</a>`;
        })].filter(x => !!x).join('<span class="center-dot">·</span>');
    }
    htmlString = htmlString.replace('{{breadcrumbs}}', breadcrumbs);

    // Get file meta data
    try {
        const metadata = await Deno.stat(path.join(config.parseDir, relativePath));
        htmlString = htmlString.replace('{{created}}', metadata.birthtime?.toLocaleDateString() || '');
        htmlString = htmlString.replace('{{modified}}', metadata.mtime?.toLocaleDateString() || '');
    } catch (e) {
        console.error('Err: Failed to get metadata for ', filePath);
    }

    return htmlString;

}