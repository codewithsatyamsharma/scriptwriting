🎬 Storyboard & Script Sandbox
A robust, purely vanilla JavaScript web application designed for filmmakers, content creators, and animators to plan out their video scenes. It allows users to create structured storyboard shots, script dialogue, track scene durations, and even sketch visual notes using an integrated, fully functional digital drawing pad.

✨ Key Features
🎞️ Storyboard Management
Create & Edit Shots: Add individual shots with custom titles, scene durations (in seconds), specific shot types (Wide, Close-Up, B-Roll, etc.), and color-coded tags.

Drag-and-Drop Reordering: Easily rearrange the sequence of your shots using native HTML5 Drag and Drop APIs.

Grid & List Views: Toggle between a visually rich grid layout or a compact list view for easier reading.

Script & Visual Notes: Dedicated text areas for visual descriptions, production notes, and spoken dialogue/scripts.

Auto-Calculated Runtime: Automatically tallies the total duration of all shots combined.

🎨 Integrated Drawing Pad
Iframe Architecture: A completely isolated digital drawing canvas (/drawingtab) is embedded directly into the shot-editing modal via an iframe.

Rich Toolset: Features a pencil, eraser, shape tools (rectangle, circle, line), text insertion, and a bucket fill tool.

Customization: Includes a custom color picker and a dynamic cursor follower for precise sketching.

Canvas API: Built entirely on the HTML5 <canvas> element.

💾 Data Persistence & Export
Local Storage: All storyboard data is automatically saved to the browser's localStorage (under the key storyboard_shots_v2), ensuring no work is lost upon page refresh.

Plain Text Export: Generates a clean, beautifully formatted ASCII text export of the entire storyboard, ready to be copied to the clipboard and shared with production teams.

🛠️ Tech Stack
This project is built from the ground up without heavy frontend frameworks, showcasing strong fundamentals in web development:

HTML5: Semantic markup, Canvas API, and Drag-and-Drop API.

CSS3: Custom CSS variables, Flexbox/Grid layouts, and modular styling. Uses Remix Icons and Google Fonts (Bebas Neue, DM Mono, Playfair Display).

Vanilla JavaScript (ES6+): DOM manipulation, event delegation, state management, and localStorage integration.

📂 Project Structure
The project is divided into two distinct parts: the main storyboard interface and the isolated drawing pad nested within it.

Plaintext
📁 Project Root
├── 📄 index.html        # Main storyboard UI and layout
├── 📄 script.js         # Storyboard state, modal logic, drag-and-drop, and storage
├── 📄 style.css         # Main application styling
└── 📁 drawingtab        # Isolated digital drawing application
    ├── 📄 index.html    # Canvas UI and toolbars
    ├── 📄 script.js     # HTML5 Canvas rendering and tool logic
    └── 📄 style.css     # Drawing pad specific styling
🚀 Getting Started
Because this project uses vanilla web technologies and local storage, no build steps or heavy node modules are required.

Clone or Download the repository.

Open in a Local Server: Due to strict browser security policies regarding iframe interactions and local file protocols (file://), it is highly recommended to run this via a local development server.

VS Code: Install the Live Server extension, right-click index.html, and select "Open with Live Server".

Node.js: Run npx serve . in the root directory.

Python: Run python -m http.server in the root directory.

Open your browser to the provided local host address (https://scriptwriting.vercel.app/).

💡 How It Works (Under the Hood)
State Management: The main application state is held in a single shots array. Every time a shot is added, edited, deleted, or reordered, the render() function rebuilds the DOM, and saveToStorage() synchronizes the array with localStorage.

Event Delegation: To maintain high performance, event listeners for dynamically created shot cards are attached efficiently, and global clicks (like closing modals by clicking the overlay) are handled at the document level.

Lazy Loading the Canvas: The drawing pad iframe uses a data-src attribute. The src is only populated (loading the actual canvas document) when the user clicks the sketch icon for the very first time. This significantly improves the initial load time of the main storyboard app.
