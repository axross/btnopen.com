// the query parameters a page view may report. the list is closed by
// construction: an unknown parameter is dropped rather than excluded, so a
// secret that later travels in the URL cannot reach an event payload by anyone
// forgetting to exclude it here. both entries are this site's own routing state.
const reportableSearchParams = ["draft", "agentic"];

/**
 * Reduces a URL's query string to the parameters that may be reported, as a
 * plain object.
 *
 * Parameter names are kept verbatim rather than normalized to the casing the
 * rest of the analytics payload uses: they identify positions in a URL, and
 * renaming them would stop the payload matching the address it describes.
 *
 * Lives apart from the analytics module so it can be unit-tested without
 * dragging the browser SDK and the environment barrel into the test runner.
 */
export function pickReportableSearchParams(
	searchParams: URLSearchParams,
): Record<string, string> {
	const reportable: Record<string, string> = {};

	for (const name of reportableSearchParams) {
		const value = searchParams.get(name);

		if (value !== null) {
			reportable[name] = value;
		}
	}

	return reportable;
}
