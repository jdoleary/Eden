export const defaultHtmlTemplate = `<!DOCTYPE html>
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
</head>

<body>
    <main>
        <article>
            <div id="article-content">
                <nav>
                    {{breadcrumbs}}
                </nav>
                {{metadata:title}}
                {{metadata:subtitle}}
                <hr>
                <div id="article-metadata">
                    {{metadata:tags}}
                    <div>
                        <div>Planted {{created}}</div>
                        <div>Last tended {{modified}}</div>
                    </div>
                </div>
                {{content}}
            </div>
            <div id="article-footer">
                <div id="backlinks">
                    {{backlinks}}
                </div>
                {{pagination}}
            </div>
        </article>
        <footer>
        </footer>
    </main>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</body>

</html>`

export const defaultStyles = `
body {
    font-size: 18px;
}

h1 {
    font-size: 3.5em;
}

h2 {
    font-size: 1.55em;
}

h1,h2,h3 {
    margin:0;
}

p {
   /* Keep newlines just like obsidian does */ 
    white-space:pre-wrap;
}
body {
    background-color: #ffffff;
    font-family: 'Verdana', 'Helvetica', sans-serif;
    font-display: optional;
    margin: 0;
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
}

article {
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
}

ul {
    padding-left: 16px;
}

main {
    display: flex;
    flex-direction: column;
    /* Must be min-height so main can grow beyond 100vh if page is long like "Funnel_of_Control.html" */
    min-height: 100vh;
    align-items: center;
}

nav {
    display: flex;
    flex-wrap: wrap;
    text-decoration: none;
    padding-bottom: 1em;
}

nav>.center-dot {
    content: "·";
}

nav>.center-dot:last-child {
    content: "";
}


@media screen and (min-width: 1050px) {
    main {
        display: flex;
    }

    article {
        display: flex;
        flex-direction: column;
        /* Make the nextPrev buttons appear at the bottom */
        justify-content: space-between;
    }
}

.nav-item:first-child {
    padding-left:0;
}
.nav-item {
    padding:0 0.5em;
    /* allow the anchor tag to grow in size */
    display: block;
    text-decoration: none;
}

.nav-item:hover {
    transform: translateY(-2px);
}

.nav-item:active {
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
.pagination .nextPrevButtons:first-child {
    margin-left:0;
}
.pagination .nextPrevButtons:last-child {
    margin-right:0;
}

.pagination a {
    transition: 0.05s;
    display: block;
    margin: 0.5em;
    padding: 0.5em;
    border-radius: 4px;
    text-decoration: none;
    color: black;
    border: 1px solid black;

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
`