# Low-Fidelity Wireframe & Breadboard Design — Structure, Hierarchy & Content

Information architecture, hierarchy, grouping, and using real content at breadboard fidelity.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the guideline bullets are the normative takeaways, and the MUST/SHOULD rules in `SKILL.md` remain authoritative.

## Establish information architecture and hierarchy before anything else

Information architecture is the decision layer that a wireframe exists to test, so resolve it before you place a single box: list every piece of content a screen must carry, rank it by importance to the user's task, and cluster the items into a handful of regions before choosing any layout. Grouping is what makes ranking legible — increase whitespace between unrelated groups and tighten it between a heading and the content it labels, using a container (border or fill block) only when spacing alone cannot separate two clusters (Gestalt proximity and common-region). Commit to a grid so those regions have consistent edges and rhythm; a grid is what keeps a low-fidelity sketch from reading as noise even without color or real type.

Encode the ranking through the two channels that survive a grayscale wireframe: size and position. Cap the scale to about three steps — small, medium, large — and allow at most two genuinely dominant (large) elements per screen, otherwise nothing leads. Reinforce with placement: readers scan top-left first and sweep in an F- or Z-pattern, so the highest-priority item and the primary action belong where the eye lands, not wherever space remains. Because you are deliberately withholding brand color and final typography, these structural cues are the entire hierarchy; if the ranking is not visible in the boxes, it does not exist yet.

Validate the result with the squint or blur test, which is the discipline's built-in check precisely because it removes detail. Step back and defocus, or apply a Gaussian blur of roughly 5–10px: whatever remains prominent when the labels dissolve is what a real user perceives first, and it should match your intended priority order. If a secondary block or an image placeholder dominates while the primary action recedes, the architecture is wrong — fix the grouping, size, or position, not the polish. The common failure mode is skipping straight to arranging components on the canvas and letting available space, decoration, or the largest content asset dictate emphasis, which produces a screen where everything competes and the user's actual next step is buried.

**Good Example:**

> A checkout screen lists order-summary, shipping form, and "Place order" as its three content blocks; the designer ranks the action highest, gives it the single largest box at the bottom-anchored primary position, groups the form fields tightly under one header, and confirms via the blur test that the button is the first thing still visible.

**Bad Example:**

> A designer opens the canvas and drops in nav, hero image, five equal cards, and a CTA at whatever sizes fill the grid; blurred, the hero image placeholder dominates and the CTA vanishes, because emphasis was decided by leftover space rather than content priority.

**Guidelines:**

- MUST rank every content item by task priority and cluster the items into a handful of regions before placing any box or choosing a layout.
- MUST encode ranking through size and position only, capping the scale to about three steps and allowing at most two large elements per screen.
- MUST anchor the highest-priority item and the primary action where the F- or Z-scan lands, not in whatever space remains.
- MUST validate the layout with the squint or 5-to-10px blur test and fix the grouping, size, or position whenever the wrong element dominates.

Sources: [Visual Hierarchy in UX: Definition — Nielsen Norman Group](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) · [What is Visual Hierarchy? — Interaction Design Foundation (IxDF)](https://ixdf.org/literature/topics/visual-hierarchy) · [What is Wireframing? — Interaction Design Foundation (IxDF)](https://ixdf.org/literature/topics/wireframing) · [Creating Content Wireframes For Responsive Design — Smashing Magazine](https://www.smashingmagazine.com/2016/02/create-content-wireframes-for-responsive-design/) · [Debug your visual hierarchy with the squint test — Polypane](https://polypane.app/blog/debug-your-visual-hierarchy-with-the-squint-test/)

## Group with spacing first, and add enclosures only when spacing fails

In wireframes the strongest grouping cue is empty space, not lines or fills. The Gestalt law of proximity says elements read as a set when they sit closer to each other than to their neighbors, so the reliable move is to make inner spacing (gap within a group) meaningfully smaller than outer spacing (gap between groups) — a common working target is roughly a 1:2 or greater ratio, e.g. 8px between a label and its field but 24px to the next field group. Get that contrast right and the eye parses the regions with zero decoration, which is exactly what a low-fidelity mock wants: the reviewer judges structure, not chrome. Because a wireframe deliberately strips color and type, spacing is also one of the few grouping signals still available to you, so spend your attention there before anything else.

Reach for common region — a shared border or background that encloses the group — only as the fallback when spacing genuinely cannot do the job. Nielsen Norman Group frames it the same way: a boundary is a strong cue that overpowers proximity and similarity, which is why it is the right tool when you must hold several different element types together, when the surrounding layout won't let you open up enough whitespace, or when near-but-unrelated items would otherwise merge. The test to apply before drawing a box is literally "can I communicate this grouping by adding or removing whitespace instead?" If yes, don't draw the box.

The common failure mode is over-segmentation: wrapping every cluster in its own card or rule until the screen becomes a stack of nested containers. This adds visual complexity, competes for the hierarchy you were trying to establish, and — with full-width horizontal borders especially — creates "false floors" that read as the end of content and suppress scrolling. In a wireframe it also lies about fidelity, implying card components and elevation decisions that haven't been made yet. Default to whitespace, escalate to a single enclosure only where it earns its place, and never nest a bordered group inside another bordered group when a gap would have separated them.

**Good Example:**

> A settings form separates "Account", "Notifications", and "Privacy" purely with a larger gap between sections than between the rows inside each — no dividers, no cards — and the three groups are instantly legible in grayscale.

**Bad Example:**

> Every section of that same form is wrapped in its own bordered card, and inside each card each row gets its own inset box, producing a cluttered nest of rectangles where full-width borders read as page endings and stop the eye from scrolling.

**Guidelines:**

- MUST size inner spacing within a group at half or less of the outer spacing to its neighbors, so proximity alone parses the regions.
- MUST verify each grouping reads in grayscale from spacing before adding any border, background, or divider.
- SHOULD reserve a shared enclosure for cases where whitespace cannot separate the group — mixed element types, layout that forbids enough gap, or near-but-unrelated items that would otherwise merge.
- MUST NOT nest a bordered group inside another bordered group when a gap would separate them, and MUST NOT span full-width horizontal borders that read as page-ending false floors.

Sources: [Proximity Principle in Visual Design — Nielsen Norman Group](https://www.nngroup.com/articles/gestalt-proximity/) · [The Principle of Common Region: Containers Create Groupings — Nielsen Norman Group](https://www.nngroup.com/articles/common-region/) · [Law of Common Region — Laws of UX (Jon Yablonski)](https://lawsofux.com/law-of-common-region/) · [Similarity Principle in Visual Design — Nielsen Norman Group](https://www.nngroup.com/articles/gestalt-similarity/) · [Visual Hierarchy in UX: Definition — Nielsen Norman Group](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)

## Breadboard flows with words when the layout is not the problem

Breadboarding, from Shape Up's chapter on finding the elements, exists because most disagreements a team has early on are about topology and sequence — what places exist, what a user can do in each, and where each action leads — not about where a button sits on screen. Capturing those as three text primitives keeps the discussion on that substance. Places are the screens, dialogs, or menus a user can be in (write them as underlined headings). Affordances are the things a user acts on inside a place — buttons, fields, or specific pieces of copy (list them under the place). Connection lines are arrows showing which affordance moves the user to which place. Everything is words and arrows on purpose: "the important things are the components we're identifying and their connections," and words are cheap enough that nobody gets attached to a layout they then defend past its usefulness.

The mechanism matters more than the notation. Because a breadboard has no pixels, it forces functional debate — is this step even needed, does this action have a place to land, is there a dead end — while explicitly leaving the 2D arrangement to the designer later. NN/g's fidelity research reinforces why this pays off: fidelity varies independently across visuals, content, and interactivity, and low-fidelity artifacts draw more honest critique precisely because people don't mistake them for finished work; jumping to a refined interface often just hides the structural problem you should be finding now, and tearing up finished code costs far more than discarding a sketch. A breadboard deliberately sits at the floor of all three axes so the cheap conversation happens first.

The one explicit exception is the reason the principle names the fat-marker sketch. When the idea itself is spatial — a chart, a canvas, a drag-and-drop arrangement, a map, anything where the 2D placement of elements is the actual question — a breadboard "would just miss the point," and a few coarse strokes with a thick marker (thick enough that you physically cannot add detail) is the right tool. Choose by asking what the open question is: if it is flow and sequence, breadboard in words; if it is arrangement, sketch fat. The common failure mode is reaching for boxes-and-arrows wireframing tools or full-fidelity mockups for every question, which pulls the team into litigating spacing, alignment, and component choice before anyone has agreed the flow is even right — and once a visual layout exists, people defend it. The inverse failure is breadboarding a genuinely spatial problem and producing a word list that says nothing about the thing being decided.

**Good Example:**

> For a "share a document" feature, breadboard it as places and affordances: Doc page [Share button] → Share dialog [Email field, Permission dropdown, Send] → Confirmation toast [Undo]. The gap is instantly visible — there is no place the user lands if Send fails — and the team fixes the flow before anyone opens a design tool.

**Bad Example:**

> Opening Figma to answer "should sharing be a dialog or a full screen?" by pixel-placing an email field, a styled dropdown, and a brand-blue Send button — the team spends the meeting arguing about field spacing and button color while the real question, whether the flow even has all the steps it needs, goes untested.

**Guidelines:**

- MUST choose the artifact by the open question: breadboard flow and sequence questions as words when layout is not in dispute, and reserve a fat-marker sketch for questions whose substance is 2D arrangement (chart, canvas, drag-and-drop, map).
- MUST write a breadboard as the three text primitives only — underlined places, affordances listed under each place, and connection arrows from an affordance to the place it leads to — adding no pixels, spacing, or component styling.
- MUST NOT open a full-fidelity design tool to answer a question about topology or sequence, since a rendered layout redirects critique to spacing, alignment, and color before the flow is agreed.
- MUST trace every affordance to a landing place and flag any action with no destination or any dead-end place as a flow gap to resolve before visual design begins.

Sources: [Shape Up — Chapter 4: Find the Elements (Breadboarding & Fat Marker Sketches) — Basecamp (Ryan Singer)](https://basecamp.com/shapeup/1.3-chapter-04) · [Breadboarding: A Simple Way to Prototype — SEP (Software Engineering Professionals)](https://sep.com/blog/breadboarding-a-simple-way-to-prototype/) · [UX Prototypes: Low Fidelity vs. High Fidelity — Nielsen Norman Group](https://www.nngroup.com/articles/ux-prototype-hi-lo-fidelity/)

## Use real or realistic content, never lorem ipsum

Wireframes exist to test decisions, and it is the content that provokes useful decisions, not the box around it. Lorem ipsum quietly hides the exact problems a wireframe is meant to expose: real headlines reveal whether the type hierarchy carries the message, real body copy shows whether a column is a comfortable measure, real button labels ("Add to shipment", "Deactivate account") show whether the control has room before it wraps or truncates, and real list rows show whether empty, one-item, and long-item states all hold up. Greeked text also has a second, well-documented failure: reviewers routinely mistake gray filler for real copy still being written, or for a foreign language, and either derails the review or produces feedback about the placeholder instead of the layout. Nielsen Norman Group frames the fix as deciding what each region must say before drawing it — a content inventory or "promptframe" that names the message, the user need, and the business goal per area — so layout follows content rather than content being poured into a fixed shell late in the build.

The practical rule is to write draft-real copy at realistic length, not final polished marketing copy. You are testing fit and hierarchy, so extremes matter more than prose quality: use the longest plausible product name, a genuinely long user-generated title, a real error sentence, and a real number format ("$1,299.00", "3 days ago", "128 unread"), because these are what break layouts. Where you genuinely cannot yet know the words, prefer an explicit descriptive label in brackets — [primary CTA], [12-word supporting subhead], [avatar] — over lorem ipsum, because that label still communicates intent and length expectation while signaling "not final" unambiguously. Populate lists and tables with content that varies row to row rather than the same string repeated, so alignment, wrapping, and density read honestly.

The common anti-pattern is reaching for a lorem-ipsum generator to "fill space fast," which optimizes for a tidy-looking mockup and against the whole point of the artifact. The tidy filled rectangle looks done, sails through review, and then the real content — a 40-character title, a two-line legal disclaimer, an empty-state with nothing to show — arrives after the layout is committed and forces rework. Realistic content surfaces those constraints while they are still cheap to change, and modern practice (including AI-assisted drafting) makes generating plausible stand-in copy fast enough that lorem ipsum no longer buys the speed it once claimed to.

**Good Example:**

> A settings-screen wireframe labels its rows with the actual strings — "Two-factor authentication", "Connected accounts", "Delete workspace" — and fills a notifications list with three differently-sized real messages including one long enough to wrap, so the reviewer can see truncation and row height behave before build.

**Bad Example:**

> A product card shows a lorem-ipsum title, "Lorem ipsum dolor sit" price, and greeked description; it looks balanced in review, but real data ("Ergonomic Mesh Office Chair with Adjustable Lumbar Support", "$1,299.00") later overflows two lines and breaks the grid the layout was approved on.

**Guidelines:**

- MUST NOT fill any wireframe region with lorem ipsum or greeked placeholder text.
- MUST label controls, headings, and rows with draft-real strings from the actual domain, sized to the longest plausible value rather than average-length prose.
- SHOULD stress every list and table with row-varying content — an empty state, a single item, and an item long enough to wrap or truncate — plus real number and date formats like "$1,299.00" or "3 days ago".
- MUST substitute a bracketed intent-and-length label such as [12-word supporting subhead] wherever the final words are unknown, never lorem ipsum.

Sources: [Promptframes: Evolving the Wireframe for the Age of AI — Nielsen Norman Group](https://www.nngroup.com/articles/promptframes/) · [Wireframing With Real Content for More Intentional Experiences — Adobe](https://blog.adobe.com/en/publish/2022/01/27/using-real-content-in-wireframes-prototypes) · [Wireframes are More than Greeking Text and Gray Boxes — GovWebworks](https://www.govwebworks.com/2017/03/07/wireframes-are-more-than-greeking-text-and-gray-boxes/) · [Creating Content Wireframes For Responsive Design — Smashing Magazine](https://www.smashingmagazine.com/2016/02/create-content-wireframes-for-responsive-design/) · [Practical Tips for Creating Better Wireframes — Balsamiq](https://balsamiq.com/learn/articles/practical-tips-for-better-wireframes/)
