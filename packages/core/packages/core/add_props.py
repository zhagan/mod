#!/usr/bin/env python3
"""
Script to add missing controlled props to processor documentation props tables
"""

import re
import os

DOCS_BASE = "/Users/joe/Projects/Mod/mod/docs/api/processors"

# Processor definitions with their props and defaults
PROCESSOR_PROPS = {
    "reverb.md": [
        ("wet", "number", "0.3", "Wet/dry mix 0-1 (controlled or initial value)"),
        ("onWetChange", "(wet: number) => void", "-", "Callback when wet/dry mix changes"),
        ("duration", "number", "2.0", "Reverb duration in seconds (controlled or initial value)"),
        ("onDurationChange", "(duration: number) => void", "-", "Callback when duration changes"),
        ("decay", "number", "2.0", "Decay rate (controlled or initial value)"),
        ("onDecayChange", "(decay: number) => void", "-", "Callback when decay changes"),
    ],
    "filter.md": [
        ("frequency", "number", "1000", "Filter frequency in Hz (controlled or initial value)"),
        ("onFrequencyChange", "(frequency: number) => void", "-", "Callback when frequency changes"),
        ("Q", "number", "1", "Filter Q/resonance (controlled or initial value)"),
        ("onQChange", "(Q: number) => void", "-", "Callback when Q changes"),
        ("type", "BiquadFilterType", "'lowpass'", "Filter type (controlled or initial value)"),
        ("onTypeChange", "(type: BiquadFilterType) => void", "-", "Callback when type changes"),
        ("gain", "number", "0", "Filter gain in dB (controlled or initial value)"),
        ("onGainChange", "(gain: number) => void", "-", "Callback when gain changes"),
        ("cv", "ModStreamRef", "-", "Optional CV input for frequency modulation"),
        ("cvAmount", "number", "1000", "Amount of CV modulation to apply"),
    ],
    "compressor.md": [
        ("threshold", "number", "-24", "Threshold in dB (controlled or initial value)"),
        ("onThresholdChange", "(threshold: number) => void", "-", "Callback when threshold changes"),
        ("knee", "number", "30", "Knee width (controlled or initial value)"),
        ("onKneeChange", "(knee: number) => void", "-", "Callback when knee changes"),
        ("ratio", "number", "12", "Compression ratio (controlled or initial value)"),
        ("onRatioChange", "(ratio: number) => void", "-", "Callback when ratio changes"),
        ("attack", "number", "0.003", "Attack time in seconds (controlled or initial value)"),
        ("onAttackChange", "(attack: number) => void", "-", "Callback when attack changes"),
        ("release", "number", "0.25", "Release time in seconds (controlled or initial value)"),
        ("onReleaseChange", "(release: number) => void", "-", "Callback when release changes"),
    ],
    "distortion.md": [
        ("amount", "number", "50", "Distortion amount (controlled or initial value)"),
        ("onAmountChange", "(amount: number) => void", "-", "Callback when amount changes"),
    ],
    "panner.md": [
        ("pan", "number", "0", "Pan position -1 (left) to 1 (right) (controlled or initial value)"),
        ("onPanChange", "(pan: number) => void", "-", "Callback when pan changes"),
        ("cv", "ModStreamRef", "-", "Optional CV input for pan modulation"),
        ("cvAmount", "number", "0.5", "Amount of CV modulation to apply"),
    ],
    "eq.md": [
        ("lowGain", "number", "0", "Low shelf gain in dB (controlled or initial value)"),
        ("onLowGainChange", "(value: number) => void", "-", "Callback when low gain changes"),
        ("midGain", "number", "0", "Mid peak gain in dB (controlled or initial value)"),
        ("onMidGainChange", "(value: number) => void", "-", "Callback when mid gain changes"),
        ("highGain", "number", "0", "High shelf gain in dB (controlled or initial value)"),
        ("onHighGainChange", "(value: number) => void", "-", "Callback when high gain changes"),
        ("lowFreq", "number", "250", "Low shelf frequency in Hz (controlled or initial value)"),
        ("onLowFreqChange", "(value: number) => void", "-", "Callback when low frequency changes"),
        ("highFreq", "number", "4000", "High shelf frequency in Hz (controlled or initial value)"),
        ("onHighFreqChange", "(value: number) => void", "-", "Callback when high frequency changes"),
    ],
}

def add_props_to_file(filename, props_list):
    """Add missing props to a processor documentation file"""
    filepath = os.path.join(DOCS_BASE, filename)

    print(f"Adding props to {filename}...")

    with open(filepath, 'r') as f:
        content = f.read()

    # Find the props table and add new rows before the children row
    # Look for the line with "| `children`" and insert before it
    children_pattern = r'(\| `children` \|[^\n]+\n)'

    # Build the new props rows
    new_props = ""
    for prop_name, prop_type, default, description in props_list:
        new_props += f"| `{prop_name}` | `{prop_type}` | `{default}` | {description} |\n"

    # Replace
    content = re.sub(children_pattern, new_props + r'\1', content)

    with open(filepath, 'w') as f:
        f.write(content)

    print(f"  ✓ Added {len(props_list)} props to {filename}")

def main():
    for filename, props_list in PROCESSOR_PROPS.items():
        try:
            add_props_to_file(filename, props_list)
        except Exception as e:
            print(f"  ✗ Error processing {filename}: {e}")

if __name__ == "__main__":
    main()
    print("\nAll processor props tables have been updated!")
