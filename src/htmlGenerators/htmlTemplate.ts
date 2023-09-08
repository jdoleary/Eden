export const defaultHtmlTemplatePage = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    {{title}}
    <!-- <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet"> -->
    <link rel="stylesheet" href="/styles.css">
    <script>
        window.metadata = {{ metadata }};
    </script>
    <!-- Optional script: converts any element with data-converttimeago to the format "X days/months/years ago" -->
    <script src="/timeAgo.js" defer></script>

</head>

<body class="{{pageType}}">
    <header>Header</header>
    <nav>
        <div id="nav-aligner">
            {{nav}}
        </div>
    </nav>
    <article>
        <div id="article-main">
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
            <div id="article-content">
                {{content}}
            </div>
        </div>
        <div id="article-footer">
            <div id="backlinks">
                {{backlinks}}
            </div>
        </div>
    </article>
    <aside>
    </aside>
    <footer>
    Footer
    </footer>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</body>

</html>`

export const defaultStyles = `
body {
    font-size: 18px;
    background-color: #ffffff;
    font-family: 'Verdana', 'Helvetica', sans-serif;
    font-display: optional;
    margin: 0;
    color:#313131;
}
/* Holy Grail Layout styling */
body {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr 3fr 1fr;
    height: 100vh;
}

header {
    grid-column: 1 / 4;
    background-color: #333;
    color: white;
}

nav {
    grid-row: 2;
    grid-column: 1;
}
#nav-aligner {
    /* Keep the nav right aligned */
    width:280px;
    margin-left:auto;
}

article {
    grid-row: 2;
    grid-column: 2;
    background-color: #f5f5f5;
}

aside {
    display:none;
    grid-row: 2;
    grid-column: 3;
}

@media screen and (min-width: 1050px) {
    aside {
        display:block;
    }
}

footer {
    grid-column: 1 / 4;
    background-color: #333;
    color: white;
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
}

article {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding:0 1em;
    background-color: #ffffff;
    max-width: 100%;
    width: 800px;
    height: 100%;
    box-sizing: border-box;
    /* So small pages will grow to full height */
    flex: 1;
}

/* Only show underline on hover like how google does it */
a:hover {
    text-decoration: underline;
}

a {
    text-decoration: none;
}

img {
    max-width: 100%;
    display:block;
    margin:0 auto;
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

.nextPrevButtons:hover {
    transform: translateY(-2px);
    box-shadow: 1px 1px 1px;
}

.nextPrevButtons:active {
    transform: translateY(1px);
    box-shadow: inset 1px 1px 1px;
}
.pageNumber {
    text-align: center;
}

.pageNumber a {
    cursor: pointer;
    border: none;
}
.responsive-iframe{
    aspect-ratio: 16/9;
    width:100%;
    height:100%;
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

details {
}

summary {
    font-weight: bold;
    cursor: pointer;
}

summary::-webkit-details-marker {
    color: #aaa;
}

details[open] {
}

details[open] summary {
}

nav ul {
    list-style-type: disc;
    padding-left: 20px;
    margin:0;
}

/* End Collapsable nav styling */
`