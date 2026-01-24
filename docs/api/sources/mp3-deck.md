# MP3Deck

The `MP3Deck` component loads and plays local audio files (MP3, WAV, etc.). It provides playback controls, seeking, and looping capabilities.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `output` | `ModStreamRef` | Required | Reference to output the audio signal |
| `trigger` | `ModStreamRef` | - | Optional trigger input (gate) |
| `pitchCv` | `ModStreamRef` | - | Optional pitch CV input |
| `label` | `string` | `'mp3-deck'` | Label for the component in metadata |
| `src` | `string` | `''` | Audio source URL (controlled or initial value) |
| `onSrcChange` | `(src: string) => void` | - | Callback when source URL changes |
| `fileName` | `string` | `''` | Loaded file name (controlled or initial value) |
| `onFileNameChange` | `(name: string) => void` | - | Callback when file name changes |
| `fileDataUrl` | `string` | `''` | Loaded file data URL (controlled or initial value) |
| `onFileDataUrlChange` | `(dataUrl: string) => void` | - | Callback when file data URL changes |
| `gain` | `number` | `1.0` | Gain level 0-1+ (controlled or initial value) |
| `onGainChange` | `(gain: number) => void` | - | Callback when gain changes |
| `loop` | `boolean` | `false` | Whether audio loops (controlled or initial value) |
| `onLoopChange` | `(loop: boolean) => void` | - | Callback when loop state changes |
| `playbackMode` | `'one-shot' \| 'gate' \| 'loop'` | `'one-shot'` | Playback mode |
| `onPlaybackModeChange` | `(mode: PlaybackMode) => void` | - | Callback when playback mode changes |
| `startTime` | `number` | `0` | Start position in seconds |
| `onStartTimeChange` | `(time: number) => void` | - | Callback when start time changes |
| `endTime` | `number` | `0` | End position in seconds (0 = full length) |
| `onEndTimeChange` | `(time: number) => void` | - | Callback when end time changes |
| `pitch` | `number` | `0` | Pitch offset in semitones |
| `onPitchChange` | `(pitch: number) => void` | - | Callback when pitch changes |
| `onPlayingChange` | `(isPlaying: boolean) => void` | - | Callback when playback state changes |
| `onTimeUpdate` | `(currentTime: number, duration: number) => void` | - | Callback when playback position updates |
| `onError` | `(error: string \| null) => void` | - | Callback when error state changes |
| `onEnd` | `() => void` | - | Callback when track finishes playing |
| `children` | `function` | - | Render prop function receiving control props |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `src` | `string` | Current audio source URL |
| `setSrc` | `(src: string) => void` | Set audio source by URL |
| `fileName` | `string` | Current file name |
| `setFileName` | `(name: string) => void` | Update file name |
| `fileDataUrl` | `string` | Current file data URL |
| `setFileDataUrl` | `(dataUrl: string) => void` | Update file data URL |
| `loadFile` | `(file: File) => void` | Load audio from a File object |
| `gain` | `number` | Current gain level (0-1+) |
| `setGain` | `(value: number) => void` | Update the gain level |
| `loop` | `boolean` | Whether the audio loops |
| `setLoop` | `(value: boolean) => void` | Enable or disable looping |
| `playbackMode` | `'one-shot' \| 'gate' \| 'loop'` | Current playback mode |
| `setPlaybackMode` | `(value: PlaybackMode) => void` | Update playback mode |
| `startTime` | `number` | Current start position in seconds |
| `setStartTime` | `(value: number) => void` | Update start position |
| `endTime` | `number` | Current end position in seconds |
| `setEndTime` | `(value: number) => void` | Update end position |
| `pitch` | `number` | Current pitch offset in semitones |
| `setPitch` | `(value: number) => void` | Update pitch offset |
| `isPlaying` | `boolean` | Whether audio is currently playing |
| `play` | `() => void` | Start playback |
| `pause` | `() => void` | Pause playback |
| `stop` | `() => void` | Stop playback and reset to start |
| `trigger` | `() => void` | Trigger playback (one-shot/gate) |
| `currentTime` | `number` | Current playback position in seconds |
| `duration` | `number` | Total duration of audio in seconds |
| `seek` | `(time: number) => void` | Seek to a specific time in seconds |
| `isActive` | `boolean` | Whether the audio deck is active |
| `isReady` | `boolean` | Whether the audio is loaded and ready to play |
| `error` | `string \| null` | Error message if loading failed |

## Usage

### Basic Usage

```tsx
import { MP3Deck, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const deckOut = useRef(null);

  return (
    <>
      <MP3Deck output={deckOut}>
        {({ setSrc, play }) => (
          <button onClick={() => {
            setSrc('/path/to/audio.mp3');
            play();
          }}>
            Load and Play
          </button>
        )}
      </MP3Deck>
      <Monitor input={deckOut} />
    </>
  );
}
```

### Full Playback Controls

```tsx
import { MP3Deck } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const deckOut = useRef(null);

  return (
    <MP3Deck output={deckOut}>
      {({
        loadFile,
        isPlaying,
        isReady,
        play,
        pause,
        stop,
        playbackMode,
        setPlaybackMode,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        pitch,
        setPitch,
        currentTime,
        duration,
        seek,
        loop,
        setLoop,
        gain,
        setGain,
        error
      }) => (
        <div>
          {error && <div style={{ color: 'red' }}>Error: {error}</div>}

          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadFile(file);
            }}
          />

          <div>
            <button onClick={play} disabled={!isReady || isPlaying}>
              {!isReady ? 'Loading...' : 'Play'}
            </button>
            <button onClick={pause} disabled={!isPlaying}>Pause</button>
            <button onClick={stop}>Stop</button>
          </div>

          <div>
            <label>
              Mode:
              <select value={playbackMode} onChange={(e) => setPlaybackMode(e.target.value as any)}>
                <option value="one-shot">One-shot</option>
                <option value="gate">Gate</option>
                <option value="loop">Loop</option>
              </select>
            </label>
          </div>

          <div>
            <label>
              Position: {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </label>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
              Loop
            </label>
          </div>

          <div>
            <label>
              Start: {startTime.toFixed(2)}s
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
              />
            </label>
            <label>
              End: {endTime.toFixed(2)}s
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
              />
            </label>
          </div>

          <div>
            <label>Pitch: {pitch.toFixed(1)} st</label>
            <input
              type="range"
              min="-24"
              max="24"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
            />
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
        </div>
      )}
    </MP3Deck>
  );
}
```

### With Effects Chain

```tsx
import { MP3Deck, Filter, Delay, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const deckOut = useRef(null);
  const triggerIn = useRef(null);
  const filterOut = useRef(null);
  const delayOut = useRef(null);

  return (
    <>
      <MP3Deck output={deckOut} trigger={triggerIn}>
        {({ loadFile, play, pause, isPlaying, isReady }) => (
          <div>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadFile(file);
              }}
            />
            <button
              onClick={isPlaying ? pause : play}
              disabled={!isReady}
            >
              {!isReady ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        )}
      </MP3Deck>
      <Filter input={deckOut} output={filterOut} type="lowpass" frequency={2000} />
      <Delay input={filterOut} output={delayOut} time={0.5} feedback={0.3} />
      <Monitor input={delayOut} />
    </>
  );
}
```

### Controlled Props

You can control the MP3Deck from external state using controlled props:

```tsx
import { MP3Deck, Monitor } from '@mode-7/mod';
import { useState, useRef } from 'react';

function App() {
  const deckOut = useRef(null);
  const [src, setSrc] = useState('');
  const [gain, setGain] = useState(1.0);
  const [loop, setLoop] = useState(false);
  const [isPlaying, setPlaying] = useState(false);

  return (
    <>
      <MP3Deck
        output={deckOut}
        src={src}
        onSrcChange={setSrc}
        gain={gain}
        onGainChange={setGain}
        loop={loop}
        onLoopChange={setLoop}
        onPlayingChange={setPlaying}
      >
        {({ loadFile, currentTime, duration, seek }) => (
          <div>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadFile(file);
              }}
            />

            <div>
              <label>Position: {currentTime.toFixed(1)}s / {duration.toFixed(1)}s</label>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </MP3Deck>

      <button onClick={() => setPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <label>
        <input
          type="checkbox"
          checked={loop}
          onChange={(e) => setLoop(e.target.checked)}
        />
        Loop
      </label>

      <Monitor input={deckOut} />
    </>
  );
}
```

### Imperative Refs

For programmatic control of playback and file loading, you can use refs:

```tsx
import { MP3Deck, MP3DeckHandle, Monitor } from '@mode-7/mod';
import { useRef, useEffect } from 'react';

function App() {
  const deckRef = useRef<MP3DeckHandle>(null);
  const deckOut = useRef(null);

  useEffect(() => {
    // Access current state
    if (deckRef.current) {
      const state = deckRef.current.getState();
      console.log('Source:', state.src);
      console.log('Is playing:', state.isPlaying);
      console.log('Is ready:', state.isReady);
      console.log('Current time:', state.currentTime);
      console.log('Duration:', state.duration);
      console.log('Gain:', state.gain);
      console.log('Loop:', state.loop);
    }
  }, []);

  const handlePlayback = () => {
    if (!deckRef.current) return;

    // Control playback
    deckRef.current.play();
    // deckRef.current.pause();
    // deckRef.current.stop();
  };

  const skipToChorus = () => {
    // Skip to 60 seconds (example chorus position)
    deckRef.current?.seek(60);
  };

  const loadNewFile = (file: File) => {
    deckRef.current?.loadFile(file);
  };

  return (
    <>
      <MP3Deck ref={deckRef} output={deckOut} />
      <button onClick={handlePlayback}>Play</button>
      <button onClick={skipToChorus}>Skip to Chorus</button>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadNewFile(file);
        }}
      />
      <Monitor input={deckOut} />
    </>
  );
}
```

**Note:** The imperative handle provides `play()`, `pause()`, `stop()`, `seek()`, and `loadFile()` methods for playback control, plus `getState()` for read-only state access. To control gain and loop programmatically, use the controlled props pattern shown above.

## Important Notes

### Trigger + Pitch CV

- `trigger` input starts playback on rising gate in `gate` or `one-shot` mode.
- `pitchCv` applies pitch modulation (in semitone offsets) on top of the `pitch` value.

### Supported Formats

- MP3, WAV, OGG, AAC, and other formats supported by the browser's `<audio>` element
- Format support varies by browser

### Loading Audio

- Use `setSrc()` for URLs (local or remote)
- Use `loadFile()` for File objects from `<input type="file">`
- Audio must be loaded before playback can start

### CORS Considerations

- Remote audio files must have appropriate CORS headers
- The `crossOrigin="anonymous"` attribute is set automatically for remote URLs
- Local blob URLs (from File objects) do not use crossOrigin

::: tip User Gesture Required
Some browsers require a user gesture (like a button click) before audio can play. Make sure playback is triggered by user interaction.
:::

## Related

- [StreamingAudioDeck](/api/sources/streaming-audio-deck) - For streaming audio (internet radio, live streams)
- [Monitor](/api/output/monitor) - Output to speakers
- [Filter](/api/processors/filter) - Process the audio
