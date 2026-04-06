// biome-ignore-all lint/suspicious/noConsole: use console for providing status stdout
// biome-ignore-all lint/correctness/noNodejsModules: it runs on nodejs as npm postinstall script
import { execSync } from "node:child_process";
import { statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const rootDir = resolve(dirname(new URL(import.meta.url).pathname), "../");

// ref. https://github.com/gabenunez/puppeteer-on-vercel
try {
	console.log("Extracting chromium archive...");

	const chromiumUri = import.meta.resolve("@sparticuz/chromium");
	const chromiumPath = new URL(chromiumUri).pathname;
	const chromiumDir = resolve(chromiumPath, "../../../");
	const chromiumBinDir = resolve(chromiumDir, "./bin");
	const chromiumBinDirStat = statSync(chromiumBinDir);

	if (chromiumBinDirStat.isDirectory()) {
		const publicDir = resolve(rootDir, "./public");
		const outputPath = resolve(publicDir, "./chromium-pack.tar");

		console.log(
			`Creating chromium archive... (${chromiumBinDir} → ${outputPath})`,
		);

		execSync(
			`mkdir -p ${publicDir} && tar -cf "${outputPath}" -C "${chromiumBinDir}" .`,
			{
				stdio: "inherit",
				cwd: rootDir,
			},
		);

		console.log("Successfully created chromium archive!");
	} else {
		console.error(
			"Chromium bin directory is not found. Skipping archive creation.",
		);
	}
} catch (error) {
	console.error("Failed to create chromium archive.");
	console.error(error);
}
