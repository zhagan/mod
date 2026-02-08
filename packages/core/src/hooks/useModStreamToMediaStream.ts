import { useEffect, useRef, useState } from 'react';
import { ModStreamRef } from '../types/ModStream';

/**
 * Converts a ModStreamRef (Web Audio API) to a MediaStream (for WebRTC, recording, etc.)
 *
 * This hook creates a MediaStreamAudioDestinationNode that bridges the Web Audio API
 * graph to the MediaStream API, enabling use cases like:
 * - WebRTC streaming (LiveKit, Twilio, etc.)
 * - MediaRecorder for saving audio
 * - Canvas/Video capture with audio
 *
 * @param modStreamRef - The ModStream to convert
 * @returns A MediaStream containing the audio from the ModStream, or null if not ready
 *
 * @example
 * ```tsx
 * import { useModStreamToMediaStream, MP3Deck, useModStream } from '@mode-7/mod';
 *
 * function App() {
 *   const deckOut = useModStream();
 *   const mediaStream = useModStreamToMediaStream(deckOut);
 *
 *   const startRecording = () => {
 *     if (mediaStream) {
 *       const recorder = new MediaRecorder(mediaStream);
 *       recorder.start();
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <MP3Deck output={deckOut} />
 *       <button onClick={startRecording}>Record</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useModStreamToMediaStream(modStreamRef: ModStreamRef): MediaStream | null {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  useEffect(() => {
    if (!modStreamRef.current) {
      setMediaStream(null);
      return;
    }

    // Get the audio context from the modStreamRef
    const audioContext = modStreamRef.current.context;
    if (!audioContext) {
      setMediaStream(null);
      return;
    }

    // Create a MediaStreamAudioDestinationNode
    // This is the bridge between Web Audio API and MediaStream API
    const destination = audioContext.createMediaStreamDestination();
    destinationRef.current = destination;

    // Connect the ModStream to the destination
    // Audio will flow through this connection automatically
    if (!modStreamRef.current.gain) {
      setMediaStream(null);
      return;
    }
    modStreamRef.current.gain.connect(destination);

    // The destination.stream is a MediaStream that can be used with:
    // - WebRTC (RTCPeerConnection.addTrack)
    // - MediaRecorder
    // - HTMLMediaElement.srcObject
    setMediaStream(destination.stream);

    return () => {
      if (modStreamRef.current && modStreamRef.current.gain && destinationRef.current) {
        try {
          modStreamRef.current.gain.disconnect(destinationRef.current);
        } catch (e) {
          // Already disconnected
        }
      }
      destinationRef.current = null;
    };
  }, [modStreamRef.current?.audioNode]);

  return mediaStream;
}
