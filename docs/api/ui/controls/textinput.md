# TextInput

A styled text input component supporting multiple input types (text, URL, email, password, search) with optional labels.

## Features

- Multiple input types (text, url, email, password, search)
- Optional label
- Focus state with green highlight
- Disabled state support
- Placeholder support
- Completely customizable via className props
- Event propagation control (won't drag parent modules)
- Accessible with proper labeling

## Import

```tsx
import { TextInput } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | Required | Current input value |
| `onChange` | `(value: string) => void` | Required | Value change callback |
| `placeholder` | `string` | - | Placeholder text |
| `label` | `string` | - | Label text displayed above input |
| `disabled` | `boolean` | `false` | Disabled state |
| `type` | `'text' \| 'url' \| 'email' \| 'password' \| 'search'` | `'text'` | Input type |
| `className` | `string` | `''` | Additional CSS classes for container |
| `inputClassName` | `string` | `''` | Additional CSS classes for input element |
| `labelClassName` | `string` | `''` | Additional CSS classes for label |

## Usage

### Basic Text Input

```tsx
import { TextInput } from '@mode-7/mod';
import { useState } from 'react';

function BasicInput() {
  const [text, setText] = useState('');

  return (
    <TextInput
      value={text}
      onChange={setText}
      placeholder="Enter text..."
    />
  );
}
```

### URL Input

```tsx
function StreamURLInput() {
  const [url, setUrl] = useState('');

  return (
    <TextInput
      value={url}
      onChange={setUrl}
      type="url"
      placeholder="https://example.com/stream.mp3"
      label="Stream URL"
    />
  );
}
```

### With Label

```tsx
<TextInput
  value={name}
  onChange={setName}
  label="Module Name"
  placeholder="Enter name..."
/>
```

### Email Input

```tsx
<TextInput
  value={email}
  onChange={setEmail}
  type="email"
  placeholder="email@example.com"
  label="Email Address"
/>
```

### Password Input

```tsx
<TextInput
  value={password}
  onChange={setPassword}
  type="password"
  placeholder="Enter password..."
  label="Password"
/>
```

### Search Input

```tsx
<TextInput
  value={search}
  onChange={setSearch}
  type="search"
  placeholder="Search modules..."
/>
```

### Disabled State

```tsx
<TextInput
  value={value}
  onChange={setValue}
  disabled={true}
  placeholder="Disabled..."
/>
```

### Custom Styling

```tsx
<TextInput
  value={value}
  onChange={setValue}
  className="custom-input-container"
  inputClassName="custom-input"
  labelClassName="custom-label"
/>
```

## CSS Classes

The TextInput component uses the following CSS classes:

- `.modui-textinput` - Container element
- `.modui-textinput-label` - Label element
- `.modui-textinput-input` - Input element
- `.modui-textinput-input-disabled` - Applied when disabled

## Styling Examples

### Custom Colors

```css
.custom-input .modui-textinput-input {
  background: #1a1a2e;
  border-color: #3949ab;
  color: #e0e0e0;
}

.custom-input .modui-textinput-input:focus {
  border-color: #5c6bc0;
  box-shadow: 0 0 0 2px rgba(92, 107, 192, 0.3);
}
```

### Compact Size

```css
.compact-input .modui-textinput-input {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}
```

### Error State

```css
.error-input .modui-textinput-input {
  border-color: #ef5350;
}

.error-input .modui-textinput-input:focus {
  border-color: #ef5350;
  box-shadow: 0 0 0 2px rgba(239, 83, 80, 0.3);
}
```

### Success State

```css
.success-input .modui-textinput-input {
  border-color: #66BB6A;
}

.success-input .modui-textinput-input:focus {
  border-color: #66BB6A;
  box-shadow: 0 0 0 2px rgba(102, 187, 106, 0.3);
}
```

## Common Patterns

### StreamingAudioDeck Integration

```tsx
import { StreamingAudioDeck, TextInput } from '@mode-7/mod';
import { useModStream } from '@mode-7/mod';

function StreamPlayer() {
  const output = useModStream();

  return (
    <StreamingAudioDeck output={output}>
      {(controls) => (
        <div className="stream-player">
          <TextInput
            value={controls.url}
            onChange={controls.setUrl}
            type="url"
            placeholder="Enter stream URL..."
            label="Stream URL"
            disabled={controls.isPlaying}
          />
          {/* Other controls... */}
        </div>
      )}
    </StreamingAudioDeck>
  );
}
```

### With Validation

```tsx
function ValidatedInput() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleChange = (value: string) => {
    setUrl(value);

    // Validate URL
    try {
      new URL(value);
      setError('');
    } catch {
      setError('Invalid URL');
    }
  };

  return (
    <div>
      <TextInput
        value={url}
        onChange={handleChange}
        type="url"
        placeholder="https://..."
        className={error ? 'error-input' : ''}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
```

### With Clear Button

```tsx
import { X } from 'lucide-react';

function ClearableInput() {
  const [value, setValue] = useState('');

  return (
    <div style={{ position: 'relative' }}>
      <TextInput
        value={value}
        onChange={setValue}
        placeholder="Enter text..."
      />
      {value && (
        <button
          onClick={() => setValue('')}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
```

### Controlled with Enter Key

```tsx
function EnterSubmitInput() {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    console.log('Submitted:', value);
    setValue('');
  };

  return (
    <div onKeyDown={(e) => {
      if (e.key === 'Enter') handleSubmit();
    }}>
      <TextInput
        value={value}
        onChange={setValue}
        placeholder="Press Enter to submit..."
      />
    </div>
  );
}
```

### Module Name Editor

```tsx
function ModuleNameEditor({ defaultName }) {
  const [name, setName] = useState(defaultName);

  return (
    <TextInput
      value={name}
      onChange={setName}
      label="Module Name"
      placeholder="Untitled Module"
    />
  );
}
```

## Input Types

### text
Standard text input for general purposes.

### url
URL input with browser validation for web addresses. Useful for streaming URLs.

### email
Email input with browser validation for email addresses.

### password
Password input with obscured characters for secure entry.

### search
Search input with browser-specific styling (may include clear button in some browsers).

## Accessibility

The TextInput component includes:

- Proper label association via `htmlFor` and `id`
- Placeholder text for hints
- Disabled state handling
- Focus styles for keyboard navigation
- Native input validation for url/email types

## Related

- [FilePicker](/api/ui/controls/filepicker)
- [Select](/api/ui/controls/select)
- [StreamingAudioDeck](/api/sources/streaming-audio-deck)
- [ModUI Overview](/api/ui/overview)
