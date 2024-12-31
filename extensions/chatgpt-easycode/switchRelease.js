const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");

function copyFile(source, destination) {
  fs.copyFile(source, destination, (err) => {
    if (err) {
      console.error("Error copying file:", err);
      return;
    }
    console.log(
      `Successfully copied ${path.basename(source)} to ${path.basename(
        destination
      )}`
    );
  });
}

async function cloneGitRepo(targetDir) {
  const git = simpleGit();
  try {
    await git.clone(
      "https://github.com/Personabo-Technologies/ffmpeg",
      targetDir,
      ["-b", "windows"]
    );
    console.log(`Successfully download ffmpeg into ${targetDir}`);
  } catch (error) {
    console.error(`Failed to download ffmpeg: ${error.message}`);
    throw error;
  }
}

function deleteDirectory(directoryPath) {
  fs.rm(directoryPath, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error("Error deleting directory:", err);
      return;
    }
    console.log(`Successfully deleted directory: ${directoryPath}`);
  });
}

async function switchFiles(type) {
  const packageFileName =
    type === "release" ? "package-release.json" : "package-pre-release.json";
  const changelogFileName =
    type === "release" ? "CHANGELOG-release.md" : "CHANGELOG-pre-release.md";

  const packageSrcPath = path.join(__dirname, packageFileName);
  const packageDestPath = path.join(__dirname, "package.json");
  const changelogSrcPath = path.join(__dirname, changelogFileName);
  const changelogDestPath = path.join(__dirname, "CHANGELOG.md");

  copyFile(packageSrcPath, packageDestPath);
  copyFile(changelogSrcPath, changelogDestPath);

  const ffmpegBinSrcPath = path.join(__dirname, "resources", "bin");
  const ffmpegBinDestPath = path.join(__dirname, "dist", "bin");

  if (type === "pre-release") {
    const ffmpegExists = fs.existsSync(ffmpegBinDestPath);
    if (ffmpegExists) {
      console.log(`Exists ffmpeg in ${ffmpegBinDestPath}, skip download.`);
    } else {
      await cloneGitRepo(ffmpegBinDestPath);
    }
  } else {
    deleteDirectory(ffmpegBinDestPath);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

// Expected usage: node switchPackage.js release
// or: node switchPackage.js pre-release
if (args.length !== 1 || (args[0] !== "release" && args[0] !== "pre-release")) {
  console.error("Usage: node switchPackage.js <release|pre-release>");
  process.exit(1);
}

switchFiles(args[0]);
