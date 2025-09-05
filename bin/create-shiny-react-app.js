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

    if (stat.isDirectory() && !entry.startsWith(".")) {
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
      if (file === "node_modules" || file === "www") {
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
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.name = appName;
    packageJson.version = "1.0.0";

    // Update shiny-react dependency to use npm package
    if (packageJson.dependencies && packageJson.dependencies["@posit/shiny-react"]) {
      packageJson.dependencies["@posit/shiny-react"] = "^0.0.6";
    }

    // Generate build scripts based on backend selection
    const scripts = {};

    if (selectedBackend === "r") {
      scripts.build =
        "esbuild srcts/main.tsx --bundle --outfile=r/www/main.js --format=esm --minify --alias:react=react && tsc --noEmit";
      scripts.watch =
        'concurrently "esbuild srcts/main.tsx --bundle --outfile=r/www/main.js --format=esm --minify --alias:react=react --watch" "tsc --noEmit --watch"';
      scripts.clean = "rm -rf r/www";
    } else if (selectedBackend === "py") {
      scripts.build =
        "esbuild srcts/main.tsx --bundle --outfile=py/www/main.js --format=esm --minify --alias:react=react && tsc --noEmit";
      scripts.watch =
        'concurrently "esbuild srcts/main.tsx --bundle --outfile=py/www/main.js --format=esm --minify --alias:react=react --watch" "tsc --noEmit --watch"';
      scripts.clean = "rm -rf py/www";
    } else if (selectedBackend === "both") {
      scripts.build =
        'concurrently "npm run build-r" "npm run build-py" "tsc --noEmit"';
      scripts.watch =
        'concurrently "npm run watch-r" "npm run watch-py" "tsc --noEmit --watch"';
      scripts["build-r"] =
        "esbuild srcts/main.tsx --bundle --outfile=r/www/main.js --format=esm --minify --alias:react=react";
      scripts["watch-r"] =
        "esbuild srcts/main.tsx --bundle --outfile=r/www/main.js --format=esm --minify --alias:react=react --watch";
      scripts["build-py"] =
        "esbuild srcts/main.tsx --bundle --outfile=py/www/main.js --format=esm --minify --alias:react=react";
      scripts["watch-py"] =
        "esbuild srcts/main.tsx --bundle --outfile=py/www/main.js --format=esm --minify --alias:react=react --watch";
      scripts.clean = "rm -rf r/www py/www";
    }

    packageJson.scripts = scripts;

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

function getNextSteps(appName, selectedBackend) {
  const steps = [
    `cd ${appName}`,
    "npm install",
    "npm run watch    # Start development with automatic rebuilds of JavaScript and CSS files",
  ];

  return steps;
}

function getBackendInstructions(selectedBackend) {
  const instructions = [];

  if (selectedBackend === "r" || selectedBackend === "both") {
    instructions.push("  # For R backend:");
    instructions.push(
      "  R -e \"options(shiny.autoreload = TRUE); shiny::runApp('r/app.R', port=8000)\""
    );
  }

  if (selectedBackend === "py" || selectedBackend === "both") {
    if (instructions.length > 0) instructions.push("");
    instructions.push("  # For Python backend:");
    instructions.push("  shiny run py/app.py --port 8000 --reload");
  }

  return instructions;
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

  // Locate shiny-react package templates
  let shinyReactPath;
  try {
    // Try to resolve from the CLI package's node_modules first
    const cliPackageDir = path.dirname(__dirname);

    // Try different resolution strategies
    try {
      const resolvedPath = require.resolve("@posit/shiny-react", {
        paths: [cliPackageDir],
      });
      // The resolved path is to the entry point (dist/index.js), we need the package root
      shinyReactPath = path.dirname(path.dirname(resolvedPath));
    } catch (e1) {
      // Fallback: try direct path to node_modules
      const directPath = path.join(
        cliPackageDir,
        "node_modules",
        "@posit/shiny-react"
      );
      if (fs.existsSync(directPath)) {
        shinyReactPath = directPath;
      } else {
        throw new Error("Package not found");
      }
    }
  } catch (error) {
    console.error("Error: @posit/shiny-react package not found.");
    console.error("Please ensure @posit/shiny-react is installed.");
    console.error("Run: npm install -g create-shiny-react-app");
    process.exit(1);
  }

  let templatesDir = path.join(shinyReactPath, "templates");

  // Fallback for development: check if we're in the development environment
  if (!fs.existsSync(templatesDir)) {
    const devTemplatesDir = path.join(__dirname, "..", "..", "templates");
    if (fs.existsSync(devTemplatesDir)) {
      templatesDir = devTemplatesDir;
      console.log("Using development templates directory");
    } else {
      console.error(
        "Error: Templates directory not found in @posit/shiny-react package or development directory."
      );
      process.exit(1);
    }
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
    const includeClaude = await question(
      "Include CLAUDE.md for LLM assistance? (y/N): "
    );
    const shouldIncludeClaude =
      includeClaude.toLowerCase() === "y" ||
      includeClaude.toLowerCase() === "yes";

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

    const nextSteps = getNextSteps(appName, selectedBackend.id);
    nextSteps.forEach((step) => console.log(`  ${step}`));

    console.log("");
    console.log("Then in another terminal:");
    const backendInstructions = getBackendInstructions(selectedBackend.id);
    backendInstructions.forEach((instruction) => console.log(instruction));

    console.log("");
    console.log("Open http://localhost:8000 in your browser");

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
