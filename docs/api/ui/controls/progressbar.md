# ProgressBar

A styled progress/scrub bar component for displaying and controlling playback position, loading progress, or other linear values.

## Features

- Visual fill gradient showing progress
- Interactive scrubbing via hidden range input
- Optional value display with custom formatting
- Configurable min/max/step values
- Disabled state support
- Smooth visual transitions
- Completely customizable via className props
- Event propagation control (won't drag parent modules)

## Import

```tsx
import { ProgressBar } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | Required | Current value/position |
| `onChange` | `(value: number) => void` | Required | Value change callback |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `disabled` | `boolean` | `false` | Disabled state |
| `showValue` | `boolean` | `false` | Show formatted value text |
| `formatValue` | `(value: number) => string` | - | Custom value formatter |
| `className` | `string` | `''` | Additional CSS classes for container |
| `barClassName` | `string` | `''` | Additional CSS classes for bar |

## Usage

### Basic Usage

```tsx
import { ProgressBar } from '@mode-7/mod';
import { useState } from 'react';

function BasicProgress() {
  const [value, setValue] = useState(50);

  return (
    <ProgressBar
      value={value}
      onChange={setValue}
      min={0}
      max={100}
    />
  );
}
```

### Audio Playback Scrubber

```tsx
function AudioScrubber({ currentTime, duration, onSeek }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ProgressBar
      value={currentTime}
      onChange={onSeek}
      min={0}
      max={duration || 100}
      step={0.1}
      showValue={true}
      formatValue={() => `${formatTime(currentTime)} / ${formatTime(duration)}`}
    />
  );
}
```

### Loading Progress

```tsx
function LoadingIndicator({ progress }) {
  return (
    <ProgressBar
      value={progress}
      onChange={() => {}} // Read-only
      min={0}
      max={100}
      disabled={true}
      showValue={true}
      formatValue={(v) => `${v.toFixed(0)}%`}
    />
  );
}
```

### Volume Level

```tsx
function VolumeBar() {
  const [volume, setVolume] = useState(80);

  return (
    <ProgressBar
      value={volume}
      onChange={setVolume}
      min={0}
      max={100}
      showValue={true}
      formatValue={(v) => `${v}%`}
    />
  );
}
```

### Buffer Progress

```tsx
function BufferIndicator({ buffered, duration }) {
  const percentage = (buffered / duration) * 100;

  return (
    <ProgressBar
      value={percentage}
      onChange={() => {}}
      min={0}
      max={100}
      disabled={true}
      className="buffer-progress"
    />
  );
}
```

### With Custom Step

```tsx
<ProgressBar
  value={gain}
  onChange={setGain}
  min={0}
  max={2}
  step={0.01}
  showValue={true}
  formatValue={(v) => `${(v * 100).toFixed(0)}%`}
/>
```

### Disabled State

```tsx
<ProgressBar
  value={value}
  onChange={setValue}
  disabled={true}
/>
```

## CSS Classes

The ProgressBar component uses the following CSS classes:

- `.modui-progressbar` - Container element
- `.modui-progressbar-bar` - Bar container
- `.modui-progressbar-fill` - Fill gradient element
- `.modui-progressbar-input` - Hidden range input
- `.modui-progressbar-value` - Value display text
- `.modui-progressbar-disabled` - Applied when disabled

## Styling Examples

### Custom Colors

```css
.custom-progress .modui-progressbar-bar {
  background: #1a1a2e;
  border-color: #3949ab;
}

.custom-progress .modui-progressbar-fill {
  background: linear-gradient(90deg, #3949ab, #5c6bc0);
}
```

### Compact Size

```css
.compact-progress .modui-progressbar-bar {
  height: 4px;
  border-radius: 2px;
}
```

### Thick Bar

```css
.thick-progress .modui-progressbar-bar {
  height: 16px;
  border-radius: 8px;
}

.thick-progress .modui-progressbar-value {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
```

### Success Color

```css
.success-progress .modui-progressbar-fill {
  background: linear-gradient(90deg, #4CAF50, #66BB6A);
}
```

### Warning Color

```css
.warning-progress .modui-progressbar-fill {
  background: linear-gradient(90deg, #FFA726, #FFB74D);
}
```

### Danger Color

```css
.danger-progress .modui-progressbar-fill {
  background: linear-gradient(90deg, #EF5350, #E57373);
}
```

## Common Patterns

### MP3Deck Integration

```tsx
import { MP3Deck, ProgressBar } from '@mode-7/mod';
import { useModStream } from '@mode-7/mod';

function MP3Player() {
  const output = useModStream();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MP3Deck output={output}>
      {(controls) => (
        <div className="mp3-player">
          <ProgressBar
            value={controls.currentTime}
            onChange={(value) => controls.seek(value)}
            min={0}
            max={controls.duration || 100}
            step={0.1}
            disabled={!controls.src}
            showValue={true}
            formatValue={() =>
              controls.src
                ? `${formatTime(controls.currentTime)} / ${formatTime(controls.duration)}`
                : '0:00 / 0:00'
            }
          />
          {/* Other controls... */}
        </div>
      )}
    </MP3Deck>
  );
}
```

### StreamingAudioDeck Integration

```tsx
import { StreamingAudioDeck, ProgressBar } from '@mode-7/mod';
import { useModStream } from '@mode-7/mod';

function StreamPlayer() {
  const output = useModStream();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <StreamingAudioDeck output={output}>
      {(controls) => (
        <div className="stream-player">
          <ProgressBar
            value={controls.currentTime}
            onChange={(value) => controls.seek(value)}
            min={0}
            max={controls.duration || 100}
            step={0.1}
            disabled={!controls.url}
            showValue={true}
            formatValue={() =>
              controls.url
                ? `${formatTime(controls.currentTime)} / ${formatTime(controls.duration)}`
                : '0:00 / 0:00'
            }
          />
          {/* Other controls... */}
        </div>
      )}
    </StreamingAudioDeck>
  );
}
```

### Read-Only Progress

```tsx
function DownloadProgress({ progress }) {
  return (
    <ProgressBar
      value={progress}
      onChange={() => {}} // No-op for read-only
      min={0}
      max={100}
      disabled={true}
      showValue={true}
      formatValue={(v) => `Downloading... ${v.toFixed(0)}%`}
    />
  );
}
```

### Multi-Range Display

```tsx
function MultiProgress() {
  const [position, setPosition] = useState(0);
  const [buffer, setBuffer] = useState(0);

  return (
    <div style={{ position: 'relative' }}>
      {/* Buffer indicator (behind) */}
      <ProgressBar
        value={buffer}
        onChange={() => {}}
        disabled={true}
        className="buffer-bar"
      />
      {/* Playback position (on top) */}
      <ProgressBar
        value={position}
        onChange={setPosition}
        className="position-bar"
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
      />
    </div>
  );
}
```

## Time Formatting Helpers

### Standard Time Format

```tsx
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

### Hours:Minutes:Seconds

```tsx
const formatTimeWithHours = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

## Accessibility

The ProgressBar component includes:

- Native range input for keyboard support (arrow keys)
- Disabled state handling
- Focus styles
- Proper value boundaries

## Related

- [MP3Deck](/api/sources/mp3-deck)
- [StreamingAudioDeck](/api/sources/streaming-audio-deck)
- [Slider](/api/ui/controls/slider)
- [ModUI Overview](/api/ui/overview)
