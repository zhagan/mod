# Clock

The `Clock` component generates precise timing pulses (gate signals) that can trigger envelopes, sync sequencers, or create rhythmic patterns.

## Clock Source

### Where time originates

Time is derived from the audio rendering clock (`AudioContext.currentTime`) inside an `AudioWorkletProcessor`. This keeps timing aligned to the audio sample clock instead of the UI thread.

### Why that source was chosen

The audio thread is the only clock that is sample-accurate and immune to UI jitter. Using it ensures gate pulses stay phase-stable even when the main thread is busy.

### Tick model

Each tick is a **16th-note pulse** generated on the audio thread. The pulse is a short gate (10ms width) at a fixed subdivision of the BPM.

### Tick resolution and precision

Ticks are computed per sample in the worklet, so timing is sample-accurate. The pulse width and spacing are derived directly from the audio sample rate.

### Scheduling

The clock is generated in real time by the worklet, not via `setTimeout` or UI loops. There is no lookahead buffer: pulses are emitted by the audio engine as each render quantum is processed.

### How far ahead events are planned

No lookahead scheduling is used for the clock itself. Downstream components that need lookahead scheduling should use their own scheduler.

### BPM & transport

Tempo is controlled by the `bpm` AudioParam on the worklet. Changes are applied at audio rate (sample-accurate). Start/stop/reset toggle the worklet’s `running` parameter, which resets phase when starting.

### Sync

Multiple sequencers stay in sync by connecting to the same clock output. Since all pulses are generated from the same audio clock, their phase remains locked. Late subscribers will receive the next pulse on time (they will not retroactively align to earlier pulses).

### Threading / execution context

The clock runs in an `AudioWorkletProcessor` (audio rendering thread). The UI thread only updates parameters (BPM, running), which minimizes drift and jitter.

### Transport and TransportBus

For applications that need a shared timeline across modules (tempo, phase, start/stop), use the `Transport` / `WorkletTransport` plus a `TransportBus`. The Clock is a CV pulse source; the Transport is the global timeline.

- `Transport` / `WorkletTransport` expose beat-accurate time conversions (`getBeatAtTime`, `getTimeAtBeat`).
- `TransportBus` lets devices subscribe to `tick`, `tempo`, `start`, `stop`, and `seek` without direct references.
- When using a transport, you can still drive a sequencer with a Clock, but the transport is the better choice for phase-locked scheduling.

Minimal usage sketch:

```ts
import { WorkletTransport, TransportBus, Scheduler } from '@mode-7/mod';

const transport = await WorkletTransport.create(audioContext, { bpm: 120 });
const bus = new TransportBus(transport);
const scheduler = new Scheduler(transport, { lookaheadMs: 100, intervalMs: 25 });

scheduler.start(false);
const stop = bus.on('tick', (payload) => scheduler.advance((payload as any).time));
transport.start();
```

### Known limitations

- UI changes (rapid BPM slider movement) are still applied from the main thread, so the control signal itself can be jittery even though the worklet is not.
- Background tab throttling can affect UI-driven state, but the audio thread continues running once started.
- Extreme CPU load can cause audio glitches, which will manifest as irregular pulses.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `output` | `ModStreamRef` | Required | Reference to output the clock pulses |
| `label` | `string` | `'clock'` | Label for the component in metadata |
| `bpm` | `number` | `120` | Tempo in beats per minute (controlled or initial value) |
| `onBpmChange` | `(bpm: number) => void` | - | Callback when BPM changes |
| `onRunningChange` | `(isRunning: boolean) => void` | - | Callback when running state changes |
| `children` | `function` | - | Render prop function receiving control props |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `bpm` | `number` | Current tempo in beats per minute |
| `setBpm` | `(value: number) => void` | Update the tempo |
| `isRunning` | `boolean` | Whether the clock is running |
| `start` | `() => void` | Start the clock |
| `stop` | `() => void` | Stop the clock |
| `reset` | `() => void` | Stop the clock and reset |

## Usage

### Clock -> Sequencer (Required)

Sequencers need a clock input to advance steps. Create a `Clock`, connect its output to the `Sequencer` `clock` input, and start the clock.

```tsx
import { Clock, Sequencer, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const clockOut = useRef(null);
  const seqOut = useRef(null);
  const seqGate = useRef(null);

  return (
    <>
      <Clock output={clockOut}>
        {({ start }) => <button onClick={start}>Start</button>}
      </Clock>
      <Sequencer output={seqOut} gateOutput={seqGate} clock={clockOut} />
      <Monitor input={seqOut} />
    </>
  );
}
```

### Basic Usage

```tsx
import { Clock, ADSR, ToneGenerator, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const clockOut = useRef(null);
  const adsrOut = useRef(null);
  const toneOut = useRef(null);

  return (
    <>
      <Clock output={clockOut}>
        {({ start, stop, isRunning }) => (
          <button onClick={isRunning ? stop : start}>
            {isRunning ? 'Stop' : 'Start'}
          </button>
        )}
      </Clock>
      <ADSR gate={clockOut} output={adsrOut} />
      <ToneGenerator output={toneOut} cv={adsrOut} cvAmount={1.0} />
      <Monitor input={toneOut} />
    </>
  );
}
```

### With Tempo Control

```tsx
import { Clock } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const clockOut = useRef(null);

  return (
    <Clock output={clockOut}>
      {({ bpm, setBpm, isRunning, start, stop, reset }) => (
        <div>
          <div>
            <button onClick={start} disabled={isRunning}>Start</button>
            <button onClick={stop} disabled={!isRunning}>Stop</button>
            <button onClick={reset}>Reset</button>
          </div>

          <div>
            <label>Tempo: {bpm} BPM</label>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </div>

          <div>
            <button onClick={() => setBpm(60)}>60</button>
            <button onClick={() => setBpm(90)}>90</button>
            <button onClick={() => setBpm(120)}>120</button>
            <button onClick={() => setBpm(140)}>140</button>
            <button onClick={() => setBpm(180)}>180</button>
          </div>
        </div>
      )}
    </Clock>
  );
}
```

### Triggering Multiple Envelopes

```tsx
import { Clock, ADSR, ToneGenerator, Filter, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const clockOut = useRef(null);
  const ampEnvOut = useRef(null);
  const filterEnvOut = useRef(null);
  const toneOut = useRef(null);
  const filterOut = useRef(null);

  return (
    <>
      <Clock output={clockOut} bpm={128}>
        {({ start }) => {
          React.useEffect(() => { start(); }, []);
          return null;
        }}
      </Clock>

      {/* Amplitude envelope */}
      <ADSR
        gate={clockOut}
        output={ampEnvOut}
      />

      {/* Filter envelope with different settings */}
      <ADSR
        gate={clockOut}
        output={filterEnvOut}
      >
        {({ setAttack, setDecay, setSustain, setRelease }) => {
          React.useEffect(() => {
            setAttack(0.001);
            setDecay(0.3);
            setSustain(0.2);
            setRelease(0.2);
          }, []);
          return null;
        }}
      </ADSR>

      <ToneGenerator output={toneOut} cv={ampEnvOut} cvAmount={1.0} />
      <Filter
        input={toneOut}
        output={filterOut}
        cv={filterEnvOut}
        cvAmount={2000}
      />
      <Monitor input={filterOut} />
    </>
  );
}
```

### Rhythmic Pattern with Sequencer

```tsx
import { Clock, Sequencer, ToneGenerator, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const clockOut = useRef(null);
  const seqOut = useRef(null);
  const toneOut = useRef(null);

  return (
    <>
      <Clock output={clockOut} bpm={120}>
        {({ start, isRunning }) => {
          React.useEffect(() => {
            if (!isRunning) start();
          }, []);
          return null;
        }}
      </Clock>

      <Sequencer output={seqOut} clock={clockOut} numSteps={16}>
        {({ setSteps }) => {
          React.useEffect(() => {
            // Create a rhythmic pattern
            const pattern = [
              1.0, 0.0, 0.5, 0.0, 0.8, 0.0, 0.3, 0.0,
              1.0, 0.0, 0.5, 0.0, 0.6, 0.4, 0.2, 0.0,
            ];
            setSteps(pattern.map((value) => ({
              active: value > 0,
              value,
              lengthPct: 80,
              slide: false,
              accent: false,
            })));
          }, []);
          return null;
        }}
      </Sequencer>

      <ToneGenerator
        output={toneOut}
        frequency={100}
        cv={seqOut}
        cvAmount={200}
      />
      <Monitor input={toneOut} />
    </>
  );
}
```

### Controlled Props

You can control the Clock from external state using controlled props:

```tsx
import { Clock, ADSR, ToneGenerator, Monitor } from '@mode-7/mod';
import { useState, useRef } from 'react';

function App() {
  const clockOut = useRef(null);
  const adsrOut = useRef(null);
  const toneOut = useRef(null);
  const [bpm, setBpm] = useState(120);
  const [isRunning, setRunning] = useState(false);

  return (
    <>
      <Clock
        output={clockOut}
        bpm={bpm}
        onBpmChange={setBpm}
        onRunningChange={setRunning}
      >
        {({ start, stop }) => (
          <button onClick={isRunning ? stop : start}>
            {isRunning ? 'Stop' : 'Start'}
          </button>
        )}
      </Clock>

      <div>
        <label>Tempo: {bpm} BPM</label>
        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />
      </div>

      <ADSR gate={clockOut} output={adsrOut} />
      <ToneGenerator output={toneOut} cv={adsrOut} cvAmount={1.0} />
      <Monitor input={toneOut} />
    </>
  );
}
```

### Imperative Refs

For programmatic access to state and transport control, you can use refs:

```tsx
import { Clock, ClockHandle, ADSR, ToneGenerator, Monitor } from '@mode-7/mod';
import { useRef, useEffect } from 'react';

function App() {
  const clockRef = useRef<ClockHandle>(null);
  const clockOut = useRef(null);
  const adsrOut = useRef(null);
  const toneOut = useRef(null);

  useEffect(() => {
    // Access current state
    if (clockRef.current) {
      const state = clockRef.current.getState();
      console.log('BPM:', state.bpm);
      console.log('Is running:', state.isRunning);
    }
  }, []);

  const handleTransport = () => {
    if (!clockRef.current) return;

    // Use imperative transport methods
    clockRef.current.start();
    // clockRef.current.stop();
    // clockRef.current.reset();
  };

  return (
    <>
      <Clock ref={clockRef} output={clockOut} />
      <ADSR gate={clockOut} output={adsrOut} />
      <ToneGenerator output={toneOut} cv={adsrOut} cvAmount={1.0} />
      <button onClick={handleTransport}>Start</button>
      <Monitor input={toneOut} />
    </>
  );
}
```

**Note:** The imperative handle provides `start()`, `stop()`, and `reset()` for transport control, plus `getState()` for read-only access. To control BPM programmatically, use the controlled props pattern shown above.

## Important Notes

### Clock Pulses

- Each pulse is a short 10ms trigger
- Pulses go from 0 to 1 and back to 0
- Pulse timing is precise and based on BPM

### BPM Range

- Typical range: 40-240 BPM
- Lower values create slower rhythms
- Higher values create faster rhythms
- Can be changed while the clock is running

### Gate Outputs

- The clock output is compatible with any component accepting gate inputs
- Most commonly used with ADSR envelopes
- Can also trigger sequencers or other CV modules

### Sync Considerations

- The clock starts immediately when `start()` is called
- Changing BPM while running adjusts timing smoothly
- `reset()` stops the clock and can be used to resync

## Related

- [ADSR](/api/cv/adsr) - Trigger envelopes with clock pulses
- [Sequencer](/api/cv/sequencer) - Can be synced to clock tempo
- [ToneGenerator](/api/sources/tone-generator) - Create rhythmic patterns
