// commonmark.mjs — the CommonMark fenced-block rule, shared by this skill's
// validators.
//
// Both check-skill.mjs and check-links.mjs must ignore content inside fenced
// code blocks, so the skill-authoring docs can show `[file.md](./references/
// file.md)` or a `- MUST …` bullet as an EXAMPLE without either validator
// reading it as the real thing. That rule lived twice — once here in JavaScript
// and once as an awk program inside check-links.sh — and the two drifted: both
// used to toggle state on any fence-looking line, so an inner ```ts block
// inverted the state and exposed the enclosing block's content as body text.
//
// One implementation with two callers is what keeps that from recurring. This
// module is not an executable: it carries no CLI and is imported by the two
// scripts beside it, which ship together in this skill.
//
// It is dependency-light (no imports at all) and makes no assumption about what
// a document means — it reports which lines are outside a fence, and callers
// decide what to read from them.

/**
 * A line that opens or closes a fenced block: 3+ backticks or 3+ tildes after
 * optional leading whitespace. Group 1 is the marker, group 2 the rest of the
 * line (an info string on an opening fence, blank on a closing one).
 */
export const FENCE_RE = /^[ \t]*(`{3,}|~{3,})(.*)$/;

/**
 * Per CommonMark, a fence closes only on a marker of the SAME character, at
 * least as long as the opener, carrying no info string. That is what lets a
 * longer fence legally contain shorter ones — a ````markdown block wrapping a
 * ```ts block, as this repository's own references do. Toggling on any
 * fence-looking line inverts the state inside such a block and exposes its
 * content as body text.
 *
 * @param {RegExpMatchArray | null} marker a FENCE_RE match, or null
 * @param {string} char the open fence's marker character
 * @param {number} length the open fence's marker length
 * @returns {boolean}
 */
export function closesFence(marker, char, length) {
  return (
    marker !== null &&
    marker[1][0] === char &&
    marker[1].length >= length &&
    marker[2].trim() === ""
  );
}

/**
 * Walk a document once, tracking fenced blocks.
 *
 * The single state machine behind every export here — `scanLines` and
 * `unterminatedFenceLine` are two views of this one result, so a caller can
 * never observe the two disagreeing about where a fence opened or closed.
 *
 * @param {string} body
 * @returns {{
 *   lines: Array<{ line: number, text: string, fence: boolean }>,
 *   unterminatedAt: number | null,
 * }} `lines` holds every line OUTSIDE a fence plus each fence's OPENING line
 *   marked `fence: true`; `unterminatedAt` is the 1-based line of a fence still
 *   open at end of file, or null.
 */
function scanDocument(body) {
  let fenceChar = null; // open fence's marker character, or null outside a fence
  let fenceLength = 0; // and its length — a closer must be at least this long
  let fenceOpenedAt = 0;
  const lines = [];
  const source = body.split("\n");

  for (let index = 0; index < source.length; index += 1) {
    const text = source[index];
    const marker = text.match(FENCE_RE);
    if (fenceChar !== null) {
      if (closesFence(marker, fenceChar, fenceLength)) fenceChar = null;
      continue;
    }
    if (marker) {
      fenceChar = marker[1][0];
      fenceLength = marker[1].length;
      fenceOpenedAt = index + 1;
      lines.push({ line: index + 1, text, fence: true });
      continue;
    }
    lines.push({ line: index + 1, text, fence: false });
  }

  return { lines, unterminatedAt: fenceChar === null ? null : fenceOpenedAt };
}

/**
 * Every line OUTSIDE a fenced block, plus each fence's OPENING line marked
 * `fence: true`, as `{ line, text, fence }`.
 *
 * Surfacing the opener is what lets a caller treat a fenced block as content
 * without seeing inside it. The section-intro check needs exactly that: a
 * section whose demonstration IS a code block must not read as a heading
 * abutting its `**Guidelines:**` label. Callers that only care about prose skip
 * the marked lines.
 *
 * @param {string} body
 */
export function* scanLines(body) {
  yield* scanDocument(body).lines;
}

/**
 * The 1-based line where a fence was opened and never closed, or null when
 * every fence closed.
 *
 * An unterminated fence is legal CommonMark — the block simply runs to the end
 * of the document — so this is a caller's cue to WARN rather than fail. It
 * matters because everything after that opener went unread.
 *
 * @param {string} body
 * @returns {number | null}
 */
export function unterminatedFenceLine(body) {
  return scanDocument(body).unterminatedAt;
}
