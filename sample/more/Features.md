- 🔲 🌀Block-based, content as data, so the same piece of content can easily be transcluded in multiple places
    - Adding in dynamically updated bits of content into other bits of content
    - https://subpixel.space/entries/open-transclude/
    - 🔑[Obsidian named block ids](https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link+to+a+block+in+a+note)
        - Note: Check that it works with ^652cd3
    - Implementation notes:
        - done: record Block existance in the Page object and convert them to html with an `class` link so it can be queried later
        - dom: After all pages have been created as html, use another pass with `deno-dom` to find all blocks store their HTML in garden
            - and give them html ids so they can be linked directly to
        - todo: actually loop all outputted html to run editDOM's processBlock.. on them
        - todo: Then pass again and replace blocks as needed
- ✅ Breadcrumbs
- ✅ Metadata Support
    - Tags
    - Created Date
    - Last Edited Date
- ✅ Future-proof: Exportable data, portable, control and own your data, no lock-in
- ✅ Highly Customizable HTML and CSS
    - ✅ Javascript is supported and is fully optional!
- ✅ Backlinks
- ✅ Support embeddable images
- ✅ Website icons next to external links (Like this: [Youtube](https://youtube.com))
- ✅ ️Built-in rss feed support (automatically creates `/rss.xml`)
- ✅ Metadata `publish`
- ✅ Metadata define custom `template`
- ✅ Metadata `type` like tags but singular.
- ✅ Metadata `tags` should link to index pages
- ✅ Index pages based on tags (example: [Maggie Appleton's Essays](https://maggieappleton.com/essays))
- 🔲 Custom Static Components (similar to shortcodes)
- 🔲 Site search
    - make entire garden available in json like [Maggie Appleton's Garden.json](https://maggieappleton.com/_next/data/yUhDOUNEYA1W3PsJNBhvU/garden.json) This will be necessary to support homepage
- 🔲 🔑⛰️Backlinks should include optional context snippets
- 🔲 🍎Metadata `thumbnail` for article for when it's displayed in an index page
- 🔲 Embeddable content
    - ✅ Embeddable Youtube Videos
    - 🔲⛰️Embeddable Tweets
- 🔲 🌀Ability to create different object types, ontologies, and tags
    - Example: https://www.gwern.net/About#confidence-tags
    - Example: Maggie Appleton's site, which has "Notes", "Essays", and "Patterns", among other collections of different objects
- 🔲 🍎Expandible/collapsible blocks
- ✅ [Support sizing images](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#External+images)
- 🔲 Navigation: Support for vertical and horizontal nav, primary and secondary, floating navbar, nested or expanded megamenu navigation
- 🔲 Sidenotes, in margin
    - https://www.gwern.net/Sidenotes
- 🔲 ⛰️Support syntax highlighting
- 🔲 ❓Serve as or integrate with a headless or component content management system
- 🔲 🌀Live link previews, infoboxes, and hover popups
- 🔲 ❓Print-ready, capable of being exported to EPUB or PDF
- 🔲 ⛰️Customizable header (like https://maggieappleton.com/) that works with transclusion.
- 🔲 ⛰️Annotation support (or compatible with social annotation plugins)
- 🔲 ⛰️Optimization: Optionally only process files that have changed to speed up compile time
- 🔲 ⛰️Template Footer: with social links and link to rss.xml
- 🔲 🍎[Link to a note using a metadata alias](https://help.obsidian.md/Linking+notes+and+files/Aliases#Link+to+a+note+using+an+alias)


```
*🍎: Low-hanging fruit (easy and fast to complete)
*⛰️: Medium Difficulty
*🌀: Complex (may take longer to implement)
*❓: Optional (unsure if this will be a final feature)
*🔑: Key feature
```

^f3edfd
