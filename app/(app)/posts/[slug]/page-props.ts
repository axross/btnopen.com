export interface PageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		draft?: "true";
		preview?: "true";
	}>;
}
