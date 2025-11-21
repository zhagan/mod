#!/usr/bin/env python3
"""
Script to create documentation for all missing processor components
"""

import os

DOCS_BASE = "/Users/joe/Projects/Mod/mod/docs/api/processors"

# Template for processor documentation
DOC_TEMPLATE = """# {component}

The `{component}` component {description}.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Audio signal to process |
| `output` | `ModStreamRef` | Required | Processed audio output |
| `label` | `string` | `'{label}'` | Label for the component in metadata |
{props_rows}| `children` | `function` | - | Render prop function receiving control props |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
{render_props_rows}| `isActive` | `boolean` | Whether the effect is active |

## Usage

### Basic Usage

```tsx
import {{ ToneGenerator, {component}, Monitor }} from '@mode-7/mod';
import {{ useRef }} from 'react';

function App() {{
  const toneOut = useRef(null);
  const outputRef = useRef(null);

  return (
    <>
      <ToneGenerator output={{toneOut}} />
      <{component}
        input={{toneOut}}
        output={{outputRef}}
      />
      <Monitor input={{outputRef}} />
    </>
  );
}}
```

### With Render Props (UI Controls)

```tsx
import {{ {component} }} from '@mode-7/mod';
import {{ useRef }} from 'react';

function App() {{
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  return (
    <{component} input={{inputRef}} output={{outputRef}}>
      {{({ {render_prop_names} }) => (
        <div>
{ui_controls}
        </div>
      )}}
    </{component}>
  );
}}
```

### Controlled Props

You can control the {component} from external state using controlled props:

```tsx
import {{ ToneGenerator, {component}, Monitor }} from '@mode-7/mod';
import {{ useState, useRef }} from 'react';

function App() {{
  const toneOut = useRef(null);
  const outputRef = useRef(null);
{state_declarations}

  return (
    <>
      <ToneGenerator output={{toneOut}} />
      <{component}
        input={{toneOut}}
        output={{outputRef}}
{controlled_props}
      />

{state_controls}

      <Monitor input={{outputRef}} />
    </>
  );
}}
```

### Imperative Refs

For programmatic access to state, you can use refs:

```tsx
import {{ ToneGenerator, {component}, {component}Handle, Monitor }} from '@mode-7/mod';
import {{ useRef, useEffect }} from 'react';

function App() {{
  const {ref}Ref = useRef<{component}Handle>(null);
  const toneOut = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {{
    // Access current state
    if ({ref}Ref.current) {{
      const state = {ref}Ref.current.getState();
{log_statements}
    }}
  }}, []);

  return (
    <>
      <ToneGenerator output={{toneOut}} />
      <{component}
        ref={{{ref}Ref}}
        input={{toneOut}}
        output={{outputRef}}
      />
      <Monitor input={{outputRef}} />
    </>
  );
}}
```

**Note:** The imperative handle provides read-only access via `getState()`. To control the component programmatically, use the controlled props pattern shown above.

## Important Notes

{important_notes}

## Related

- [ToneGenerator](/api/sources/tone-generator) - Generate audio to process
- [Monitor](/api/output/monitor) - Output the processed audio
{related_components}
"""

# Processor definitions
PROCESSORS = {
    "chorus.md": {
        "component": "Chorus",
        "label": "chorus",
        "description": "adds depth and thickness to audio by creating multiple delayed copies with slight pitch variations",
        "props": [
            ("rate", "number", "1.5", "LFO rate in Hz (controlled or initial value)", "Rate of the chorus modulation"),
            ("depth", "number", "0.002", "Modulation depth (controlled or initial value)", "Depth of the pitch modulation"),
            ("delay", "number", "0.02", "Base delay time in seconds (controlled or initial value)", "Base delay before modulation"),
            ("wet", "number", "0.5", "Wet/dry mix 0-1 (controlled or initial value)", "Mix between dry and wet signal"),
        ],
        "important_notes": """### Rate

- Controls the speed of the chorus modulation
- Typical range: 0.1 to 5 Hz
- Lower rates create subtle movement
- Higher rates create more dramatic effects

### Depth

- Controls the amount of pitch variation
- Very small values (0.001-0.005) work best
- Too much depth can sound unnatural

### Delay

- Base delay time before modulation
- Typical range: 0.01 to 0.05 seconds
- Shorter delays create tighter chorus
- Longer delays create more separated effect""",
        "related": ["- [Flanger](/api/processors/flanger) - Similar but more dramatic effect", "- [Phaser](/api/processors/phaser) - Related modulation effect"],
    },
    "phaser.md": {
        "component": "Phaser",
        "label": "phaser",
        "description": "creates sweeping notches in the frequency spectrum for classic phasing effects",
        "props": [
            ("rate", "number", "0.5", "LFO rate in Hz (controlled or initial value)", "Rate of the phaser sweep"),
            ("depth", "number", "500", "Modulation depth in Hz (controlled or initial value)", "Depth of frequency modulation"),
            ("feedback", "number", "0.5", "Feedback amount 0-1 (controlled or initial value)", "Amount of feedback"),
            ("baseFreq", "number", "800", "Base frequency in Hz (controlled or initial value)", "Center frequency for the effect"),
        ],
        "important_notes": """### Rate

- Controls the speed of the phaser sweep
- Typical range: 0.1 to 2 Hz
- Classic phaser uses 0.3-0.8 Hz

### Feedback

- Adds resonance to the effect
- Range: 0 to 1
- Higher values create more pronounced peaks
- Can become unstable above 0.9""",
        "related": ["- [Chorus](/api/processors/chorus) - Related modulation effect", "- [Flanger](/api/processors/flanger) - Similar swept effect"],
    },
    "flanger.md": {
        "component": "Flanger",
        "label": "flanger",
        "description": "creates metallic, swooshing sounds by combining the signal with a slightly delayed and modulated copy",
        "props": [
            ("rate", "number", "0.25", "LFO rate in Hz (controlled or initial value)", "Rate of the flanger sweep"),
            ("depth", "number", "0.003", "Modulation depth (controlled or initial value)", "Depth of delay modulation"),
            ("feedback", "number", "0.5", "Feedback amount 0-1 (controlled or initial value)", "Amount of feedback"),
            ("delay", "number", "0.005", "Base delay time in seconds (controlled or initial value)", "Base delay time"),
        ],
        "important_notes": """### Delay

- Very short delay times (1-10ms) create flanging
- Longer delays move toward chorus territory
- Classic flanger uses 3-7ms

### Feedback

- Creates the characteristic metallic sound
- Negative feedback can create different tonalities
- High feedback creates jet-plane sounds""",
        "related": ["- [Chorus](/api/processors/chorus) - Similar but gentler effect", "- [Phaser](/api/processors/phaser) - Related swept effect"],
    },
    "tremolo.md": {
        "component": "Tremolo",
        "label": "tremolo",
        "description": "creates rhythmic volume variations by modulating the amplitude",
        "props": [
            ("rate", "number", "5", "LFO rate in Hz (controlled or initial value)", "Rate of amplitude modulation"),
            ("depth", "number", "0.5", "Modulation depth 0-1 (controlled or initial value)", "Depth of amplitude modulation"),
        ],
        "important_notes": """### Rate

- Controls how fast the volume oscillates
- Typical range: 1 to 10 Hz
- Lower rates create subtle pulsing
- Higher rates create helicopter effects

### Depth

- Controls how much the volume changes
- Range: 0 to 1
- 0 = no effect
- 1 = full volume modulation
- Classic tremolo uses 0.3-0.7""",
        "related": ["- [LFO](/api/cv/lfo) - Can be used to modulate other parameters", "- [ADSR](/api/cv/adsr) - For envelope-based amplitude control"],
    },
    "bitcrusher.md": {
        "component": "BitCrusher",
        "label": "bitcrusher",
        "description": "reduces bit depth and sample rate to create lo-fi, digital distortion effects",
        "props": [
            ("bitDepth", "number", "8", "Bit depth for quantization (controlled or initial value)", "Number of bits for audio resolution"),
            ("sampleReduction", "number", "1", "Sample rate reduction factor (controlled or initial value)", "Factor to reduce sample rate by"),
        ],
        "important_notes": """### Bit Depth

- Controls the resolution of the audio
- Typical range: 1 to 16 bits
- Lower values create more distortion
- 1-4 bits creates heavy degradation
- 8 bits gives classic 8-bit game sound
- 16 bits is near CD quality

### Sample Reduction

- Reduces the effective sample rate
- Value of 1 = no reduction
- Higher values create more digital artifacts
- Creates aliasing and stepped waveforms""",
        "related": ["- [Distortion](/api/processors/distortion) - For analog-style distortion", "- [Filter](/api/processors/filter) - To shape the crushed sound"],
    },
    "limiter.md": {
        "component": "Limiter",
        "label": "limiter",
        "description": "prevents audio from exceeding a specified threshold, protecting against clipping",
        "props": [
            ("threshold", "number", "-1", "Threshold in dB (controlled or initial value)", "Maximum output level in dB"),
            ("release", "number", "0.05", "Release time in seconds (controlled or initial value)", "Time to return to normal gain"),
        ],
        "important_notes": """### Threshold

- Maximum output level in decibels
- Typical range: -10 to 0 dB
- Lower values create more limiting
- 0 dB prevents digital clipping
- -1 dB is a safe maximum

### Release

- How quickly the limiter recovers
- Faster release (0.01-0.05s) = more transparent
- Slower release (0.1-0.5s) = smoother but may pump
- Very fast release can cause distortion""",
        "related": ["- [Compressor](/api/processors/compressor) - For more transparent dynamic control", "- [Monitor](/api/output/monitor) - Final output stage"],
    },
    "gate.md": {
        "component": "Gate",
        "label": "gate",
        "description": "silences audio below a threshold, useful for removing noise and creating rhythmic effects",
        "props": [
            ("threshold", "number", "-40", "Threshold in dB (controlled or initial value)", "Level below which audio is muted"),
            ("attack", "number", "0.01", "Attack time in seconds (controlled or initial value)", "Time to open the gate"),
            ("release", "number", "0.1", "Release time in seconds (controlled or initial value)", "Time to close the gate"),
        ],
        "important_notes": """### Threshold

- Level at which gate opens
- In decibels (dB)
- Lower values keep more signal
- -40 dB is a good starting point
- Adjust based on noise floor

### Attack

- How quickly the gate opens
- Fast attack (0.001-0.01s) preserves transients
- Slow attack can soften sounds
- Too slow causes clicks

### Release

- How quickly the gate closes
- Fast release cuts off sound quickly
- Slow release creates smoother tail
- Balance between cutting noise and naturalness""",
        "related": ["- [Compressor](/api/processors/compressor) - For dynamic control", "- [Limiter](/api/processors/limiter) - For peak control"],
    },
    "autowah.md": {
        "component": "AutoWah",
        "label": "autowah",
        "description": "creates dynamic filter sweeps based on the input signal's amplitude, classic for funk and electronic music",
        "props": [
            ("sensitivity", "number", "1000", "Envelope sensitivity (controlled or initial value)", "How responsive to input level"),
            ("baseFreq", "number", "200", "Base frequency in Hz (controlled or initial value)", "Minimum filter frequency"),
            ("maxFreq", "number", "2000", "Maximum frequency in Hz (controlled or initial value)", "Maximum filter frequency"),
            ("Q", "number", "5", "Filter resonance (controlled or initial value)", "Resonance of the bandpass filter"),
        ],
        "important_notes": """### Sensitivity

- Controls how much the envelope affects frequency
- Higher values = more dramatic sweeps
- Lower values = subtler effect
- Adjust based on input signal level

### Frequency Range

- baseFreq to maxFreq defines the sweep range
- Wider range = more dramatic effect
- Narrow range = focused wah sound
- Typical range: 200 Hz to 2000 Hz

### Q (Resonance)

- Controls the sharpness of the filter peak
- Higher Q = more pronounced wah
- Lower Q = smoother sweep
- Very high Q can sound harsh""",
        "related": ["- [Filter](/api/processors/filter) - For manual filter control", "- [LFO](/api/cv/lfo) - For rhythmic filter sweeps"],
    },
    "ringmodulator.md": {
        "component": "RingModulator",
        "label": "ringmod",
        "description": "creates metallic, bell-like tones by multiplying the audio signal with a carrier oscillator",
        "props": [
            ("frequency", "number", "440", "Carrier frequency in Hz (controlled or initial value)", "Frequency of the modulating oscillator"),
            ("wet", "number", "0.5", "Wet/dry mix 0-1 (controlled or initial value)", "Mix between dry and modulated signal"),
        ],
        "important_notes": """### Frequency

- The carrier oscillator frequency
- Creates sidebands at input ± carrier
- Lower frequencies (50-200 Hz) create tremolo-like effects
- Mid frequencies (200-1000 Hz) create metallic tones
- High frequencies (1000+ Hz) create bell-like sounds

### Wet/Dry Mix

- Blends original and modulated signal
- 0 = no effect (dry signal only)
- 0.5 = equal mix
- 1 = fully modulated (wet signal only)
- Subtle mixes often sound better

### Musical Use

- Dissonant and inharmonic by nature
- Works well on percussive sounds
- Creates otherworldly textures
- Classic Dalek voice effect""",
        "related": ["- [Distortion](/api/processors/distortion) - For different types of distortion", "- [Filter](/api/processors/filter) - To shape the modulated sound"],
    },
}

def generate_props_rows(props):
    """Generate props table rows"""
    rows = ""
    for prop_name, prop_type, default, description, _ in props:
        rows += f"| `{prop_name}` | `{prop_type}` | `{default}` | {description} |\n"
        # Add onChange callback
        callback_type = f"({prop_name}: {prop_type}) => void"
        rows += f"| `on{prop_name[0].upper()}{prop_name[1:]}Change` | `{callback_type}` | `-` | Callback when {prop_name} changes |\n"
    return rows

def generate_render_props_rows(props):
    """Generate render props table rows"""
    rows = ""
    for prop_name, prop_type, _, _, render_desc in props:
        rows += f"| `{prop_name}` | `{prop_type}` | {render_desc} |\n"
        rows += f"| `set{prop_name[0].upper()}{prop_name[1:]}` | `(value: {prop_type}) => void` | Update the {prop_name} |\n"
    return rows

def generate_ui_controls(props):
    """Generate UI control examples"""
    controls = ""
    for prop_name, prop_type, _, _, _ in props:
        prop_display = prop_name[0].upper() + prop_name[1:]
        setter = f"set{prop_display}"

        if prop_type == "number":
            controls += f"          <div>\n"
            controls += f"            <label>{prop_display}: {{{prop_name}.toFixed(2)}}</label>\n"
            controls += f"            <input\n"
            controls += f"              type=\"range\"\n"
            controls += f"              min=\"0\"\n"
            controls += f"              max=\"1\"\n"
            controls += f"              step=\"0.01\"\n"
            controls += f"              value={{{prop_name}}}\n"
            controls += f"              onChange={{(e) => {setter}(Number(e.target.value))}}\n"
            controls += f"            />\n"
            controls += f"          </div>\n"
    return controls

def generate_state_declarations(props):
    """Generate useState declarations"""
    declarations = ""
    for prop_name, _, default, _, _ in props:
        declarations += f"  const [{prop_name}, set{prop_name[0].upper()}{prop_name[1:]}] = useState({default});\n"
    return declarations

def generate_controlled_props(props):
    """Generate controlled props for component"""
    props_str = ""
    for prop_name, _, _, _, _ in props:
        setter = f"on{prop_name[0].upper()}{prop_name[1:]}Change"
        props_str += f"        {prop_name}={{{prop_name}}}\n"
        props_str += f"        {setter}={{set{prop_name[0].upper()}{prop_name[1:]}}}\n"
    return props_str

def generate_state_controls(props):
    """Generate UI controls for state"""
    controls = ""
    for prop_name, _, _, _, _ in props:
        prop_display = prop_name[0].upper() + prop_name[1:]
        setter = f"set{prop_display}"
        controls += f"      <div>\n"
        controls += f"        <label>{prop_display}: {{{prop_name}.toFixed(2)}}</label>\n"
        controls += f"        <input\n"
        controls += f"          type=\"range\"\n"
        controls += f"          min=\"0\"\n"
        controls += f"          max=\"1\"\n"
        controls += f"          step=\"0.01\"\n"
        controls += f"          value={{{prop_name}}}\n"
        controls += f"          onChange={{(e) => {setter}(Number(e.target.value))}}\n"
        controls += f"        />\n"
        controls += f"      </div>\n\n"
    return controls

def generate_log_statements(props):
    """Generate console.log statements"""
    logs = ""
    for prop_name, _, _, _, _ in props:
        logs += f"      console.log('{prop_name}:', state.{prop_name});\n"
    return logs

def create_processor_doc(filename, config):
    """Create a processor documentation file"""
    filepath = os.path.join(DOCS_BASE, filename)

    print(f"Creating {filename}...")

    component = config["component"]
    props = config["props"]
    ref = component.lower()

    # Generate all dynamic content
    render_prop_names = ", ".join([f"{p[0]}, set{p[0][0].upper()}{p[0][1:]}" for p in props])

    content = DOC_TEMPLATE.format(
        component=component,
        label=config["label"],
        description=config["description"],
        props_rows=generate_props_rows(props),
        render_props_rows=generate_render_props_rows(props),
        render_prop_names=render_prop_names,
        ui_controls=generate_ui_controls(props),
        state_declarations=generate_state_declarations(props),
        controlled_props=generate_controlled_props(props),
        state_controls=generate_state_controls(props),
        ref=ref,
        log_statements=generate_log_statements(props),
        important_notes=config["important_notes"],
        related_components="\n".join(config.get("related", [])),
    )

    with open(filepath, 'w') as f:
        f.write(content)

    print(f"  ✓ Created {filename}")

def main():
    for filename, config in PROCESSORS.items():
        try:
            create_processor_doc(filename, config)
        except Exception as e:
            print(f"  ✗ Error creating {filename}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()
    print("\nAll new processor documentation files have been created!")
