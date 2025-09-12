# Hello World - Basic Template

This is a basic template example demonstrating how to use the shiny-react library to create React components that communicate with Shiny applications.

The front end is implemented with React and TypeScript. The Shiny backend can be implemented in either R or Python (or both). Depending on which language(s) you selected when creating this app, you may have an `r/` directory, a `py/` directory, or both.

The front end uses `useShinyInput` and `useShinyOutput` hooks to send and receive values from the Shiny back end. The back end is a Shiny application that uses `render_json` to send the output values to the front end as JSON. In this example, the Shiny back end simply capitalizes the input value and sends it back to the front end.

## Directory Structure

- **`r/`** - R Shiny application (if you selected R)
  - `app.R` - Main R Shiny server application
  - `shinyreact.R` - R utility functions
- **`py/`** - Python Shiny application (if you selected Python)
  - `app.py` - Main Python Shiny server application
  - `shinyreact.py` - Python utility functions
- **`srcts/`** - TypeScript/React source code
  - `main.tsx` - Entry point that renders the React app
  - `ExampleComponent.tsx` - Main React component using shiny-react hooks
  - `styles.css` - Simple CSS styling for the application
- **`r/www/`** - Built JavaScript output for R Shiny app (generated)
- **`py/www/`** - Built JavaScript output for Python Shiny app (generated)
- **`node_modules/`** - npm dependencies (generated)

## Getting Started

```bash
# Install dependencies
npm install

# Start development with hot-reload (recommended)
npm run dev
```

The `npm run dev` command will automatically:
- Build the TypeScript/React frontend
- Start the Shiny server with hot-reload
- Open your browser to http://localhost:8000

## Available npm Scripts

This template includes the following npm scripts:

### Development Scripts

- **`npm run dev`** - 🚀 **Start development** - Builds frontend and starts Shiny server with hot-reload
- **`npm run watch`** - 👀 **Watch frontend** - Watch TypeScript/React files for changes and rebuild
- **`npm run shinyapp`** - 🖥️ **Start Shiny server** - Start only the backend server (Python by default)

### Build Scripts  

- **`npm run build`** - 🔨 **Build frontend** - Compile TypeScript/React to JavaScript once
- **`npm run clean`** - 🧹 **Clean build** - Remove generated `www/` directories

### Port Configuration

You can customize the port (default is 8000):

```bash
# Use custom port
PORT=3000 npm run dev
PORT=3000 npm run shinyapp
```

## Manual Development Setup

If you prefer to run the frontend and backend separately:

### 1. Build the Frontend

```bash
# Build once
npm run build

# OR watch for changes and rebuild automatically
npm run watch
```

The build process compiles TypeScript/React code and outputs to:
- `r/www/main.js` (R backend)
- `py/www/main.js` (Python backend)

### 2. Start the Backend

In a separate terminal:

```bash
# For R backend (if you have r/ directory)
R -e "options(shiny.autoreload = TRUE); shiny::runApp('r/app.R', port=8000)"

# For Python backend (if you have py/ directory)  
shiny run py/app.py --port 8000 --reload
```

### 3. View Your App

Open your browser and navigate to `http://localhost:8000`.
