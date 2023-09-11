## Eden Features
- ✅ Breadcrumbs
- ✅ Metadata Support ^9d270c
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
- ✅ Metadata `hidden`: prevents publishing the page
- ✅ Metadata define custom `template`
- ✅ Metadata `type` like tags but singular.
- ✅ Metadata `tags` should link to index pages
- ✅ Index pages based on tags (example: [Maggie Appleton's Essays](https://maggieappleton.com/essays))
- ✅ [Support sizing images](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#External+images)
- ✅ Navigation: Support for vertical and horizontal nav depending on screen size.  Collapsable sections
- ✅ 🔑Block Embedding
    - Block-based, content as data, so the same piece of content can easily be transcluded in multiple places
        - Adding in dynamically updated bits of content into other bits of content
        - https://subpixel.space/entries/open-transclude/
        - 🔑[Obsidian named block ids](https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link+to+a+block+in+a+note)
- 🔲 Site search
    - ✅ make entire garden available in json at /garden.json for advanced usage 
- 🔲 🔑⛰️Backlinks should include optional context snippets
- 🔲 🍎Metadata `thumbnail` for article for when it's displayed in an index page
- 🔲 Embeddable content
    - ✅ Embeddable Youtube Videos
    - ✅ Embeddable Vimeo Videos
    - 🔲⛰️Embeddable Tweets
- 🔲 🌀Ability to create different object types, ontologies, and tags
    - Example: https://www.gwern.net/About#confidence-tags
    - Example: Maggie Appleton's site, which has "Notes", "Essays", and "Patterns", among other collections of different objects
- 🔲 🍎Expandible/collapsible blocks
- 🔲 ⛰️Support syntax highlighting
- 🔲 ❓Print-ready, capable of being exported to EPUB or PDF
- 🔲 ⛰️Customizable header (like https://maggieappleton.com/) that works with transclusion.
- 🔲 ⛰️Optimization: Optionally only process files that have changed to speed up compile time
- 🔲 ⛰️Template Footer: with social links
    - ✅ link to rss.xml
- 🔲 🍎[Link to a note using a metadata alias](https://help.obsidian.md/Linking+notes+and+files/Aliases#Link+to+a+note+using+an+alias)

### Obsidian Flavored Markdown Support
| Completed | Syntax | Feature Name | Note |
| --------- | ------- | ------------ | --- |
| ✅ |`[[Link]]` | Internal links | |
| ✅ |`![[Link]]` | Embedding files | |
| ✅ |`![[image.png]]` | Embedding image | |
| ✅ |`![[Link#^id]]` | Block references | |
| ✅ |`^id` | Defining a block | |
| 🔲 |`%%Text%%` | Comments | |
| ✅ |`~~Text~~` | Strikethroughs | |
| ✅ |`==Text==` | Highlights | https://github.com/markdown-it/markdown-it-mark |
| ⏳ |` ``` ` | Code blocks | Missing syntax highlighting |
| ✅ |`- [ ]` | Incomplete task | Note: Use input checkbox for this; https://github.com/revin/markdown-it-task-lists/blob/master/index.js|
| ✅ |`- [x]` | Completed task | |
| ⏳ |`> [!note]` | Callouts | Missing special styling |

### Advanced Potential Features
- 🔲 ❓Serve as or integrate with a headless or component content management system
- 🔲 🌀Live link previews, infoboxes, and hover popups
- 🔲 Sidenotes, in margin
    - https://www.gwern.net/Sidenotes
- 🔲 Custom Static Components (similar to shortcodes)
- 🔲 ⛰️Annotation support (or compatible with social annotation plugins)

```
*🍎: Low-hanging fruit (easy and fast to complete)
*⛰️: Medium Difficulty
*🌀: Complex (may take longer to implement)
*❓: Optional (unsure if this will be a final feature)
*🔑: Key feature
*⏳ : Partially Complete
```

^f3edfd
