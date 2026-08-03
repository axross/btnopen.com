import { redirect } from "next/navigation";
import type { PageProps } from "./page-props";

export default function BlogPostListPage(_props: PageProps): never {
	redirect("/");
}
