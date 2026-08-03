# User Feedback

Apply this reference when adding a feedback surface, collecting feedback from an interface you built, or linking a person's report to the event behind it.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0.

## Three Surfaces

Sentry offers feedback collection in three shapes, and they are not interchangeable.

**The web widget** is a floating trigger and form, added as an integration and configurable in copy, colour scheme, and whether it offers a screenshot.

**The native form** is a component the application renders or opens imperatively, with an optional shake gesture to open it from anywhere. It requires the root component to be wrapped.

**A custom interface** is your own form calling the capture API directly, which is the right answer whenever the built-in surfaces cannot match the product's design language or its accessibility requirements.

**Guidelines:**

- MUST wrap the root component before relying on the native form or its shake gesture; neither works without it.
- SHOULD build a custom interface rather than restyling a built-in widget past what its options express.
- MUST hold a feedback surface to the same accessibility standard as the rest of the product; a third-party widget is not exempt.

## Linking Feedback to an Event

Feedback that arrives unattached says something went wrong. Feedback attached to the event that prompted it says what went wrong, with a stack trace and a breadcrumb trail beside the person's description.

The link is the event identifier returned when the error was captured. An error boundary that shows a feedback dialog does this automatically; a custom flow passes the identifier explicitly.

**Guidelines:**

- MUST pass the originating event identifier when feedback is collected in response to a specific failure.
- SHOULD offer feedback from an error boundary's fallback, where the identifier is already available and the person is already looking at a failure.
- SHOULD NOT prompt for feedback on a failure the application recovered from silently; it asks the person to explain something they did not see.

## What Opening the Widget Starts

Where replay is enabled, opening a feedback surface commits a buffer of the preceding session so the report arrives with a recording. That is the feature's main value and also a disclosure: the person is submitting a recording of their recent activity, subject to the masking that was configured.

Feedback text itself is user-authored content and passes through no scrubbing. Nothing prevents someone from typing a password into a description field.

**Guidelines:**

- MUST account for feedback-triggered replay capture in the product's privacy documentation where replay is enabled.
- MUST treat submitted feedback text as unscrubbable content, and keep it out of any downstream system that assumes scrubbed input.
- SHOULD keep the form's fields minimal; every field is a place for content nobody intended to send.
