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
        <nav>
            {{breadcrumbs}}
        </nav>
        <article>
            <!-- Created {{created}}
            Modified {{modified}} -->
            {{content}}
        </article>
    </main>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</body>

</html>`

export const defaultStyles = `body {
    background-color: #393939;
    font-family: 'Verdana', 'Helvetica', sans-serif;
    font-display: optional;
    margin: 0;
}

article {
    background-color: #fffefe;
    padding: 3em;
    /* For footer so text doesn't show below them */
    padding-bottom: 0;
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

article h1 {
    margin-top: 0;
    border-bottom: 1px solid black;
    text-align: center;
    padding-bottom: 0.5em;
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
    color: white;
    text-decoration: none;
}

nav>.center-dot {
    content: "·";
    padding: 16px;
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

.nav-item {
    padding: 16px;
    /* allow the anchor tag to grow in size */
    display: block;
    text-decoration: none;
    color: white;
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

.footer {
    position: sticky;
    width: 100%;
    bottom: 0;
    /* Same as article */
    padding-bottom: 2em;
    /* Same as article */
    background-color: #fffefe;
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

.footer .nextPrevButtons:hover {
    transform: translateY(-2px);
    box-shadow: 1px 1px 1px;
}

.footer .nextPrevButtons:active {
    transform: translateY(1px);
    box-shadow: inset 1px 1px 1px;
}

.footer a {
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
}`