import MarkdownIt = require('../index.d.ts');
import Token = require('../token.d.ts');

declare class StateCore {
    constructor(src: string, md: MarkdownIt, env: any);

    src: string;
    env: any;
    tokens: Token[];
    inlineMode: boolean;

    /**
     * link to parser instance
     */
    md: MarkdownIt;

    Token: typeof Token;
}

export = StateCore;
