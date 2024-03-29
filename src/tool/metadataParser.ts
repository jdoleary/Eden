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

// Note: modifies fileContents to remove metadata string
export function extractMetadata(fileContents: string): { metadata: any | null, metadataCharacterCount: number } {
    const stringSearcher = searchInParts(fileContents);
    let hasMetaData = null;
    let countEndDashes = 0;
    let metadata = '';
    let charactersToRemove = 0;
    for (const v of stringSearcher) {
        charactersToRemove += v.length;
        if (hasMetaData == null) {
            if (v == '---') {
                hasMetaData = true;
                continue;
            } else {
                hasMetaData = false;
                // Do not keep looking for metadata
                return { metadata: null, metadataCharacterCount: 0 };
            }
        }
        let dashesAddedThisLoop = 0;
        for (const char of v) {
            if (char == '-') {
                countEndDashes++;
                dashesAddedThisLoop++;
                if (countEndDashes == 3) {
                    // .slice removes the trailing '---' so that it's valid yaml
                    const sliceAmount = -(3 - dashesAddedThisLoop);
                    const yaml = sliceAmount < 0 ? metadata.slice(0, sliceAmount) : metadata;
                    try {
                        charactersToRemove -= v.length - dashesAddedThisLoop;
                        return { metadata: parse(yaml), metadataCharacterCount: Math.max(0, charactersToRemove) };
                    } catch (e) {
                        if (Deno.env.get('MODE') !== 'test') {
                            console.error('❌ Error parsing metadata', e);
                        }
                    }
                }
            } else {
                countEndDashes = 0;
            }
        }
        metadata += v;
    }
    return { metadata: null, metadataCharacterCount: 0 };
}


[
    {
        description: 'Regular metadata',
        input: `---
tags:
    - tag1
    - tag2
hidden: true
---
after metadata`,
        expected: {
            tags: ['tag1', 'tag2'],
            hidden: true,
        }

    },
    {
        description: 'Test Dashes broken by character, note yaml is invalid so expected will be null',
        input: `---
    anything: one
    hidden: true
    -x--
    not done yet
    ---`,
        expected: null

    },
    {
        description: 'Test Dashes broken by newline, note yaml is invalid so expected will be null',
        input: `---
    anything: one
    hidden: true
    --
    -
    not done yet
    ---`,
        expected: null

    }
].map(test => {
    Deno.test(test.description, () => {
        const actual = extractMetadata(test.input)
        assertEquals(actual?.metadata, test.expected);
    })
});
[
    {
        description: 'Ensure following text after metadata is preserved',
        input: `---
test: metadata
tags:
  - journal
---
Metadata lives at the top of a markdown document and looks like this:
`,
        expected: `
Metadata lives at the top of a markdown document and looks like this:
`
    }
].map(test => {
    Deno.test(test.description, () => {
        const extractedInfo = extractMetadata(test.input)
        const actual = test.input.slice(extractedInfo.metadataCharacterCount);
        assertEquals(actual, test.expected);
    })
})