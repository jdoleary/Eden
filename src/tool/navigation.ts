import { Garden } from "../sharedTypes.ts";

export interface NavItem {
    name: string;
    webPath: string;
    isDir: boolean;
    children: NavItem[];
    hidden: boolean;
}
export function findNavItem(nav: NavItem[], steps: string[]): NavItem | undefined {
    let children: NavItem[] = nav;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        for (const item of children) {
            if (item.name.replaceAll(' ', '_') == step) {
                // If last step is a match, return
                if (i == steps.length - 1) {
                    return item;
                }
                children = item.children;
            }
        }
    }
    return undefined

}
// If path is provided it will "open" the collapable blocks that exist in the path
// So that the navigation shows the path to the current page
function navToHTML(item: NavItem, path?: string[]): string {
    if (item.hidden) {
        return '';
    }
    if (!item.children.length) {
        const isCurrentPage = (path?.[0] || '').includes(item.name);
        return `<li><a href="${item.webPath}" ${isCurrentPage ? `class="currentPage"` : ''}>${item.name}</a></li>`;
    }
    const pathMatches = path && item.name == path[0];
    const childrenHTML = `
        ${item.children
            ? `
            <ul>
            ${item.children.map(c => navToHTML(c, pathMatches
                // Go down one path since we are iterating children
                ? path.slice(1)
                // Exception: For top level documents (at the root of parseDir), keep
                // the path as is since "" is never a part of path during the previous split operation
                // that makes the path string
                : item.name == ''
                    ? path
                    : undefined)).join('')}
            </ul>
            `
            : ''}
    `
    if (!item.name) {
        return childrenHTML
    }
    return `
    <details ${pathMatches ? `open=""` : ''}>
        <summary>${item.name}</summary>
        ${childrenHTML}
    </details>
    `;
}
export function navHTML(nav: NavItem[], path?: string[]): string {
    let html = '';
    for (const item of nav) {
        html += navToHTML(item, path);
    }
    return html;
}

export function removeHiddenPages(nav: NavItem[], garden: Garden) {
    for (const item of nav) {
        const gardenPage = garden.pages.find(p => p.webPath == item.webPath);
        // Only files have metadata which can declare themselves hidden
        if (!item.isDir) {
            if (!gardenPage || gardenPage.metadata?.hidden) {
                item.hidden = true;
            }
        }

        if (item.children) {
            removeHiddenPages(item.children, garden);
        }
    }

}