# Low-Fidelity Wireframe & Breadboard Design — Responsive & Platform

Device scale, thumb reach, content-driven breakpoints, and per-platform navigation.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the guideline bullets are the normative takeaways, and the MUST/SHOULD rules in `SKILL.md` remain authoritative.

## Wireframe mobile-first at real device scale

The common failure mode is designing the phone screen last — laying out a spacious desktop composition and then reflowing it down — which produces cramped tap targets, primary actions marooned in the top red zone, and more content than the fold can hold. Wireframing mobile-first at real scale catches all three while they are still cheap to move.

True device scale is what removes the biggest lie of desktop-drawn mobile screens: a phone comp shrunk to fit a laptop canvas hides how little vertical room exists and how far a thumb actually has to stretch. Drawing inside a 1:1 device frame (or on a printed phone-sized template) forces you to confront the real budget — a single narrow column, a handful of visible rows above the fold, and one truly prominent action — before you commit ink ([sketching and wireframing templates](https://www.smashingmagazine.com/2012/09/free-download-ux-sketching-wireframing-templates-mobile/), [practical tips](https://balsamiq.com/blog/practical-tips-for-better-wireframes/)). Starting from the smallest viewport is the mobile-first discipline: the tightest frame strips a screen down to its essential content and one primary path, and layouts that survive that constraint scale up to tablet and desktop far more cleanly than desktop layouts scale down ([content wireframes](https://www.smashingmagazine.com/2016/02/create-content-wireframes-for-responsive-design/)). This stays a wireframe-stage decision, not a visual-polish one — grey boxes and placeholder labels, never brand color or final type.

Place the primary action in the thumb's natural reach zone. About half of people operate their phones one-handed, and most of those with the right thumb, which makes the bottom-center of the screen the comfortable "green" reach zone, the mid-screen sides a "yellow" stretch, and the top corners a "red" zone that usually demands a grip change or a second hand ([the thumb zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/), [mobile UX](https://www.nngroup.com/articles/mobile-ux-study-guide/)). Primary navigation and the main call-to-action belong low and central — this is the ergonomic case for bottom tab bars over top ones — while destructive or rarely-used controls can live in the harder-to-hit top corners on purpose. On modern large-screen phones the reachable arc shrinks relative to the display, so the higher a control sits, the more you are taxing the user.

Validate touch-target size on paper before going digital, because a box that looks tappable in a sketch can be too small once it is a real 44px hit area. Work to a ~44pt floor ([Material 3](https://m3.material.io/foundations/designing/structure), [SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)) — and sketch the gaps too, not just the buttons, because once you clear roughly 40 pt the spacing between adjacent targets affects error rate more than raw size does.

**Good Example:**

> On a phone-sized frame you sketch a single-column list with a bottom tab bar holding the primary "Create" action in the lower-center green zone, size the tab hit areas to a penciled ~44pt grid with visible gaps between them, and confirm only three list rows plus a header fit above the fold — then widen the same regions into a two-column tablet layout.

**Bad Example:**

> You design the desktop screen first at half-scale on a laptop canvas with a top navigation bar and eight dense toolbar icons, then shrink it to phone width — pushing the main action into the top-right red zone, collapsing the icons into 20px targets with no spacing, and burying half the content below a fold you never actually measured.

**Guidelines:**

- MUST sketch each mobile screen inside a 1:1 real-device frame and start from the smallest target viewport, widening the same regions up to tablet and desktop rather than shrinking a desktop composition down.
- MUST place primary navigation and the main call-to-action in the bottom-center green reach zone, and reserve the top corners for destructive or rarely-used controls.
- MUST size penciled touch targets to a ~44pt working floor and draw the spacing between adjacent targets, not the buttons alone.
- MUST count the rows, header, and one primary action that fit above the fold on the device frame before committing the layout, keeping every element a grey box or placeholder label with no brand color or final type.

## Set breakpoints from content, and adapt navigation per platform

Two failure modes dominate. The first is hiding navigation behind a hamburger on screens with room to show it: hidden navigation lowers discoverability, slows task completion, and reduces engagement versus visible or partially visible navigation ([hamburger menus](https://www.nngroup.com/articles/hamburger-menus/)), so it is a last resort for genuinely compact widths, not a default. The second is designing to devices — a single "tablet" breakpoint that ignores foldables, split-screen multitasking, browser windows dragged to arbitrary sizes, and large-text/zoom users whose effective width shrinks. Ranges survive all of those; device names do not.

So anchor each breakpoint to the line where a layout stops reading well. For body text that is roughly 45–75 characters per line, with about 66 as the comfortable target ([the 50–75 character rule](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/), [optimal line length](https://baymard.com/blog/line-length-readability)) and 80 as the AAA ceiling ([SC 1.4.8](https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html)). A column that would run wider has earned a new breakpoint or a second pane; one that would run narrower than ~45 characters should collapse ([logical breakpoints](https://www.smashingmagazine.com/2013/03/logical-breakpoints-responsive-design/), [responsive basics](https://web.dev/articles/responsive-web-design-basics)). Design against a small set of width ranges rather than named phones and tablets: [window size classes](https://m3.material.io/foundations/layout/breakpoints/medium) give durable anchors — compact below 600dp (single column), medium 600–839dp, expanded 840–1199dp — but set the exact pixel value where your content breaks rather than copying it blindly ([layout](https://design-system.service.gov.uk/styles/layout/)). Start every screen single-column at the smallest width and add panes, rails, and secondary regions as width grows, so the compact case is the guaranteed-correct baseline rather than a degraded afterthought.

Navigation adapts on the same width axis, and in a wireframe you show it as a labeled region, not a finished control. Keep primary destinations visible: on compact/mobile, a bottom bar or tab bar carries 3–5 top-level destinations, each persistently visible and one tap away, since both platforms cap around five before crowding ([navigation bar](https://m3.material.io/components/navigation-bar/guidelines), [tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [mobile navigation patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/)). As width crosses into medium, promote that same set to a vertical [navigation rail](https://m3.material.io/components/navigation-rail/guidelines); in expanded widths, promote again to a full sidebar or persistent left nav, which scales to more items and is easy to scan ([left-side vertical navigation](https://www.nngroup.com/articles/vertical-nav/)). The destinations stay the same across breakpoints — only the container changes — so a user's mental model of the app survives the resize.

In a low-fidelity wireframe, annotate each breakpoint with the content reason ("second pane appears here because the list + detail both fit above ~840dp") rather than a device name, and sketch the compact, medium, and expanded states as separate frames so the reflow is explicit.

**Good Example:**

> A dashboard wireframe drawn as three frames: compact shows one scrolling column with a 4-item bottom tab bar; at ~600dp the tabs become a left icon rail and a filter pane appears; at ~840dp the rail expands to a labeled sidebar and a detail pane opens beside the list — each transition annotated with the content reason, not a device name.

**Bad Example:**

> A wireframe with two states labeled "iPhone" and "iPad," both tucking all navigation behind a top-left hamburger, and a body text column that runs the full window width (~120 characters per line) on the larger frame because no readability-based breakpoint was set.

**Guidelines:**

- MUST set each breakpoint at the width where a content column stops reading well — collapsing below roughly 45 characters per line and adding a pane or breakpoint before body text exceeds about 66 (Bringhurst's measure), never past the 80-character WCAG AAA ceiling.
- MUST sketch the compact, medium, and expanded states as separate frames starting single-column at the smallest width, and annotate each transition with the content reason ("second pane fits above ~840dp") rather than a device name.
- MUST keep the 3-5 primary destinations persistently visible across breakpoints — a bottom or tab bar on compact, a navigation rail on medium, a labeled sidebar on expanded — changing only the container, not the destination set.
- MUST NOT hide primary navigation behind a hamburger on medium or expanded widths, reserving it for genuinely compact frames where the destinations cannot stay visible.
