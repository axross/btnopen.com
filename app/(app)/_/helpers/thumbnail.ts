// the dimensions every Open Graph thumbnail this site serves is rendered at.
// the two `thumbnail.png` routes generate at this size, the routes' Open Graph
// tags declare it, and the `BlogPosting` structured data repeats it — so it
// lives here rather than as a literal at each of those five call sites, where
// they have already drifted apart once.
export const thumbnailWidth = 1200;
export const thumbnailHeight = 630;
