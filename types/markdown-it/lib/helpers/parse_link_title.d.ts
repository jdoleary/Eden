import Destination = require('./parse_link_destination.d.ts');

declare function parseLinkTitle(str: string, pos: number, max: number): Destination.ParseResult;

export = parseLinkTitle;
