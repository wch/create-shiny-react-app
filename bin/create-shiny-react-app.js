#!/usr/bin/env node

import fs from "node:fs";
import path, { dirname } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

// ES module compatibility for __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Backend options
const BACKENDS = [
  { id: "r", name: "R (Shiny for R)" },
  { id: "py", name: "Python (Shiny for Python)" },
];

const SKIP_PATHS = ["node_modules", "www", "__pycache__", ".DS_Store"];

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

// Helper functions for colored output
const c = {
  error: (text) => `${colors.red}${text}${colors.reset}`,
  success: (text) => `${colors.green}${text}${colors.reset}`,
  info: (text) => `${colors.blue}${text}${colors.reset}`,
  warning: (text) => `${colors.yellow}${text}${colors.reset}`,
  highlight: (text) => `${colors.cyan}${colors.bright}${text}${colors.reset}`,
  dim: (text) => `${colors.gray}${text}${colors.reset}`,
  bold: (text) => `${colors.bright}${text}${colors.reset}`,
};

// Dynamically discover available templates
function getAvailableTemplates(templatesDir) {
  if (!fs.existsSync(templatesDir)) {
    console.error(c.error("❌ Error: Templates directory not found."));
    process.exit(1);
  }

  const templates = [];
  const entries = fs.readdirSync(templatesDir);

  for (const entry of entries) {
    const templatePath = path.join(templatesDir, entry);
    const stat = fs.statSync(templatePath);

    if (stat.isDirectory() && !SKIP_PATHS.includes(entry)) {
      // Read package.json or README.md to get template info
      let name = entry;
      let description = "Shiny-React template";

      const packageJsonPath = path.join(templatePath, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8")
          );
          if (packageJson.description) {
            description = packageJson.description;
          }
          // Extract name from directory (e.g., "1-basic" -> "Basic")
          const nameParts = entry.split("-").slice(1);
          if (nameParts.length > 0) {
            name = nameParts
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");
          }
        } catch (e) {
          // Continue with defaults if package.json is invalid
        }
      }

      templates.push({
        id: entry,
        name: name,
        description: description,
      });
    }
  }

  return templates.sort((a, b) => a.id.localeCompare(b.id));
}

function copyRecursive(src, dest, options = {}) {
  const { skipBackends = [] } = options;

  if (!fs.existsSync(src)) {
    console.error(c.error(`❌ Error: Template directory not found at ${src}`));
    process.exit(1);
  }

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach((file) => {
      // Skip node_modules and build outputs
      if (SKIP_PATHS.includes(file)) {
        return;
      }

      // Skip backend directories based on user selection
      if (skipBackends.includes(file)) {
        return;
      }

      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath, options);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function updatePackageJson(targetDir, appName, selectedBackend) {
  const packageJsonPath = path.join(targetDir, "package.json");
  const packageCustomPath = path.join(targetDir, "package-custom.json");

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.name = appName;

    // Apply backend-specific configuration if available
    if (fs.existsSync(packageCustomPath)) {
      try {
        const packageConfig = JSON.parse(
          fs.readFileSync(packageCustomPath, "utf8")
        );
        const backendConfig = packageConfig[selectedBackend];

        if (backendConfig) {
          // Apply backend-specific configurations
          Object.keys(backendConfig).forEach((key) => {
            packageJson[key] = { ...packageJson[key], ...backendConfig[key] };
          });
        }

        // Remove the package-custom.json file after applying it
        fs.unlinkSync(packageCustomPath);
      } catch (e) {
        console.log(
          c.warning(
            "⚠️ Warning: Could not apply customized package configuration for R/Python!"
          )
        );
      }
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function showTemplates(templates) {
  console.log(c.bold("📋 Available templates:"));
  console.log("");
  templates.forEach((template, index) => {
    console.log(`  ${c.highlight(index + 1 + ".")} ${c.bold(template.name)}`);
    console.log(`     ${template.description}`);
    console.log("");
  });
}

function showBackends() {
  console.log(c.bold("🚀 Available backends:"));
  console.log("");
  BACKENDS.forEach((backend, index) => {
    console.log(`  ${c.highlight(index + 1 + ".")} ${c.bold(backend.name)}`);
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.log(c.bold("Usage: create-shiny-react-app <app-name>"));
    console.log("");
    console.log(
      c.dim(
        "Creates a new shiny-react application with your choice of template."
      )
    );
    console.log("");
    console.log(c.bold("Example:"));
    console.log(`  ${c.highlight("create-shiny-react-app myapp")}`);
    process.exit(1);
  }

  const appName = args[0];
  const targetDir = path.resolve(appName);

  // Check if target directory already exists
  if (fs.existsSync(targetDir)) {
    console.error(c.error(`❌ Error: Directory "${appName}" already exists`));
    process.exit(1);
  }

  // Use templates from this CLI package
  const cliPackageDir = path.dirname(__dirname);
  const templatesDir = path.join(cliPackageDir, "templates");

  if (!fs.existsSync(templatesDir)) {
    console.error(
      c.error("❌ Error: templates/ directory not found in CLI package.")
    );
    console.error(
      c.dim("Please ensure create-shiny-react-app is properly installed.")
    );
    process.exit(1);
  }

  // Get available templates dynamically
  const availableTemplates = getAvailableTemplates(templatesDir);

  try {
    console.log(
      c.success(`✨ Creating new shiny-react app: ${c.highlight(appName)}`)
    );
    console.log("");

    // Show available templates
    showTemplates(availableTemplates);

    // Get user's template choice
    const templateChoice = await question(
      c.info(`Choose a template (1-${availableTemplates.length}) [2]: `)
    );
    const choiceIndex = parseInt(templateChoice || "2") - 1;

    if (choiceIndex < 0 || choiceIndex >= availableTemplates.length) {
      console.error(
        c.error(
          `❌ Invalid choice. Please select a number between 1 and ${availableTemplates.length}.`
        )
      );
      process.exit(1);
    }

    const selectedTemplate = availableTemplates[choiceIndex];
    const templateDir = path.join(templatesDir, selectedTemplate.id);

    console.log("");

    // Show backend options
    showBackends();
    console.log("");

    // Get user's backend choice
    const backendChoice = await question(
      c.info("Choose a backend (1-2) [1]: ")
    );
    const backendIndex = parseInt(backendChoice || "3") - 1;

    if (backendIndex < 0 || backendIndex >= BACKENDS.length) {
      console.error(
        c.error("❌ Invalid choice. Please select a number between 1 and 2.")
      );
      process.exit(1);
    }

    const selectedBackend = BACKENDS[backendIndex];

    // Determine which backends to skip
    const skipBackends = [];
    if (selectedBackend.id === "r") {
      skipBackends.push("py");
    } else if (selectedBackend.id === "py") {
      skipBackends.push("r");
    }

    console.log("");

    // Ask about Python package manager if Python is selected
    let pythonPackageManager = null;
    if (selectedBackend.id === "py") {
      console.log(c.bold("📦Show instructions for Python package manager:"));
      console.log("");
      console.log(
        `  ${c.highlight("1.")} ${c.bold("uv")} (recommended - fastest)`
      );
      console.log(`  ${c.highlight("2.")} ${c.bold("pip")} (standard)`);
      console.log(
        `  ${c.highlight("3.")} ${c.bold("None")} (skip package installation instructions)`
      );
      console.log("");

      let packageManagerChoice;
      do {
        packageManagerChoice = await question(
          c.info("Choose package manager (1-3) [1]: ")
        );
        const pmIndex = parseInt(packageManagerChoice || "1") - 1;

        if (pmIndex >= 0 && pmIndex <= 2) {
          const managers = ["uv", "pip", "none"];
          pythonPackageManager = managers[pmIndex];
          break;
        } else {
          console.log(c.error("❌ Please select a number between 1 and 3."));
        }
      } while (true);

      console.log("");
    }

    // Ask about CLAUDE.md
    console.log(
      c.bold("🤖 Include CLAUDE.md and SHINY-REACT.md for LLM assistance:")
    );
    console.log("");
    console.log(`  ${c.highlight("1.")} ${c.bold("Yes")} (recommended)`);
    console.log(`  ${c.highlight("2.")} ${c.bold("No")}`);
    console.log("");

    let shouldIncludeClaude;
    let claudeChoice;

    do {
      claudeChoice = await question(c.info("Choose an option (1-2) [1]: "));
      const choiceIndex = parseInt(claudeChoice || "1") - 1;

      if (choiceIndex === 0) {
        shouldIncludeClaude = true;
        break;
      } else if (choiceIndex === 1) {
        shouldIncludeClaude = false;
        break;
      } else {
        console.log(c.error("❌ Please select a number between 1 and 2."));
      }
    } while (true);

    console.log("");
    console.log("ℹ️ Configuration summary:");
    console.log(
      `  Template: ${c.highlight(selectedTemplate.name)} (${selectedTemplate.id})`
    );
    console.log(`  Backend: ${c.highlight(selectedBackend.name)}`);
    console.log(`  Target: ${c.highlight(targetDir)}`);
    if (shouldIncludeClaude) {
      console.log(`  Including: ${c.highlight("CLAUDE.md + SHINY-REACT.md")}`);
    }
    console.log("");

    // Copy the selected template with backend filtering
    copyRecursive(templateDir, targetDir, { skipBackends });

    // Update package.json with the new app name, proper @posit/shiny-react dependency, and build scripts
    updatePackageJson(targetDir, appName, selectedBackend.id);

    // Copy CLAUDE.md template if requested
    if (shouldIncludeClaude) {
      const claudeTemplatePath = path.join(templatesDir, "CLAUDE.md.template");
      const claudeDestPath = path.join(targetDir, "CLAUDE.md");
      const shinyReactDocsPath = path.join(templatesDir, "SHINY-REACT.md");
      const shinyReactDestPath = path.join(targetDir, "SHINY-REACT.md");

      // Copy and customize CLAUDE.md.template
      if (fs.existsSync(claudeTemplatePath)) {
        // Read template and customize it with app name
        let claudeContent = fs.readFileSync(claudeTemplatePath, "utf8");
        claudeContent = claudeContent.replace(/\{project_name\}/g, appName);
        fs.writeFileSync(claudeDestPath, claudeContent);
      } else {
        console.log(
          c.warning("⚠️ Warning: CLAUDE.md.template not found, skipping...")
        );
      }

      // Copy shiny-react.md documentation (no customization needed)
      if (fs.existsSync(shinyReactDocsPath)) {
        fs.copyFileSync(shinyReactDocsPath, shinyReactDestPath);
      } else {
        console.log(
          c.warning("⚠️ Warning: SHINY-REACT.md not found, skipping...")
        );
      }
    }

    console.log(c.success("✅ App created successfully!"));
    console.log("");
    console.log(c.bold("🚀 Next steps:"));

    console.log("  # Go to app directory:");
    console.log(`  ${c.highlight(`cd ${appName}`)}`);
    console.log("");

    console.log("  # Install JavaScript dependencies:");
    console.log(`  ${c.highlight("npm install")}`);
    console.log("");

    if (selectedBackend.id === "py" && pythonPackageManager !== "none") {
      console.log("  # Install Python dependencies:");
      console.log("    # Optional: Set up virtual environment");
      if (pythonPackageManager === "uv") {
        console.log(`    ${c.highlight("uv venv")}`);
      } else {
        console.log(`    ${c.highlight("python -m venv .venv")}`);
      }
      const isWindows = process.platform === "win32";
      const activateCommand = isWindows
        ? "    .venv\\Scripts\\activate"
        : "    source .venv/bin/activate";
      console.log(`    ${c.highlight(activateCommand.trim())}`);
      console.log("");
      console.log("    # Install Python packages:");

      if (pythonPackageManager === "uv") {
        console.log(
          `    ${c.highlight("uv pip install -r py/requirements.txt")}`
        );
      } else if (pythonPackageManager === "pip") {
        console.log(`    ${c.highlight("pip install -r py/requirements.txt")}`);
      }
      console.log("");
    }

    let appFilesString = "";
    if (selectedBackend.id === "r") {
      appFilesString += "r/app.R";
    }
    if (selectedBackend.id === "py") {
      appFilesString += "py/app.py";
    }

    console.log(
      "  # Build the frontend JS and launch the Shiny app (will rebuild/reload on changes):"
    );
    console.log(`  ${c.highlight("npm run dev")}`);

    console.log("");
    console.log(
      `${c.success("🌐 Open")} ${c.highlight("http://localhost:8000")} ${c.success("in your browser.")}`
    );

    if (selectedTemplate.id.includes("chat")) {
      console.log("");
      console.log(
        c.warning("📝 Note: The AI chat template requires LLM API keys.")
      );
      console.log("   See the README.md for setup instructions.");
    }
  } catch (error) {
    console.error(c.error(`❌ Error creating app: ${error.message}`));
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
