import { DOMParser, Element, Node } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Garden } from "../sharedTypes.ts";

export function processBlockElementsWithID(html: string, garden: Garden): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) {
    return html;
  }

  const paragraphs = document.querySelectorAll("p");
  // In Obsidian blocks are paragraphs, so search all blocks,
  // find ones that end in a blockEmbedId, replace the element
  // with an ID'd element and add that block to the garden
  for (const p of paragraphs) {
    if (p.nodeType === Node.ELEMENT_NODE) {
      const blockEmbedIdRegex = /\s\^([\w\d]*)$/;
      const match = p.textContent.match(blockEmbedIdRegex);
      if (match) {
        // id is without "^" and leading space
        const id = match[1];
        if (id) {
          console.log((p as Element).innerHTML);
          const divWithId = document.createElement('div');
          divWithId.id = 'pageName' + id;
          let innerHTML = (p as Element).innerHTML;
          // Remove id tag
          innerHTML = innerHTML.replace(match[0], '');
          // Add the block to the garden
          garden.blocks[id] = innerHTML;
          // Replace the paragraph with an id'd div so that it can be linked to
          divWithId.innerHTML = innerHTML;
          (p as Element).replaceWith(divWithId);
        }
      }
    }
  }

  // Return the modified html
  return document?.documentElement?.outerHTML || html;
}