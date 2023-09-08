
export interface NavItem {
    name: string,
    webPath: string,
    isDir: boolean,
    children: NavItem[]
}
export function findNavItem(nav: NavItem[], steps: string[]): NavItem | undefined {
    let children: NavItem[] = nav;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        for (const item of children) {
            if (item.name == step) {
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
    if (!item.children.length) {
        return `<li><a href="${item.webPath}">${item.name}</a></li>`;
    }
    const pathMatches = path && item.name == path[0];
    const childrenHTML = `
        ${item.children
            ? `
            <ul>
            ${item.children.map(c => navToHTML(c, pathMatches ? path.slice(1) : undefined)).join('')}
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