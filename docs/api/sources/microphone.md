# Microphone

The `Microphone` component captures audio from a microphone or other audio input device. It provides device selection and gain control.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `output` | `ModStreamRef` | Required | Reference to output the captured audio signal |
| `label` | `string` | `'microphone'` | Label for the component in metadata |
| `deviceId` | `string` | - | Optional device ID to pre-select a specific microphone |
| `gain` | `number` | `1.0` | Gain level 0-2+ (controlled or initial value) |
| `onGainChange` | `(gain: number) => void` | - | Callback when gain changes |
| `isMuted` | `boolean` | `false` | Whether microphone is muted (controlled or initial value) |
| `onMutedChange` | `(isMuted: boolean) => void` | - | Callback when mute state changes |
| `selectedDeviceId` | `string \| null` | - | Selected device ID (controlled or initial value) |
| `onSelectedDeviceIdChange` | `(deviceId: string \| null) => void` | - | Callback when selected device changes |
| `onDevicesChange` | `(devices: AudioDevice[]) => void` | - | Callback when device list changes |
| `onError` | `(error: string \| null) => void` | - | Callback when error state changes |
| `children` | `function` | - | Render prop function receiving control props |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `gain` | `number` | Current gain level (0-1+) |
| `setGain` | `(value: number) => void` | Update the gain level |
| `isMuted` | `boolean` | Whether the microphone is muted |
| `setMuted` | `(muted: boolean) => void` | Mute or unmute the microphone |
| `devices` | `AudioDevice[]` | List of available audio input devices |
| `selectedDeviceId` | `string \| null` | Currently selected device ID |
| `selectDevice` | `(deviceId: string) => void` | Select a different input device |
| `refreshDevices` | `() => Promise<void>` | Refresh the list of available devices |
| `isActive` | `boolean` | Whether the microphone is active |
| `error` | `string \| null` | Error message if microphone access failed |

## Usage

### Basic Usage

```tsx
import { Microphone, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const micOut = useRef(null);

  return (
    <>
      <Microphone output={micOut} />
      <Monitor input={micOut} />
    </>
  );
}
```

### With Device Selection

```tsx
import { Microphone } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const micOut = useRef(null);

  return (
    <Microphone output={micOut}>
      {({
        gain,
        setGain,
        isMuted,
        setMuted,
        devices,
        selectedDeviceId,
        selectDevice,
        error
      }) => (
        <div>
          {error && <div style={{ color: 'red' }}>Error: {error}</div>}

          <div>
            <label>Input Device:</label>
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => selectDevice(e.target.value)}
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Gain: {gain.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={gain}
              onChange={(e) => setGain(Number(e.target.value))}
            />
          </div>

          <button onClick={() => setMuted(!isMuted)}>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      )}
    </Microphone>
  );
}
```

### With Effects Processing

```tsx
import { Microphone, Filter, Reverb, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const micOut = useRef(null);
  const filterOut = useRef(null);
  const reverbOut = useRef(null);

  return (
    <>
      <Microphone output={micOut} />
      <Filter input={micOut} output={filterOut} type="highpass" frequency={100} />
      <Reverb input={filterOut} output={reverbOut} />
      <Monitor input={reverbOut} />
    </>
  );
}
```

### Controlled Props

You can control the Microphone from external state using controlled props:

```tsx
import { Microphone, Monitor } from '@mode-7/mod';
import { useState, useRef } from 'react';

function App() {
  const micOut = useRef(null);
  const [gain, setGain] = useState(1.0);
  const [isMuted, setMuted] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  return (
    <>
      <Microphone
        output={micOut}
        gain={gain}
        onGainChange={setGain}
        isMuted={isMuted}
        onMutedChange={setMuted}
        selectedDeviceId={selectedDeviceId}
        onSelectedDeviceIdChange={setSelectedDeviceId}
      >
        {({ devices }) => (
          <div>
            <label>Input Device:</label>
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </Microphone>

      <div>
        <label>Gain: {gain.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={gain}
          onChange={(e) => setGain(Number(e.target.value))}
        />
      </div>

      <button onClick={() => setMuted(!isMuted)}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>

      <Monitor input={micOut} />
    </>
  );
}
```

### Imperative Refs

For programmatic access to state and device management, you can use refs:

```tsx
import { Microphone, MicrophoneHandle, Monitor } from '@mode-7/mod';
import { useRef, useEffect } from 'react';

function App() {
  const micRef = useRef<MicrophoneHandle>(null);
  const micOut = useRef(null);

  useEffect(() => {
    // Access current state
    if (micRef.current) {
      const state = micRef.current.getState();
      console.log('Current gain:', state.gain);
      console.log('Is muted:', state.isMuted);
      console.log('Selected device:', state.selectedDeviceId);
      console.log('Available devices:', state.devices);
      console.log('Error:', state.error);
    }
  }, []);

  const handleDeviceChange = async () => {
    if (!micRef.current) return;

    // Select a different device
    micRef.current.selectDevice('some-device-id');

    // Refresh device list
    await micRef.current.refreshDevices();
  };

  return (
    <>
      <Microphone ref={micRef} output={micOut} />
      <button onClick={handleDeviceChange}>Change Device</button>
      <Monitor input={micOut} />
    </>
  );
}
```

**Note:** The imperative handle provides `getState()` for read-only access, plus `selectDevice()` and `refreshDevices()` for device management. To control gain and mute programmatically, use the controlled props pattern shown above.

## Important Notes

### Browser Permissions

- The browser will prompt the user for microphone access when the component mounts
- Access must be granted by the user before audio can be captured
- HTTPS is required for microphone access in most browsers (except localhost)

### Device Selection

- Available devices are enumerated on mount
- Device labels may be empty until microphone permission is granted
- If no device is pre-selected, the first available device is chosen automatically

### Error Handling

- Check the `error` property in render props to detect access failures
- Common errors include permission denied, device not found, or device busy

::: warning Browser Compatibility
The Microphone component requires the `getUserMedia` API, which may not be available in all browsers or contexts. Always check for errors and provide fallback UI.
:::

## Related

- [Filter](/api/processors/filter) - Process microphone input
- [Monitor](/api/output/monitor) - Output to speakers
- [Compressor](/api/processors/compressor) - Control dynamics
