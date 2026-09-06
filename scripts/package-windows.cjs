const { spawnSync } = require("node:child_process");
const {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const projectDirectory = path.resolve(__dirname, "..");
const releaseDirectory = path.join(projectDirectory, "release");
const stagingDirectory = mkdtempSync(
  path.join(os.tmpdir(), "baloons-package-"),
);
const builderCli = path.join(
  projectDirectory,
  "node_modules",
  "electron-builder",
  "cli.js",
);
const childEnvironment = { ...process.env };

// Some editor-integrated terminals set this variable for their own Electron
// processes. It must not leak into the app packaging process.
delete childEnvironment.ELECTRON_RUN_AS_NODE;

const result = spawnSync(
  process.execPath,
  [
    builderCli,
    "--win",
    "nsis",
    "portable",
    `--config.directories.output=${stagingDirectory}`,
  ],
  {
    cwd: projectDirectory,
    env: childEnvironment,
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

mkdirSync(releaseDirectory, { recursive: true });

const artifacts = readdirSync(stagingDirectory).filter((fileName) =>
  /^Baloons-(?:Setup|Portable)-.+\.exe$/.test(fileName),
);

if (artifacts.length !== 2) {
  console.error(
    `Expected a setup and portable executable, found: ${artifacts.join(", ") || "none"}`,
  );
  process.exit(1);
}

for (const artifact of artifacts) {
  copyFileSync(
    path.join(stagingDirectory, artifact),
    path.join(releaseDirectory, artifact),
  );
  console.log(`Created release/${artifact}`);
}

try {
  rmSync(stagingDirectory, { recursive: true, force: true });
} catch (error) {
  console.warn(`Could not clean temporary build files: ${error.message}`);
}
