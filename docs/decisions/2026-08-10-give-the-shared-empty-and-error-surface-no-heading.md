---
status: accepted
---

# Give the shared empty and error surface no heading

Until this change the site had exactly one surface for having nothing to show:
the not-found page, with a code-syntax heading, a glitched status number, and a
single escape hatch. The visual-identity specification generalized the heading
half of that into a rule for "error and empty-state headings", which at the time
described a category with one member.

Building a genuine empty and error surface tested that generalization for the
first time. Three designs were put to @axross, and the one chosen is the
quietest: a single muted line, no heading, no decorative glyph, and a text-link
retry only where retrying can succeed. The surface serves both an empty list and
a failed render, so both inherit it.

No heading is right for these two states in a way it is not for a 404. An empty
list sits inside a region the page has already titled, so a heading there would
be the second one in the same region and would announce an absence more loudly
than the content it stands in for. A failed render is a transient fault on a
route the reader reached correctly, not a destination that does not exist, and
the glitched-status treatment would overstate it as much as the heading would.

That left a conflict with the written rule, and the rule is what changed. The
specification's sentence was written for the not-found surface before this one
existed and generalized from a sample of one, whereas the design selection was an
explicit human decision made with the alternatives in front of it. Both
specification documents now scope the code-syntax voice to a not-found heading
and record that this surface has none.

The alternative was to conform the surface to the specification by giving it a
code-syntax heading — `posts.length === 0` over an empty list, something similar
over a failure. It was rejected because it would make the quietest surface on the
site the loudest thing in its container, and would have preserved a rule at the
cost of the design it was being applied to.

A heading is therefore not to be added back to this surface without revisiting
this record. The component's own doc comment says so too, so the constraint
survives a reader who reaches the code without the documentation.
