---
status: accepted
---

# Floor the code block at 11pt on coarse pointers

The optical correction recorded in
[2026-08-16-correct-the-two-code-surfaces-with-an-optical-scale-token.md](./2026-08-16-correct-the-two-code-surfaces-with-an-optical-scale-token.md)
left the code block below the 11pt (14.667px) platform minimum for body text on
a phone — 13.18px at a 390px viewport. The size before that correction was
already under the minimum, so the correction deepened a breach rather than
opening one, but it was the change that put the figure in front of a reviewer.
Honouring the floor was chosen over recording a deviation from it.

What made the floor's scope a decision rather than a detail is arithmetic.
`--text-sm` clamps at a maximum of `0.9375rem`, so the corrected block maxes at
14.0625px — under the floor at every viewport width there is. A floor written
without a gate therefore never acts as a floor; it acts as a constant, pinning
the block to 14.667px everywhere and leaving the optical correction nothing to do
on that surface. Three scopings were measured against the seeded post, counting
the monospace characters that fit before the block scrolls sideways:

| Scoping | 1440px | 1024px | 768px | 390px |
| --- | --- | --- | --- | --- |
| No floor | 14.06px / 80 | 13.71px / 83 | 13.50px / 50 | 13.18px / 45 |
| Every width | 14.67px / 77 | 14.67px / 78 | 14.67px / 46 | 14.67px / 40 |
| Below 50rem | 14.06px / 80 | 13.71px / 83 | 14.67px / 46 | 14.67px / 40 |
| Coarse pointer | 14.06px / 80 (fine) | 13.71px / 83 (fine) | 14.67px / 46 (coarse) | 14.67px / 40 (coarse) |

The last row is the only one a width does not determine on its own, so it is read
against the hardware typical at each width: the two desktop widths are shown on a
mouse and the two smaller ones on a touch screen. The same widths on the opposite
hardware take the other branch — which is the row's cost, stated below.

Flooring at **every width** was rejected on cost. It is the simplest declaration
— no conditional, no discontinuity, and the floor holds unconditionally — but it
drops the desktop reading column from 80 monospace characters to 77, handing back
the exact result the correction had just bought, and it is the scoping that makes
the correction inert for the block.

Flooring **below the 50rem desktop breakpoint** was rejected on coherence. It
keeps the 80-column desktop, but it floors 768px while leaving 1024px unfloored,
so code text *shrinks* by about a pixel as the window grows — and the 800–1024px
band sits under the floor without being floored, because a breakpoint drawn for
layout does not mark where legibility stops.

The floor is gated on a **coarse pointer** instead. 11pt is a platform minimum
for reading at arm's length on handheld hardware, so the input device is what the
rule was actually written about, and a viewport width is only ever a proxy for
it. That gate is also the only one of the three that keeps this repository's
existing rule that fine-pointer rendering never changes in order to reach a
coarse-pointer minimum.

The accepted cost is that one viewport width can now render the block at two
sizes depending on the hardware attached — 13.71px on a 1024px desktop against
14.667px on a 1024px tablet — which a width-based scoping would never produce. A
touchscreen laptop takes the floored size; that is the rule reading correctly
rather than an exception to it.

Inline code was left unfloored. A chip is not independently sized body text but a
run set inside a sentence, and its purpose is to sit optically level with that
sentence, so a floor would restore on small containers exactly the oversizing the
correction exists to remove.

This narrows the earlier record rather than replacing it: the optical correction
still governs both code surfaces, and the block still renders at 14.06px in 80
columns wherever a mouse is driving it.
