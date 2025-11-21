# StreamingAudioDeck

The `StreamingAudioDeck` component plays streaming audio from URLs (internet radio, live streams, etc.). Unlike MP3Deck, it's optimized for continuous streams without seeking.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `output` | `ModStreamRef` | Required | Reference to output the audio signal |
| `label` | `string` | `'streaming-audio-deck'` | Label for the component in metadata |
| `url` | `string` | `''` | Stream URL (controlled or initial value) |
| `onUrlChange` | `(url: string) => void` | - | Callback when URL changes |
| `gain` | `number` | `1.0` | Gain level 0-1+ (controlled or initial value) |
| `onGainChange` | `(gain: number) => void` | - | Callback when gain changes |
| `loop` | `boolean` | `false` | Whether stream loops (controlled or initial value) |
| `onLoopChange` | `(loop: boolean) => void` | - | Callback when loop state changes |
| `onPlayingChange` | `(isPlaying: boolean) => void` | - | Callback when playback state changes |
| `onTimeUpdate` | `(currentTime: number, duration: number) => void` | - | Callback when playback position updates |
| `onError` | `(error: string \| null) => void` | - | Callback when error state changes |
| `children` | `function` | - | Render prop function receiving control props |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `url` | `string` | Current stream URL |
| `setUrl` | `(url: string) => void` | Set stream URL |
| `gain` | `number` | Current gain level (0-1+) |
| `setGain` | `(value: number) => void` | Update the gain level |
| `loop` | `boolean` | Whether the stream loops |
| `setLoop` | `(value: boolean) => void` | Enable or disable looping |
| `isPlaying` | `boolean` | Whether stream is currently playing |
| `play` | `() => void` | Start streaming |
| `pause` | `() => void` | Pause streaming |
| `stop` | `() => void` | Stop streaming and reset to start |
| `currentTime` | `number` | Current playback position in seconds |
| `duration` | `number` | Total duration in seconds (if available) |
| `seek` | `(time: number) => void` | Seek to a specific time in seconds |
| `isActive` | `boolean` | Whether the deck is active |
| `error` | `string \| null` | Error message if streaming failed |

## Usage

### Basic Usage

```tsx
import { StreamingAudioDeck, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const streamOut = useRef(null);

  return (
    <>
      <StreamingAudioDeck output={streamOut}>
        {({ setUrl, play }) => (
          <button onClick={() => {
            setUrl('https://example.com/stream');
            play();
          }}>
            Play Stream
          </button>
        )}
      </StreamingAudioDeck>
      <Monitor input={streamOut} />
    </>
  );
}
```

### Internet Radio Player

```tsx
import { StreamingAudioDeck } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const streamOut = useRef(null);

  const stations = [
    { name: 'Jazz FM', url: 'https://example.com/jazz' },
    { name: 'Rock Radio', url: 'https://example.com/rock' },
    { name: 'Classical', url: 'https://example.com/classical' },
  ];

  return (
    <StreamingAudioDeck output={streamOut}>
      {({ url, setUrl, isPlaying, play, pause, gain, setGain, error }) => (
        <div>
          {error && <div style={{ color: 'red' }}>Error: {error}</div>}

          <div>
            <h3>Select Station:</h3>
            {stations.map(station => (
              <button
                key={station.name}
                onClick={() => {
                  setUrl(station.url);
                  setTimeout(play, 100);
                }}
                disabled={url === station.url && isPlaying}
              >
                {station.name}
              </button>
            ))}
          </div>

          <div>
            <button onClick={isPlaying ? pause : play}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>

          <div>
            <label>Volume: {gain.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={gain}
              onChange={(e) => setGain(Number(e.target.value))}
            />
          </div>

          {isPlaying && <div>Now playing: {url}</div>}
        </div>
      )}
    </StreamingAudioDeck>
  );
}
```

### With Processing

```tsx
import { StreamingAudioDeck, EQ, Compressor, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const streamOut = useRef(null);
  const eqOut = useRef(null);
  const compOut = useRef(null);

  return (
    <>
      <StreamingAudioDeck output={streamOut}>
        {({ setUrl, play, pause, isPlaying }) => (
          <div>
            <input
              type="text"
              placeholder="Stream URL"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setUrl(e.currentTarget.value);
                  play();
                }
              }}
            />
            <button onClick={isPlaying ? pause : play}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        )}
      </StreamingAudioDeck>
      <EQ input={streamOut} output={eqOut} />
      <Compressor input={eqOut} output={compOut} />
      <Monitor input={compOut} />
    </>
  );
}
```

### Controlled Props

You can control the StreamingAudioDeck from external state using controlled props:

```tsx
import { StreamingAudioDeck, Monitor } from '@mode-7/mod';
import { useState, useRef } from 'react';

function App() {
  const streamOut = useRef(null);
  const [url, setUrl] = useState('');
  const [gain, setGain] = useState(1.0);
  const [isPlaying, setPlaying] = useState(false);

  const stations = [
    { name: 'Jazz FM', url: 'https://example.com/jazz' },
    { name: 'Rock Radio', url: 'https://example.com/rock' },
  ];

  return (
    <>
      <StreamingAudioDeck
        output={streamOut}
        url={url}
        onUrlChange={setUrl}
        gain={gain}
        onGainChange={setGain}
        onPlayingChange={setPlaying}
      />

      <div>
        <h3>Select Station:</h3>
        {stations.map(station => (
          <button
            key={station.name}
            onClick={() => {
              setUrl(station.url);
              setPlaying(true);
            }}
          >
            {station.name}
          </button>
        ))}
      </div>

      <div>
        <label>Volume: {gain.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={gain}
          onChange={(e) => setGain(Number(e.target.value))}
        />
      </div>

      <button onClick={() => setPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <Monitor input={streamOut} />
    </>
  );
}
```

### Imperative Refs

For programmatic control of playback, you can use refs:

```tsx
import { StreamingAudioDeck, StreamingAudioDeckHandle, Monitor } from '@mode-7/mod';
import { useRef, useEffect } from 'react';

function App() {
  const streamRef = useRef<StreamingAudioDeckHandle>(null);
  const streamOut = useRef(null);

  useEffect(() => {
    // Access current state
    if (streamRef.current) {
      const state = streamRef.current.getState();
      console.log('URL:', state.url);
      console.log('Is playing:', state.isPlaying);
      console.log('Gain:', state.gain);
      console.log('Loop:', state.loop);
      console.log('Current time:', state.currentTime);
      console.log('Duration:', state.duration);
    }
  }, []);

  const handlePlayback = () => {
    if (!streamRef.current) return;

    // Control playback
    streamRef.current.play();
    // streamRef.current.pause();
    // streamRef.current.stop();
    // streamRef.current.seek(30); // Seek to 30 seconds if supported
  };

  return (
    <>
      <StreamingAudioDeck ref={streamRef} output={streamOut} />
      <button onClick={handlePlayback}>Play</button>
      <Monitor input={streamOut} />
    </>
  );
}
```

**Note:** The imperative handle provides `play()`, `pause()`, `stop()`, and `seek()` methods for playback control, plus `getState()` for read-only state access. To control URL, gain, and loop programmatically, use the controlled props pattern shown above.

## Important Notes

### Streaming vs File Playback

- StreamingAudioDeck is designed for continuous streams without seeking
- For local files or seekable content, use [MP3Deck](/api/sources/mp3-deck) instead
- No duration or currentTime information available for streams

### CORS Requirements

- The streaming server must have appropriate CORS headers
- The `crossOrigin="anonymous"` attribute is set automatically

### Stream Formats

- Supports any format the browser's `<audio>` element can handle
- Common formats: MP3, AAC, OGG, WebM
- Format support varies by browser

::: warning User Gesture Required
Most browsers require user interaction (button click) before audio can play. Make sure to call `play()` in response to user actions.
:::

::: tip Buffering
Streams may take a moment to buffer before playback starts. Consider showing a loading indicator when playback is initiated.
:::

## Related

- [MP3Deck](/api/sources/mp3-deck) - For local audio files with seeking
- [Monitor](/api/output/monitor) - Output to speakers
- [EQ](/api/processors/eq) - Equalize the stream
