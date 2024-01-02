import { assertEquals } from "https://deno.land/std@0.196.0/testing/asserts.ts";


export const twitterRegex = /^https?:\/\/(?:www\.)?(?:twitter|x).com(?:.com)?(?:\/(\w+))+/;
([
    ['https://twitter.com/Kamulch_Art/status/1701131095805452583?s=23', ['https://twitter.com/Kamulch_Art/status/1701131095805452583', '1701131095805452583'], true],
    ['https://x.com/Kamulch_Art/status/1701131095805452583', ['1701131095805452583']],

] as RegexTest[]).map(([testString, captureGroups, useExplicitMatch]) => {
    runTest(`twitterRegex: ${testString}->${captureGroups} `, new RegExp(twitterRegex), testString, captureGroups, useExplicitMatch);
});
export const youtubeRegex = /^https?:\/\/(?:www\.)?youtu\.?be(?:.com)?\/(?:watch\?v=)?(\w*)/;
([
    ['https://youtu.be/', ['']],
    ['http://youtu.be/', ['']],
    ['https://youtube.com/', ['']],
    ['http://youtube.com/', ['']],
    ['https://youtu.be/aFBp0cZ79bQ?si=rdrrNxhVlJWzHpVw', ['https://youtu.be/aFBp0cZ79bQ', 'aFBp0cZ79bQ'], true],
    ['https://www.youtube.com/watch?v=aFBp0cZ79bQ', ['aFBp0cZ79bQ']],
] as RegexTest[]).map(([testString, captureGroups, useExplicitMatch]) => {
    runTest(`youtubeRegex: ${testString}->${captureGroups} `, new RegExp(youtubeRegex), testString, captureGroups, useExplicitMatch);
});

export const markdownImageRegex = /!\[([^\^#\[\]*"\\<>\n\r:|?]+(?:\.[\w\d]+)?)\]\(([^\^#\[\]*"\\<>\n\r:|?]+\.[\w\d]+)(?: "([\w\s]*)")?\)/;
([
    ['![alt text](Pasted_image 20230729221843.png "title text")', ['alt text', 'Pasted_image 20230729221843.png', 'title text']],
    ['![Pasted image 20230729221843.png](Pasted image 20230729221843.png)', ['Pasted image 20230729221843.png', 'Pasted image 20230729221843.png']],
] as RegexTest[]).map(([testString, captureGroups]) => {
    runTest(`markdownImageRegex: ${testString}->${captureGroups} `, new RegExp(markdownImageRegex), testString, captureGroups, false);
});


export const imageSizeRegex = /\|(\d+)x?(\d*)$/;
([
    ['Portrait|640', ['|640', '640']],
    ['Portrait|640x480', ['|640x480', '640', '480']],
] as RegexTest[]).map(([testString, captureGroups]) => {
    runTest(`imageSizeRegex: ${testString}->${captureGroups} `, new RegExp(imageSizeRegex), testString, captureGroups, true);

});


export const obsidianStyleEmbedFileRegex = /!\[\[(([^\^#\[\]*"\\<>\n\r:|?]+\.[\w\d]+)(\|?\d*x?\d*)?)\]\]/g;
([
    ['![[panda.png]]', ['panda.png']],
    ['![[Image.png]]', ['Image.png']],
    ['![[Image with spaces.png]]', ['Image with spaces.png']],
    ['![[image.webm]]', ['image.webm']],
    ['![[flower.png|80]]', ['flower.png|80', 'flower.png', '|80']],
    ['![[flower.png|80x234]]', ['flower.png|80x234', 'flower.png', '|80x234']],
    ['![[more/flower.png]]', ['more/flower.png']],
] as RegexTest[]).map(([testString, captureGroups]) => {
    runTest(`obsidianStyleEmbedFileRegex: ${testString}->${captureGroups} `, new RegExp(obsidianStyleEmbedFileRegex), testString, captureGroups);
});

// Matches
// ![Pasted image 20230903174037.png](Pasted image 20230903174037.png)
// ![](image.png)
// export const mdImageEmbedRegex = /!\[([^\^#\[\]*"/\\<>\n\r:|?]+\.[\w\d]+)?\]\(([^\^#\[\]*"/\\<>\n\r:|?]+\.[\w\d]+)\)/g;

export const obsidianStyleEmbedPageRegex = /!\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)\]\]/g;
([
    [`![[Features]]`, ['Features']],
    [`![[page with spaces]]`, ['page with spaces']],
    [`![[page-with-dashes]]`, ['page-with-dashes']],
] as RegexTest[]).map(([testString, captureGroups]) => {
    runTest(`obsidianStyleEmbedPageRegex: ${testString}->${captureGroups} `, new RegExp(obsidianStyleEmbedPageRegex), testString, captureGroups);
});

export const obsidianStyleEmbedBlockRegex = /!\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)(\#\^?[\w\d\s]+)\]\]/g;
([
    ['![[Features#^f3edfd]]', ['Features', '#^f3edfd']],
    ['![[images 2 again#^be171d]]', ['images 2 again', '#^be171d']],
    ['![[Features#Header Text]]', ['Features', '#Header Text']],
] as RegexTest[]).map(([testString, captureGroups]) => {
    runTest(`obsidianStyleEmbedBlockRegex: ${testString}->${captureGroups} `, new RegExp(obsidianStyleEmbedBlockRegex), testString, captureGroups);
});

// Capture groups: [pageName, modified title, link to header]
export const obsidianStyleBacklinkRegex = /\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)(?:\|([\w\s\d-]+))?(?:#\^?([\w\s\d-]+))?\]\]/g;
([
    ['[[backlink]]', ['backlink']],
    ['[[backlink with spaces]]', ['backlink with spaces']],
    // Modified title (also known as "aliases")
    ['[[summary|modified title]]', ['summary', 'modified title']],
    ['[[summary|modified-title]]', ['summary', 'modified-title']],
    // Link to header
    ['[[Features#Advanced Potential Features]]', ['Features', undefined, 'Advanced Potential Features']],
    // Link to block id
    ['[[summary#^8fb9e2]]', ['summary', undefined, '8fb9e2']],
    ['[[Core Concepts#^the-bonsai-tree]]', ['Core Concepts', undefined, 'the-bonsai-tree']]
] as RegexTest[]).map(([testString, captureGroups]) => {
    runTest(`obsidianStyleBacklinkRegex: ${testString}->${captureGroups} `, new RegExp(obsidianStyleBacklinkRegex), testString, captureGroups);
});

export const obsidianStyleComment = /%%[\r\n\w\d\s]+%%/g;
([
    ['%%Invisible Text%%', ['%%Invisible Text%%']],
    ['Inline comment %%invisible%% end inline', ['%%invisible%%']],
    [`before%%
Multiline comment
%%
after`, [`%%
Multiline comment
%%`]],
] as RegexTest[]).map(([testString, captureGroups]) => {
    runTest(`obsidianStyleComment: ${testString}->${captureGroups} `, new RegExp(obsidianStyleComment), testString, captureGroups, true);
});

// Note tags always have a space after them
export const obsidianTags = /(?:^|\s)#([\w-_]+)\s/g;
([
    ['#tag ', ['tag']],
    ['#tag_with_underscores ', ['tag_with_underscores']],
    ['#tag-dash ', ['tag-dash']],
    ['#tag1234567890 ', ['tag1234567890']],
    // Does not match
    // tagin#middleofword
    // #tagwithspecialcharacters$
] as RegexTest[]).map(([testString, captureGroups]) => {
    runTest(`obsidianTags: ${testString}->${captureGroups} `, new RegExp(obsidianTags), testString, captureGroups);
});


export const obsidianStyleCallout = /\[!(\w+)\](-)?(.*)/g;

type RegexTest = [string, Array<string>, boolean?];
function runTest(testName: string, regex: RegExp, testString: string, captureGroups: string[], useExplicitMatch?: boolean, only?: boolean) {
    Deno.test({
        name: `${testName}: ${testString}->${captureGroups} `, fn: () => {
            const testFn = useExplicitMatch ? testRegexExplicit : testRegex;
            testFn(new RegExp(regex), testString, captureGroups);
        },
        only
    });
}
// Always expects the first match to == the test string
function testRegex(regex: RegExp, testString: string, captureGroups: string[]) {
    const actual = new RegExp(regex).exec(testString);
    // console.log('jtest2', testString, 'actual:', actual);

    // Always expect the first index to return the whole string
    assertEquals((actual || [])[0] as string, testString);
    // Next, any array entries should match the Capture Groups
    for (let i = 0; i < captureGroups.length; i++) {
        const match = captureGroups[i];
        assertEquals((actual || [])[i + 1] as string, match);
    }
}

// tests match strings one for one (as opposed to testRegex() above)
function testRegexExplicit(regex: RegExp, testString: string, matches: string[]) {
    const actual = new RegExp(regex).exec(testString);
    // Next, any array entries should match the Capture Groups
    // console.log('jtest', testString, actual);
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        assertEquals((actual || [])[i] as string, match);
    }

}