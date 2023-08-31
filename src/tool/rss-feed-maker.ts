import { TableOfContents, RSSInfo } from "../sharedTypes.ts";


export function makeRSSFeed(tableOfContents: TableOfContents, rssInfo: RSSInfo): string {
    const items = tableOfContents.filter(x => !x.isDir).map(entry => {
        const homepage = rssInfo.homepage.endsWith('/') ? rssInfo.homepage : rssInfo.homepage + '/'
        const itemUrl = homepage + entry.relativePath;
        const pubDate = entry.createdAt?.toUTCString();
        return `
        <item>
            <title>${entry.pageName}</title>
            <link>${itemUrl}</link>
            <guid>${itemUrl}</guid>
            ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
        </item>
`
    }).join('');
    const rssFeedString = `
<rss version="2.0">
    <channel>
        <title>${rssInfo.title}</title>
        <link>${rssInfo.homepage}</link>
        <description>${rssInfo.description}</description>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
        <language>${rssInfo.language}</language>
        ${items}
    </channel>
</rss>
            `;
    return rssFeedString;
}