import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { Config, Garden, TableOfContents, TableOfContentsEntry, tableOfContentsURL, tagsDirectoryName } from "../sharedTypes.ts";
import { Backlinks } from "../tool/backlinkFinder.ts";
import { absoluteOsMdPathToWebPath, doesFileExist, getOutDir, pageNameToPagePath, pathOSAbsolute } from "../path.ts";
import { NavItem, navHTML } from "../tool/navigation.ts";

// Takes a string that contains html with template designators (e.g. {{content}}) and fills all the templates
export async function addContentsToTemplate(content: string, templateHtml: string, { config, tableOfContents, garden, nav, filePath, relativePath, metadata, backlinks, isDir }: {
    config: Config, tableOfContents: TableOfContents, garden?: Garden, nav?: NavItem[], filePath: string, relativePath: string, metadata: any, backlinks: Backlinks, isDir: boolean
}): Promise<string> {
    const pageTitle = (relativePath.split('\\').slice(-1)[0] || '').replaceAll('.md', '');

    const templateReplacer = '{{content}}';

    // Add the template to the front
    // TODO: Optimizable
    const [templateStart, templateEnd] = templateHtml.split(templateReplacer);
    content = (templateStart || '') + content + (templateEnd || '');
    // }
    const title = metadata && metadata.title || path.parse(filePath).name;

    content = content.replace('{{title}}', `<title>${title}</title>`);
    let breadcrumbs = '';
    if (relativePath) {
        breadcrumbs = [`<a href="/" class="breadcrumbs-item">${config.projectName || 'Home'}</a>`, ...relativePath.split(path.sep).map(currentPathStep => {
            const preUrl = relativePath.split(currentPathStep)[0];
            if (path.parse(currentPathStep).name == title) {
                // No breadcrumb for current title
                return '';
            }
            return `<a class="breadcrumbs-item" href="/${pageNameToPagePath(preUrl, currentPathStep, '/')}">${currentPathStep}</a>`;
        })].filter(x => !!x).join('<span class="center-dot">/</span>');
    }
    content = content.replace('{{breadcrumbs}}', breadcrumbs);
    const webPath = absoluteOsMdPathToWebPath(filePath, globalThis.parseDir);
    const backlinkList = backlinks[webPath];
    if (backlinkList) {
        content = content.replace('{{backlinks}}', `<h4>Backlinks</h4>${backlinkList.map(({ text, from, backlinkName }) => `<div><a href="${from}#${backlinkName}">${text}</a></div>`).join('')}`);
    } else {
        content = content.replace('{{backlinks}}', '');
    }

    // Add footer "next" and "prev" buttons
    if (garden) {

        const publishedPages = garden.pages.filter(x => !x.metadata || !x.metadata.hidden);
        const currentPage = publishedPages.find(x => x.name == pageTitle);
        const currentIndex = currentPage ? publishedPages.indexOf(currentPage) : -1;
        let pagination = '';
        if (currentIndex !== -1) {
            const previous = publishedPages[currentIndex - 1];
            pagination += `<div class="pagination flex space-between">`;
            // Add next and previous buttons to page
            // If other page is in a different chapter, show the chapter before a ":"
            pagination += `${(previous && previous.name)
                // ? `<a class="nextPrevButtons" href="\\${previous.webPath}">← ${previous.parentDir !== currentPage?.parentDir
                //     ? path.parse(previous.parentDir || '').name + '/'
                //     : ''}${previous.name}</a>`
                ? `<a class="nextPrevButtons secondary" href="${previous.webPath}">← ${previous.name}</a>`
                : `<a class="nextPrevButtons secondary ${(metadata && metadata.title == 'Table of Contents') ? 'hidden' : ''}" href="${tableOfContentsURL}">Table of Contents</a>`}`;
            // Add pageNumber
            pagination += `<div class="pageNumber"><a href="${tableOfContentsURL}">${currentIndex + 1}</a></div>`;
            const next = publishedPages[currentIndex + 1];
            pagination += `${next ? `<a class="nextPrevButtons secondary" href="${next.webPath}">${next.name} →</a>` : ''}`;
            pagination += `</div>`;
        }
        content = content.replace('{{pagination}}', pagination);
    } else {
        content = content.replace('{{pagination}}', '');
    }

    // {{ metadata  }} has spaces due to formatter changing it
    // TODO find a better way to add this to the head rather than replace
    content = content.replace('{{ metadata }}', JSON.stringify(metadata) || '{}');

    content = content.replace('{{metadata:title}}', `<h1 style="text-transform:capitalize;">${metadata && metadata.title ? metadata.title : title === 'index' ? '' : title}</h1>`);
    content = content.replace('{{metadata:subtitle}}', metadata && metadata.subtitle ? `<h2 class="gray">${metadata.subtitle}</h2>` : '');
    // Even if tags don't exist, it should still be an empty div so that the createdAt timestamps stay on the right side of the flex
    content = content.replace('{{metadata:tags}}', metadata && metadata.tags ? `<div id="article-tags">${metadata.tags.map((tag: string) => `<a href="${path.join('/', tagsDirectoryName, `${tag}.html`).replaceAll(' ', '_')}">${tag}</a>`).join('')}</div>` : '<div></div>');

    content = content.replace('{{metadata:cssclasses}}', metadata && metadata.cssclasses && metadata.cssclasses.length ? metadata.cssclasses.join(' ') : '');

    content = content.replace('{{article-header-css}}', metadata && metadata.cssclasses && metadata.cssclasses.includes('hide-title') ? 'hide-title' : '');

    let extraHeadTags = '';
    // Ref: https://help.obsidian.md/Obsidian+Publish/Customize+your+site
    if (await doesFileExist(path.join(globalThis.parseDir, 'publish.css'))) {
        extraHeadTags += `<link rel="stylesheet" href='/publish.css'>`;
    }
    if (await doesFileExist(path.join(globalThis.parseDir, 'publish.js'))) {
        extraHeadTags += `<script src="/publish.js" defer></script>`;
    }
    if (await doesFileExist(path.join(globalThis.parseDir, 'favicon-32x32.png'))) {
        extraHeadTags += `<link rel="icon" type="image/x-icon" href="/favicon-32x32.png">`;
    }
    if (await doesFileExist(path.join(globalThis.parseDir, 'favicon-32.png'))) {
        extraHeadTags += `<link rel="icon" type="image/x-icon" href="/favicon-32.png">`;
    }
    if (await doesFileExist(path.join(globalThis.parseDir, 'favicon.ico'))) {
        extraHeadTags += `<link rel="icon" type="image/x-icon" href="/favicon.ico">`;
    }
    content = content.replace('{{head:extra}}', extraHeadTags);


    const isHomepage = filePath == path.join(getOutDir(config), 'index.html');
    content = content.replace('{{pageType}}', isHomepage ? 'type-homepage' : isDir ? 'type-directory' : 'type-page');

    if (!isDir) {
        // Get file stat data on the harddrive
        try {
            const createdDate = metadata?.created && new Date(metadata.created);
            content = content.replace('{{created}}', `<span ${createdDate ? `data-converttimeago="${createdDate.getTime()}"` : ''}>${createdDate?.toLocaleDateString()}</span>` || '');
            const tocEntry = findTOCEntryFromFilepath(tableOfContents, filePath);
            if (tocEntry) {
                tocEntry.createdAt = createdDate;
            }
            const updatedDate = metadata?.updated && new Date(metadata.updated);
            content = content.replace('{{modified}}', `<span ${updatedDate ? `data-converttimeago="${updatedDate.getTime()}"` : ''}>${updatedDate?.toLocaleDateString()}</span>` || '');
        } catch (e) {
            console.error('❌ Err: Failed to get file stat for ', filePath, ';', e);
        }
    }

    // Add nav
    content = content.replace('{{nav}}', nav ? `<div id="nav-aligner">
        ${navHTML(nav, relativePath.split(path.SEP))}
    </div>` : '');
    // Add header
    const headerHTML = `<a href="/">${config.projectName}</a>`;
    content = content.replace('{{header}}', headerHTML);
    // Add footer
    let footerHTML = ``;
    if (config.rssInfo && config.rssInfo.homepage !== 'https://example.com') {
        footerHTML += `
        <div><a href="/rss.xml">RSS Feed</a></div>`;
    }
    content = content.replace('{{footer}}', footerHTML);

    return content;

}

export function findTOCEntryFromFilepath(tableOfContents: TableOfContents, filePath: pathOSAbsolute): TableOfContentsEntry | undefined {
    const normalizedPath = path.normalize(filePath);
    return tableOfContents.find(entry => (entry.originalFilePath || '') === normalizedPath);

}