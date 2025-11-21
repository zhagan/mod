# Button

A versatile button component with support for icons, multiple variants, sizes, and active states - perfect for transport controls, toggles, and actions.

## Features

- Icon-only, text-only, or combined icon+text buttons
- 4 visual variants: default, danger, success, ghost
- 3 sizes: small, medium, large
- Active state support for toggle behavior
- Disabled state with visual feedback
- Accessible with ARIA attributes
- Completely customizable via className props
- Event propagation control (won't drag parent modules)

## Import

```tsx
import { Button } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Button text content |
| `icon` | `React.ReactNode` | - | Icon element (e.g., from lucide-react) |
| `active` | `boolean` | `false` | Active/pressed state for toggles |
| `onClick` | `() => void` | - | Click handler |
| `disabled` | `boolean` | `false` | Disabled state |
| `variant` | `'default' \| 'danger' \| 'success' \| 'ghost'` | `'default'` | Visual variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `title` | `string` | - | Tooltip text |
| `className` | `string` | `''` | Additional CSS classes |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type |

## Usage

### Icon-Only Buttons

```tsx
import { Button } from '@mode-7/mod';
import { Play, Pause, RotateCcw } from 'lucide-react';

function TransportControls() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button
        icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
        active={isPlaying}
        onClick={() => setIsPlaying(!isPlaying)}
        variant="success"
        title={isPlaying ? 'Pause' : 'Play'}
      />
      <Button
        icon={<RotateCcw size={16} />}
        onClick={() => console.log('Reset')}
        title="Reset"
      />
    </div>
  );
}
```

### Text Buttons

```tsx
<Button onClick={() => console.log('Clicked')}>
  Click Me
</Button>

<Button variant="danger" onClick={() => console.log('Delete')}>
  Delete
</Button>

<Button variant="success" onClick={() => console.log('Save')}>
  Save
</Button>
```

### Icon + Text Buttons

```tsx
import { Upload, Download } from 'lucide-react';

<Button icon={<Upload size={16} />} onClick={handleUpload}>
  Upload File
</Button>

<Button icon={<Download size={16} />} variant="success" onClick={handleDownload}>
  Download
</Button>
```

### Sizes

```tsx
<Button size="small" icon={<Play size={14} />} />
<Button size="medium" icon={<Play size={16} />} />
<Button size="large" icon={<Play size={20} />} />
```

### Variants

```tsx
<Button variant="default">Default</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>
<Button variant="ghost">Ghost</Button>
```

### Toggle Buttons

```tsx
function MuteButton() {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <Button
      icon={isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      active={isMuted}
      onClick={() => setIsMuted(!isMuted)}
      variant="danger"
      title={isMuted ? 'Unmute' : 'Mute'}
    />
  );
}
```

### Disabled State

```tsx
<Button disabled onClick={() => console.log('Never called')}>
  Disabled
</Button>

<Button
  icon={<Play size={16} />}
  disabled={!hasAudio}
  onClick={play}
>
  Play
</Button>
```

## CSS Classes

The Button component uses the following CSS classes:

- `.modui-button` - Base button element
- `.modui-button-default` - Default variant
- `.modui-button-danger` - Danger variant (red)
- `.modui-button-success` - Success variant (green)
- `.modui-button-ghost` - Ghost variant (transparent)
- `.modui-button-small` - Small size
- `.modui-button-medium` - Medium size
- `.modui-button-large` - Large size
- `.modui-button-active` - Active/pressed state
- `.modui-button-disabled` - Disabled state
- `.modui-button-icon-only` - Icon-only button
- `.modui-button-icon` - Icon wrapper
- `.modui-button-text` - Text wrapper

## Styling Examples

### Custom Colors

```css
.my-custom-button.modui-button {
  background: #1a237e;
  border-color: #3949ab;
  color: #7986cb;
}

.my-custom-button.modui-button:hover:not(.modui-button-disabled) {
  background: #283593;
  border-color: #5c6bc0;
}
```

### Custom Active State

```css
.modui-button-active.my-transport-button {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4CAF50;
  color: #4CAF50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
}
```

## Accessibility

The Button component includes:

- `role="button"` for screen readers
- `aria-pressed` attribute for toggle buttons
- `title` attribute for tooltips
- Proper `disabled` state handling
- Keyboard support (native button element)
- Focus styles

## Common Patterns

### Transport Controls

```tsx
<div style={{ display: 'flex', gap: '8px' }}>
  <Button
    icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
    active={isPlaying}
    onClick={togglePlay}
    variant="success"
  />
  <Button
    icon={<Square size={16} />}
    onClick={stop}
  />
  <Button
    icon={<Repeat size={16} />}
    active={loop}
    onClick={toggleLoop}
  />
</div>
```

### Action Bar

```tsx
<div style={{ display: 'flex', gap: '8px' }}>
  <Button icon={<RefreshCw size={16} />} title="Refresh" />
  <Button icon={<Settings size={16} />} title="Settings" />
  <Button icon={<Download size={16} />} variant="success" title="Download" />
  <Button icon={<Trash size={16} />} variant="danger" title="Delete" />
</div>
```

## Related

- [Slider](/api/ui/controls/slider)
- [Knob](/api/ui/controls/knob)
- [Select](/api/ui/controls/select)
- [ModUI Overview](/api/ui/overview)
