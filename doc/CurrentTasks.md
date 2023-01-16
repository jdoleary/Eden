# Tasks
- Convert a directory of markdown files into a website of static html
- Support template headers
- Auto linking back to pages
- Spaced Repetition feature (this will move to a separate project as a browser extension)

## Breakdown
- Iterate all files in directory
    - DONE If their hash has changed or is missing, process it
    - Process:
        - DONE Create auto backlinks within stream
        - DONE Convert to html
        - DONE Embed inside of template header
        - Remove missing or moved files from out/