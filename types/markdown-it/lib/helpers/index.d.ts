import parseLinkLabel = require('./parse_link_label.d.ts');
import parseLinkDestination = require('./parse_link_destination.d.ts');
import parseLinkTitle = require('./parse_link_title.d.ts');

interface Helpers {
    parseLinkLabel: typeof parseLinkLabel;
    parseLinkDestination: typeof parseLinkDestination;
    parseLinkTitle: typeof parseLinkTitle;
}

declare const helpers: Helpers;

export = helpers;
