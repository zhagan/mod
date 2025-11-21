# FilePicker

A styled file picker button for loading audio files and other media, with support for file type filtering and custom icons.

## Features

- Hidden native file input with styled button trigger
- File type filtering (accept attribute)
- Optional icon support
- Disabled state support
- Custom label text
- Completely customizable via className props
- Event propagation control (won't drag parent modules)
- Single file selection

## Import

```tsx
import { FilePicker } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onFileSelect` | `(file: File) => void` | Required | Callback when file is selected |
| `accept` | `string` | `'*/*'` | File type filter (MIME types) |
| `label` | `string` | `'Choose File'` | Button label text |
| `icon` | `React.ReactNode` | - | Icon element (e.g., from lucide-react) |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | `''` | Additional CSS classes for container |
| `buttonClassName` | `string` | `''` | Additional CSS classes for button |

## Usage

### Basic Usage

```tsx
import { FilePicker } from '@mode-7/mod';

function AudioLoader() {
  const handleFile = (file: File) => {
    console.log('Selected:', file.name);
    // Load the file...
  };

  return (
    <FilePicker
      onFileSelect={handleFile}
      accept="audio/*"
      label="Load Audio"
    />
  );
}
```

### MP3 File Picker

```tsx
import { FilePicker } from '@mode-7/mod';
import { Upload } from 'lucide-react';

function MP3Loader() {
  const handleMP3 = (file: File) => {
    const url = URL.createObjectURL(file);
    // Set audio source...
  };

  return (
    <FilePicker
      onFileSelect={handleMP3}
      accept="audio/mp3,audio/mpeg"
      label="Load MP3"
      icon={<Upload size={14} />}
    />
  );
}
```

### Audio File Picker (Multiple Formats)

```tsx
<FilePicker
  onFileSelect={handleAudioFile}
  accept="audio/mp3,audio/wav,audio/ogg,audio/flac,audio/m4a"
  label="Load Audio"
/>
```

### With Icon Only

```tsx
import { FolderOpen } from 'lucide-react';

<FilePicker
  onFileSelect={handleFile}
  accept="audio/*"
  icon={<FolderOpen size={16} />}
  label=""
/>
```

### Image Picker

```tsx
<FilePicker
  onFileSelect={handleImage}
  accept="image/*"
  label="Load Image"
/>
```

### Disabled State

```tsx
<FilePicker
  onFileSelect={handleFile}
  accept="audio/*"
  label="Load Audio"
  disabled={isLoading}
/>
```

### Custom Styling

```tsx
<FilePicker
  onFileSelect={handleFile}
  accept="audio/*"
  label="Load Track"
  className="custom-picker"
  buttonClassName="custom-button"
/>
```

## File Type Filtering

The `accept` prop uses standard HTML file input accept attribute syntax:

### Audio Files

```tsx
// All audio
accept="audio/*"

// Specific formats
accept="audio/mp3,audio/wav"
accept="audio/mpeg,audio/wav,audio/ogg"

// By extension
accept=".mp3,.wav,.ogg"
```

### Images

```tsx
accept="image/*"
accept="image/png,image/jpeg"
accept=".png,.jpg,.jpeg"
```

### Video

```tsx
accept="video/*"
accept="video/mp4,video/webm"
```

### Any File

```tsx
accept="*/*"
```

## CSS Classes

The FilePicker component uses the following CSS classes:

- `.modui-filepicker` - Container element
- `.modui-filepicker-button` - Button element
- `.modui-filepicker-button-disabled` - Applied when disabled
- `.modui-filepicker-icon` - Icon wrapper
- `.modui-filepicker-label` - Label text
- `.modui-filepicker-input` - Hidden file input

## Styling Examples

### Custom Colors

```css
.custom-picker .modui-filepicker-button {
  background: #1a237e;
  border-color: #3949ab;
  color: #7986cb;
}

.custom-picker .modui-filepicker-button:hover:not(.modui-filepicker-button-disabled) {
  background: #283593;
  border-color: #5c6bc0;
}
```

### Compact Button

```css
.compact-picker .modui-filepicker-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  gap: 0.25rem;
}
```

### Success Style

```css
.success-picker .modui-filepicker-button {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
  color: #4CAF50;
}

.success-picker .modui-filepicker-button:hover:not(.modui-filepicker-button-disabled) {
  background: rgba(76, 175, 80, 0.2);
  border-color: #66BB6A;
}
```

## Common Patterns

### MP3Deck Integration

```tsx
import { MP3Deck, FilePicker } from '@mode-7/mod';
import { useModStream } from '@mode-7/mod';
import { Upload } from 'lucide-react';

function MP3Player() {
  const output = useModStream();

  return (
    <MP3Deck output={output}>
      {(controls) => (
        <div className="mp3-player">
          <FilePicker
            onFileSelect={controls.loadFile}
            accept="audio/mp3,audio/mpeg,audio/wav"
            label="Load File"
            icon={<Upload size={14} />}
            disabled={controls.isPlaying}
          />
          {/* Other controls... */}
        </div>
      )}
    </MP3Deck>
  );
}
```

### With Loading State

```tsx
function FileLoader() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    try {
      await loadAudioFile(file);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FilePicker
      onFileSelect={handleFile}
      accept="audio/*"
      label={isLoading ? 'Loading...' : 'Load Audio'}
      disabled={isLoading}
    />
  );
}
```

### With File Name Display

```tsx
function FileSelector() {
  const [fileName, setFileName] = useState<string>('');

  const handleFile = (file: File) => {
    setFileName(file.name);
    // Load file...
  };

  return (
    <div>
      <FilePicker
        onFileSelect={handleFile}
        accept="audio/*"
        label="Choose File"
      />
      {fileName && <div className="file-name">{fileName}</div>}
    </div>
  );
}
```

## File Handling

### Creating Object URLs

```tsx
const handleFile = (file: File) => {
  const url = URL.createObjectURL(file);
  setSrc(url);

  // Important: Revoke when done to prevent memory leaks
  return () => URL.revokeObjectURL(url);
};
```

### Reading File Data

```tsx
const handleFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  // Use audioBuffer...
};
```

### File Validation

```tsx
const handleFile = (file: File) => {
  // Check file size (e.g., max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert('File too large');
    return;
  }

  // Check file type
  if (!file.type.startsWith('audio/')) {
    alert('Please select an audio file');
    return;
  }

  // File is valid
  loadAudioFile(file);
};
```

## Accessibility

The FilePicker component includes:

- Native file input for keyboard support
- Proper `disabled` state handling
- Focus styles on button
- Label text for screen readers

## Related

- [MP3Deck](/api/sources/mp3-deck)
- [TextInput](/api/ui/controls/textinput)
- [Button](/api/ui/controls/button)
- [ModUI Overview](/api/ui/overview)
