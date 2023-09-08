import { TableOfContents, RSSInfo } from "../sharedTypes.ts";


export function makeRSSFeed(tableOfContents: TableOfContents, rssInfo: RSSInfo): string {
    const items = tableOfContents.filter(x => !x.isDir).map(entry => {
        const homepage = rssInfo.homepage.endsWith('/') ? rssInfo.homepage : rssInfo.homepage + '/'
        const itemUrl = homepage + entry.relativePath;
        const pubDate = entry.createdAt?.toUTCString();
        return `
        <item>
            <title>${escapeXml(entry.pageName)}</title>
            <link>${escapeXml(itemUrl)}</link>
            <guid>${escapeXml(itemUrl)}</guid>
            ${pubDate ? `<pubDate>${escapeXml(pubDate)}</pubDate>` : ''}
        </item>
`
    }).join('');
    const rssFeedString = `
<rss version="2.0">
    <channel>
        <title>${escapeXml(rssInfo.title)}</title>
        <link>${escapeXml(rssInfo.homepage)}</link>
        <description>${escapeXml(rssInfo.description)}</description>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
        <language>${escapeXml(rssInfo.language)}</language>
        ${items}
    </channel>
</rss>
            `;
    return rssFeedString;
}
function escapeXml(unsafe: string) {
    return unsafe.replaceAll(/[<>&'"]/gm, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
}