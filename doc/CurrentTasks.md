# Tasks
- Convert a directory of markdown files into a website of static html
- Support template headers
- Auto linking back to pages
- Spaced Repetition feature

## Breakdown
- Iterate all files in directory
    - If their hash has changed or is missing, process it
    - Process:
        - Create auto backlinks within stream
        - Convert to html
        - Embed inside of template header