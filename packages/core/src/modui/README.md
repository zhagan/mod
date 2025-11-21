# ModUI - Visual Components

ModUI is a collection of composable, granular UI components designed for building audio applications. These components have **zero dependencies** and can be styled using plain CSS, custom CSS classes, or Tailwind CSS.

## Philosophy

- **Zero Dependencies**: No external libraries, just React and plain CSS
- **Composable**: Components can be combined and nested
- **Granular**: Fine-grained control over styling and behavior
- **Flexible Styling**: Works with plain CSS, CSS modules, or Tailwind
- **Framework Agnostic Styles**: CSS classes follow BEM-like naming (`modui-*`)

## Components

### Slider

A versatile slider component with optional increment/decrement buttons.

#### Basic Usage

```tsx
import { ModUISlider } from '@mod-audio/core';
import '@mod-audio/core/dist/modui/Slider.css'; // Optional default styles

function MyComponent() {
  const [volume, setVolume] = useState(50);

  return (
    <ModUISlider
      value={volume}
      onChange={setVolume}
      min={0}
      max={100}
      label="Volume"
      unit="%"
    />
  );
}
```

#### Without Buttons

```tsx
<ModUISlider
  value={value}
  onChange={setValue}
  showButtons={false}
/>
```

#### With Custom Formatting

```tsx
<ModUISlider
  value={frequency}
  onChange={setFrequency}
  min={20}
  max={20000}
  step={1}
  label="Frequency"
  formatValue={(val) => `${val.toFixed(0)} Hz`}
/>
```

#### With Tailwind Styling

```tsx
<ModUISlider
  value={value}
  onChange={setValue}
  className="w-full p-2"
  labelClassName="text-gray-400 text-xs"
  valueClassName="text-green-500 text-xs font-bold"
  buttonClassName="bg-gray-800 hover:bg-gray-700 border-gray-600"
  inputClassName="accent-green-500"
/>
```

#### With Custom CSS

```tsx
<ModUISlider
  value={value}
  onChange={setValue}
  className="my-custom-slider"
  buttonClassName="my-button-style"
  inputClassName="my-input-style"
/>
```

```css
.my-custom-slider {
  padding: 1rem;
  background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.my-button-style {
  background: white;
  color: #764ba2;
}
```

## Props

### SliderProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | Required | Current slider value |
| `onChange` | `(value: number) => void` | Required | Value change callback |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `label` | `string` | - | Optional label text |
| `unit` | `string` | `''` | Unit suffix (e.g., "Hz", "%") |
| `formatValue` | `(value: number) => string` | - | Custom value formatter |
| `showButtons` | `boolean` | `true` | Show +/- buttons |
| `disabled` | `boolean` | `false` | Disable the slider |
| `className` | `string` | `''` | Container class |
| `labelClassName` | `string` | `''` | Label class |
| `valueClassName` | `string` | `''` | Value display class |
| `controlClassName` | `string` | `''` | Control wrapper class |
| `buttonClassName` | `string` | `''` | Button class |
| `inputClassName` | `string` | `''` | Range input class |

## CSS Classes

All components use predictable class names following the `modui-{component}-{element}` pattern:

### Slider Classes

- `.modui-slider` - Container
- `.modui-slider-header` - Header with label and value
- `.modui-slider-label` - Label text
- `.modui-slider-value` - Value display
- `.modui-slider-control` - Control wrapper
- `.modui-slider-button` - Button (both + and -)
- `.modui-slider-button-minus` - Decrement button
- `.modui-slider-button-plus` - Increment button
- `.modui-slider-input` - Range input

## Styling Strategies

### 1. Use Default Styles

Import the default CSS file:

```tsx
import '@mod-audio/core/dist/modui/Slider.css';
```

### 2. Override with Custom CSS

```css
.modui-slider-button {
  background: your-color;
  border-radius: 50%;
}
```

### 3. Use Tailwind Classes

```tsx
<ModUISlider
  buttonClassName="rounded-full bg-blue-500 hover:bg-blue-600"
  inputClassName="accent-blue-500"
/>
```

### 4. CSS Modules

```tsx
import styles from './MySlider.module.css';

<ModUISlider
  className={styles.slider}
  buttonClassName={styles.button}
/>
```

## Future Components

ModUI will expand to include:

- **Button** - Customizable button component
- **Knob** - Rotary knob for parameter control
- **Toggle** - Switch/toggle component
- **Select** - Dropdown selector
- **Input** - Text input field
- **Display** - Value display/meter
- **Panel** - Container with header
- **Grid** - Layout grid
- And more...
