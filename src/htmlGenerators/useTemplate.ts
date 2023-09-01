import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { Config, TableOfContents, TableOfContentsEntry, tableOfContentsURL } from "../sharedTypes.ts";
import { Backlinks } from "../tool/backlinkFinder.ts";
import { absoluteOsMdPathToWebPath, pathOSAbsolute } from "../path.ts";

// Takes a string that contains html with template designators (e.g. {{content}}) and fills all the templates
export async function addContentsToTemplate(content: string, templateHtml: string, { config, tableOfContents, filePath, relativePath, titleOverride, metadata, backlinks, isDir }: {
    config: Config, tableOfContents: TableOfContents, filePath: string, relativePath: string, titleOverride: string, metadata: any, backlinks: Backlinks, isDir: boolean
}): Promise<string> {
    const pageTitle = (relativePath.split('\\').slice(-1)[0] || '').replaceAll('.md', '');
    // The wrapping div separates the text from the nextPrev buttons so the buttons can be
    // at the bottom of the page
    if (titleOverride) {
        content = `<div><h2>${titleOverride}</h2>${content}</div>`;
    }

    const templateReplacer = '{{content}}';

    // Add the template to the front
    // TODO: Optimizable
    const [templateStart, templateEnd] = templateHtml.split(templateReplacer);
    content = (templateStart || '') + content + (templateEnd || '');
    // }
    const title = path.parse(filePath).name;

    content = content.replace('{{title}}', `<title>${title}</title>`);
    let breadcrumbs = '';
    if (relativePath) {
        breadcrumbs = [`<a href="${tableOfContentsURL}"' class="breadcrumbs-item">Home</a>`, ...relativePath.split(path.sep).map(currentPathStep => {
            const preUrl = relativePath.split(currentPathStep)[0];
            const url = path.join('/', preUrl, currentPathStep);
            if (currentPathStep == title) {
                // No breadcrumb for current title
                return '';
            }
            return `<a class="breadcrumbs-item" href=${url}>${currentPathStep}</a>`;
        })].filter(x => !!x).join('<span class="center-dot">/</span>');
    }
    content = content.replace('{{breadcrumbs}}', breadcrumbs);
    const webPath = absoluteOsMdPathToWebPath(filePath, config.parseDir);
    const backlinkList = backlinks[webPath];
    if (backlinkList) {
        content = content.replace('{{backlinks}}', `<h4>Backlinks</h4>${backlinkList.map(({ text, from, backlinkName }) => `<div><a href="${from}#${backlinkName}">${text}</a></div>`).join('')}`);
    } else {
        content = content.replace('{{backlinks}}', '');
    }
    // Add footer "next" and "prev" buttons
    const publishedTableOfContents = tableOfContents.filter(x => x.publish);
    const currentPage = publishedTableOfContents.find(x => x.pageName == pageTitle);
    const currentIndex = currentPage ? publishedTableOfContents.indexOf(currentPage) : -1;
    let pagination = '';
    if (currentIndex !== -1) {
        const previous = publishedTableOfContents[currentIndex - 1];
        pagination += `<div class="pagination flex space-between">`;
        // Add next and previous buttons to page
        // If other page is in a different chapter, show the chapter before a ":"
        pagination += `${(previous && previous.pageName)
            ? `<a class="nextPrevButtons" href="\\${previous.relativePath}">← ${previous.parentDir !== currentPage?.parentDir
                ? path.parse(previous.parentDir || '').name + ':'
                : ''} ${previous.pageName}</a>`
            : `<a class="nextPrevButtons ${titleOverride == 'Table of Contents' ? 'hidden' : ''}" href="${tableOfContentsURL}">Table of Contents</a>`}`;
        // Add pageNumber
        pagination += `<div class="pageNumber"><a href="${tableOfContentsURL}">${currentIndex + 1}</a></div>`;
        const next = publishedTableOfContents[currentIndex + 1];
        pagination += `${next ? `<a class="nextPrevButtons" href="\\${next.relativePath}">${next.pageName} →</a>` : ''}`;
        pagination += `</div>`;
    }
    content = content.replace('{{pagination}}', pagination);

    if (metadata) {
        // {{ metadata  }} has spaces due to formatter changing it
        // TODO find a better way to add this to the head rather than replace
        content = content.replace('{{ metadata }}', JSON.stringify(metadata) || '{}');
    }

    content = content.replace('{{metadata:title}}', `<h1>${metadata && metadata.title ? metadata.title : title}</h1>`);
    content = content.replace('{{metadata:subtitle}}', metadata && metadata.subtitle ? `<h2 class="gray">${metadata.subtitle}</h2>` : '');
    // Even if tags don't exist, it should still be an empty div so that the createdAt timestamps stay on the right side of the flex
    content = content.replace('{{metadata:tags}}', metadata && metadata.tags ? `<div id="article-tags">${metadata.tags.map((tag: string) => `<span>${tag}</span>`).join('')}</div>` : '<div></div>');

    content = content.replace('{{pageType}}', isDir ? 'type-directory' : 'type-page');

    if (!isDir) {
        // Get file stat data on the harddrive
        try {
            const statInfo = await Deno.stat(path.join(config.parseDir, relativePath));
            if (statInfo.birthtime) {
                content = content.replace('{{created}}', statInfo.birthtime?.toLocaleDateString() || '');
                const tocEntry = findTOCEntryFromFilepath(tableOfContents, filePath);
                if (tocEntry) {
                    tocEntry.createdAt = statInfo.birthtime;
                }
            }
            content = content.replace('{{modified}}', statInfo.mtime?.toLocaleDateString() || '');
        } catch (e) {
            console.error('❌ Err: Failed to get file stat for ', filePath);
        }
    }

    return content;

}

export function findTOCEntryFromFilepath(tableOfContents: TableOfContents, filePath: pathOSAbsolute): TableOfContentsEntry | undefined {
    const normalizedPath = path.normalize(filePath);
    return tableOfContents.find(entry => (entry.originalFilePath || '') === normalizedPath);

}