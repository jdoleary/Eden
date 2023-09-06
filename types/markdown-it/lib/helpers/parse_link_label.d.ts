import StateInline = require('../rules_inline/state_inline.d.ts');

declare function parseLinkLabel(state: StateInline, start: number, disableNested?: boolean): number;

export = parseLinkLabel;
