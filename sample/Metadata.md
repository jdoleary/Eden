---
test: metadata
tags:
  - journal
---
Metadata lives at the top of a markdown document and looks like this:
```yaml
tags:
 - journal
 - thoughts
anykey: anyvalue
---
```
Eden handles some reserved metadata keywords specially such as `publish` which determines if the file is outputted as html.  See [[Features]] for a list of which metadata features are currently implemented and which are coming soon.

Metadata is also available on the page in javascript at `window.metadata`. ^5c0e8d