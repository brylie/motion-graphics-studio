# Motion Graphics Studio

A browser-based motion graphics studio with timeline-based sequencing for Interactive Shader Format (ISF) shaders. Built with SvelteKit, TypeScript, and WebGL2.

## Features

- **SVG-based Timeline**: Professional timeline editor with grid layout and proper coordinate system
- **Track-based Composition**: Layer multiple shader tracks with proper blending and visual feedback
- **ISF Shader Support**: Full support for ISF 2.0 format including generators and effects
- **Real-time Preview**: Hardware-accelerated WebGL2 rendering at 1920x1080 with real-time composition
- **Playback Controls**: Play, pause, stop, loop functionality with real-time scrubbing
- **Zoom & Pan**: Adjustable timeline zoom with mouse wheel (Ctrl/Cmd + wheel to zoom)
- **Parameter Automation**: Full keyframe animation with proportional and absolute resize modes
- **Automation Lanes**: Visual automation curve editing with draggable keyframes
- **Shader Library**: Browse, search, filter, and drag shaders onto the timeline
- **Drag & Drop**: Drag shaders from library to tracks, move clips between tracks
- **Clip Resizing**: Resize clips with handles, with intelligent keyframe handling
- **Parameter Panel**: Edit shader parameters and manage keyframes for selected clips

## Project Structure

```
src/
├── lib/
│   ├── isf/
│   │   ├── types.ts          # ISF type definitions
│   │   ├── parser.ts         # ISF file parser
│   │   ├── uniforms.ts       # WebGL uniform management
│   │   └── renderer.ts       # WebGL2 ISF renderer
│   ├── timeline/
│   │   └── types.ts          # Timeline data structures
│   ├── composition/
│   │   └── renderer.ts       # Multi-track composition renderer
│   ├── stores/
│   │   ├── timeline.ts       # Timeline state & actions
│   │   ├── playback.ts       # Playback state & actions
│   │   ├── shaders.ts        # Shader library state
│   │   ├── dragDrop.ts       # Drag & drop state management
│   │   └── historyStore.ts   # Undo/redo history (foundation)
│   ├── utils/
│   │   └── keyframes.ts      # Keyframe interpolation utilities
│   └── components/
│       ├── Timeline.svelte         # Main timeline container
│       ├── TimelineRuler.svelte    # Time ruler with scrubbing
│       ├── TimelineTrack.svelte    # Individual track component
│       ├── TimelineClip.svelte     # Draggable/resizable clip
│       ├── AutomationLane.svelte   # Keyframe curve editor
│       ├── Preview.svelte          # WebGL preview window
│       ├── ShaderLibrary.svelte    # Shader browser panel
│       ├── PlaybackControls.svelte # Transport controls
│       └── ParameterPanel.svelte   # Parameter editor panel
└── routes/
    └── +page.svelte          # Main application layout

static/
└── shaders/                  # ISF shader files
    ├── Plasma.fs
    ├── Checkerboard.fs
    ├── Ripples.fs
    ├── Kaleidoscope.fs
    ├── Pixellate.fs
    ├── ColorShift.fs
    ├── SolidColor.fs
    └── Image.fs
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```sh
npm install
```

### Development

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Testing

The project includes comprehensive test coverage across multiple levels:

#### Unit Tests

Run fast unit tests for store logic, utilities, and non-UI code:

```sh
npm run test:unit
```

Or run tests in watch mode during development:

```sh
npm run test:unit -- --watch
```

#### Component Tests

Run component tests in a real browser environment (uses Playwright):

```sh
npm test
```

This runs both unit and component tests together.

#### End-to-End Tests

Run full e2e tests that simulate real user interactions:

```sh
npm run test:e2e
```

Run e2e tests in headed mode (opens browser window):

```sh
npm run test:e2e -- --headed
```

Run e2e tests in UI mode (interactive test runner):

```sh
npm run test:e2e -- --ui
```

#### Visual Testing with Storybook

Launch Storybook to interactively test components and visual states:

```sh
npm run storybook
```

View stories at [http://localhost:6006](http://localhost:6006)

Build static Storybook for deployment:

```sh
npm run build-storybook
```

#### Test Coverage

- **Unit Tests**: Timeline store operations, track management, keyframe CRUD, clip operations
- **Component Tests**: Svelte component rendering and behavior
- **E2E Tests**: Timeline interactions, clip management, keyframe operations, resize behavior (absolute/proportional modes), regression tests for keyframe duplication bug
- **Visual Tests**: Timeline states, automation curves, multi-track layouts

### Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Usage

### Timeline Controls

- **Click Clip**: Select clip (shows resize handles and highlights)
- **Drag Clip**: Move clip along timeline or between tracks
- **Drag Resize Handles**: Resize clip duration (left/right edges when selected)
- **Hold Alt While Resizing**: Proportional mode (scales keyframes proportionally)
- **Default Resize**: Absolute mode (keyframes stay at absolute time positions)
- **Click Ruler**: Seek to time position
- **Drag Ruler**: Scrub through timeline
- **Mouse Wheel**: Scroll timeline horizontally
- **Ctrl/Cmd + Wheel**: Zoom timeline in/out
- **Esc During Drag**: Cancel drag operation

### Playback Controls

- **Play/Pause**: Start or pause playback
- **Stop**: Stop and return to beginning
- **Loop**: Toggle loop mode
- **Zoom +/-**: Adjust timeline zoom level
- **Fit**: Reset zoom and scroll

### Shader Library

- **Search**: Filter shaders by name or description
- **Category Filter**: Filter by shader category
- **Click Shader**: Add to first track at time 0
- **Drag Shader**: Drag onto timeline at specific time and track

### Parameter Panel

- **Clip Info**: View selected clip's shader, start time, duration, and alpha
- **Shader Parameters**: Edit shader parameters with appropriate controls (sliders, color pickers, etc.)
- **Parameter Values**: Shows interpolated value at current playhead position
- **Add Keyframe**: Click "Add Keyframe" to create automation point at current time
- **Remove Keyframe**: Select keyframe on automation lane and delete
- **Image Selection**: For Image shader, select images from your local filesystem with preview
- **Automation Curves**: Visual curves show parameter changes over time

### Track Management

- Tracks are processed bottom-to-top
- Upper tracks render over lower tracks
- Mute (M) and Solo (S) buttons per track (UI pending)

## ISF Shader Format

This project supports ISF 2.0 shaders with the following features:

- **Generator Shaders**: Create patterns from scratch
- **Effect Shaders**: Process input images
- **Input Types**: float, vec2, color, image, bool, long, event
- **Standard Uniforms**: TIME, RENDERSIZE, PASSINDEX
- **Image Sampling**: IMG_PIXEL, IMG_NORM_PIXEL macros

### Adding Custom Shaders

Place `.fs` shader files in the `static/shaders/` directory. Each shader must include JSON metadata in a comment block:

```glsl
/*{
  "DESCRIPTION": "My custom shader",
  "CREDIT": "Your Name",
  "CATEGORIES": ["Generator"],
  "INPUTS": [
    {
      "NAME": "speed",
      "TYPE": "float",
      "DEFAULT": 1.0,
      "MIN": 0.0,
      "MAX": 10.0
    }
  ]
}*/

#version 300 es
precision highp float;

uniform float TIME;
uniform vec2 RENDERSIZE;
uniform float speed;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / RENDERSIZE;
  float t = TIME * speed;
  fragColor = vec4(sin(t + uv.x), cos(t + uv.y), 0.5, 1.0);
}
```

## Roadmap

### Completed ✅
- SvelteKit project setup with TypeScript
- ISF parser and WebGL2 renderer
- Timeline data structures and state management
- SVG-based timeline editor with proper coordinate system
- Clip selection, dragging, and resizing with visual feedback
- Drag-and-drop from shader library to timeline
- Move clips between tracks
- Playback controls with scrubbing
- Shader library browser with search and category filtering
- Multi-track composition renderer with blending
- Parameter automation system with keyframes
- Automation lanes with visual curve editing
- Proportional and absolute resize modes for keyframes
- Parameter panel with live value display
- Comprehensive test coverage (unit, component, e2e)
- Storybook for all components
- Image parameter support with file selection

### In Progress 🚧
- Undo/redo system (foundation in place)
- Track mute/solo functionality (buttons present, wiring needed)

### Planned 📋
- Audio integration with Tone.js
- Audio reactivity (FFT analysis)
- Bezier curve automation (currently linear)
- Export to video
- Keyboard shortcuts
- Save/load projects (JSON format)
- Multi-select and bulk operations
- Copy/paste clips
- Track reordering

## Technology Stack

- **SvelteKit**: Application framework
- **TypeScript**: Type-safe development
- **WebGL2**: Hardware-accelerated rendering
- **Svelte**: Reactive UI components
- **Vite**: Fast build tool and dev server
- **Vitest**: Unit and component testing
- **Playwright**: End-to-end testing
- **Storybook**: Component development and visual testing
- **Tailwind CSS**: Styling (via Vite plugin)

## License

MIT

## Credits

- ISF Shader Format: [Interactive Shader Format](https://isf.video/)
- ISF Shaders: Created for this project (examples)

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
