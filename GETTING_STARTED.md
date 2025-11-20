# Getting Started with Mod Audio

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Core Library

```bash
npm run build --workspace=packages/core
```

### 3. Run the Demo

```bash
npm run dev --workspace=packages/demo
```

The demo will be available at http://localhost:5173 (or the next available port).

## Project Structure

```
mod/
├── packages/
│   ├── core/                    # Core library (@mode-7/mod)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── sources/     # Source components (ToneGenerator, Microphone, MP3Deck, etc.)
│   │   │   │   ├── cv/          # Control Voltage (LFO, ADSR, Sequencer, Clock)
│   │   │   │   ├── processors/  # Effect processors (Delay, Reverb, Filter, etc.)
│   │   │   │   ├── mixers/      # Mixing components (CrossFade, Mixer)
│   │   │   │   ├── output/      # Output component (Monitor)
│   │   │   │   └── visualizations/ # Visualizations (Oscilloscope, SpectrumAnalyzer, LevelMeter)
│   │   │   ├── context/         # React Context for AudioContext
│   │   │   ├── hooks/           # useModStream hook
│   │   │   ├── types/           # TypeScript types
│   │   │   └── index.ts         # Main export
│   │   ├── dist/                # Built library (generated)
│   │   └── package.json
│   │
│   └── demo/                    # Demo application
│       ├── src/
│       │   ├── App.tsx          # Demo page with examples
│       │   ├── App.css          # Styles
│       │   └── main.tsx         # Entry point
│       └── package.json
│
├── docs/                        # VitePress documentation
├── package.json                 # Root workspace config
└── README.md                    # Main documentation
```

## Development Workflow

### Building the Core Library

```bash
# Build once
npm run build --workspace=packages/core

# Watch mode (rebuild on changes)
npm run dev --workspace=packages/core
```

### Running the Demo

```bash
npm run dev --workspace=packages/demo
```

### Build Everything

```bash
npm run build:all
```

## Publishing to npm

### 1. Update Version

Edit `packages/core/package.json` and bump the version:

```json
{
  "version": "0.2.0"
}
```

### 2. Build

```bash
npm run build --workspace=packages/core
```

### 3. Publish

```bash
cd packages/core
npm publish --access public
```

## Adding to Your Project

Once published, install in any React project:

```bash
npm install @mode-7/mod
```

Then use in your app:

```tsx
import {
  AudioProvider,
  useModStream,
  ToneGenerator,
  Monitor
} from '@mode-7/mod';

function MyAudioApp() {
  const tone = useModStream();

  return (
    <AudioProvider>
      <ToneGenerator output={tone} frequency={440} />
      <Monitor input={tone} />
    </AudioProvider>
  );
}
```

## Available Components

### Sources (No Input → Output)
- `ToneGenerator` - Oscillator with multiple waveforms (sine, square, sawtooth, triangle)
- `NoiseGenerator` - White and pink noise generator
- `Microphone` - Live microphone input
- `MP3Deck` - Audio file playback with loop control and time tracking
- `StreamingAudioDeck` - Streaming audio from URLs with loop control and time tracking

### CV (Control Voltage)
- `LFO` - Low-frequency oscillator for modulation
- `ADSR` - Attack-Decay-Sustain-Release envelope generator
- `Sequencer` - Step sequencer for rhythmic patterns
- `Clock` - Precise timing source for triggering envelopes

### Processors (Input → Output)
- `Filter` - Multi-mode filter (lowpass, highpass, bandpass, etc.)
- `Delay` - Echo/delay effect with feedback
- `Reverb` - Convolution reverb with adjustable decay
- `Compressor` - Dynamic range compression
- `Distortion` - Waveshaping distortion
- `Panner` - Stereo panning
- `EQ` - 3-band equalizer
- `Chorus` - Chorus effect
- `Phaser` - Phaser effect
- `Flanger` - Flanger effect
- `Tremolo` - Amplitude modulation
- `BitCrusher` - Lo-fi bit reduction
- `Limiter` - Peak limiter
- `Gate` - Noise gate
- `AutoWah` - Envelope-following filter
- `RingModulator` - Ring modulation effect

### Mixers (Multiple Inputs → Output)
- `CrossFade` - Blend two inputs with multiple curve modes
- `Mixer` - 4-channel mixer with level control

### Output (Input → Speakers)
- `Monitor` - Audio output with device selection and muting

### Visualizations (Input → Canvas)
- `Oscilloscope` - Waveform visualization
- `SpectrumAnalyzer` - Frequency spectrum visualization
- `LevelMeter` - Audio level meter with peak detection

## Examples in Demo

The demo app is an interactive modular synthesizer playground showcasing:
- Drag-and-drop module placement on a canvas
- Visual wire connections between modules
- All available source, CV, processor, mixer, and visualization components
- Real-time parameter control
- Modular patching workflows

## Browser Requirements

- Chrome/Edge 35+
- Firefox 25+
- Safari 14.1+

## Troubleshooting

### Demo won't start
Make sure you've built the core library first:
```bash
npm run build --workspace=packages/core
```

### TypeScript errors
Make sure all dependencies are installed:
```bash
npm install
```

### No audio output
- Check browser permissions for microphone (if using Microphone component)
- Make sure your volume is up
- Open browser console to check for errors
- Some browsers require user interaction before playing audio

## Next Steps

1. Explore the demo app for usage examples
2. Read the [Core Library README](./packages/core/README.md) for API docs
3. Check out the [Main README](./README.md) for architecture overview
4. Start building your own audio components!
