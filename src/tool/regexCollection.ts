
// Youtube regex matches the following:
// https://youtu.be/
// http://youtu.be/
// https://youtube.com/
// http://youtube.com/
// https://youtu.be/aFBp0cZ79bQ?si=rdrrNxhVlJWzHpVw
// https://www.youtube.com/watch?v=aFBp0cZ79bQ
export const youtubeRegex = /^https?:\/\/(www\.)?youtu\.?be(.com)?\/(watch\?v=)?(\w*)/;

// Example matches
// Portrait|640
// Portrait|640x480
export const imageSizeRegex = /\|(\d+)x?(\d*)$/;

// Matches
// ![[panda.png]]
// ![[image.png]]
// ![[image.webm]]
export const obsidianStyleEmbedFileRegex = /!\[\[([^\^#\[\]*"/\\<>\n\r:|?]+\.[\w\d]+)\]\]/g;

// Matches
// ![[Features]]
export const obsidianStyleEmbedPageRegex = /!\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)\]\]/g;

// Matches
// ![[Features#^f3edfd]]
// ![[images 2 again#^be171d]]
// ![[test embed]]
export const obsidianStyleEmbedBlockRegex = /!\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)(\#\^[\w\d]+)\]\]/g;

// Matches
// [[backlink]]
export const obsidianStyleBacklinkRegex = /\[\[([^\^#\[\]*"/\\<>\n\r:|?]+)\]\]/g;