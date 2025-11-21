# Component Documentation Fix Guide

This guide provides specific instructions for fixing all remaining component documentation.

## Components Fixed (7/31)

### ✅ Completed
1. **ToneGenerator** - Already correct (template)
2. **NoiseGenerator** - Fixed props table & imperative refs
3. **Microphone** - Fixed props table & imperative refs
4. **MP3Deck** - Fixed props table & imperative refs
5. **StreamingAudioDeck** - Fixed props table & imperative refs
6. **LFO** - Fixed props table & imperative refs
7. **ADSR** - Fixed props table & imperative refs

---

## Remaining Components (24/31)

### CV Generators (2 remaining)

#### Sequencer (`/Users/joe/Projects/Mod/mod/docs/api/cv/sequencer.md`)

**Handle Interface** (from code):
```typescript
export interface SequencerHandle {
  play: () => void;
  pause: () => void;
  reset: () => void;
  getState: () => {
    steps: number[];
    currentStep: number;
    bpm: number;
    isPlaying: boolean;
  };
}
```

**Props to Add:**
```markdown
| `steps` | `number[]` | `[0, 0, 0, 0, 0, 0, 0, 0]` | Sequence step values (controlled or initial value) |
| `onStepsChange` | `(steps: number[]) => void` | - | Callback when steps change |
| `bpm` | `number` | `120` | Tempo in beats per minute (controlled or initial value) |
| `onBpmChange` | `(bpm: number) => void` | - | Callback when BPM changes |
| `onCurrentStepChange` | `(currentStep: number) => void` | - | Callback when current step changes |
| `onPlayingChange` | `(isPlaying: boolean) => void` | - | Callback when playback state changes |
```

**Imperative Refs Example:**
```tsx
useEffect(() => {
  // Access current state
  if (sequencerRef.current) {
    const state = sequencerRef.current.getState();
    console.log('Steps:', state.steps);
    console.log('Current step:', state.currentStep);
    console.log('BPM:', state.bpm);
    console.log('Is playing:', state.isPlaying);
  }
}, []);

const handleTransport = () => {
  if (!sequencerRef.current) return;

  // Use imperative transport methods
  sequencerRef.current.play();
  // sequencerRef.current.pause();
  // sequencerRef.current.reset();
};
```

**Note to Add:**
> The imperative handle provides `play()`, `pause()`, and `reset()` for transport control, plus `getState()` for read-only access. To control steps and BPM programmatically, use the controlled props pattern.

---

#### Clock (`/Users/joe/Projects/Mod/mod/docs/api/cv/clock.md`)

**Handle Interface** (from code):
```typescript
export interface ClockHandle {
  start: () => void;
  stop: () => void;
  reset: () => void;
  getState: () => {
    bpm: number;
    isRunning: boolean;
  };
}
```

**Props to Add:**
```markdown
| `bpm` | `number` | `120` | Tempo in beats per minute (controlled or initial value) |
| `onBpmChange` | `(bpm: number) => void` | - | Callback when BPM changes |
| `onRunningChange` | `(isRunning: boolean) => void` | - | Callback when running state changes |
| `onTick` | `() => void` | - | Callback on each clock tick |
```

**Imperative Refs Example:**
```tsx
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
```

**Note to Add:**
> The imperative handle provides `start()`, `stop()`, and `reset()` for transport control, plus `getState()` for read-only access. To control BPM programmatically, use the controlled props pattern.

---

### Processors (7 to fix, 9 to create)

**ALL PROCESSORS follow this pattern:**
- Handle has ONLY `getState()` (read-only)
- All parameters support controlled props
- No setter methods on handle

#### Template for Processor Docs

**Props Table - Add controlled props:**
```markdown
| `paramName` | `type` | `default` | Description (controlled or initial value) |
| `onParamNameChange` | `(paramName: type) => void` | - | Callback when parameter changes |
```

**Imperative Refs Section - Replace with:**
```markdown
### Imperative Refs

For programmatic access to state, you can use refs:

```tsx
import { Component, ComponentHandle } from '@mode-7/mod';
import { useRef, useEffect } from 'react';

function App() {
  const componentRef = useRef<ComponentHandle>(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    // Access current state
    if (componentRef.current) {
      const state = componentRef.current.getState();
      console.log('Param 1:', state.param1);
      console.log('Param 2:', state.param2);
      // Log all state properties
    }
  }, []);

  return (
    <>
      <SomeSource output={inputRef} />
      <Component
        ref={componentRef}
        input={inputRef}
        output={outputRef}
      />
      <Monitor input={outputRef} />
    </>
  );
}
```

**Note:** The imperative handle provides read-only access via `getState()`. To control the component programmatically, use the controlled props pattern shown above.
```

---

#### Specific Processor Fixes

**Delay** - `/Users/joe/Projects/Mod/mod/docs/api/processors/delay.md`
- Props: `time`, `feedback`, `wet`
- Add: `onTimeChange`, `onFeedbackChange`, `onWetChange`
- Remove: Any `setTime`, `setFeedback`, `setWet` in imperative section

**Reverb** - `/Users/joe/Projects/Mod/mod/docs/api/processors/reverb.md`
- Props: `wet`, `duration`, `decay`
- Add: `onWetChange`, `onDurationChange`, `onDecayChange`
- Remove: Any setter methods in imperative section

**Filter** - `/Users/joe/Projects/Mod/mod/docs/api/processors/filter.md`
- Props: `frequency`, `Q`, `type`, `gain`
- Add: `onFrequencyChange`, `onQChange`, `onTypeChange`, `onGainChange`
- Remove: Any setter methods in imperative section

**Compressor** - `/Users/joe/Projects/Mod/mod/docs/api/processors/compressor.md`
- Check implementation for exact props
- Follow same pattern

**Distortion** - `/Users/joe/Projects/Mod/mod/docs/api/processors/distortion.md`
- Check implementation for exact props
- Follow same pattern

**Panner** - `/Users/joe/Projects/Mod/mod/docs/api/processors/panner.md`
- Props: `pan` (likely)
- Add: `onPanChange`
- Remove: Any setter methods

**EQ** - `/Users/joe/Projects/Mod/mod/docs/api/processors/eq.md`
- Check implementation for exact props
- Follow same pattern

---

#### Processors Needing Documentation Creation

These files need to be created following the ToneGenerator template structure:

1. **Chorus** - `/Users/joe/Projects/Mod/mod/docs/api/processors/chorus.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/Chorus.tsx`

2. **Phaser** - `/Users/joe/Projects/Mod/mod/docs/api/processors/phaser.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/Phaser.tsx`

3. **Flanger** - `/Users/joe/Projects/Mod/mod/docs/api/processors/flanger.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/Flanger.tsx`

4. **Tremolo** - `/Users/joe/Projects/Mod/mod/docs/api/processors/tremolo.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/Tremolo.tsx`

5. **BitCrusher** - `/Users/joe/Projects/Mod/mod/docs/api/processors/bitcrusher.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/BitCrusher.tsx`

6. **Limiter** - `/Users/joe/Projects/Mod/mod/docs/api/processors/limiter.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/Limiter.tsx`

7. **Gate** - `/Users/joe/Projects/Mod/mod/docs/api/processors/gate.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/Gate.tsx`

8. **AutoWah** - `/Users/joe/Projects/Mod/mod/docs/api/processors/autowah.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/AutoWah.tsx`

9. **RingModulator** - `/Users/joe/Projects/Mod/mod/docs/api/processors/ringmodulator.md`
   - Source: `/Users/joe/Projects/Mod/mod/packages/core/src/components/processors/RingModulator.tsx`

**Creation Process:**
1. Read the source file to identify:
   - Props interface
   - Handle interface
   - RenderProps interface
   - Default values
2. Follow ToneGenerator.md structure:
   - Description
   - Props table (with controlled props)
   - Render Props table
   - Basic usage example
   - Render props example
   - Controlled props example
   - Imperative refs example (getState() only)
   - Important notes
   - Related components

---

### Mixers (2 remaining)

#### Mixer - `/Users/joe/Projects/Mod/mod/docs/api/mixers/mixer.md`
- Check `/Users/joe/Projects/Mod/mod/packages/core/src/components/mixers/Mixer.tsx` for Handle interface
- Likely has `getState()` only
- Apply standard processor pattern

#### CrossFade - `/Users/joe/Projects/Mod/mod/docs/api/mixers/crossfade.md`
- Check `/Users/joe/Projects/Mod/mod/packages/core/src/components/mixers/CrossFade.tsx` for Handle interface
- Likely has `getState()` only
- Apply standard processor pattern

---

### Output (1 remaining)

#### Monitor - `/Users/joe/Projects/Mod/mod/docs/api/output/monitor.md`
- Check `/Users/joe/Projects/Mod/mod/packages/core/src/components/output/Monitor.tsx` for Handle interface
- May not have a handle (check if it exports one)
- If it has a handle, likely `getState()` only

---

### Visualizations (3 remaining)

#### Oscilloscope - `/Users/joe/Projects/Mod/mod/docs/api/visualizations/oscilloscope.md`
- Check `/Users/joe/Projects/Mod/mod/packages/core/src/components/visualizations/Oscilloscope.tsx`
- May have different pattern (visualization components)
- Check for Handle interface and methods

#### SpectrumAnalyzer - `/Users/joe/Projects/Mod/mod/docs/api/visualizations/spectrum-analyzer.md`
- Check `/Users/joe/Projects/Mod/mod/packages/core/src/components/visualizations/SpectrumAnalyzer.tsx`
- Same pattern as Oscilloscope

#### LevelMeter - `/Users/joe/Projects/Mod/mod/docs/api/visualizations/level-meter.md`
- Check `/Users/joe/Projects/Mod/mod/packages/core/src/components/visualizations/LevelMeter.tsx`
- Same pattern as Oscilloscope

---

### Core (1 remaining)

#### AudioProvider - `/Users/joe/Projects/Mod/mod/docs/api/audio-provider.md`
- Check `/Users/joe/Projects/Mod/mod/packages/core/src/context/AudioContext.tsx` or similar
- Different pattern - context provider, not a component
- May not have imperative refs at all

---

## Search & Replace Commands

For efficiency, here are grep commands to find files with issues:

```bash
# Find all docs with incorrect setter methods in imperative refs
grep -l "setFrequency\|setGain\|setWet\|setTime\|setFeedback\|setAttack\|setDecay" \
  /Users/joe/Projects/Mod/mod/docs/api/**/*.md

# Find all docs WITHOUT controlled prop callbacks in props table
grep -L "onGainChange\|onFrequencyChange\|onWetChange\|onTimeChange" \
  /Users/joe/Projects/Mod/mod/docs/api/processors/*.md
```

---

## Quality Checklist

For each documentation file, verify:

- [ ] Props table includes ALL props from the interface
- [ ] All parameters marked as "controlled or initial value"
- [ ] All `onParamNameChange` callbacks documented
- [ ] Render Props table matches `ComponentRenderProps` interface exactly
- [ ] Imperative Refs section shows ONLY methods that exist on Handle
- [ ] No setter methods (`setX()`) shown unless they exist on Handle
- [ ] Note added explaining controlled props for programmatic control
- [ ] All four usage patterns included:
  - [ ] Basic usage (uncontrolled)
  - [ ] Render props pattern
  - [ ] Controlled props pattern
  - [ ] Imperative refs pattern
- [ ] Examples are syntactically correct and runnable
- [ ] Cross-references to related components are accurate

---

## Priority Order

1. **High Priority** (most visible, most used):
   - Delay, Reverb, Filter (fix imperative refs)
   - Sequencer, Clock (fix imperative refs + add props)

2. **Medium Priority** (common processors):
   - Compressor, Distortion, Panner, EQ (fix imperative refs + add props)

3. **Low Priority** (less common):
   - Mixer, CrossFade, Monitor
   - Visualizations (Oscilloscope, SpectrumAnalyzer, LevelMeter)
   - Missing processor docs (create 9 files)

---

## Example Command to Check a Component

```bash
# Read the source to find Handle interface
grep -A 20 "export interface ComponentHandle" \
  /Users/joe/Projects/Mod/mod/packages/core/src/components/category/Component.tsx

# Read the source to find Props interface
grep -A 30 "export interface ComponentProps" \
  /Users/joe/Projects/Mod/mod/packages/core/src/components/category/Component.tsx
```

This ensures documentation matches actual implementation 100%.
