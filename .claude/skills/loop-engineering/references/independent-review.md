# Independent Review

Apply this reference for the machine-event tail after you push and request review, and for addressing what the review and CI return. The review request itself (opening the draft pull request, the trigger phrase) is covered in the loop-engineering skill's Phase 3; this reference owns the polling tail and the addressing mechanics.

## CI and Review Tail

After you push and request review, machine events run on their own: the merge-checks CI and the independent review, plus a per-PR preview deploy where the project has one. Nothing wakes this session when they finish, so you must schedule your own poll.

**Guidelines:**

- MUST schedule a self-wake where the harness provides one (in Claude Code, `send_later`, which delivers a message back into this same session and survives container reclaim); without one, end the turn and wait for the human to resume.
- SHOULD poll at a **4-minute** cadence for the first ~15 minutes, then back off to a **10-minute** cadence while still pending. (The 4-minute figure suits a harness whose prompt cache has a ~5-minute TTL, so a wake under five minutes resumes cache-warm; adjust to the harness.)
- MUST, on green CI plus a clean review, flip the pull request to ready, update the status block, deliver the Ready-to-Merge Handoff in the turn output, and end the turn.
- MUST, on review findings or red CI, enter the addressing mechanics below; on only some checks resolved, keep polling for the rest.
- MUST stop autonomous polling at the dormancy cap in the skill's Termination Guard and go dormant with a status-block note rather than poll indefinitely.

## Addressing Findings

When the independent review's comments land, read them (their author is the review bot, not you and not a human) together with the CI status. Address blocking findings and unmet acceptance criteria, then tie each resolution to the commit that fixed it.

**Guidelines:**

- MUST address and resolve each blocking finding (whatever the posted-review policy marks merge-blocking) and every unmet acceptance criterion, pushing fixes to the same branch and re-running the relevant verification after each batch.
- MUST, for every review comment a commit resolves, reply on that comment's thread with a marked comment — the project's agent-comment marker line, then a line beginning **`Resolved in <short-hash>`** (the 7-character hash of the fixing commit) and a one-sentence summary — then resolve the thread. Reference the same hash on each comment one commit resolves.
- MUST re-request review by posting the review trigger phrase again after a batch of fixes, and repeat up to the round cap in the skill's Termination Guard; on non-convergence, record what still fails and go dormant.
- MUST escalate through the question UI when a finding or human comment is ambiguous or needs a product or architecture decision, rather than guessing.
- MUST NOT gate the ready flip on your own assessment — only a clean independent review plus green CI flips draft→ready.

## Keeping the Branch Mergeable

When the base branch moves and the pull request conflicts, the branch must be brought back to mergeable before the ready flip.

**Guidelines:**

- MUST bring the base branch into the branch and resolve the conflicts when GitHub marks the pull request not mergeable or an update/rebase fails, then re-run the verification the touched surface requires and note it in the pull request.
- MUST resolve mechanical conflicts yourself — imports, independent or adjacent edits, regenerated lockfiles — but ask the human how to reconcile a genuine judgment call (both sides changed the same logic on purpose) rather than guessing.
- MUST NOT force-push to resolve a conflict; merge the base in and add the resolution as a commit, preserving history.
