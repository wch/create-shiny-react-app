# create-shiny-react-app

A CLI tool to quickly create new shiny-react applications with pre-configured templates. Build modern, interactive web applications that combine React's component system with Shiny's reactive backend capabilities.

## Quick Start

The fastest way to create a new shiny-react application is with npx (no installation required):

```bash
# Create a new app in myapp/
npx create-shiny-react-app myapp
# You will be asked which template and which backend (R or Python) to use

cd myapp
npm install
npm run dev  # Builds frontend and starts Shiny app
```

The `npm run dev` command will build the frontend and start the Shiny app automatically with hot-reload. By default it will use port 8000.

Open http://localhost:8000 in your browser to see your app.


You can change the port by setting the `PORT` environment variable:

```bash
PORT=8001 npm run dev
```

Some other ways of building the frontend and running the app:

```bash
# Build frontend once (without launching Shiny app)
npm run build

# Build frontend and auto-rebuild on changes (without launching Shiny app)
npm run watch

# Start Shiny app manually (in separate terminal)
# For R backend
R -e "options(shiny.autoreload = TRUE); shiny::runApp('r/app.R', port=8000)"

# For Python backend
shiny run py/app.py --port 8000 --reload
```


## Templates

Click on the template name to view its code and README.md file.

- [**1-basic**](templates/1-basic/):
    - This is the most basic template, showing how to use shiny-react with R and Python backends.

- [**2-scaffold**](templates/2-scaffold/):
    - This template shows how to use shiny-react with shadcn/ui and tailwindcss.
    - It can include a CLAUDE.md file for AI coding assistance.
    - It also has editor and linter configuration files for a streamlined development experience.


## Installation

### Option 1: Use with npx

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

## Available npm Scripts

Generated applications include the following npm scripts:

- **`npm run dev`** - **Start development** - Builds frontend and starts Shiny server with hot-reload
- **`npm run build`** - **Production build** - Build frontend once (includes TypeScript checking)
- **`npm run watch`** - **Development build** - Watch frontend files for changes and rebuild automatically
- **`npm run shinyapp`** - **Start Shiny server** - Start only the Shiny backend server
- **`npm run build-prod`** - **Optimized build** - Production build with optimization (advanced templates)
- **`npm run clean`** - **Clean build** - Remove all generated files

### Port Configuration

You can configure the port for the Shiny server:

```bash
# Use custom port (default is 8000)
PORT=3000 npm run dev
PORT=3000 npm run shinyapp
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
