---
status: accepted
---

# Correct the two code surfaces with an optical-scale token

The site's one type scale, `--text-xs` through `--text-4xl`, was tuned on IBM
Plex Sans, and both surfaces that render code read off it uncorrected. The two
families do not share metrics: measured per em in the running build, JetBrains
Mono has an x-height of 0.5625 against IBM Plex Sans's 0.5313. The code block
took a single step down to `--text-sm`, which under-compensated for that
difference, and inline code took no step at all — it switched family and kept the
prose size whole, so a chip rendered visibly larger than the sentence it
interrupted.

The correction chosen is `0.9375`, the nearest sixteenth to the measured 0.9444
x-height ratio, applied to both code surfaces through a
`--font-mono-optical-scale` token declared beside `--font-mono` in the theme
file. Routing it through a token rather than repeating the literal is what lets
the two surfaces state the same intent and lets a later reader find every carrier
of the correction in one search.

`font-size-adjust: 0.5313` was the principled alternative and the first one
considered, because the browser derives the correction from the font's own
metrics and would stay right if the family were ever swapped. It was rejected on
support. It reached Baseline in 2024 — Chrome and Edge 127, Firefox 118,
Safari 17 — but Samsung Internet still does not implement it, leaving roughly 88%
global support, so about one reader's browser in eight would ignore the
declaration and silently keep the uncorrected rendering. A fix that disappears on
a subset of readers is worse than a deterministic one, and because the font is
pinned in `fonts.ts` the automatic-correctness benefit it buys is small.

Adding a `--text-code` tier to the scale was rejected because it fixes only half
the problem. The block would read cleanly at the call site, but an inline chip
appears inside headings, list items, blockquotes, and table cells, so it needs an
`em`-relative value to track its container; a fixed tier cannot follow the
context. The tier would have bought one of the two surfaces and added a step to
the scale for it. A ratio is also not a size, so the token that did land is a
different kind of thing rather than that tier under another name.

Widening the reading column was rejected as the third option. It would have kept
code at its existing size and given desktop the most columns of any option, but
it leaves the worst case — a phone, at 42 columns — untouched, and it would make
code blocks wider than the prose they sit among.

The accepted consequence is that the block moves from 15px to 14.06px at a
1440px viewport, which lands the reading column on exactly 80 monospace
characters, up from 75.
