---
tags:
  - test
---
- Leading Character Case insensitive backlink: [[features]]

- [[features]] Multiple backlinks in a single line: [[features]] [[Images]] [[summary]] [[features]] [[featuresnomatch]] [[nomatchfeatures]]
- Auto backlink: Features
- (Not Supported) Case insentitive auto backlink: features 
- (Not Supported) Non-leading character case insentitive backlink: [[feaTUres]] 

{/* ### Commented out content */}

Invalid Backlink testing
[[Multi space_backlink]]
[[^]]
[[#]]
[[[]]
[[]]]
[[*]
[["]]
[[/]]
[[\]]
[[<]]
[[>]]
[[
]]
[[:]]
[[|]]
[[?]]
[[$%!@&()]]


Test embed youtube (both types of link):
![](https://youtu.be/aFBp0cZ79bQ?si=rdrrNxhVlJWzHpVw)
![](https://www.youtube.com/watch?v=aFBp0cZ79bQ)
Embeddable Twitter:
![](https://x.com/Kamulch_Art/status/1701131095805452583?s=23)

Test custom xml tags:
<AssumedAudience>
  This is a test for embedding custom tags
</AssumedAudience>
<br>
SVG:
<svg width="391" height="391" viewBox="-70.5 -70.5 391 391" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect fill="#fff" stroke="#000" x="-70" y="-70" width="390" height="390"/>
  <g opacity="0.8">
    <rect x="25" y="25" width="200" height="200" fill="lime" stroke-width="4" stroke="pink" />
    <circle cx="125" cy="125" r="75" fill="orange" />
    <polyline points="50,150 50,200 200,200 200,100" stroke="red" stroke-width="4" fill="none" />
    <line x1="50" y1="50" x2="200" y2="200" stroke="blue" stroke-width="4" />
  </g>
</svg>
<br>

Test HTML embedding from https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Basics
<table>
  <tr>
    <td>&nbsp;</td>
    <td>Knocky</td>
    <td>Flor</td>
    <td>Ella</td>
    <td>Juan</td>
  </tr>
  <tr>
    <td>Breed</td>
    <td>Jack Russell</td>
    <td>Poodle</td>
    <td>Streetdog</td>
    <td>Cocker Spaniel</td>
  </tr>
  <tr>
    <td>Age</td>
    <td>16</td>
    <td>9</td>
    <td>10</td>
    <td>5</td>
  </tr>
  <tr>
    <td>Owner</td>
    <td>Mother-in-law</td>
    <td>Me</td>
    <td>Me</td>
    <td>Sister-in-law</td>
  </tr>
  <tr>
    <td>Eating Habits</td>
    <td>Eats everyone's leftovers</td>
    <td>Nibbles at food</td>
    <td>Hearty eater</td>
    <td>Will eat till he explodes</td>
  </tr>
</table>

Regular image md syntax
![|80](bumblebee-at-root.gif)

Auto import into obsidian
![[bumblebee-at-root.gif]]

![|80](bumblebee.gif)
Test external image
![alt text|80](https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Grosser_Panda.JPG/1200px-Grosser_Panda.JPG "Panda Title")