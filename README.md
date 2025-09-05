# create-shiny-react-app

A CLI tool to quickly create new shiny-react applications with pre-configured templates. Build modern, interactive web applications that combine React's component system with Shiny's reactive backend capabilities.

## Quick Start

The fastest way to create a new shiny-react application is with npx (no installation required):

```bash
# Create a new app in my-app/
npx create-shiny-react-app my-app
# You will be asked which template and which backend (R or Python) to use

cd my-app
npm install
npm run watch
```

Then, in Positron, RStudio, or other editor, open r/app.R or py/app.py and launch the app. Or, in another terminal, start the app:

```bash
# For R backend
cd my-app
R -e "options(shiny.autoreload = TRUE); shiny::runApp('r/app.R', port=8000)"

# For Python backend
cd my-app
shiny run py/app.py --port 8000 --reload
```

Open http://localhost:8000 in your browser to see your app.


## Installation

### Option 1: Use with npx (Recommended)

No installation required. Always uses the latest version:

```bash
npx create-shiny-react-app my-app
```

### Option 2: Global Installation

Install globally for repeated use:

```bash
npm install -g create-shiny-react-app
create-shiny-react-app my-app
```

> **Important:** If you have the CLI installed globally, run `npm update -g create-shiny-react-app` periodically to get the latest templates and features.


## Interactive Setup

When you run the command, the CLI will interactively prompt you to:

1. **Choose a template** - Select from the available example templates
2. **Select backend** - Choose R, Python, or both
3. **Include CLAUDE.md** - Optionally add comprehensive documentation for LLM coding assistance

## Project Structure

Created applications follow this structure:

```
my-app/
├── package.json       # Build configuration and dependencies
├── tsconfig.json      # TypeScript configuration
├── srcts/             # React TypeScript source code
│   ├── main.tsx       # React app entry point
│   └── components/    # React components using shiny-react hooks
├── r/                 # R Shiny backend (if selected)
│   ├── app.R          # Main R Shiny application
│   ├── shinyreact.R   # R functions for shiny-react
│   └── www/           # Built JavaScript/CSS output (generated)
└── py/                # Python Shiny backend (if selected)
    ├── app.py         # Main Python Shiny application
    ├── shinyreact.py  # Python functions for shiny-react
    └── www/           # Built JavaScript/CSS output (generated)
```

## Requirements

- **Node.js** 18+
- **For R backend**: R with Shiny package (`install.packages("shiny")`)
- **For Python backend**: Python with shiny package (`pip install shiny`)

## Related Projects

- [shiny-react](https://github.com/wch/shiny-react) - The core React bindings library
- [Shiny for R](https://shiny.posit.co/) - R web application framework
- [Shiny for Python](https://shiny.posit.co/py/) - Python web application framework

## License

MIT