# Processors

Processors transform audio signals - filtering, adding effects, shaping dynamics, and more.

## Filter Types

### Filter
Multimode resonant filter.

**Types**: Lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf  
**API**: [Filter](/api/processors/filter)

### Diode Filter
Nonlinear ladder filter with drive and resonance.

**API**: [DiodeFilter](/api/processors/diode-filter)

### EQ
Multi-band parametric equalizer.

**Bands**: Low, mid, high  
**API**: [EQ](/api/processors/eq)

### AutoWah
Envelope-following filter effect.

**API**: [AutoWah](/api/processors/autowah)

## Time-Based Effects

### Delay
Echo/delay effect with feedback.

**API**: [Delay](/api/processors/delay)

### Reverb
Spatial reverberation effect.

**API**: [Reverb](/api/processors/reverb)

## Modulation Effects

### Chorus
Pitch modulation for thickness.

**API**: [Chorus](/api/processors/chorus)

### Flanger
Sweeping comb filter effect.

**API**: [Flanger](/api/processors/flanger)

### Phaser
Phase-shifting modulation effect.

**API**: [Phaser](/api/processors/phaser)

### Tremolo
Amplitude modulation effect.

**API**: [Tremolo](/api/processors/tremolo)

### RingModulator
Frequency modulation effect.

**API**: [RingModulator](/api/processors/ringmodulator)

## Dynamics

### Compressor
Dynamic range compression.

**API**: [Compressor](/api/processors/compressor)

### Limiter
Peak limiting for preventing clipping.

**API**: [Limiter](/api/processors/limiter)

### Gate
Noise gate for cutting low signals.

**API**: [Gate](/api/processors/gate)

## Distortion

### Distortion
Waveshaping distortion/overdrive.

**Types**: Soft clip, hard clip, tanh, foldback  
**API**: [Distortion](/api/processors/distortion)

### BitCrusher
Digital degradation effect.

**API**: [BitCrusher](/api/processors/bitcrusher)

## Spatialization

### Panner
Stereo panning control.

**API**: [Panner](/api/processors/panner)

## Effect Chains

### Serial Chain
```tsx
const dry = useModStream();
const filtered = useModStream();
const delayed = useModStream();
const reverbed = useModStream();

<ToneGenerator output={dry} />
<Filter input={dry} output={filtered} />
<Delay input={filtered} output={delayed} />
<Reverb input={delayed} output={reverbed} />
<Monitor input={reverbed} />
```

### Parallel Effects
```tsx
const source = useModStream();
const chorus = useModStream();
const delay = useModStream();
const mixed = useModStream();

<NoiseGenerator output={source} />
<Chorus input={source} output={chorus} />
<Delay input={source} output={delay} />
<Mixer inputs={[chorus, delay]} output={mixed} />
```

## Next Steps

- Learn about [Mixers](/guide/mixers)
- Explore individual [processor APIs](/api/processors/filter)
- Build [effect chains](/guide/examples/rhythmic-patterns)
