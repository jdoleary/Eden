import { DOMParser, Element, Node } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Garden, edenEmbed, embedPathDataKey } from "../sharedTypes.ts";

// Returns undefined if nothing changed
export function processBlockElementsWithID(html: string, pageName: string, garden: Garden): string | undefined {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) {
    return undefined;
  }
  let changedHTML = false;

  const nodes = document.querySelectorAll("*");
  // In Obsidian blocks are paragraphs, so search all blocks,
  // find ones that end in a blockEmbedId, replace the element
  // with an ID'd element and add that block to the garden
  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const blockEmbedIdRegex = /\^([\w\d]*)/;
      const match = node.textContent.match(blockEmbedIdRegex);
      if (match) {
        // id is without "^"
        const id = match[1];
        if (id) {
          changedHTML = true;
          const el = (node as Element);
          const divWithId = document.createElement('div');
          const blockId = pageName + '#^' + id
          divWithId.id = blockId;
          let innerHTML = el.innerHTML;
          // Remove id tag
          innerHTML = innerHTML.replace(match[0], '');
          if (innerHTML == '') {
            // Handle special case (tests/embedBlocksSource#^f3edfd) where
            // the block id is on it's own line and is referencing a previous code block
            innerHTML = el.previousElementSibling?.outerHTML || innerHTML;
          }
          // Add the block to the garden
          garden.blocks[blockId] = innerHTML;
          // Replace the paragraph with an id'd div so that it can be linked to
          divWithId.innerHTML = innerHTML;
          el.replaceWith(divWithId);
        }
      }
    }
  }
  if (!changedHTML) {
    return undefined;
  }

  // Return the modified html
  return document?.documentElement?.outerHTML || undefined;
}

// Returns undefined if nothing changed
export function embedBlocks(html: string, garden: Garden): string | undefined {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) {
    return undefined;
  }
  let changedHTML = false;
  const toReplaceWithEmbedBlocks = document.querySelectorAll("." + edenEmbed);
  for (const node of toReplaceWithEmbedBlocks) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      {
        const el = node as Element;
        // Note: .data isn't in deno-dom yet
        const embedId = el.attributes.getNamedItem(`data-${embedPathDataKey}`)?.value;
        console.log('jtest embedId', embedId);
        if (embedId) {
          const block = garden.blocks[embedId];
          if (block) {
            changedHTML = true;
            console.log('jtest block', block);
            const div = document.createElement('div');
            div.innerHTML = block;
            el.replaceWith(div);
          }
        }
      }
    }
  }
  if (!changedHTML) {
    return undefined;
  }

  // Return the modified html
  return document?.documentElement?.outerHTML || html;

}