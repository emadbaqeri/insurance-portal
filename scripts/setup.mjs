import { spawnSync } from "node:child_process";

// Color output utilities
const styles = {
	success: { open: "\u001b[32;1m", close: "\u001b[0m" },
	danger: { open: "\u001b[31;1m", close: "\u001b[0m" },
	info: { open: "\u001b[36;1m", close: "\u001b[0m" },
	subtitle: { open: "\u001b[2;1m", close: "\u001b[0m" },
};

function color(modifier, string) {
	return styles[modifier].open + string + styles[modifier].close;
}

// Helper function to run commands with error handling
function runCommand(command, errorMessage) {
	const result = spawnSync(command, {
		shell: true,
		stdio: "inherit",
		env: { ...process.env, FORCE_COLOR: "1" },
	});

	if (result.status !== 0) {
		console.error(color("danger", `🚨 ${errorMessage}`));
		process.exit(result.status);
	}
}

// Main setup process
async function main() {
	try {
		console.log(color("info", "\n🚀 Starting project setup...\n"));

		// Verify Node.js version
		const [nodeMajor] = process.versions.node.split(".").map(Number);
		if (nodeMajor < 20) {
			console.error(
				color(
					"danger",
					`❌ Node.js v20+ required (current: ${process.versions.node})`,
				),
			);
			process.exit(1);
		}

		// Verify npm is installed and version is 10 or higher
		const npmVersionCheck = spawnSync("npm --version", {
			shell: true,
			encoding: "utf-8",
		});
		if (npmVersionCheck.status !== 0) {
			console.error(
				color(
					"danger",
					"❌ npm is required but not found. Install Node.js or npm.",
				),
			);
			process.exit(1);
		}

		const [npmMajor] = npmVersionCheck.stdout.trim().split(".").map(Number);
		if (npmMajor < 10) {
			console.error(
				color(
					"danger",
					`❌ npm v10+ required (current: ${npmVersionCheck.stdout.trim()}). Please update npm.`,
				),
			);
			process.exit(1);
		}

		// Install dependencies
		console.log(color("info", "\n📦 Installing dependencies..."));
		runCommand(
			"npm install",
			"Dependency installation failed. Check network connection and try again.",
		);

		// Setup git hooks
		console.log(color("info", "\n🔧 Configuring git hooks..."));
		runCommand(
			"npx lefthook install",
			"Git hooks setup failed. Check lefthook configuration.",
		);

		// Setup complete message
		console.log(color("success", "\n✅ Setup completed successfully!"));
		console.log(
			color(
				"subtitle",
				"\n👉 Run 'npm run dev' to start the development server.\n",
			),
		);
	} catch (error) {
		console.error(
			color("danger", "\n❌ Setup failed. Please fix errors and try again."),
			color(error),
		);
		process.exit(1);
	}
}

main();
