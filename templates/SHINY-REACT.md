# Shiny-React Library Documentation

This is comprehensive documentation for the Shiny-React library, providing React bindings for Shiny applications with bidirectional communication between React frontend components and Shiny servers (both R and Python).


### Core Concepts


### Reactivity Systems Bridge

Shiny-React connects two different reactivity systems:

**Frontend (React)**:
- React components use `useState` and other hooks for state management
- State changes trigger re-renders of components
- Changes flow through component trees via props and context

**Backend (Shiny)**:
- Shiny's reactivity system is a directed graph of reactive values and reactive functions
- Input values are reactive values that trigger re-execution of dependent functions when they change
- Output values are set by reactive functions that automatically re-execute when their inputs change

**The Bridge**:
- `useShinyInput` extends React state to the server (server can read, but not modify)
- `useShinyOutput` brings server reactive values into React components
- Communication happens via WebSocket with debouncing and deduplication


### Data Flow Pattern
```
React Component ──[useShinyInput]──> Shiny Server
                                           │
                                           ▼
                                    Process/Transform Data
                                           │
                                           ▼
React Component <──[useShinyOutput]── Shiny Server
```


## Available Hooks and Components

The shiny-react library provides the following React hooks and components:

### Hooks
- **`useShinyInput<T>`**: Send data from React to Shiny server (similar to useState)
- **`useShinyOutput<T>`**: Receive data from Shiny server to React components
- **`useShinyMessageHandler<T>`**: Handle custom messages from server with automatic cleanup
- **`useShinyInitialized`**: Track whether Shiny has been initialized and is ready

### Components
- **`ImageOutput`**: Display Shiny image outputs with dynamic sizing

## Complete API Reference

### useShinyInput Hook

```typescript
function useShinyInput<T>(
  id: string,
  defaultValue: T,
  options?: {
    debounceMs?: number;
    priority?: EventPriority;
  }
): [T, (value: T) => void]
```

**Purpose**: Sends data FROM React TO Shiny server (similar to `useState` but syncs with server).

**Parameters**:
- `id`: The Shiny input ID (accessed as `input$id` in R or `input.id()` in Python)
- `defaultValue`: Initial value for the input
- `options.debounceMs`: Debounce delay in milliseconds (default: 100ms)
- `options.priority`: Event priority level - use `"event"` for button clicks to ensure reactive invalidation even with identical values

**Returns**: `[value, setValue]` tuple identical to React's `useState`

**Key Behaviors**:
- Values are debounced before sending to prevent excessive server calls
- Values are deduplicated (identical consecutive values are not sent, unless using `priority: "event"`)
- Event priority bypasses deduplication for cases like button clicks where identical values still need to trigger updates
- Waits for Shiny initialization before sending values
- Updates are sent to `ShinyReactRegistry` which manages server communication

**Example**: All input types
```typescript
// Text input
const [textValue, setTextValue] = useShinyInput<string>("txtin", "Hello, world!");

// Number input
const [numberValue, setNumberValue] = useShinyInput<number>("numberin", 42);

// Boolean checkbox
const [checkboxValue, setCheckboxValue] = useShinyInput<boolean>("checkboxin", false);

// Radio button selection
const [radioValue, setRadioValue] = useShinyInput<string>("radioin", "option1");

// Select dropdown
const [selectValue, setSelectValue] = useShinyInput<string>("selectin", "apple");

// Slider/range input
const [sliderValue, setSliderValue] = useShinyInput<number>("sliderin", 50);

// Date input
const [dateValue, setDateValue] = useShinyInput<string>("datein", "2024-01-01");

// Button click with event priority (ensures reactive updates even with identical values)
const [buttonValue, setButtonValue] = useShinyInput<null | object>("buttonin", null, {
  debounceMs: 0,
  priority: "event"
});

// Slider with immediate updates (no debouncing)
const [sliderValue, setSliderValue] = useShinyInput<number>("sliderin", 50, {
  debounceMs: 0
});
```

### useShinyOutput Hook

```typescript
function useShinyOutput<T>(
  outputId: string,
  defaultValue?: T | undefined
): [T | undefined, boolean]
```

**Purpose**: Receives data FROM Shiny server TO React components.

**Parameters**:
- `outputId`: The Shiny output ID (set as `output$outputId` in R or `@render.type def outputId()` in Python)
- `defaultValue`: Optional default value before first server update

**Returns**: `[value, recalculating]` tuple where:
- `value`: Current value of the Shiny output (undefined until first update)
- `recalculating`: Boolean indicating if server is currently recalculating this output

**Example**: Various output types
```typescript
// Simple text output
const [textOutput, textOutputRecalc] = useShinyOutput<string>("txtout", undefined);

// Complex JSON data
const [tableData, tableDataRecalc] = useShinyOutput<Record<string, number[]>>("table_data", undefined);

// Statistics object
const [stats, statsRecalc] = useShinyOutput<{
  colname: string;
  mean: number;
  median: number;
  min: number;
  max: number;
}>("table_stats", undefined);

// Plot output
const [plotData, plotDataRecalc] = useShinyOutput<ImageData>("plot1", undefined);
```

### useShinyMessageHandler Hook

```typescript
function useShinyMessageHandler<T = any>(
  type: string,
  handler: (message: T) => void
): void
```

**Purpose**: Handle custom messages sent from the Shiny server to React components with automatic cleanup.

**Parameters**:
- `type`: The message type to listen for
- `handler`: Function to call when a message of this type is received

**Features**:
- **Automatic cleanup**: Handlers are removed when components unmount or dependencies change
- **Multiple listeners**: Multiple components can listen to the same message type simultaneously
- **Memory safe**: No lingering handlers from unmounted components
- **React compliant**: Follows React's useEffect cleanup pattern

**Example**: Toast notifications
```typescript
import React, { useState } from "react";
import { useShinyMessageHandler } from "@posit/shiny-react";

interface ToastMessage {
  id: number;
  message: string;
  type: string;
}

function NotificationComponent() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Handle custom messages from the server
  useShinyMessageHandler("logEvent", (msg: { message: string; type: string }) => {
    const newToast: ToastMessage = {
      id: Date.now(),
      message: msg.message,
      type: msg.type,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
    }, 6000);
  });

  return (
    <div className="notifications">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
```

### useShinyInitialized Hook

```typescript
function useShinyInitialized(): boolean
```

**Purpose**: Tracks whether Shiny has been initialized and is ready for use.

**Parameters**: None

**Returns**: `boolean` indicating whether Shiny has been initialized

**Key Behaviors**:
- Returns `false` initially before Shiny is ready
- Returns `true` once `window.Shiny.initializedPromise` resolves


### ImageOutput Component

```typescript
function ImageOutput({
  id,
  className,
  width,
  height,
  debounceMs = 400,
  onRecalculating
}: {
  id: string;
  className?: string;
  width?: string;
  height?: string;
  debounceMs?: number;
  onRecalculating?: (isRecalculating: boolean) => void;
}): JSX.Element
```

**Purpose**: Displays Shiny image outputs with dynamic sizing capabilities. Unlike typical web images that have an inherent size, this component tells the server to generate an image that is sized to fit the dimensions of the img element. The element must have a width and height, either through CSS or through the width and height props.

**Parameters**:
- `id`: The Shiny output ID corresponding to a renderImage() call on the server
- `className`: Optional CSS class name to apply to the img element
- `width`: Optional width as a CSS size string (e.g., "300px", "50%", "auto")
- `height`: Optional height as a CSS size string (e.g., "200px", "50vh", "auto")
- `debounceMs`: Debounce delay in milliseconds for dimension changes (default: 400ms)
- `onRecalculating`: Optional callback function called when recalculation status changes. Receives a boolean indicating whether the image is currently recalculating

**Features**:
- Automatically tracks rendered dimensions and sends them to Shiny via clientData
- Updates Shiny when image size changes using ResizeObserver with debouncing
- Hides image when Shiny sets the hidden state
- Handles image load events for accurate dimension reporting

**Usage**:
```typescript
import { ImageOutput } from "@posit/shiny-react";

// With explicit dimensions
function PlotCard() {
  return (
    <div>
      <h2>My Plot</h2>
      <ImageOutput id="plot1" width="400px" height="300px" />
    </div>
  );
}

// With CSS-controlled dimensions
function ResponsivePlot() {
  return (
    <div>
      <h2>Responsive Plot</h2>
      <ImageOutput id="plot2" className="responsive-image" />
    </div>
  );
}

// CSS for responsive sizing:
// .responsive-image {
//   width: 100%;
//   height: 100dvh; /* Full viewport height */
// }

// With flex container for height determined by container:
function FlexPlot() {
  return (
    <div className="flex-container">
      <ImageOutput id="plot3" className="flex-image" />
    </div>
  );
}

// With recalculation status tracking:
function PlotWithLoadingIndicator() {
  const [isRecalculating, setIsRecalculating] = useState(false);

  return (
    <div>
      <h2>My Plot {isRecalculating && "(Updating...)"}</h2>
      <ImageOutput
        id="plot4"
        className="responsive-image"
        onRecalculating={setIsRecalculating}
      />
    </div>
  );
}

// CSS:
// .flex-container {
//   display: flex;
//   flex-direction: column;
//   height: 500px;
// }
// .flex-image {
//   flex: 1;
//   width: 100%;
//   height: 100%;
//   min-height: 300px;
// }
```

**Backend Requirements**:
```r
# R - Use renderPlot
output$plot1 <- renderPlot({
  # Your plotting code here
  plot(mtcars$wt, mtcars$mpg)
})
```

```python
# Python - Use render.plot
@render.plot()
def plot1():
    fig, ax = plt.subplots()
    ax.scatter(mtcars["wt"], mtcars["mpg"])
    return fig
```


## Data Flow Patterns

### Data Frame Serialization

When working with data frames (tables) in Shiny-React applications, it's important to understand how they are serialized between the server and client.

**Column-Major Format**: Data frames are serialized as JSON objects in **column-major format**, where each column becomes a property in the JSON object with an array of values:

```json
{
  "mpg": [21, 21, 22.8, 21.4, 18.7, ...],
  "cyl": [6, 6, 4, 6, 8, ...],
  "disp": [160, 160, 108, 258, 360, ...],
  "hp": [110, 110, 93, 110, 175, ...],
  ...
}
```

**Reading Data Frames in JavaScript**:
```typescript
// Receiving column-major data from server
const [tableData] = useShinyOutput<Record<string, number[]> | undefined>(
  "table_data",
  undefined
);

// Convert to row-major format for easier processing
function convertToRows(columnData: Record<string, any[]>): any[] {
  const columnNames = Object.keys(columnData);
  const numRows = columnNames.length > 0 ? columnData[columnNames[0]].length : 0;

  return Array.from({ length: numRows }, (_, rowIndex) => {
    const row: Record<string, any> = {};
    columnNames.forEach(colName => {
      row[colName] = columnData[colName][rowIndex];
    });
    return row;
  });
}

// Usage in component
function DataTableCard() {
  const [tableData] = useShinyOutput<Record<string, number[]> | undefined>(
    "table_data",
    undefined
  );

  // Extract column names and data
  const columnNames = tableData ? Object.keys(tableData) : [];
  const numRows = columnNames.length > 0 ? tableData![columnNames[0]].length : 0;

  return (
    <table>
      <thead>
        <tr>
          {columnNames.map(colName => (
            <th key={colName}>{colName.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: numRows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {columnNames.map(colName => {
              const value = tableData?.[colName][rowIndex];
              return (
                <td key={colName}>
                  {typeof value === "number"
                    ? Number.isInteger(value) ? value : value.toFixed(3)
                    : value}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Server-Side Data Frame Handling**:

*R Backend*:
```r
# Data frames are automatically converted to column-major JSON
output$table_data <- render_json({
  req(input$table_rows)
  mtcars[seq_len(input$table_rows), ]
})
```

*Python Backend*:
```python
@render_json
def table_data():
    num_rows = input.table_rows()
    return mtcars.head(num_rows).to_dict(orient="list")
```


## Input Component Patterns

### Button Input Pattern (Event Handling with Event Priority)
```typescript
// Use priority: "event" to ensure each button click triggers server updates
// even though we send the same empty object value each time
const [buttonValue, setButtonValue] = useShinyInput<null | object>(
  "buttonin",
  null,
  {
    debounceMs: 0,      // No delay for button clicks
    priority: "event"   // Bypass deduplication for event-style inputs
  }
);

const handleButtonClick = () => {
  setButtonValue({});  // Send empty object - value doesn't matter for events
};

return (
  <div>
    <button onClick={handleButtonClick}>Click Me</button>
    <div>Button sends: {JSON.stringify(buttonValue)}</div>
    <div>
      Note: useShinyInput is called with priority:"event" so that even
      though the value (an empty object) is sent every time the button is
      clicked, it will still cause reactive invalidation on the server.
    </div>
  </div>
);
```


**Server-side button handling**:
```r
# R - Track button clicks by counting non-null values
num_button_clicks <- 0
output$click_count <- render_json({
  if (is.null(input$button_input)) {
    return(0)
  }
  num_button_clicks <<- num_button_clicks + 1
  num_button_clicks
})
```

```python
# Python - Track button clicks
num_button_clicks = 0

@render_json
def click_count():
    if input.button_input() is None:
        return "0"
    global num_button_clicks
    num_button_clicks += 1
    return str(num_button_clicks)
```


### Date Input Pattern
```typescript
// Default to today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];
const [dateValue, setDateValue] = useShinyInput<string>("datein", today);

return (
  <div>
    <input
        type="date"
        value={dateValue}
        onChange={(e) => setDateValue(e.target.value)}
      />
  </div>
);
```

### Radio Button Group Pattern
```typescript
const [radioValue, setRadioValue] = useShinyInput<string>("radioin", "option1");
const options = ["option1", "option2", "option3"];

return (
  <div className="radio-group">
    {options.map(option => (
      <label key={option}>
        <input
          type="radio"
          name="radio-options"
          value={option}
          checked={radioValue === option}
          onChange={(e) => setRadioValue(e.target.value)}
        />
        {option}
      </label>
    ))}
  </div>
);
```

### File Input Pattern with Drag-and-Drop

File inputs require special handling since Shiny needs access to actual file objects, not just filenames. The key is to use a **hidden HTML file input** that Shiny can automatically detect and bind to, combined with React state for UI interactions:

```typescript
const inputRef = useRef<HTMLInputElement>(null);
const [files, setFiles] = useState<File[]>([]);
const [isDragOver, setIsDragOver] = useState(false);

const handleFiles = (files: FileList | null) => {
  if (files) {
    const fileArray = Array.from(files);
    setFiles(fileArray);
  } else {
    setFiles([]);
  }
};

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  handleFiles(event.target.files);
};

const handleButtonClick = () => {
  inputRef.current?.click();
};

const handleDragOver = (event: React.DragEvent) => {
  event.preventDefault();
  setIsDragOver(true);
};

const handleDragLeave = (event: React.DragEvent) => {
  event.preventDefault();
  setIsDragOver(false);
};

const handleDrop = (event: React.DragEvent) => {
  event.preventDefault();
  setIsDragOver(false);
  handleFiles(event.dataTransfer.files);
};

return (
  <div>
    {/*
      Hidden file input - Shiny automatically detects this and creates a
      corresponding Shiny input with the same name as the id.
    */}
    <input
      ref={inputRef}
      type="file"
      id="filein"
      multiple={true}
      onChange={handleInputChange}
      style={{ display: "none" }}
    />

    {/* Custom drag and drop area */}
    <div
      className={`file-drop-zone ${isDragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleButtonClick}
    >
      <div className="file-drop-content">
        {files.length === 0 ? (
          <>
            <div className="file-drop-text">
              Click to select files or drag and drop them here
            </div>
            <div className="file-drop-hint">Multiple files are supported</div>
          </>
        ) : (
          <div className="selected-files">
            <ul className="selected-files-list">
              {files.map((file, index) => (
                <li key={index}>
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </li>
              ))}
            </ul>
            <div className="file-drop-hint">
              Click to select different files or drag new ones here
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
```

**Key File Input Concepts**:

1. **Hidden HTML Input**: The actual `<input type="file">` must be present for Shiny to detect and bind to it. The `id` attribute becomes the Shiny input name (`input$filein` in R or `input.filein()` in Python).

2. **React State Management**: Use `useState` to track selected files for UI display, but the actual file data is handled by Shiny's input binding.

3. **Custom UI Layer**: Build a custom drag-and-drop interface while keeping the hidden HTML input for Shiny compatibility.

4. **File List Display**: Show selected files with names and sizes for user feedback.

**Backend File Handling**:

*R Backend*:
```r
server <- function(input, output, session) {
  output$fileout <- render_json({
    req(input$filein)

    files_info <- input$filein
    # files_info is a data frame with columns: name, size, type, datapath

    file_details <- paste(
      paste("File:", files_info$name, collapse = "\n"),
      paste("Size:", files_info$size, "bytes", collapse = "\n"),
      paste("Type:", files_info$type, collapse = "\n"),
      paste("Path:", files_info$datapath, collapse = "\n"),
      sep = "\n"
    )

    # Read file content example
    if (nrow(files_info) > 0) {
      first_file_content <- readLines(files_info$datapath[1], n = 5)
      paste(file_details, "\nFirst 5 lines:", paste(first_file_content, collapse = "\n"))
    } else {
      file_details
    }
  })
}
```

*Python Backend*:
```python
def server(input: Inputs, output: Outputs, session: Session):
    @render_json
    def fileout():
        file_infos = input.filein()
        if not file_infos:
            return "No files selected"

        # file_infos is a list of FileInfo objects
        details = []
        for file_info in file_infos:
            details.append(f"File: {file_info['name']}")
            details.append(f"Size: {file_info['size']} bytes")
            details.append(f"Type: {file_info['type']}")

            # Read file content example
            with open(file_info['datapath'], 'r') as f:
                first_lines = [f.readline().strip() for _ in range(5)]
                details.append(f"First 5 lines: {' | '.join(first_lines)}")

        return "\n".join(details)
```

**File Input Best Practices**:
- Always use `req(input$filein)` in R or check for null in Python before processing files
- Display file information for user
- If `multiple` is set to true, handle multiple files by iterating over the file list
- Use `datapath` property to access the uploaded file content
- Consider file size limits and validation on the server side
- Provide clear visual feedback during drag-and-drop operations


### Compound Input Pattern (Batch Form Submission)

Compound inputs collect multiple form fields in **local React state** and only send data to Shiny when the user explicitly submits (e.g., button click). This pattern reduces server calls and provides better UX for complex forms.

```typescript
const [comment, setComment] = useState("");
const [priority, setPriority] = useState(50);
const [features, setFeatures] = useState({ notifications: false, darkMode: false });

// Single Shiny input for batch submission
const [formData, setFormData] = useShinyInput<object | null>(
  "formdata",
  null,
  { debounceMs: 0, priority: "event" }
);

const handleSubmit = () => {
  const data = { comment, priority, features };
  setFormData(data);  // Send all data at once
};

return (
  <div>
    <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
    <input
      type="range"
      value={priority}
      onChange={(e) => setPriority(Number(e.target.value))}
    />
    <label>
      <input
        type="checkbox"
        checked={features.notifications}
        onChange={(e) => setFeatures(prev => ({...prev, notifications: e.target.checked}))}
      />
      Enable Notifications
    </label>
    <button onClick={handleSubmit}>Submit Form</button>
  </div>
);
```

**Backend Handling**:

These examples just send the form data back to the UI for display. In a real application, you would do something with the data.

*R Backend*:
```r
output$formout <- render_json({
  data <- input$formdata
  if (is.null(data)) return("No data submitted yet.")

  data$receivedAt <- as.character(Sys.time())
  jsonlite::toJSON(data, auto_unbox = TRUE, pretty = TRUE)
})
```

*Python Backend*:
```python
@render_json
def formout():
    data = input.formdata()
    if not data:
        return "No data submitted yet."

    data["receivedAt"] = datetime.datetime.now().isoformat()
    return json.dumps(data, indent=2)
```

**Key Concepts**:
- **Local State**: Form fields use `useState` - changes don't trigger server calls
- **Batch Submission**: Single `useShinyInput` collects all form data on submit
- **Event Priority**: Use `priority: "event"` so identical submissions still trigger server updates
- **Validation**: Disable submit button based on form validity

**When to Use Compound Inputs**:
- Complex forms with multiple related fields
- Forms where partial data isn't useful to the server
- Reducing server load by avoiding updates on every keystroke
- When you need client-side validation before submission


## Debouncing and Event Priority

### Understanding Debouncing

**Debouncing** delays sending input values to the Shiny server to prevent excessive server calls during rapid user interactions. By default, `useShinyInput` debounces updates by 100ms.

**When to Use Debouncing**:
- **Text inputs**: Prevent server calls on every keystroke
- **Sliders**: Reduce server load during dragging
- **Any high-frequency input**: Optimize performance for rapid value changes

**When to Disable Debouncing (`debounceMs: 0`)**:
- **Button clicks**: Users expect immediate response
- **Sliders where immediate feedback is important**: Real-time visualization
- **Form submissions**: No delay wanted for user actions

```typescript
// Default debouncing (100ms) - good for text inputs
const [text, setText] = useShinyInput<string>("text_input", "");

// No debouncing - immediate updates for sliders
const [slider, setSlider] = useShinyInput<number>("slider_input", 50, {
  debounceMs: 0
});

// Custom debouncing - longer delay for expensive operations
const [expensiveInput, setExpensiveInput] = useShinyInput<string>("expensive", "", {
  debounceMs: 500  // Wait 500ms before sending
});
```


### Understanding Event Priority

**Event Priority** controls how Shiny handles duplicate values. Normally, Shiny deduplicates consecutive identical values to avoid unnecessary reactive updates.

**Normal Priority (default)**:
- Values are compared and deduplicated
- `setValue(5)` followed by `setValue(5)` only triggers one server update
- Good for most inputs like text, sliders, dropdowns

**Event Priority (`priority: "event"`)**:
- Bypasses deduplication completely
- Every call to `setValue()` triggers a server update, even with identical values
- Essential for button clicks and event-like interactions



## Server-to-Client Messages

The server can send messages directly to React components for notifications, real-time updates, and server-initiated events.

### Client-Side Message Handling

Register message handlers in React components using the `useShinyMessageHandler` hook:

```typescript
import React, { useState } from "react";
import { useShinyMessageHandler } from "@posit/shiny-react";

function App() {
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: string}>>([]);

  useShinyMessageHandler("logEvent", (msg: { message: string; type: string }) => {
    const newToast = { id: Date.now(), message: msg.message, type: msg.type };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
    }, 6000);
  });

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
```

### Server-Side Message Sending

**R Shiny**:
```r
post_message(session, "logEvent", list(
  message = "User logged in",
  type = "info"
))
```

**Python Shiny**:
```python
await post_message(session, "logEvent", {
    "message": "User logged in",
    "type": "info"
})
```

### Use Cases
- **Notifications**: Toast messages, alerts
- **Progress**: Long-running task updates
- **Real-time data**: Server-initiated data streams
- **System events**: Status changes, heartbeats

**Note**: Custom messages are server→client only and bypass the normal input/output reactive system.



## Backend Patterns and Best Practices

### R Shiny Patterns

**Basic Server Structure**:
```r
library(shiny)
source("shinyreact.R", local = TRUE)

# Using the page_react() convenience function (recommended)
ui <- page_react(title = "My Shiny React App")

server <- function(input, output, session) {
  # Text output - simple transformation
  output$txtout <- render_json({
    toupper(input$txtin)
  })

  # Complex data output using render_json
  output$table_data <- render_json({
    req(input$table_rows)  # Ensure input exists
    mtcars[seq_len(input$table_rows), ]
  })

  # Plot output
  output$plot1 <- renderPlot({
    req(input$table_rows)
    plot(mtcars$wt[1:input$table_rows], mtcars$mpg[1:input$table_rows])
  })

  # Send custom messages (for notifications, real-time updates, etc.)
  observe({
    post_message(session, "logEvent", list(
      message = "Processing completed successfully",
      type = "success"
    ))
  })
}

shinyApp(ui = ui, server = server)
```

**R Utility Functions (shinyreact.R)**:

```r
# Convenience function for React apps (recommended)
page_react <- function(
  ...,
  title = NULL,
  js_file = "main.js",
  css_file = "main.css",
  lang = "en"
) {
  # ... Implementation here ...
}

# Base function for custom layouts (advanced)
page_bare <- function(..., title = NULL, lang = NULL) {
  # ... Implementation here ...
}

# Generic renderer for arbitrary JSON data
render_json <- function(
  expr,
  env = parent.frame(),
  quoted = FALSE,
  outputArgs = list(),
  sep = " "
) {
  # ... Implementation here ...
}

# Send custom messages to React components
# Messages are automatically wrapped and routed through shiny-react's
# internal message dispatch system for proper React lifecycle management
post_message <- function(session, type, data) {
  session$sendCustomMessage("shinyReactMessage", list(
    type = type,
    data = data
  ))
}
```


### Python Shiny Patterns

**Basic Server Structure**:
```python
from shiny import App, Inputs, Outputs, Session, ui, render
from shinyreact import page_react, render_json, post_message
from pathlib import Path

def server(input: Inputs, output: Outputs, session: Session):
    # Text output - simple transformation
    @render_json
    def txtout():
        return input.txtin().upper()

    # Complex data output using render_json
    @render_json
    def table_data():
        num_rows = input.table_rows()
        return mtcars.head(num_rows).to_dict(orient="list")

    # Plot output using matplotlib
    @render.plot()
    def plot1():
        num_rows = input.table_rows()
        fig, ax = plt.subplots()
        ax.scatter(mtcars["wt"].head(num_rows), mtcars["mpg"].head(num_rows))
        return fig

    # Send custom messages (for notifications, real-time updates, etc.)
    @reactive.effect
    async def _():
        await post_message(session, "logEvent", {
            "message": "Processing completed successfully",
            "type": "success"
        })

# Use the page_react() convenience function (recommended)
app = App(
    page_react(title="My Shiny React App"),
    server,
    static_assets=str(Path(__file__).parent / "www")
)
```

**Python Utility Functions (shinyreact.py)**:

```python
from __future__ import annotations

from shiny import ui
from shiny.html_dependencies import shiny_deps
from shiny.types import Jsonifiable
from shiny.render.renderer import Renderer, ValueFn
from typing import Any, Optional

# Convenience function for React apps (recommended)
def page_react(
    *args: ui.TagChild,
    title: str | None = None,
    js_file: str | None = "main.js",
    css_file: str | None = "main.css",
    lang: str = "en",
) -> ui.Tag:
    # ... Implementation here ...

# Base function for custom layouts (advanced)
def page_bare(*args: ui.TagChild, title: str | None = None, lang: str = "en") -> ui.Tag:
    # ... Implementation here ...

# Generic renderer for arbitrary JSON data
class render_json(Renderer[Jsonifiable]):
    """
    Reactively render arbitrary JSON object.

    This is a generic renderer that can be used to render any Jsonifiable data.
    It sends the data to the client-side and let the client-side code handle the
    rendering.
    """
    # ... Implementation here ...


# Send custom messages to React components
# Messages are automatically wrapped and routed through shiny-react's
# internal message dispatch system for proper React lifecycle management
async def post_message(session: Session, type: str, data: Jsonifiable):
    # ... Implementation here ...
```


### Reactivity Patterns

Shiny's reactivity is a **directed acyclic graph (DAG)** that automatically tracks dependencies and propagates changes through your application. Understanding this system is crucial for building efficient Shiny-React applications.

#### The Reactive Graph Structure

The reactive graph consists of three types of nodes:

1. **Reactive Values (Sources)** → 2. **Reactive Expressions/Calcs (Optional Middle)** → 3. **Observers/Effects/Renderers (Endpoints)**

```
[Input Values] → [Reactive Expressions] → [Outputs/Effects]
     ↓                    ↓                      ↓
(User changes)    (Cached calculations)   (UI updates/Side effects)
```

#### Reactive Values (Sources)

Reactive values are the **sources** of reactivity. They trigger the reactive chain when their values change.

**Types of Reactive Values**:
- **Shiny Inputs**: All `input$*` values from the UI (automatically reactive)
- **ReactiveValues** (R) / **reactive.value** (Python): Custom reactive values you create

**R Example**:
```r
# Custom reactive value
counter <- reactiveVal(0)

# This observer will invalidate and re-execute every time input$txt
# or counter() changes.
observe({
  cat(input$txt)
  cat(counter())
})

# observeEvent() is like observe(), but here it only is invalidated
# by input$txt. This example also sets counter() to a new value, which
# invalidates anything that depends on counter().
observeEvent(input$txt, {
  counter(counter() + 1)  # This triggers reactivity
})
```

**Python Example**:
```python
# Custom reactive value
counter = reactive.value(0)

# This effect will invalidate and re-execute every time input.txt()
# or counter() changes.
@reactive.effect
def _():
    print(input.txt())
    print(counter())

# With reactive.event(), this effect is only invalidated by input.txt().
# This example also sets counter() to a new value, which invalidates
# anything that depends on counter().
@reactive.effect
@reactive.event(input.txt)
def _():
    counter.set(counter() + 1)  # This triggers reactivity
```

**Key Behavior**: When a reactive value changes, all downstream reactive functions that depend on it are **invalidated** and scheduled for re-execution.

#### Reactive Expressions/Calcs (Intermediate Computations)

Reactive expressions (`reactive()` in R, `@reactive.calc` in Python) are **cached computations** that sit between reactive values and endpoints.

**Purpose**: Perform calculations that multiple outputs depend on, avoiding redundant computation.

**R Example**:
```r
# Reactive expression that filters data based on input
filtered_data <- reactive({
  # This uses input$min, so it will be invalidated when input$min changes.
  mtcars[mtcars$mpg >= input$min, ] # Result is cached
})

# Multiple outputs can use the same reactive expression
output$plot <- renderPlot({
  plot(filtered_data()$wt, filtered_data()$mpg)
})

output$summary <- render_json({
  paste("Rows:", nrow(filtered_data()))  # Uses cached value
})
```

**Python Example**:
```python
# Reactive calc that filters data based on input
@reactive.calc
def filtered_data():
    # This uses input.min, so it will be invalidated when input.min changes.
    return mtcars[mtcars["mpg"] >= input.min()]  # Result is cached

# Multiple outputs can use the same reactive calc
@render.plot
def plot():
    data = filtered_data()  # Uses cached value
    return plt.scatter(data["wt"], data["mpg"])

@render_json
def summary():
    return f"Rows: {len(filtered_data())}"  # Uses cached value
```

**Important Characteristics**:
- Results are **cached** - only re-compute when dependencies change
- **Should NOT have side effects** - use observers/effects for that
- **Lazy evaluation** - only execute when called by an endpoint
- Create dependencies when they access reactive values

#### Observers/Effects/Renderers (Endpoints)

These are the **endpoints** of the reactive chain where actions happen.

**Types**:

1. **Observers/Effects**: For side effects (file writes, logs, messages)
2. **Renderers**: For sending data to the UI (wrapped observers)

**R Observer Example**:
```r
# Observer for side effects
observe({
  # This re-runs whenever input$save_data changes
  req(input$save_data)

  # Side effect: write to file
  write.csv(filtered_data(), "output.csv")
  cat("Data saved at", Sys.time(), "\n")

  # Return value is ignored
})

# observeEvent for specific triggers
observeEvent(input$send_message, {
  post_message(session, "notification", list(
    message = paste("Button clicked at", Sys.time())
  ))
})
```

**Python Effect Example**:
```python
# Effect for side effects
@reactive.effect
def _():
    if input.save_data():
        # Side effect: write to file
        filtered_data().to_csv("output.csv")
        print(f"Data saved at {datetime.now()}")

    # Return value is ignored

# Event-based effect
@reactive.effect
@reactive.event(input.send_message)
async def _():
    await post_message(session, "notification", {
        "message": f"Button clicked at {datetime.now()}"
    })
```

**Renderer Example**:
```r
# Renderers are observers that send output to UI
output$result <- render_json({
  # Takes dependencies on any reactive values used
  paste("Value:", input$text_input, "Count:", values$counter)
})  # Return value is sent to client
```

**Key Behaviors**:
- **Eager execution**: Run automatically when invalidated
- **Auto-dependency tracking**: Dependencies determined at runtime
- **Re-execution on invalidation**: Scheduled to run when dependencies change


#### Important Anti-Patterns to Avoid

**1. Nested Reactive Objects**:
```r
# ❌ BAD: Don't define reactive objects inside others
observe({
  output$nested <- render_json({  # Don't do this!
    "This is wrong"
  })
})

# ✅ GOOD: Define at top level
output$proper <- render_json({
  "This is correct"
})
```

**2. Circular Dependencies**:
```r
# ❌ BAD: Can create infinite loops
values <- reactiveValues(a = 1, b = 2)

observe({
  values$a <- values$b + 1  # a depends on b
})

observe({
  values$b <- values$a + 1  # b depends on a - CIRCULAR!
})

# ✅ GOOD: Use reactive expressions for derived values
values <- reactiveValues(a = 1)

b <- reactive({
  values$a + 1
})

```python
# ❌ BAD: Can create infinite loops
a = reactive.value(1)
b = reactive.value(2)

@reactive.effect
def _():
    a.set(b() + 1)  # a depends on b

@reactive.effect
def _():
    b.set(a() + 1)  # b depends on a - CIRCULAR!


# ✅ GOOD: Use reactive expressions for derived values
@reactive.calc
def b():
    return a() + 1
```

**3. Side Effects in Reactive Expressions**:
```r
# ❌ BAD: Don't have side effects in reactive expressions
bad_reactive <- reactive({
  data <- read.csv("file.csv")
  write.csv(data, "output.csv")  # Side effect - DON'T DO THIS!
  return(data)
})

# ✅ GOOD: Use observers for side effects
good_reactive <- reactive({
  read.csv("file.csv")  # Pure computation
})

observe({
  write.csv(good_reactive(), "output.csv")  # Side effect in observer
})
```

```python
# ❌ BAD: Don't have side effects in reactive expressions
@reactive.calc
def bad_reactive():
    data = pd.read_csv("file.csv")
    data.to_csv("output.csv")  # Side effect - DON'T DO THIS!
    return data

# ✅ GOOD: Use reactive effects for side effects
@reactive.calc
def good_reactive():
    return pd.read_csv("file.csv")  # Pure computation

@reactive.effect
def _():
    good_reactive().to_csv("output.csv")  # Side effect in effect
```

**4. Reactive Value Feedback Loops**:
```r
counter <- reactiveVal(0)

# ❌ BAD: Don't have an observer that both reads and writes a reactive value.
#        This can create an infinite loop
observe({
  input$click
  counter(counter() + 1)  # Updates `counter` reactive value
})

# ✅ GOOD: Use isolate() to prevent taking dependency on reactive value that is
#          being updated.
observe({
  input$click
  isolate({
    counter(counter() + 1)
  })
})

# ✅ GOOD: Use observeEvent() to only invalidate on specific inputs
observeEvent(input.click, {
  counter(counter() + 1)
})
```

```python
counter = reactive.value(0)

# ❌ BAD: Don't have an observer that both reads and writes a reactive value.
#        This can create an infinite loop
@reactive.effect
def _():
    input.click()
    counter.set(counter() + 1)  # Updates `counter` reactive value

# ✅ GOOD: Use isolate() to prevent taking dependency on reactive value that is
#          being updated.
@reactive.effect
def _():
    input.click()
    with reactive.isolate():
        counter.set(counter() + 1)

# ✅ GOOD: Use @reactive.event() to only invalidate on specific inputs
@reactive.effect
@reactive.event(input.click)
def _():
    counter.set(counter() + 1)
```

#### Reactive Value Feedback Loops

Sometimes observers need to update reactive values, creating feedback loops. While valid, use sparingly:

```r
# Counter that auto-increments (use with caution)
values <- reactiveValues(counter = 0)

observe({
  invalidateLater(1000)  # Re-run every second
  isolate({  # Prevent taking dependency on values$counter
    values$counter <- values$counter + 1  # Updates reactive value
  })
})

# Better approach: Use reactive.poll or invalidateLater with clear purpose
```

**Best Practices**:
- Keep reactive graphs simple and acyclic
- Use reactive expressions for shared computations
- Reserve observers/effects for side effects only
- Avoid updating reactive values from observers when possible
- Use `req()` (R) or conditional checks (Python) to handle missing inputs gracefully

#### Scoping of reactive objects

For most apps, reactive objects should be defined at the top level of the server function. The server function is executed once for each user session, so this ensures that reactive objects are scoped to the session.

In some cases, it is useful to share reactive objects across sessions: for example, if there is a single connection to a data source or API , or if there is a shared state that needs to be accessed by multiple sessions. In such cases, reactive values and reactive expressions/calcs can be defined at the top level of the app, outside of the server function. This ensures that those reactive objects are shared across all sessions.

#### Python-Specific: Object Identity and Reactivity

**Critical Concept**: In Python Shiny, reactivity is triggered by **object identity** changes, not value equality. This means that when you modify mutable objects like lists and dictionaries in-place, Shiny doesn't detect the change because the object identity (memory address) remains the same.

**The Problem**: Mutating lists or dictionaries directly doesn't trigger reactive updates:

```python
# ❌ BAD: This doesn't trigger reactivity
items = reactive.value(["apple", "banana"])

@reactive.effect
@reactive.event(input.add_item)
def _():
    current_items = items()
    current_items.append("cherry")  # Modifies list in-place
    items.set(current_items)  # Same object identity - no reactivity!

# ❌ BAD: Dictionary modification doesn't trigger reactivity either
user_data = reactive.value({"name": "John", "age": 30})

@reactive.effect
@reactive.event(input.update_age)
def _():
    current_data = user_data()
    current_data["age"] = 31  # Modifies dict in-place
    user_data.set(current_data)  # Same object identity - no reactivity!
```

**The Solution**: Create copies before modification to get a new object identity:

```python
# ✅ GOOD: Copy the list before modifying
items = reactive.value(["apple", "banana"])

@reactive.effect
@reactive.event(input.add_item)  # Only react to input.add_item
def _():
    current_items = items()  # This doesn't create a dependency because of @reactive.event
    new_items = current_items[:]  # Create a copy
    new_items.append("cherry")  # Modify the copy
    items.set(new_items)  # New object identity - triggers reactivity!

# ✅ GOOD: Copy the dictionary before modifying
user_data = reactive.value({"name": "John", "age": 30})

@reactive.effect
@reactive.event(input.update_age)  # Only react to input.update_age
def _():
    current_data = user_data()  # This doesn't create a dependency because of @reactive.event
    new_data = current_data.copy()  # Create a copy
    new_data["age"] = 31  # Modify the copy
    user_data.set(new_data)  # New object identity - triggers reactivity!
```

**Important Note**: In the examples above, `@reactive.event` ensures the effect only reacts to specific inputs (`input.add_item`, `input.update_age`) and NOT to the reactive values we're reading (`items()`, `user_data()`). This prevents dependency loops.

**Avoiding Reactive Loops**: When updating a reactive value within an effect, you need to prevent the effect from depending on that same reactive value. You can do this in two ways:

**Option 1: Use `@reactive.event` to only depend on specific inputs**

```python
task_list = reactive.value([{"id": 1, "text": "Task 1", "done": False}])

@reactive.effect
@reactive.event(input.toggle_task)  # Only react to this specific input
def _():
    tasks = task_list()  # Safe to read - no dependency created due to @reactive.event
    updated_tasks = [task.copy() for task in tasks]

    # Find and toggle the specified task
    task_id = input.task_id()
    for task in updated_tasks:
        if task["id"] == task_id:
            task["done"] = not task["done"]
            break

    task_list.set(updated_tasks)  # Update without creating loop
```

**Option 2: Use `reactive.isolate()` when reading values you're about to update**

```python
task_list = reactive.value([{"id": 1, "text": "Task 1", "done": False}])

@reactive.effect
def _():
    input.toggle_task()  # Take dependency on this input

    # Use isolate() to read current value without creating dependency
    with reactive.isolate():
        tasks = task_list()  # Isolated - no dependency created
        updated_tasks = [task.copy() for task in tasks]

        # Find and toggle the specified task
        task_id = input.task_id()
        for task in updated_tasks:
            if task["id"] == task_id:
                task["done"] = not task["done"]
                break

        task_list.set(updated_tasks)  # Update without creating loop
```

**❌ BAD Example - This creates an infinite loop**:

```python
task_list = reactive.value([{"id": 1, "text": "Task 1", "done": False}])

@reactive.effect
def _():
    tasks = task_list()  # Takes dependency on task_list
    # Some processing logic here...
    updated_tasks = [task.copy() for task in tasks]  # Process tasks
    updated_tasks[0]["done"] = True
    task_list.set(updated_tasks)  # Updates task_list - triggers this effect again!
```

**Choose Your Approach**:
- Use `@reactive.event` when you want to react only to specific user inputs
- Use `reactive.isolate()` when you need more complex dependency control within the same effect

**Alternative Copying Methods**:

```python
# For lists:
new_list = old_list[:]       # Slice copy
new_list = list(old_list)    # Constructor copy
new_list = old_list.copy()   # Method copy
new_list = [*old_list]       # Unpacking copy

# For dictionaries:
new_dict = old_dict.copy()   # Method copy
new_dict = dict(old_dict)    # Constructor copy
new_dict = {**old_dict}      # Unpacking copy

# For nested structures, consider deep copying:
import copy
new_nested = copy.deepcopy(old_nested)
```

**Complete Working Example**:

```python
# Shopping cart with add/remove functionality
cart_items = reactive.value([])

@reactive.effect
@reactive.event(input.add_to_cart)
def _():
    new_item = {"id": input.product_id(), "name": input.product_name(), "qty": 1}

    with reactive.isolate():
        current_cart = cart_items()
        new_cart = current_cart[:]  # Copy the list

        # Check if item already exists
        existing_item = next((item for item in new_cart if item["id"] == new_item["id"]), None)
        if existing_item:
            # Update quantity (need to copy the dict too)
            existing_item_copy = existing_item.copy()
            existing_item_copy["qty"] += 1
            # Replace in list
            new_cart = [existing_item_copy if item["id"] == new_item["id"] else item for item in new_cart]
        else:
            new_cart.append(new_item)

        cart_items.set(new_cart)  # Triggers reactivity for any outputs depending on cart_items

@reactive.effect
@reactive.event(input.remove_from_cart)
def _():
    item_id = input.remove_item_id()

    with reactive.isolate():
        current_cart = cart_items()
        new_cart = [item for item in current_cart if item["id"] != item_id]
        cart_items.set(new_cart)

# Output that reacts to cart changes
@render_json
def cart_summary():
    items = cart_items()  # Takes dependency - will update when cart_items changes
    total_items = sum(item["qty"] for item in items)
    return {"total_items": total_items, "items": items}
```

**Key Takeaways**:
- Always create copies of mutable objects before modification
- Use `reactive.isolate()` when reading reactive values that you're about to update
- Python's object identity (not value equality) determines reactivity
- This pattern is essential for lists, dictionaries, and any mutable objects
- Consider using `copy.deepcopy()` for nested data structures


## TypeScript Global Types

If you need to access `window.Shiny` directly in your components, add a triple-slash directive at the top of your file to import the global type definitions:

```typescript
/// <reference types="@posit/shiny" />
```

Or you can add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@posit/shiny"]
  }
}
```

This provides TypeScript with the global `Window.Shiny` interface without importing any runtime code or triggering ESLint unused import warnings.

## Using shadcn/ui with Shiny-React

The shiny-react library works seamlessly with [shadcn/ui](https://ui.shadcn.com/), a collection of beautifully designed, accessible, and customizable React components built on Radix UI and Tailwind CSS.


=====================

# Complete Shiny-React Library Documentation

## Core Shiny-React Concepts

### Reactivity Systems Bridge
Shiny-React connects two different reactivity systems:

**Frontend (React)**:
- React components use `useState` and other hooks for state management
- State changes trigger re-renders of components
- Changes flow through component trees via props and context

**Backend (Shiny)**:
- Shiny's reactivity system is a directed graph of reactive values and reactive functions
- Input values are reactive values that trigger re-execution of dependent functions when they change
- Output values are set by reactive functions that automatically re-execute when their inputs change

**The Bridge**:
- `useShinyInput` extends React state to the server (server can read, but not modify)
- `useShinyOutput` brings server reactive values into React components
- Communication happens via WebSocket with debouncing and deduplication


## Advanced Patterns and Examples

### Complex Data Structures (from 3-outputs example)

**Data Table with Dynamic Columns**:
```typescript
function DataTableCard() {
  const [tableData] = useShinyOutput<Record<string, number[]> | undefined>(
    "table_data",
    undefined
  );

  // Extract column names dynamically from JSON structure
  const columnNames = tableData ? Object.keys(tableData) : [];
  const numRows = columnNames.length > 0 ? tableData![columnNames[0]].length : 0;

  return (
    <table>
      <thead>
        <tr>
          {columnNames.map(colName => (
            <th key={colName}>{colName.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: numRows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {columnNames.map(colName => {
              const value = tableData?.[colName][rowIndex];
              return (
                <td key={colName}>
                  {typeof value === "number"
                    ? Number.isInteger(value) ? value : value.toFixed(3)
                    : value}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```


### Custom Renderers for Complex Data

 In shinyreact.R and shinyreact.py, there is a `render_json()` function that can be used to send arbitrary data to the frontend as JSON. This function is used widely for sending  data structures to the frontend.

**R Backend**:
```r
# In app.R
output$table_stats <- render_json({
  mpg_subset <- mtcars$mpg[seq_len(input$table_rows)]
  list(
    colname = "mpg",
    mean = mean(mpg_subset),
    min = min(mpg_subset),
    max = max(mpg_subset)
  )
})
```

**Python Backend**:
```python
# In app.py
@render_json
def table_stats():
    num_rows = input.table_rows()
    mpg_subset = mtcars["mpg"][seq_len(num_rows)]
    return {
        "colname": "mpg",
        "mean": float(mpg_subset.mean()),
        "min": float(mpg_subset.min()),
        "max": float(mpg_subset.max()),
    }
```


## Using shadcn/ui with Shiny-React

The shiny-react library works seamlessly with [shadcn/ui](https://ui.shadcn.com/), a collection of beautifully designed, accessible, and customizable React components built on Radix UI and Tailwind CSS.

### Required Dependencies

```json
{
  "dependencies": {
    "@posit/shiny-react": "^0.0.6",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-separator": "^1.0.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  }
}
```

### Example Components

**Text Input Card with shadcn/ui**:
```typescript
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { useShinyInput, useShinyOutput } from "@posit/shiny-react";

export function TextInputCard() {
  const [inputText, setInputText] = useShinyInput<string>("user_text", "");
  const [processedText] = useShinyOutput<string>("processed_text", "");
  const [textLength] = useShinyOutput<number>("text_length", 0);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Text Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="text-input" className="text-sm font-medium mb-2 block">
            Enter some text:
          </label>
          <Input
            id="text-input"
            type="text"
            placeholder="Type something..."
            value={inputText}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Processed text from server:
          </p>
          <div className="bg-muted p-3 rounded-md">
            <pre className="text-sm">
              {processedText || "No text entered yet"}
            </pre>
          </div>
        </div>
        <div className="text-sm">
          <Badge variant="secondary">Length: {textLength}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Key Benefits of shadcn/ui Integration

- **Consistent Design System**: Professional, accessible components out of the box
- **Full Customization**: Components are copied to your project, not installed as dependencies
- **TypeScript Support**: Full type safety with React and shiny-react
- **Theme Support**: Built-in dark/light mode with CSS variables
- **Accessibility**: Components built on Radix UI primitives
- **Modern Styling**: Tailwind CSS utility classes with custom design tokens


## Troubleshooting

### Common Issues
1. **"Shiny not found" errors**: Ensure Shiny server is running and accessible
2. **Build failures**: Check that all dependencies are installed (`npm install`)
3. **Hot reload not working**: Restart development mode
4. **Data not syncing**: Verify matching input/output IDs between React and Shiny
5. **TypeScript errors**: Check type definitions and imports

### Development Tips
- **Use browser DevTools**: Check console for React/JavaScript errors
- **Monitor Shiny logs**: Watch R/Python console for server-side errors
- **Verify IDs match**: Input/output IDs must be identical in React and Shiny code
- **Check network tab**: Verify WebSocket communication between client and server

### Performance Considerations
- **Too low debounce**: Server overload from rapid updates
- **Too high debounce**: UI feels unresponsive
- **Sweet spot**: 100-300ms for most text inputs, 0ms for buttons and real-time controls

## Key Dependencies

- **@posit/shiny-react**: Core library for React-Shiny communication
- **react + react-dom**: React framework
- **typescript**: TypeScript compiler and type checking
- **esbuild**: Fast JavaScript bundling

This documentation covers all aspects of Shiny-React development from basic concepts to advanced patterns. Use it as a complete reference for building applications with React frontends and Shiny backends.
