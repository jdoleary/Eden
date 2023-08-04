// function objectToHtmlList(obj: any): string {
//     return '';
// }
// [
//     [{
//         'chapter 1': ['a1', 'a2', {
//             'chapter 1 sub': ['aa1']
//         }],
//         'chapter 2': ['b1', 'b2']
//     }, 'name', 'a/name.html'],
// ].map(([relativePath, name, expectedPath]) => {

//     Deno.test(`pageNameToPagePath: ${relativePath},${name} -> ${expectedPath} `, () => {
//         const actual = pageNameToPagePath(relativePath, name);
//         const expected = expectedPath;
//         assertEquals(actual, expected);
//     });
// })