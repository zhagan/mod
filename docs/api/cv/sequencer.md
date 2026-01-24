# Sequencer

The `Sequencer` component outputs a stepped CV sequence and optional gate/accent pulses. It advances on an external clock input, making it phase-locked to the rest of the patch.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `output` | `ModStreamRef` | Required | CV output for step values |
| `gateOutput` | `ModStreamRef` | - | Optional gate output per step |
| `accentOutput` | `ModStreamRef` | - | Optional accent CV output per step |
| `clock` | `ModStreamRef` | - | Clock input (required to advance steps) |
| `reset` | `ModStreamRef` | - | Optional reset pulse input |
| `label` | `string` | `'sequencer'` | Label for metadata |
| `numSteps` | `number` | `8` | Default number of steps |
| `steps` | `step[]` | `Array(numSteps)` | Controlled step data |
| `onStepsChange` | `(steps: step[]) => void` | - | Callback when steps change |
| `division` | `number` | `4` | Clock division (1/4, 1/8, 1/16, etc.) |
| `onDivisionChange` | `(division: number) => void` | - | Callback when division changes |
| `length` | `number` | `numSteps` | Active sequence length |
| `onLengthChange` | `(length: number) => void` | - | Callback when length changes |
| `swing` | `number` | `0` | Swing amount (-50..50) |
| `onSwingChange` | `(swing: number) => void` | - | Callback when swing changes |
| `onCurrentStepChange` | `(currentStep: number) => void` | - | Callback when step changes |
| `children` | `function` | - | Render prop function |

### Step Model

Each step is an object:

```ts
type step = {
  active: boolean;
  value: number;
  lengthPct: number; // 10..100
  slide: boolean;
  accent: boolean;
};
```

## Render Props

| Property | Type | Description |
|----------|------|-------------|
| `steps` | `step[]` | Current step data |
| `setSteps` | `(steps: step[]) => void` | Replace all step data |
| `currentStep` | `number` | Current step index |
| `division` | `number` | Clock division |
| `setDivision` | `(value: number) => void` | Update division |
| `length` | `number` | Sequence length |
| `setLength` | `(value: number) => void` | Update length |
| `swing` | `number` | Swing amount |
| `setSwing` | `(value: number) => void` | Update swing |
| `reset` | `() => void` | Reset to step 0 |

## Usage

### Clock -> Sequencer (Required)

The sequencer advances only when it receives clock pulses. Connect a `Clock` output to the `Sequencer` `clock` input.

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

### Per-Step Features (Length, Slide, Accent)

```tsx
import { Sequencer } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const seqOut = useRef(null);
  const gateOut = useRef(null);
  const accentOut = useRef(null);

  return (
    <Sequencer output={seqOut} gateOutput={gateOut} accentOutput={accentOut}>
      {({ steps, setSteps }) => (
        <button
          onClick={() => {
            const next = [...steps];
            next[1] = { ...next[1], active: true, lengthPct: 50, slide: true, accent: true };
            setSteps(next);
          }}
        >
          Configure Step 2
        </button>
      )}
    </Sequencer>
  );
}
```

## Behavior Notes

### Clock Division

The sequencer uses the incoming clock pulses as a base and advances steps according to `division`:

- `4` = 1/16 notes (default)
- `2` = 1/8 notes
- `1` = 1/4 notes

### Gate Length

Each step has `lengthPct` (10..100). Gate and accent outputs stay high for that percentage of the step duration.

### Slide

- Slide is applied **into** a step when `step[i].slide` is true and both the previous and current steps are active.
- The previous step’s gate is held at 100% across the boundary (legato).
- CV glides using a 65ms linear ramp after the step boundary.

### Accent

Accent raises the `accentOutput` CV high for the step duration (`lengthPct`).

### Reset

Sending a pulse to the `reset` input resets the sequence to step 0 on the next clock tick.

## Related

- [Clock](/api/cv/clock) - Clock source for step advance
- [ADSR](/api/cv/adsr) - Use gate output to trigger envelopes
- [ToneGenerator](/api/sources/tone-generator) - CV pitch source
