# shadcn/ui Integration Example

This example demonstrates how to set up and use **shadcn/ui** components with **shiny-react**. It shows the complete setup process, build configuration, and practical usage patterns for building modern, professionally-styled React applications with Shiny backends.

## What This Example Demonstrates

### shadcn/ui Setup
- **Theme System**: CSS variables in `srcts/globals.css` for light/dark modes and custom design tokens
- **shadcn/ui CLI**: `components.json` configures the shadcn CLI for component installation

### Tailwind CSS
- **Tailwind CSS v4**
- **Global Styles**: Configured in `srcts/globals.css` with `@import "tailwindcss"`
- **Build Integration**: Tailwind processing handled by `esbuild-plugin-tailwindcss` in the build script

### Build Configuration
- **Custom Build Script**: `build.ts` generates the main.js and main.css files

### Linter/Editor Configuration

This example includes configuration files for TypeScript, Prettier, and ESLint. It also includes a VSCode settings file which does things like auto-format files on save. You can remove or change these files to fit your taste.

- **TypeScript** (TypeScript type checker): `tsconfig.json`
- **ESLint** (JavaScript and TypeScript linter): `eslint.config.mjs`
- **Prettier** (code formatter): `.prettierrc`
- **VSCode** (editor settings): `.vscode/settings.json`

### AI Coding Agent Integration
- **Context File**: When you instantiate the app, you can choose to add a CLAUDE.md file with information about shiny-react and shadcn/ui. This will be used as context for the Claude Code coding agent. If you wish to use a different AI coding agent, you may need to change this filename.
- **shadcn MCP server**: This example also includes an MCP server for shadcn/ui components. This will help the coding agent to find and use shadcn/ui components more effectively than it would without the MCP server. When you start Claude Code in this directory, it will ask you if you want to use this MCP Server.


## Directory Structure

```
my-app/
├── .mcp.json                # MCP server config for shadcn/ui components
├── package.json             # Dependencies including shadcn/ui packages
├── tsconfig.json            # TypeScript configuration with path aliases
├── components.json          # shadcn/ui CLI configuration
├── build.ts                 # Custom build script with Tailwind processing
├── srcts/                   # React TypeScript source
│   ├── main.tsx             # Application entry point
│   ├── globals.css          # Global styles and CSS variables
│   ├── css.d.ts             # CSS module type definitions
│   ├── lib/
│   │   └── utils.ts         # Utility functions (cn helper)
│   └── components/
│       ├── ui/              # shadcn/ui base components
│       │   ├── card.tsx     # Card component
│       │   ├── input.tsx    # Input component
│       │   └── separator.tsx # Separator component
│       └── App.tsx          # Main application component
├── r/                       # R Shiny backend
│   ├── app.R                # Main R application
│   ├── shinyreact.R         # R functions for shiny-react
│   └── www/                 # Built assets (auto-generated)
│       ├── main.js          # Built JavaScript bundle
│       └── main.css         # Built CSS bundle
└── py/                      # Python Shiny backend
    ├── app.py               # Main Python application
    ├── requirements.txt     # Python dependencies
    ├── shinyreact.py        # Python functions for shiny-react
    └── www/                 # Built assets (auto-generated)
        ├── main.js          # Built JavaScript bundle
        └── main.css         # Built CSS bundle
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Frontend

```bash
# Build once
npm run build

# Or watch for changes during development
npm run watch
```

### 3. Run the Shiny Server

**Option A: R Backend**
```bash
R -e "options(shiny.autoreload = TRUE); shiny::runApp('r/app.R', port=8000)"
```

**Option B: Python Backend**
```bash
# Install Python dependencies first
pip install -r py/requirements.txt

# Run the server
shiny run py/app.py --port 8000 --reload
```

### 4. Open Your Browser

Navigate to `http://localhost:8000` to see the shadcn/ui components in action.


## Setup Guide

### Adding New shadcn/ui Components

You can add new shadcn/ui components to this project. For example, this will add a button component:

```bash
npx shadcn@latest add button
```

Then you can import and use the component in your React components.

```typescript
import { Button } from "@/components/ui/button";
```

You can also modify component files in `components/ui/` as needed.

Or, if you are using the shadcn MCP server, you can ask your coding agent to add components for you.

### Theme Customization

- **CSS Variables**: Modify theme colors and spacing in `globals.css`
- **Tailwind Config**: Adjust utility classes and responsive breakpoints
- **Component Variants**: Use built-in variants or add custom ones
