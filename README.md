# create-shiny-react-app

A CLI tool to quickly create new shiny-react applications with pre-configured templates.

## Installation

```bash
npm install -g create-shiny-react-app
```

## Usage

```bash
create-shiny-react-app my-app
```

This will create a new shiny-react application in the `my-app` directory with your choice of template.

## Interactive Setup

The CLI will prompt you to:

1. Choose from example templates from [shiny-react](https://github.com/wch/shiny-react)
2. Optionally include CLAUDE.md for LLM coding assistance

## Development Workflow

After creating your app:

```bash
cd my-app
npm install
npm run watch    # Start development with hot reload
```

Then in another terminal:

```bash
# For R backend
R -e "options(shiny.autoreload = TRUE); shiny::runApp('r/app.R', port=8000)"

# For Python backend
shiny run py/app.py --port 8000 --reload
```

Open http://localhost:8000 in your browser.

## Requirements

- Node.js 16+ 
- For R backend: R with Shiny package
- For Python backend: Python with shiny package

## License

MIT