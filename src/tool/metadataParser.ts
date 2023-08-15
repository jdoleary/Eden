import { assertEquals } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { parse } from "https://deno.land/std@0.194.0/yaml/mod.ts";

function* searchInParts(string: string) {
    const amount = 3;
    let position = amount;
    while (string[position]) {
        yield string.slice(position - amount, position);
        position += amount;
    }
    yield string.slice(position - amount, string.length);
}
export function extractMetadata(fileContents: string) {
    const stringSearcher = searchInParts(fileContents);
    let hasMetaData = null;
    let countEndDashes = 0;
    let metaData = '';
    for (const v of stringSearcher) {
        if (hasMetaData == null) {
            if (v == '---') {
                hasMetaData = true;
                continue;
            } else {
                hasMetaData = false;
                // Do not keep looking for metadata
                return null;
            }
        }
        let dashesAddedThisLoop = 0;
        for (const char of v) {
            if (char == '-') {
                countEndDashes++;
                dashesAddedThisLoop++;
                if (countEndDashes == 3) {
                    // .slice removes the trailing '---' so that it's valid yaml
                    const yaml = metaData.slice(0, -(3 - dashesAddedThisLoop));
                    try {
                        return parse(yaml);
                    } catch (e) {
                        console.error('❌ Error parsing metadata', e);
                    }
                }
            } else {
                countEndDashes = 0;
            }
        }
        metaData += v;
    }
    return null;
}


[
    {
        description: 'Regular metadata',
        input: `---
tags:
    - tag1
    - tag2
publish: false
---
after metadata`,
        expected: {
            tags: ['tag1', 'tag2'],
            publish: false,
        }

    },
    {
        description: 'Test Dashes broken by character, note yaml is invalid so expected will be null',
        input: `---
    anything: one
    publish: false
    -x--
    not done yet
    ---`,
        expected: null

    },
    {
        description: 'Test Dashes broken by newline, note yaml is invalid so expected will be null',
        input: `---
    anything: one
    publish: false
    --
    -
    not done yet
    ---`,
        expected: null

    }
].map(test => {
    Deno.test(test.description, () => {
        const actual = extractMetadata(test.input)
        assertEquals(actual, test.expected);
    })
})