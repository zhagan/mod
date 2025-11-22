# useModStreamToMediaStream

The `useModStreamToMediaStream` hook converts a ModStreamRef (Web Audio API) to a MediaStream (MediaStream API), enabling integration with WebRTC, MediaRecorder, and other browser APIs that require MediaStream objects.

## Usage

```typescript
const mediaStream = useModStreamToMediaStream(modStreamRef);
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `modStreamRef` | `ModStreamRef` | The ModStream to convert to MediaStream |

## Returns

Returns a `MediaStream | null`. The MediaStream contains a single audio track that carries the audio from the Web Audio graph. Returns `null` if the ModStream is not yet initialized.

## Use Cases

### Recording Audio

Capture audio from your mod setup to a file using MediaRecorder:

```tsx
import { useModStream, useModStreamToMediaStream, MP3Deck } from '@mode-7/mod';
import { useState, useRef } from 'react';

function AudioRecorder() {
  const deckOut = useModStream();
  const mediaStream = useModStreamToMediaStream(deckOut);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = () => {
    if (!mediaStream) return;

    const recorder = new MediaRecorder(mediaStream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.webm';
      a.click();
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <>
      <MP3Deck output={deckOut}>
        {({ loadFile, play }) => (
          <div>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  loadFile(file);
                  play();
                }
              }}
            />
          </div>
        )}
      </MP3Deck>

      <div>
        <button onClick={startRecording} disabled={isRecording || !mediaStream}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>
    </>
  );
}
```

### WebRTC Streaming

Stream audio to remote peers using WebRTC:

```tsx
import { useModStream, useModStreamToMediaStream, Microphone } from '@mode-7/mod';

function WebRTCBroadcaster() {
  const micOut = useModStream();
  const mediaStream = useModStreamToMediaStream(micOut);

  const startBroadcast = async () => {
    if (!mediaStream) return;

    // Create peer connection
    const pc = new RTCPeerConnection();

    // Add audio track from the MediaStream
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (audioTrack) {
      pc.addTrack(audioTrack, mediaStream);
    }

    // ... rest of WebRTC setup (offer/answer, ICE candidates, etc.)
  };

  return (
    <>
      <Microphone output={micOut} />
      <button onClick={startBroadcast} disabled={!mediaStream}>
        Start Broadcast
      </button>
    </>
  );
}
```

### LiveKit Integration

Use with LiveKit for live streaming:

```tsx
import { useModStream, useModStreamToMediaStream, Mixer } from '@mode-7/mod';
import { Room } from 'livekit-client';

function LiveKitStreamer() {
  const mixerOut = useModStream();
  const mediaStream = useModStreamToMediaStream(mixerOut);

  const goLive = async () => {
    if (!mediaStream) return;

    const room = new Room();
    await room.connect('wss://your-livekit-url', token);

    // Publish the audio track
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (audioTrack) {
      await room.localParticipant.publishTrack(audioTrack);
    }
  };

  return (
    <>
      <Mixer inputs={[/* ... */]} output={mixerOut} />
      <button onClick={goLive} disabled={!mediaStream}>
        Go Live
      </button>
    </>
  );
}
```

### Audio Analysis with Canvas

Visualize audio on a canvas using MediaStream:

```tsx
import { useModStream, useModStreamToMediaStream, MP3Deck } from '@mode-7/mod';
import { useEffect, useRef } from 'react';

function CanvasVisualizer() {
  const deckOut = useModStream();
  const mediaStream = useModStreamToMediaStream(deckOut);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!mediaStream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();

    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Draw visualization
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(${dataArray[i] + 100}, 50, 50)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
      }
    }

    draw();
  }, [mediaStream]);

  return (
    <>
      <MP3Deck output={deckOut} />
      <canvas ref={canvasRef} width={800} height={200} />
    </>
  );
}
```

## Important Notes

### MediaStream Lifecycle

- The MediaStream is created when the ModStreamRef becomes available
- The MediaStream persists as long as the ModStreamRef is valid
- Audio flows through automatically - no need to manually update the stream
- The MediaStream will have one audio track in the "live" state when audio is flowing

### Browser Compatibility

- `MediaStreamAudioDestinationNode` is supported in all modern browsers
- The resulting MediaStream works with all standard browser APIs:
  - `MediaRecorder` for recording
  - `RTCPeerConnection` for WebRTC
  - `HTMLMediaElement.srcObject` for playback
  - Any API that accepts a MediaStream

### Audio Context State

Make sure your AudioContext is in the "running" state before using the MediaStream. Most browsers require a user gesture (click, tap) to start the AudioContext.

### Track State

The MediaStream will always have audio tracks, but they need actual audio flowing through the Web Audio graph to be useful. Make sure your audio sources (MP3Deck, Microphone, etc.) are active and playing.

## Related

- [useModStream](/api/hooks/use-mod-stream) - Create ModStream references
- [Monitor](/api/output/monitor) - Output audio to speakers
- [Mixer](/api/mixers/mixer) - Mix multiple audio sources
