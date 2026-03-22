"use server";

import { revalidatePath } from "next/cache";

export async function refresh(path: string): Promise<void> {
	revalidatePath(path);
}
