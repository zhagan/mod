# Audio Context

The AudioContext is the foundation of Web Audio API and mod. Understanding how it works will help you build better audio applications.

## What is AudioContext?

The AudioContext is a processing graph of audio nodes. Think of it as a virtual audio studio where all your audio modules live and connect together.

```tsx
import { AudioProvider } from '@mode-7/mod';

<AudioProvider>
  {/* All your audio modules */}
</AudioProvider>
```

## AudioProvider Component

The `AudioProvider` creates and manages the AudioContext for your entire application.

### Basic Usage

```tsx
import { AudioProvider, ToneGenerator, Monitor, useModStream } from '@mode-7/mod';

function App() {
  const output = useModStream();

  return (
    <AudioProvider>
      <ToneGenerator output={output} />
      <Monitor input={output} />
    </AudioProvider>
  );
}
```

### What It Does

1. **Creates AudioContext**: Initializes a single AudioContext instance
2. **Provides Context**: Makes it available to all child components via React Context
3. **Manages Lifecycle**: Handles suspension, resumption, and cleanup
4. **Handles User Interaction**: Resumes context after user gesture (browser requirement)

## AudioContext States

The AudioContext has three possible states:

### Suspended

Initial state when created. Audio is not being processed.

```tsx
// Context starts suspended
<AudioProvider>
  {/* context.state === 'suspended' */}
</AudioProvider>
```

### Running

Actively processing audio. Transitions from suspended after user interaction.

```tsx
// After user clicks a button or interacts with audio:
// context.state === 'running'
```

### Closed

Context has been shut down and cannot be restarted.

```tsx
// When AudioProvider unmounts:
// context.state === 'closed'
```

## Browser Autoplay Policy

Modern browsers require user interaction before audio can play. This is called the "autoplay policy."

### The Problem

```tsx
// This won't work immediately:
useEffect(() => {
  // Page loads, tries to play audio
  // Browser blocks it!
}, []);
```

### The Solution

mod components automatically resume the AudioContext when needed:

```tsx
<ToneGenerator output={ref}>
  {({ play }) => (
    <button onClick={play}>
      {/* User clicks → context resumes → audio plays */}
      Play
    </button>
  )}
</ToneGenerator>
```

All mod components that trigger audio (play, start, etc.) will automatically resume the context.

### Manual Resume

You can also resume the context manually:

```tsx
import { useAudioContext } from '@mode-7/mod';

function StartButton() {
  const audioContext = useAudioContext();

  const handleClick = async () => {
    if (audioContext?.state === 'suspended') {
      await audioContext.resume();
    }
  };

  return <button onClick={handleClick}>Start Audio</button>;
}
```

## Accessing the AudioContext

Use the `useAudioContext` hook to access the context in your components:

```tsx
import { useAudioContext } from '@mode-7/mod';

function AudioInfo() {
  const audioContext = useAudioContext();

  if (!audioContext) {
    return <div>No audio context available</div>;
  }

  return (
    <div>
      <p>Sample Rate: {audioContext.sampleRate} Hz</p>
      <p>State: {audioContext.state}</p>
      <p>Current Time: {audioContext.currentTime.toFixed(2)}s</p>
    </div>
  );
}
```

## Sample Rate

The sample rate determines audio quality and latency:

```tsx
const audioContext = useAudioContext();
console.log(audioContext?.sampleRate); // Usually 48000 or 44100
```

Common sample rates:
- **44100 Hz** - CD quality
- **48000 Hz** - Professional audio, most browsers default
- **96000 Hz** - High-resolution audio (rare in browsers)

You cannot change the sample rate - it's determined by the browser and system.

## Audio Time

The AudioContext has its own internal clock:

```tsx
const audioContext = useAudioContext();
const now = audioContext.currentTime; // Time in seconds since context creation
```

This is used for:
- Scheduling events precisely
- Synchronizing audio
- Timing automation

```tsx
// Schedule a frequency change 1 second from now:
const audioParam = someNode.frequency;
audioParam.setValueAtTime(880, audioContext.currentTime + 1);
```

## Destination (Output)

The AudioContext has a `destination` node representing the speakers:

```tsx
const audioContext = useAudioContext();
const speakers = audioContext.destination;

// mod's Monitor component connects to this automatically:
<Monitor input={ref} />
```

You usually don't need to access `destination` directly - the Monitor component handles it.

## Context Options

While mod creates the AudioContext for you, it's useful to understand the options:

```javascript
// What AudioProvider creates internally:
const audioContext = new AudioContext({
  latencyHint: 'interactive', // Low latency for interactive apps
  sampleRate: 48000,          // Browser default (can't override reliably)
});
```

## Multiple Contexts

**Important**: You should only have one AudioContext per application.

```tsx
// ❌ DON'T DO THIS
<AudioProvider>
  <AudioProvider>  {/* Nested provider! */}
    {/* ... */}
  </AudioProvider>
</AudioProvider>

// ✅ DO THIS
<AudioProvider>
  {/* All modules share one context */}
</AudioProvider>
```

Multiple contexts can cause:
- Increased CPU usage
- Audio synchronization issues
- Browser resource limits

## Debugging

### Check Context State

```tsx
function AudioDebug() {
  const audioContext = useAudioContext();

  return (
    <div>
      <p>State: {audioContext?.state}</p>
      <p>Time: {audioContext?.currentTime.toFixed(3)}s</p>
      <p>Sample Rate: {audioContext?.sampleRate}Hz</p>
      <button onClick={() => audioContext?.resume()}>
        Resume
      </button>
    </div>
  );
}
```

### Listen for State Changes

```tsx
useEffect(() => {
  if (!audioContext) return;

  const handleStateChange = () => {
    console.log('Context state:', audioContext.state);
  };

  audioContext.addEventListener('statechange', handleStateChange);
  return () => {
    audioContext.removeEventListener('statechange', handleStateChange);
  };
}, [audioContext]);
```

## Common Issues

### Audio Doesn't Play

**Cause**: Context is suspended
**Solution**: Ensure user interaction before playing

```tsx
<button onClick={play}>Play</button> // ✅ Works
```

```tsx
useEffect(() => {
  play(); // ❌ No user interaction
}, []);
```

### Choppy/Glitchy Audio

**Cause**: Browser is throttling due to inactive tab or heavy CPU load
**Solution**:
- Reduce number of audio nodes
- Optimize React rendering
- Use Web Workers for heavy computation (not audio)

### "AudioContext was not allowed to start"

**Cause**: Trying to create/resume AudioContext without user interaction
**Solution**: Wait for user click/touch before starting audio

## Best Practices

1. **One AudioProvider** per application
2. **Let mod handle context** - don't create your own AudioContext
3. **User interaction first** - always require a click/touch to start audio
4. **Check context state** before audio operations
5. **Clean up properly** - AudioProvider handles this automatically

## Next Steps

- Learn how to [connect modules](/guide/connecting-modules)
- Explore [CV modulation](/guide/cv-modulation)
- Build your first [synthesizer](/guide/examples/simple-synth)
