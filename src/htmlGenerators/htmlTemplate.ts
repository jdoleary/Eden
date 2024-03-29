import { Config } from "../sharedTypes.ts"

export const defaultHtmlTemplatePage = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    {{title}}
    <!-- <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet"> -->
    <link rel="stylesheet" href="/eden.css">
    <script>
        window.metadata = {{ metadata }};
    </script>
    <!-- Optional script: converts any element with data-converttimeago to the format "X days/months/years ago" -->
    <script src="/timeAgo.js" defer></script>
    {{head:extra}}

</head>

<body class="{{pageType}}">
    <header>
    </header>
    <div id="article-header" class="{{article-header-css}}">
        <div id="breadcrumbs">
            {{breadcrumbs}}
        </div>
        {{metadata:title}}
        {{metadata:subtitle}}
        <hr>
        <div id="article-metadata">
            {{metadata:tags}}
            <div class="gray right-align">
                <div>Created {{created}}</div>
                <div>Updated {{modified}}</div>
            </div>
        </div>
    </div>
    <nav>
        {{nav}}
    </nav>
    <article class="{{metadata:cssclasses}}">
        <div id="article-main">
            <div id="article-content">
                {{content}}
            </div>
        </div>
        <div id="article-footer">
            <div id="backlinks">
                {{backlinks}}
            </div>
            {{pagination}}
        </div>
    </article>
    <aside>
    </aside>
    <footer>
        {{footer}}
        <a href="https://www.edenmarkdown.com">
            <div class="made-with">
            <div class="eden-logo"></div>
                Powered by Eden
            </div>
        </a>
    </footer>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</body>

</html>`

export const defaultStyles = (config: Config) => `
/*Colors from https://www.realtimecolors.com/ */
:root {
    /* Green */
    /*
    --text: #101e16;
    --background: #f8fcfa;
    --primary: #284d38;
    --secondary: #cde5d7;
    --accent: #4e976d;
    */
    /* Blue and Tan */
    --text: #19120b;
    --background: #fcfaf8;
    --primary: #345474;
    --secondary: #dfccb9;
    --accent: #597b9d;
}

body {
    font-size: 18px;
    font-family: 'Verdana', 'Helvetica', sans-serif;
    font-display: optional;
    /* body should have a margin on mobile so text isn't squished up againt the side*/
    margin: 1em;
    color: var(--text);
    /* Easier on the eyes for reading */
    line-height:1.6em;
}
/* Holy Grail Layout styling */
body {
    height: 100vh;
}

header {
    grid-row: 1;
    /* Align the column with the article */
    grid-column: 2;
    margin-bottom: 1em;
}
header a {
  color: black;
}
h1, h2, h3, h4 {
    color: var(--primary);
}
hr {
    height:0.3em;
    border: var(--primary);
    background-color: var(--primary);
    /* For spacing for homepage */
    margin:0.5em 0 1em 0;
}
.color-accent {
    color: var(--accent);
}
.primary {
    padding: 0.5em 1em;
    background-color: var(--primary);
    color: var(--background);
    border-radius: 4px;
    transition: 0.1s;
}
.secondary {
    padding: 0.5em 1em;
    background-color: var(--secondary);
    color: var(--text);
    border-radius: 4px;
    transition: 0.1s;
}

.primary:hover, .secondary:hover {
    transform: translateY(-2px);
}
header a:hover {
  text-decoration: none; /* no underline */
  color: var(--primary);
}
#article-header {
    grid-row: 2;
    grid-column: 2;
}

#article-header.hide-title {
    height:0;
    visibility:hidden;
}

nav {
    display:none;
    grid-row: 3;
    grid-column: 1;
}
.type-page #nav-aligner {
    /* Align with top of page content */
    padding-top:1em;
}
#nav-aligner {
    /* Sticky side nav */
    position:sticky;
    top:0;

    padding-top:0;
    padding-right:1em;
    padding-left:1em;
    /* Keep the nav right aligned */
    width:280px;
    /*Ensure that the width isn't larger due to padding so that
    the media queries that need to take it's width into account are accurate*/
    box-sizing: border-box;
    margin-left:auto;
}
/* min width is the 800 of the article + the 280 of the nav aligner*/
@media screen and (min-width: 1080px) {
    nav {
        display: block;
    }
    nav:empty {
        display:none;
    }
    article {
        max-width: 100%;
        width: 800px;
    }
    body {
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        grid-template-columns: 1fr 800px 1fr;
        gap: 1em;
        margin:0;
    }
}
@media screen and (min-width: 1180px) {
    #nav-aligner {
        width:380px;
    }
}

article {
    grid-row: 3;
    grid-column: 2;
    background-color: #f5f5f5;
    display: flex;
    flex-direction: column;
    /* justify-content:space-between keeps the article footer at the bottom of the screen even if the content doesn't
    fill the whole screen. */
    justify-content:space-between;
    margin-bottom: 1em;
    background-color: #ffffff;
    width:100%;
    box-sizing: border-box;
    /* So small pages will grow to full height */
    flex: 1;
}

aside {
    display:none;
    grid-row: 3;
    grid-column: 3;
}

@media screen and (min-width: 1050px) {
    aside {
        display:block;
    }
}
nav summary {
    color:#777;
}
nav summary:hover {
    color:#333;
}
nav a {
    color:#999;
}
nav a:hover {
    text-decoration: none; /* no underline */
    color: var(--primary);
}

footer {
    grid-column: 2;
    padding: 0 1em 4em 1em;
}
/* End holy grail layout*/

h1 {
    font-size: 2.5em;
}

h2 {
    font-size: 1.45em;
}

h1,h2,h3 {
    margin:0;
}

p {
   /* Keep newlines just like obsidian does */ 
    white-space:pre-wrap;
}

/* directory index pages shouldn't show article metadata */
body.type-directory #article-metadata {
    display: none;
}
.gray {
    color:gray;
}
.right-align {
    text-align:right;
}
.article-footer {
    background-color: #ffffff;
    padding: 3em;
    box-sizing: border-box;
}

#backlinks {
    margin:3em 0;
}
.inline-icon {
    height:16px;
    padding-right:0.3em;
    /* This must be declared explicitly because imgs default to centered and this needs
    to be inline*/
    display:inline;
    vertical-align:middle;
}


/* Instead of underline, just change color */
a:hover {
    color: var(--primary);
}

a {
    color: var(--accent);
    text-decoration: none;
    /* Ensure long links wont cause the page to allow for horizontal scrolling on small screens
    which ruins the reading experience */
    word-break: break-all;
}

img {
    max-width: 100%;
    display:block;
    /* margin:0 auto; */
}

ul {
    padding-left: 16px;
}

#breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    text-decoration: none;
    padding-bottom: 1em;
}

#breadcrumbs>.center-dot {
    content: "·";
}

#breadcrumbs>.center-dot:last-child {
    content: "";
}


.breadcrumbs-item:first-child {
    padding-left:0;
}
.breadcrumbs-item {
    padding:0 0.5em;
    /* allow the anchor tag to grow in size */
    display: block;
    text-decoration: none;
}

.breadcrumbs-item:hover {
    transform: translateY(-2px);
}

.breadcrumbs-item:active {
    transform: translateY(1px);
}

.flex {
    display: flex;
}

.space-between {
    justify-content: space-between;
}

.article-footer {
    flex-direction:column;
    position: sticky;
    width: 100%;
    bottom: 0;
    /* Same as article */
    padding-bottom: 2em;
    /* Same as article */
    background-color: #ffffff;
    max-width: 800px;
    box-shadow: 0 -1px 0.9px;
}
.pagination .nextPrevButtons:first-child {
    margin-left:0;
}
.pagination .nextPrevButtons:last-child {
    margin-right:0;
}

.pagination a {
    display: block;

}

.hidden {
    visibility: hidden;
}

.nextPrevButtons {
    /* So that they are the same size and pageNumber will always be centered */
    flex: 1;
}

.nextPrevButtons:last-child {
    text-align: right;
}

.pageNumber {
    text-align: center;
    margin: 0 2em;
    /* match nextPrevButtons */
    padding: 0.5em 2em;
}

.pageNumber a {
    cursor: pointer;
    border: none;
}
.responsive-iframe{
    aspect-ratio: 16/9;
    width:100%;
}
#article-tags {
    display:flex;
    gap:1em;
}
#article-metadata {
    display:flex;
    justify-content:space-between;
}
.embed-block {
    border-left: 0.2em solid grey;
    padding-left: 1em;
}
.feint-link {
    opacity:0.2;
    color:black;
    font-size:0.7em;
}
/* Collapsable nav styling */
.eden-logo {
    background-image: url(data:image/png;base64,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);
    background-size:contain;
    background-repeat: no-repeat;
    height:1em;
    aspect-ratio: 1/1;
}
.made-with {
    display: flex;
    justify-content: center;
    align-items: center;
}

details {
}

summary {
    list-style-type: '▸ ';
    cursor: pointer;
}
nav {
    list-style-type: none;
}

summary::-webkit-details-marker {
    color: #aaa;
}

details[open] {
}

details[open] > summary {
    list-style-type: '▾ ';
}

nav ul {
    list-style-type: none;
    padding-left: 1em;
    margin:0;
}
#nav-aligner > ul {
    /* Top level files shouldn't have any left padding */
    padding-left:0;
}
nav li a.currentPage {
    color: var(--primary);
    opacity:0.7;
}
nav li a.currentPage:hover {
    opacity:1.0;
}

/* End Collapsable nav styling */
body.type-homepage #article-header {
    /* Cannot be display:none or else it will mess up the grid, so just hide it via visibility and height*/
    visibility:hidden;
    height:0;
    margin:0;
    padding:0;
}
body.type-homepage h4 {
    /* Make sure the first h4 aligns with the <nav>*/
    margin-top:0;
}

/* 
Special checkboxes ("- [x]" and "- [ ]") shouldn't have preceeding bullet
points in order to match obsidian
*/
li.task-list-item {
    list-style-type:none;
    /* Left align where the bullet point was */
    margin-left:-1em;
}
li.task-list-item ul {
    /* Left align indented from the parent checkbox */
    margin-left:1em;
}
/* End Special checkbox styling */

blockquote {
    border-left:4px solid var(--accent);
    padding:1em;
    margin:0;
}
/* Start of Callout styling */
/* ref: https://help.obsidian.md/Editing+and+formatting/Callouts */
.callout {
    border-radius:4px;
    padding:1em;
}
blockquote.callout {
    /* Override default blockquote styling */
    margin: 0;
    border:0;
}
.callout-title-inner {
    margin-bottom: 1em; /* Match .callout padding */
}
.callout[data-callout="info"],
.callout[data-callout="todo"] {
    background-color: #e5f0fc;
}
.callout[data-callout="info"] > .callout-title,
.callout[data-callout="todo"] > .callout-title {
    color: #086ddd;
}

.callout[data-callout="tip"],
.callout[data-callout="hint"],
.callout[data-callout="important"] {
    background-color: #e5f9f8;
}
.callout[data-callout="tip"] > .callout-title,
.callout[data-callout="hint"] > .callout-title,
.callout[data-callout="important"] > .callout-title {
    color: #00bfbc;
}

.callout[data-callout="success"],
.callout[data-callout="check"],
.callout[data-callout="done"] {
    background-color: #e5f8ed;
}
.callout[data-callout="success"] > .callout-title,
.callout[data-callout="check"] > .callout-title,
.callout[data-callout="done"] > .callout-title {
    color: #08b94e;
}

.callout[data-callout="question"],
.callout[data-callout="help"],
.callout[data-callout="faq"],
.callout[data-callout="warning"],
.callout[data-callout="caution"],
.callout[data-callout="attention"] {
    background-color: #fdf1e5;
}
.callout[data-callout="question"] > .callout-title,
.callout[data-callout="help"] > .callout-title,
.callout[data-callout="faq"] > .callout-title,
.callout[data-callout="warning"] > .callout-title,
.callout[data-callout="caution"] > .callout-title,
.callout[data-callout="attention"] > .callout-title {
    color: #ec7500;
}

.callout[data-callout="failure"],
.callout[data-callout="fail"],
.callout[data-callout="missing"],
.callout[data-callout="danger"],
.callout[data-callout="error"],
.callout[data-callout="bug"] {
    background-color: #fdeaec;
}
.callout[data-callout="failure"] > .callout-title,
.callout[data-callout="fail"] > .callout-title,
.callout[data-callout="missing"] > .callout-title,
.callout[data-callout="danger"] > .callout-title,
.callout[data-callout="error"] > .callout-title,
.callout[data-callout="bug"] > .callout-title {
    color: #e93046;
}

.callout[data-callout="example"] {
    background-color: #d5d2e0;
}
.callout[data-callout="example"] > .callout-title{
    color: #7852ee;
}

.callout[data-callout="quote"],
.callout[data-callout="cite"] {
    background-color: #f5f5f5;
}
.callout[data-callout="quote"] > .callout-title,
.callout[data-callout="cite"] > .callout-title {
    color: #9e9e9e;
}
/* End of Callout styling */

table {
    border-collapse: collapse;
    width: 100%;
}

/* Styling for table header */
th {
    text-align: left;
    padding: 12px;
}

/* Styling for table rows */
tr:nth-child(even) {
    background-color: #f2f2f2; /* Light gray for even rows */
}

tr:hover {
    background-color: #ddd; /* Lighter gray for hover effect */
}

/* Styling for table cells */
td {
    padding: 12px;
    border-bottom: 1px solid #ddd; /* Subtle border for each cell */
}

/* Styling for table head cells */
th, td {
    text-align: left;
    padding: 8px;
}

/* Responsive table */
@media screen and (max-width: 600px) {
    table, thead, tbody, th, td, tr {
        display: block;
    }

    th, td {
        width: auto;
    }

    th {
        display:none;
    }

    tr { border: 1px solid #ccc; }

    td {
        border: none;
        border-bottom: 1px solid #eee;
    }
}
`

