// `/posts` redirects to the index route and reads neither `params` nor
// `searchParams`, so this interface is deliberately empty. it exists because
// every `page.tsx` under `app/(app)/` carries a co-located props type, and a
// missing file here would read as an oversight rather than as "no props".
// biome-ignore lint/suspicious/noEmptyInterface: the emptiness is the statement, and the routing convention names an interface rather than a type alias
export interface PageProps {}
