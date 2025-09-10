#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Backend options
const BACKENDS = [
  { id: "r", name: "R (Shiny for R)" },
  { id: "py", name: "Python (Shiny for Python)" },
  { id: "both", name: "Both R and Python" },
];

const SKIP_PATHS = ["node_modules", "www", "__pycache__", ".DS_Store"];

// Dynamically discover available templates
function getAvailableTemplates(templatesDir) {
  if (!fs.existsSync(templatesDir)) {
    console.error("Error: Templates directory not found.");
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
    console.error(`Error: Template directory not found at ${src}`);
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
  const packageConfigPath = path.join(targetDir, "package-config.json");

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.name = appName;

    // Apply backend-specific configuration if available
    if (fs.existsSync(packageConfigPath)) {
      try {
        const packageConfig = JSON.parse(
          fs.readFileSync(packageConfigPath, "utf8")
        );
        const backendConfig = packageConfig[selectedBackend];

        if (backendConfig) {
          // Replace scripts entirely with backend-specific configuration
          if (backendConfig.scripts) {
            packageJson.scripts = backendConfig.scripts;
          }

          // Apply any other backend-specific configurations
          Object.keys(backendConfig).forEach((key) => {
            if (key !== "scripts") {
              packageJson[key] = { ...packageJson[key], ...backendConfig[key] };
            }
          });
        }

        // Remove the package-config.json file after applying it
        fs.unlinkSync(packageConfigPath);
      } catch (e) {
        console.log(
          "Warning: Could not apply package configuration, using defaults"
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
  console.log("Available templates:");
  console.log("");
  templates.forEach((template, index) => {
    console.log(`  ${index + 1}. ${template.name}`);
    console.log(`     ${template.description}`);
    console.log("");
  });
}

function showBackends() {
  console.log("Available backends:");
  console.log("");
  BACKENDS.forEach((backend, index) => {
    console.log(`  ${index + 1}. ${backend.name}`);
    console.log("");
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.log("Usage: create-shiny-react-app <app-name>");
    console.log("");
    console.log(
      "Creates a new shiny-react application with your choice of template."
    );
    console.log("");
    console.log("Example:");
    console.log("  create-shiny-react-app my-app");
    process.exit(1);
  }

  const appName = args[0];
  const targetDir = path.resolve(appName);

  // Check if target directory already exists
  if (fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${appName}" already exists`);
    process.exit(1);
  }

  // Use templates from this CLI package
  const cliPackageDir = path.dirname(__dirname);
  const templatesDir = path.join(cliPackageDir, "templates");

  if (!fs.existsSync(templatesDir)) {
    console.error("Error: templates/ directory not found in CLI package.");
    console.error(
      "Please ensure create-shiny-react-app is properly installed."
    );
    process.exit(1);
  }

  // Get available templates dynamically
  const availableTemplates = getAvailableTemplates(templatesDir);

  try {
    console.log(`Creating new shiny-react app: ${appName}`);
    console.log("");

    // Show available templates
    showTemplates(availableTemplates);

    // Get user's template choice
    const templateChoice = await question(
      `Choose a template (1-${availableTemplates.length}) [1]: `
    );
    const choiceIndex = parseInt(templateChoice || "1") - 1;

    if (choiceIndex < 0 || choiceIndex >= availableTemplates.length) {
      console.error(
        `Invalid choice. Please select a number between 1 and ${availableTemplates.length}.`
      );
      process.exit(1);
    }

    const selectedTemplate = availableTemplates[choiceIndex];
    const templateDir = path.join(templatesDir, selectedTemplate.id);

    console.log("");

    // Show backend options
    showBackends();

    // Get user's backend choice
    const backendChoice = await question("Choose a backend (1-3) [3]: ");
    const backendIndex = parseInt(backendChoice || "3") - 1;

    if (backendIndex < 0 || backendIndex >= BACKENDS.length) {
      console.error("Invalid choice. Please select a number between 1 and 3.");
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
    // If "both", don't skip anything

    console.log("");

    // Ask about CLAUDE.md
    let includeClaude;
    let shouldIncludeClaude;

    do {
      includeClaude = await question(
        "Include CLAUDE.md for LLM assistance? (Y/n): "
      );
      const lowerResponse = includeClaude.toLowerCase();

      if (lowerResponse === "n" || lowerResponse === "no") {
        shouldIncludeClaude = false;
        break;
      } else if (
        lowerResponse === "y" ||
        lowerResponse === "yes" ||
        lowerResponse === ""
      ) {
        shouldIncludeClaude = true;
        break;
      } else {
        console.log("Please enter 'y', 'yes', 'n', or 'no'.");
      }
    } while (true);

    console.log("");
    console.log(`Template: ${selectedTemplate.name} (${selectedTemplate.id})`);
    console.log(`Backend: ${selectedBackend.name}`);
    console.log(`Target: ${targetDir}`);
    if (shouldIncludeClaude) {
      console.log("Including: CLAUDE.md");
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

      if (fs.existsSync(claudeTemplatePath)) {
        // Read template and customize it with app name
        let claudeContent = fs.readFileSync(claudeTemplatePath, "utf8");
        claudeContent = claudeContent.replace(/hello-world-app/g, appName);
        fs.writeFileSync(claudeDestPath, claudeContent);
      } else {
        console.log("Warning: CLAUDE.md.template not found, skipping...");
      }
    }

    console.log("✅ App created successfully!");
    console.log("");
    console.log("Next steps:");

    console.log(`  cd ${appName}`);
    console.log("  npm install");
    console.log(
      "  npm run watch  # Start automatic rebuilds of JavaScript and CSS"
    );

    console.log("");

    let appFilesString = "";
    if (selectedBackend.id === "r" || selectedBackend.id === "both") {
      appFilesString += "r/app.R";
    }
    if (selectedBackend.id === "both") {
      appFilesString += " or ";
    }
    if (selectedBackend.id === "py" || selectedBackend.id === "both") {
      appFilesString += "py/app.py";
    }
    console.log(
      `Then, in Positron, RStudio, or other editor, open ${appFilesString} and launch the app,`
    );
    console.log("or, in another terminal, run the following:");

    if (selectedBackend.id === "r" || selectedBackend.id === "both") {
      console.log("  # For R backend:");
      console.log(`  cd ${appName}`);
      console.log(
        "  R -e \"options(shiny.autoreload = TRUE); shiny::runApp('r/app.R', port=8000)\""
      );
    }

    if (selectedBackend.id === "both") {
      console.log("");
    }

    if (selectedBackend.id === "py" || selectedBackend.id === "both") {
      console.log("  # For Python backend:");
      console.log(`  cd ${appName}`);
      console.log("  shiny run py/app.py --port 8000 --reload");
    }

    console.log("");
    console.log("Open http://localhost:8000 in your browser.");

    if (selectedTemplate.id.includes("chat")) {
      console.log("");
      console.log("📝 Note: The AI chat template requires LLM API keys.");
      console.log("   See the README.md for setup instructions.");
    }
  } catch (error) {
    console.error("Error creating app:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
