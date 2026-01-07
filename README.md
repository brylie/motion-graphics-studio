# ISF Timeline Sequencer

A timeline-based sequencer for Interactive Shader Format (ISF) shaders built with SvelteKit and WebGL2.

## Features

- **Canvas-based Timeline**: Drag and resize shader clips with intuitive mouse controls
- **Track-based Composition**: Layer multiple shader tracks with proper blending
- **ISF Shader Support**: Full support for ISF 2.0 format including generators and effects
- **Real-time Preview**: Hardware-accelerated WebGL2 rendering
- **Playback Controls**: Play, pause, stop, and loop functionality
- **Zoom & Pan**: Adjustable timeline zoom with mouse wheel
- **Parameter Automation**: Animate shader parameters over time (foundation in place)
- **Shader Library**: Browse and drag shaders onto the timeline

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
│   │   ├── timeline.ts       # Timeline state management
│   │   ├── playback.ts       # Playback state management
│   │   └── shaders.ts        # Shader library state
│   └── components/
│       ├── Timeline.svelte   # Canvas timeline editor
│       ├── Preview.svelte    # WebGL preview window
│       ├── ShaderLibrary.svelte  # Shader browser
│       └── PlaybackControls.svelte  # Transport controls
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

- **Click and Drag**: Move clips along the timeline
- **Drag Edges**: Resize clip duration
- **Click Ruler**: Seek to time position
- **Mouse Wheel**: Scroll timeline horizontally
- **Ctrl/Cmd + Wheel**: Zoom timeline
- **Click Clip**: Select clip (highlights with blue border)

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
- **Shader Parameters**: View and edit shader parameters
- **Image Selection**: For Image shader, select images from your local filesystem
- **Automation**: View automation curves and keyframes

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
- SvelteKit project setup
- ISF parser and WebGL2 renderer
- Timeline data structures and state management
- Canvas-based timeline editor with drag/resize
- Playback controls
- Shader library browser
- Multi-track composition renderer
- Comprehensive test coverage (unit, component, e2e)
- Storybook for visual testing
- Keyframe automation system with proportional/absolute resize modes

### In Progress 🚧
- Audio integration with Tone.js
- Parameter automation curves UI
- Drag-and-drop from shader library

### Planned 📋
- Audio reactivity (FFT analysis)
- Bezier curve automation
- Track mute/solo UI
- Export to video
- Keyboard shortcuts
- Undo/redo
- Save/load projects

## Technology Stack

- **SvelteKit**: Application framework
- **TypeScript**: Type-safe development
- **WebGL2**: Hardware-accelerated rendering
- **Tone.js**: Web Audio API wrapper
- **HTML Canvas**: Timeline interface
- **Vitest**: Unit and component testing
- **Playwright**: End-to-end testing
- **Storybook**: Component development and visual testing

## License

MIT

## Credits

- ISF Shader Format: [Interactive Shader Format](https://isf.video/)
- ISF Shaders: Created for this project (examples)

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
