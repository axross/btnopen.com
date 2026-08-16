---
status: accepted
---

# Revert the code block floor since the platform minimum is 11px

2026-08-16-floor-the-code-block-at-11pt-on-coarse-pointers.md
floored the snippet viewer on touch devices to honour a platform minimum it read
as 14.667px. That reading was a unit error, and this record reverts the floor it
produced.

`high-fidelity-ui-design`'s `references/typography.md` requires body text
"never below the platform floor (11pt on mobile, with 17pt the iOS body
default)". Those are **Apple points**, where one point is one CSS pixel — not CSS
typographic points, where a point is 1/72 inch and 11pt converts to 14.667px. The
same document settles which unit it means in its own worked example, which sets
body text at **17px** while the rule beside it names **17pt** the iOS body
default. Under a CSS-point reading that example would be 22.7px and would
contradict the rule it illustrates; under the Apple reading the two agree
exactly. The parenthetical also cites Apple directly, whose point is one pixel at
standard scale.

The floor is therefore **11px**. The code block rendered 13.183px on a 390px
viewport before the floor was added — clearing the minimum by 2.18px. No MUST was
ever violated, and the finding that prompted the floor was mistaken rather than
addressed.

The floor was reverted rather than kept as conservatism because of what it cost.
It enlarged code on a phone, dropping the block from 45 monospace columns to 40,
in order to satisfy a constraint that does not bind. The defect this work exists
to fix is code reading too large, so a floor that makes phone code larger moves
against the change's own purpose. Keeping it was measured and put to the
maintainer with that cost stated, and declined; raising the block to 15px instead
was declined for the same reason, more strongly.

The same guideline's primary range — "roughly 15-25px of rendered height" — is
missed by the restored 13.183px, by the 14.062px the block rendered before any of
this work, and by the reverted floor's own 14.667px alike. It therefore separated
none of the options and decided nothing here. It is a soft range written for body
text rather than for a code block a reader scans, and this project's type scale
puts the block a tier below body copy deliberately, so it is recorded as a known
gap in the guidance rather than treated as a constraint this change had to meet.

The optical correction recorded in
2026-08-16-correct-the-two-code-surfaces-with-an-optical-scale-token.md
is untouched by the error and stays in force on both code surfaces. The
consequence of reverting is that the block renders one size at a given viewport
regardless of the input hardware attached, and no pointer-conditional type sizing
remains.
