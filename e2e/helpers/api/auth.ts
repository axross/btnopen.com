// biome-ignore lint/correctness/noNodejsModules: payload config needs path module
import { dirname, resolve } from "node:path";
import type { Page, TestInfo } from "@playwright/test";

// biome-ignore-start lint/style/noProcessEnv: using the test user credentials
const testUserEmail = process.env.PAYLOAD_TEST_USER_EMAIL;
const testUserPassword = process.env.PAYLOAD_TEST_USER_PASSWORD;
// biome-ignore-end lint/style/noProcessEnv: using the test user credentials

const selfDirname = dirname(new URL(import.meta.url).pathname);
export const authenticatedStorageState = resolve(
	selfDirname,
	"../../.data/authenticated-storage-state.json",
);

export async function authenticateWithTestUser({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	const isAuthenticated = await checkAuthenticated({ page });

	if (isAuthenticated) {
		return;
	}

	const url = new URL("/api/users/login", testInfo.project.use.baseURL);

	const response = await page.request.post(`${url}`, {
		headers: {
			"content-type": "application/json",
		},
		data: {
			email: testUserEmail,
			password: testUserPassword,
		},
	});

	if (!response.ok()) {
		throw new Error("Failed to authenticate with the test user.");
	}
}

export async function deauthenticate({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	const isAuthenticated = await checkAuthenticated({ page });

	if (!isAuthenticated) {
		return;
	}

	const url = new URL("/api/users/logout", testInfo.project.use.baseURL);

	const response = await page.request.post(`${url}`, {
		headers: {
			"content-type": "application/json",
		},
	});

	if (!response.ok()) {
		throw new Error("Failed to deauthenticate the test user.");
	}
}

async function checkAuthenticated({ page }: { page: Page }) {
	const cookies = await page.context().cookies();

	return cookies.some((cookie) => cookie.name === "payload-token");
}
