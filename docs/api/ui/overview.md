# ModUI - UI Components

ModUI is a collection of composable, granular UI components designed for building audio applications and custom interfaces. These components are part of the `@mode-7/mod` package and have **zero external dependencies**.

## Philosophy

ModUI components follow these core principles:

- **Zero Dependencies** - No external libraries required, just React and plain CSS
- **Composable** - Components can be combined and nested flexibly
- **Granular** - Fine-grained control over styling and behavior
- **Framework Agnostic Styles** - Use plain CSS, CSS modules, or Tailwind
- **Accessible** - Built with ARIA labels and keyboard support
- **Customizable** - Every element has className props for complete control

## Why ModUI?

When building audio applications, you often need specialized UI controls that work well with audio parameters:

- **Sliders** for continuous values (frequency, volume, pan)
- **Knobs** for rotary parameter control
- **Toggles** for on/off states (bypass, mute)
- **Buttons** for triggering actions (play, stop, record)
- **Displays** for showing values and meters

Instead of bringing in heavy UI libraries, ModUI provides lightweight, audio-focused components that you can style to match your design.

## Component Categories

### Controls

Interactive input components for parameter control:

- [Slider](/api/ui/controls/slider) - Range slider with optional +/- buttons
- [Knob](/api/ui/controls/knob) - Rotary control for parameters
- [XYPad](/api/ui/controls/xypad) - Two-dimensional control surface
- [Button](/api/ui/controls/button) - Customizable button with icon support
- [Select](/api/ui/controls/select) - Dropdown selector
- [TextInput](/api/ui/controls/textinput) - Text input field (text, URL, email, password, search)
- [FilePicker](/api/ui/controls/filepicker) - File picker with type filtering
- [ProgressBar](/api/ui/controls/progressbar) - Progress/scrub bar for playback

### Visualizations

Canvas-based components for audio visualization:

- [OscilloscopeCanvas](/api/ui/visualizations/oscilloscope) - Real-time waveform display
- [SpectrumAnalyzerCanvas](/api/ui/visualizations/spectrum-analyzer) - Frequency spectrum visualization
- [LevelMeterCanvas](/api/ui/visualizations/level-meter) - Audio level metering with peak detection

## Installation

ModUI components are included in the core package:

```bash
npm install @mode-7/mod
```

## Basic Usage

Import components from the core package:

```tsx
import {
  Slider,
  Knob,
  Button,
  Select,
  XYPad,
  TextInput,
  FilePicker,
  ProgressBar,
  OscilloscopeCanvas,
  SpectrumAnalyzerCanvas,
  LevelMeterCanvas
} from '@mode-7/mod';
```

### With Default Styles

Import the bundled CSS file:

```tsx
import '@mode-7/mod/dist/index.css';
```

All ModUI component styles are included in this single CSS file.

### With Custom Styles

Use className props to apply your own styles:

```tsx
<Slider
  value={value}
  onChange={setValue}
  className="my-custom-slider"
  buttonClassName="my-button"
  inputClassName="my-input"
/>
```

### With Tailwind

ModUI works perfectly with Tailwind CSS:

```tsx
<Slider
  value={value}
  onChange={setValue}
  className="w-full p-2"
  labelClassName="text-gray-400 text-xs"
  valueClassName="text-green-500 text-xs font-bold"
  buttonClassName="bg-gray-800 hover:bg-gray-700 rounded"
  inputClassName="accent-green-500"
/>
```

## CSS Class Naming

All ModUI components use predictable class names following the pattern:

```
modui-{component}-{element}
```

For example, the Slider component uses:
- `modui-slider` - Container
- `modui-slider-label` - Label text
- `modui-slider-value` - Value display
- `modui-slider-button` - Button elements
- `modui-slider-input` - Range input

This makes it easy to target elements with custom CSS or override default styles.

## Styling Strategies

### 1. Use Default Styles

The simplest approach - import the default CSS file:

```tsx
import '@mode-7/mod/dist/index.css';

<Slider value={50} onChange={setValue} />
```

### 2. Override Default Styles

Import defaults and override specific properties:

```css
/* Your custom CSS */
.modui-slider-button {
  background: linear-gradient(to bottom, #667eea, #764ba2);
  border-radius: 50%;
}
```

### 3. Custom CSS Classes

Use className props with your own CSS:

```tsx
<Slider
  className="custom-slider"
  buttonClassName="custom-button"
/>
```

```css
.custom-slider {
  padding: 1rem;
  background: #1a1a1a;
}

.custom-button {
  background: #4CAF50;
  border: none;
}
```

### 4. CSS Modules

Perfect for component-scoped styles:

```tsx
import styles from './MyComponent.module.css';

<Slider
  className={styles.slider}
  buttonClassName={styles.button}
/>
```

### 5. Tailwind Utility Classes

Most flexible for rapid prototyping:

```tsx
<Slider
  className="w-full p-4 bg-gray-900 rounded-lg"
  labelClassName="text-xs text-gray-400 uppercase tracking-wide"
  valueClassName="text-sm font-mono text-emerald-400"
  buttonClassName="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-500"
  inputClassName="accent-emerald-500"
/>
```

## TypeScript Support

All ModUI components are written in TypeScript with full type definitions:

```tsx
import type { SliderProps } from '@mode-7/mod';

const sliderProps: SliderProps = {
  value: 50,
  onChange: (value) => console.log(value),
  min: 0,
  max: 100,
  step: 1
};
```

## Accessibility

All ModUI components include:

- Proper ARIA labels
- Keyboard support
- Focus management
- Disabled states
- Screen reader compatibility

## Examples

See individual component pages for detailed examples and demos.

## Next Steps

**Explore Controls:**
- [Slider](/api/ui/controls/slider) - Range sliders with buttons
- [Knob](/api/ui/controls/knob) - Rotary controls
- [XYPad](/api/ui/controls/xypad) - 2D control surface
- [Button](/api/ui/controls/button) - Interactive buttons
- [Select](/api/ui/controls/select) - Dropdown menus
- [TextInput](/api/ui/controls/textinput) - Text input fields
- [FilePicker](/api/ui/controls/filepicker) - File upload
- [ProgressBar](/api/ui/controls/progressbar) - Progress indicators

**Explore Visualizations:**
- [OscilloscopeCanvas](/api/ui/visualizations/oscilloscope) - Waveform display
- [SpectrumAnalyzerCanvas](/api/ui/visualizations/spectrum-analyzer) - Frequency analysis
- [LevelMeterCanvas](/api/ui/visualizations/level-meter) - Level metering

**Learn More:**
- Check out the [Playground](/playground/) for live examples
- Read the [Guide](/guide/getting-started) for more information
