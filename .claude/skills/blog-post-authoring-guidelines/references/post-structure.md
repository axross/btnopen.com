# Post Structure

A good btnopen post should have a reason to exist beyond showing that the renderer supports a syntax feature. The structure should lead the reader from context, through the practical problem, into examples, trade-offs, and a short takeaway.

When the post intentionally exercises many Markdown constructs, the article still needs a coherent topic. Each construct should carry a real piece of the explanation.

**Guidelines:**

- MUST start with the practical context, author/project trigger, or reader problem before detailed examples.
- MUST choose a dominant article shape before a large rewrite.
- MUST make each heading describe the point of the section, not the Markdown element being demonstrated.
- MUST keep headings hierarchical; do not jump levels only to exercise syntax.
- MUST use lists for steps, criteria, or parallel options rather than disconnected sample items.
- MUST use tables for comparison, reference data, or decision matrices that benefit from row/column scanning.
- MUST use blockquotes only for quoted framing, notes from another source, or a clearly separated takeaway.
- MUST use code blocks for runnable, inspectable, or representative code, not placeholder snippets.
- SHOULD end with a short conclusion, checklist, or next action when the post is instructional.

## Article Archetypes

Choose the archetype that matches the post's purpose. A single post may combine two, but one shape should dominate so the rewrite does not become a generic content template.

### Technical Pitfall Note

Use this for short posts about a framework, library, command, or API behavior that caused confusion.

**Guidelines:**

- MUST state the pitfall and why it is worth writing down.
- MUST show the symptom or failure mode before deep explanation when the symptom is known.
- MUST give the immediate fix early enough that a reader can use the post quickly.
- MUST explain the underlying mechanism after the fix.
- SHOULD use the corpus's canonical heading sequence — 現象, 解決法, 解説, then optional 深掘り and ちなみに — when the post is Japanese and the sequence fits.
- SHOULD add edge cases or "ちなみに" notes only when they prevent future confusion.

### Technical Evaluation Or Investigation

Use this for posts like framework version notes, security configuration, platform behavior, or migration findings.

**Guidelines:**

- MUST start from the trigger: project need, interview question, migration, investigation, or local experiment.
- MUST break the evaluation into concrete sections organized by reader decisions.
- MUST connect every recommendation to operational consequences.
- SHOULD include code, configuration, screenshots, links, or policy examples when they carry the explanation.
- SHOULD end with a practical summary, caveat, or unresolved point.

### Product Or Launch Note

Use this when the author shipped an app, library, tool, or public project.

**Guidelines:**

- MUST say what shipped, who it is for, and where to find it.
- MUST make the post useful beyond the announcement by explaining implementation choices or release lessons.
- SHOULD include source links, screenshots, GIFs, or store links when they help readers understand the product.
- SHOULD keep feedback requests low-pressure and specific.

### Career Or Life Guide

Use this for posts about working overseas, job search, language, visas, company culture, or personal career decisions.

**Guidelines:**

- MUST explain the author's background and why existing information felt insufficient.
- MUST define the target reader or assumptions early.
- MUST walk through concrete phases, such as preparation, resources, documents, interviews, visas, language, work culture, or Q&A.
- MUST keep legal, immigration, hiring, and career claims cautious and dated when relevant.
- SHOULD split the body by audience with verb-phrase advice headings when the post advises two sides of one situation, matching the corpus's 採用側/被採用側 shape.
- SHOULD balance practical advice with personal limitation and candid self-assessment.

### Opinion Essay

Use this for posts that argue a position on work culture, engineering practice, or industry behavior from personal experience, like the corpus's remote-work essay.

**Guidelines:**

- MUST ground the argument in a concrete personal or company case before generalizing.
- MUST state scope honestly, including a positioning disclaimer when the view may differ from colleagues or official stances.
- SHOULD name the central concept memorably (the corpus coins 「喫煙所の決定」) and use it as the lens for the argument.
- SHOULD widen from the specific case to the general principle only after the case is established.
- SHOULD land on a short, quotable thesis near the close instead of a generic summary.

### Retrospective

Use this for year-end, life, travel, work, or personal reflection posts.

**Guidelines:**

- SHOULD open briefly with the occasion.
- SHOULD use broad life/work sections that match the author's actual year or period.
- SHOULD include specific events, places, projects, and feelings.
- SHOULD acknowledge the people who helped when gratitude is genuine, matching the corpus's closing pattern.
- SHOULD close with a grounded reflection — optionally a reader well-wish (「皆さんも良いお年をお迎えください」) — rather than a generic lesson.

### Life Log Or Milestone Note

Use this for short personal posts marking an event: a resignation, an arrival, a first day, a one-month update, or a notable place or experience.

**Guidelines:**

- MUST keep the post short and unpadded; the corpus's resignation note is four paragraphs, and photo-driven logs carry most content in captions.
- MUST NOT add forced sections, conclusions, or reader lessons to a post that is fundamentally a personal record.
- SHOULD open with a single punchy occasion sentence (「今日が最終出社日でした。」「なんとか生きてます。」).
- SHOULD let photos carry the narrative in travel and place posts, with captions that add observation or humor rather than mechanical descriptions.
- SHOULD close with a concrete forward-looking intention instead of a summary.
- SHOULD follow [writing-style-and-tone.md](./writing-style-and-tone.md) for the dated 追記 addendum rule and the diary-register exception when this archetype needs them; [author-style-corpus.md](./author-style-corpus.md) records the register evidence.

### Procedural Or Logistics Note

Use this for rule-heavy reference posts — visas, immigration, taxes, contracts, or platform policies — like the corpus's ESTA note.

**Guidelines:**

- MUST state the reason for writing, even when it is just 備忘録 (a note to self that may help others).
- MUST keep rule claims cautious, dated, and linked to the authoritative source.
- SHOULD summarize the known rules as a compact bullet list before explaining mechanisms in prose.
- SHOULD include the author's own case as a worked example when one exists.
- SHOULD close with a proportionate warning when mistakes carry heavy consequences (「ビザのペナルティは人生レベルで響きます…」).

## Natural Section Flow

The default flow for pragmatic technical writing is context, constraint, implementation shape, observed trade-offs, and conclusion. Not every post needs every part, but abrupt syntax tours should be avoided.

**Guidelines:**

- SHOULD introduce the reader's problem in the first one or two paragraphs.
- SHOULD make the first section answer why the post exists and who it helps.
- SHOULD preserve an experience-led trigger when the topic allows it, even for technical or example-heavy posts.
- SHOULD put prerequisites or assumptions before steps that rely on them.
- SHOULD connect examples with prose that explains why the example matters.
- SHOULD move tangential reference material into a table, list, or appendix-style section.

## Best-Practice Adaptation

External blogging and technical-writing resources generally converge on a few ideas: write for a real reader need, front-load useful information, make pages scannable, use specific examples, and keep titles and descriptions honest. Apply those principles in the author's voice instead of importing generic SEO or marketing formulas.

Reliable resources behind this adaptation include Google Search Central, GOV.UK content design, Nielsen Norman Group, Google developer documentation style, MDN Web Docs, Diátaxis, Write the Docs, Microsoft Style Guide, Mailchimp Content Style Guide, Yoast, Ahrefs, and HubSpot.

**Guidelines:**

- MUST identify the intended reader and reader task before a large rewrite.
- MUST keep firsthand experience, project details, and observed constraints visible when they are available.
- MUST make headings, first sentences, lists, and tables carry real information for readers who scan.
- MUST NOT add sections merely to hit a word count, cover keywords, or imitate search-optimized templates.
- MUST NOT force keyword repetition into Japanese prose.
- SHOULD front-load important words in titles and headings when doing so remains natural.
- SHOULD split dense paragraphs or convert them to lists when mobile readability suffers.
- SHOULD add a concise takeaway, checklist, or next action for instructional posts, but only when it helps the reader.

## Example-Heavy Posts

Example-heavy posts can still be natural if examples share one scenario. For example, a post about tightening a markdown pipeline can naturally include links, embeds, images, code, tables, and quotes while explaining one workflow.

**Guidelines:**

- MUST choose one coherent scenario when a post needs to cover many syntax forms.
- MUST remove "this is a heading/list/table" phrasing unless the post is explicitly a syntax reference.
- MUST keep the article's reason for existing stronger than the syntax-coverage requirement.
- SHOULD make examples reflect realistic project constraints, commands, code, or editorial decisions.
- SHOULD keep media and embeds relevant to the surrounding explanation.
