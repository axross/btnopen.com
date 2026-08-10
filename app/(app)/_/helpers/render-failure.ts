/**
 * Whether retrying a failed render can plausibly succeed. Offering a retry that
 * cannot is worse than offering none, so the surface reads this rather than
 * always showing the control.
 */
export type RenderFailureKind = "retryable" | "terminal";

/** A render failure described in the terms the shared surface renders. */
export interface RenderFailure {
	kind: RenderFailureKind;
	/** Key of the muted line, relative to the `error` catalog namespace. */
	messageKey: string;
	/**
	 * Key of the retry action's label, relative to the `error` catalog
	 * namespace, or `null` when the failure is terminal and no retry is offered.
	 */
	retryLabelKey: string | null;
}

/**
 * Maps a failure caught by a route error boundary to the copy the reader sees
 * and to whether a retry is offered, so no component body branches on a status
 * code or an error class name.
 *
 * @param _error the failure the boundary received. Part of the contract rather
 *   than something the mapping reads today — see below.
 */
export function resolveRenderFailure(_error: unknown): RenderFailure {
	// every failure that reaches a route error boundary on this site today is a
	// transient render or data-fetch fault, so a retry can succeed and the
	// mapping is unconditional.
	//
	// the terminal branch is deliberately unmapped: there is no permanent render
	// failure to map onto it. a missing document calls `notFound()`, which
	// renders the 404 surface instead of this boundary, and nothing else here
	// fails in a way retrying cannot clear. `kind` carries the distinction so
	// the surface needs no change on the day one appears — writing a branch
	// nothing can reach today would only make this look complete.
	return {
		kind: "retryable",
		messageKey: "message",
		retryLabelKey: "retry",
	};
}
