# AudioProvider

The `AudioProvider` component initializes and manages the Web Audio context for your application. It must wrap all other mod components.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | Child components that will have access to the audio context |

The Audio Context is created automatically when the component mounts.

## Usage

### Basic Setup

```tsx
import { AudioProvider } from '@mode-7/mod';

function App() {
  return (
    <AudioProvider>
      {/* Your audio modules go here */}
    </AudioProvider>
  );
}
```

### Accessing the Audio Context

AudioProvider creates a React context that provides the AudioContext instance to all child components. You can access it using the `useAudioContext` hook:

```tsx
import { useAudioContext } from '@mode-7/mod';

function MyComponent() {
  const audioContext = useAudioContext();

  if (!audioContext) {
    return <div>Loading audio context...</div>;
  }

  return <div>Sample rate: {audioContext.sampleRate}Hz</div>;
}
```

### With Audio Components

```tsx
import { AudioProvider, ToneGenerator, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const toneOut = useRef(null);

  return (
    <AudioProvider>
      <ToneGenerator output={toneOut} />
      <Monitor input={toneOut} />
    </AudioProvider>
  );
}
```

### With User Activation

On some browsers (particularly iOS Safari), the AudioContext must be resumed in response to a user gesture. You may want to provide a "Start" button for the best user experience:

```tsx
import { AudioProvider } from '@mode-7/mod';
import { useState } from 'react';

function App() {
  const [audioEnabled, setAudioEnabled] = useState(false);

  if (!audioEnabled) {
    return (
      <div>
        <h1>My Audio App</h1>
        <button onClick={() => setAudioEnabled(true)}>
          Enable Audio
        </button>
      </div>
    );
  }

  return (
    <AudioProvider>
      <MyAudioComponents />
    </AudioProvider>
  );
}
```

## Important Notes

- Only one AudioProvider should exist in your application
- Nested AudioProviders are not supported and will cause issues
- The AudioContext is created automatically when the component mounts
- On iOS Safari and some browsers, user interaction may be required to start audio
- All mod components must be children of AudioProvider to function properly

## Related

- [Getting Started](/guide/getting-started) - Start building with mod
- [API Overview](/api/overview) - Explore all available components
