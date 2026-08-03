/**
 * Serializes a JSON-LD payload for injection into an inline
 * `<script type="application/ld+json">` element.
 *
 * `JSON.stringify` escapes for JSON, not for HTML, so a CMS-authored string
 * carrying `</script>` survives serialization intact and terminates the script
 * element it is written into — everything after it is then parsed as markup.
 * Escaping `<` is what makes that impossible, since every way out of a script
 * element's raw text starts with one; `>` and `&` go with it so no literal
 * markup delimiter reaches the document at all.
 *
 * The replacements are ordinary JSON unicode escapes, so the result still
 * parses back to the input value and a structured-data consumer reads
 * identical strings.
 *
 * This is the only sanctioned way to build the `__html` of a JSON-LD script
 * tag; a bare `JSON.stringify` at that sink is the vulnerability it exists to
 * remove.
 */
export function serializeJsonLd(payload: unknown): string {
	return JSON.stringify(payload)
		.replaceAll("<", "\\u003c")
		.replaceAll(">", "\\u003e")
		.replaceAll("&", "\\u0026");
}
