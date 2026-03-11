Portfolio 3D - Jinxiong Zheng

A modern interactive 3D portfolio web application built with Three.js. This project showcases a fully interactive 3D environment with object interactions, camera controls, and dynamic UI panels.

FEATURES

Interactive 3D Scene - Built with Three.js for high-quality 3D rendering
Object Interaction - Click on 3D objects to display information panels
Advanced Camera Controls - Rotate, zoom, and pan with intuitive mouse controls
Responsive UI - Dynamic panels that populate based on selected objects
Modular Architecture - Clean JavaScript modules for easy maintenance and extension
Asset Management - Organized structure for models, videos, images, and materials
GPU Isolation Mode - Focus on individual objects with camera isolation

QUICK START

Prerequisites:
- A modern web browser with WebGL support
- A local HTTP server (recommended)

Running Locally:

We recommend using a local HTTP server, as opening the file directly may cause module loading or video playback issues.

Option 1: Using VS Code Live Server
1. Install the Live Server extension in VS Code
2. Right-click index.html and select "Open with Live Server"

Option 2: Using Node.js (http-server)

npm install -g http-server
cd d:\2A3D_SSD\M06_HTML\Pr05_Portfolio3D_JinxiongZheng
http-server -c-1 .

Option 3: Using Python

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

Then open your browser to http://localhost:8000 (or the port shown in your server output).

CONTROLS

Left Mouse Button - Rotate camera around the scene
Middle Mouse Button - Pan/move the camera
Mouse Wheel - Zoom in/out
Click on Objects - Display information panels
ESC Key - Exit GPU isolation mode
Reset View Button - Return to initial camera position

PROJECT STRUCTURE

Pr05_Portfolio3D_JinxiongZheng/
├── index.html - Main entry point (UI panels & import map)
├── README.md - This file
├── css/
│   └── style.css - Main stylesheet
├── js/
│   ├── main.js - Scene setup & rendering loop
│   ├── interactions.js - Raycasting & UI panel activation
│   ├── cameraManager.js - Camera transitions & controls
│   ├── DesktopScreenManager.js - 管理副屏上的桌面交互和图标
│   ├── uiManager.js - Panel visibility & content management
│   └── poolGame.js - Pool game mechanics (if included)
└── assets/
    ├── images/ - Texture images & icons
    ├── videos/ - Video files for the scene
    ├── materials/ - Material files & textures
    └── models/
        ├── models_Static/ - Non-interactive 3D models (.glb)
        └── models_interactive/ - Interactive 3D models (.glb)

USAGE GUIDE

Loading 3D Models

1. Export from Blender: Export your 3D models as .glb (glTF Binary) files
2. Place Files:
   - Non-interactive objects: assets/models/models_Static/
   - Interactive objects: assets/models/models_interactive/
3. Update HTML/JS: Reference your models in index.html and main.js

Naming Convention

Interactive objects should be explicitly named in Blender, such as:
- graphics_card
- pool_table
- main_screen
- blackboard
- gpu_model

These names will be accessible via object.userData.type or object.name in the JavaScript code.

Creating Interactive Objects

1. Name your object in Blender appropriately
2. Export the model as .glb
3. In main.js, add the model to the scene using THREE.GLTFLoader
4. In interactions.js, add raycasting logic to detect clicks
5. In uiManager.js, create a panel that displays when the object is clicked

CAMERA CONSTRAINTS

For a controlled experience, the camera is constrained with the following limits:

Zoom Level: 5 to 15 units
Rotation: 45 degrees to each side (90 degrees total)
X-Axis Pan: -5 to 5
Y-Axis Pan: 0 to 2
Z-Axis Pan: -5 to 5

These values can be adjusted in cameraManager.js.

FILE DESCRIPTIONS

index.html - Defines HTML structure, UI panels, and Three.js import map
style.css - Styles for panels, buttons, and responsive layout
main.js - Initializes Three.js scene, loads models, and handles animation loop
interactions.js - Implements raycasting for object selection and panel display
cameraManager.js - Manages camera movement, zoom, rotation, and constraints
uiManager.js - Handles showing/hiding and updating information panels
poolGame.js - Optional pool/billiards game mechanics

DEPLOYMENT

To deploy this project:

1. Build or optimize assets (compress images, optimize models)
2. Upload all files to a web server
3. Ensure CORS headers allow model/video loading if hosted on a different domain
4. Test in target browsers for WebGL support

Recommended Hosting Providers:
- Netlify (free, easy deployment)
- GitHub Pages (free for public repos)
- Vercel (free, excellent performance)
- Your own server (full control)

DEVELOPMENT TIPS

Use Chrome DevTools for debugging and performance profiling
Monitor WebGL draw calls and memory usage in the Performance tab
Use browser console to check for CORS or loading errors
Test camera constraints and interactions on different screen sizes
Optimize model file sizes before deployment

RESOURCES

Three.js Documentation: https://threejs.org/docs/
glTF/GLB Format: https://www.khronos.org/gltf/
WebGL Performance Tips: https://www.khronos.org/api/webgl
Blender Export Guide: https://docs.blender.org/manual/en/latest/addons/io_scene_gltf2/index.html

LICENSE

This project is created for educational purposes.

AUTHOR

Jinxiong Zheng

Last Updated: March 9, 2026

STATIC HOSTING

This project can be deployed on any static hosting service:

GitHub Pages

1. Push the code to a GitHub repository
2. Go to Repository Settings > Pages
3. Select the branch to deploy (usually main or master)
4. Your site will be available at https://[username].github.io/[repository-name]

Netlify

1. Create an account at netlify.com
2. Drag and drop the project folder into the Netlify dashboard
3. Your site will deploy instantly with a random URL
4. You can customize the domain in site settings

Vercel

1. Install Vercel CLI: npm i -g vercel
2. Run vercel in the project directory
3. Follow the instructions to deploy
4. Your site will be available with a .vercel.app domain

Custom Server

For more control, you can deploy on a custom server:

1. Upload all project files to your web server
2. Ensure .glb files are served with the correct MIME type
3. Configure CORS if necessary for external resources
4. Configure HTTPS for secure connections

BROWSER COMPATIBILITY

Chrome/Edge - Fully compatible
Firefox - Fully compatible
Safari - Fully compatible
Opera - Fully compatible

TROUBLESHOOTING

Models Not Loading

- Ensure all model files are in the correct directory
- Check for error messages in the browser console
- Validate that the server is serving .glb files with the correct MIME type

Performance Issues

- Try reducing the pixel ratio in main.js
- Close other browser tabs to free up resources
- Update graphics drivers
- Use a modern browser for better performance

Controls Not Responding

- Ensure you are clicking in the canvas area
- Verify that JavaScript is enabled in your browser
- Try refreshing the page

FEEDBACK AND SUPPORT

We appreciate your feedback and suggestions! Feel free to:

- Report issues: Create an issue on GitHub
- Request features: Use the issue tracker to suggest new features
- Contact: jinxiong@example.com

FUTURE SUGGESTIONS

Add smooth camera transitions (for example, using tween.js)
Implement more detailed click behaviors in interactions.js (ball physics, GPU isolation mode)
Export and place .glb models to verify the loading workflow
