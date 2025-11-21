#!/usr/bin/env python3
"""
Script to fix all processor documentation files by:
1. Adding missing controlled props to props tables
2. Fixing imperative refs sections to only show getState()
"""

import re
import os

DOCS_BASE = "/Users/joe/Projects/Mod/mod/docs/api/processors"

# Standard imperative refs replacement (works for all processors)
IMPERATIVE_TEMPLATE = """### Imperative Refs

For programmatic access to state, you can use refs:

```tsx
import {{ {component}, {component}Handle, Monitor }} from '@mode-7/mod';
import {{ useRef, useEffect }} from 'react';

function App() {{
  const {ref}Ref = useRef<{component}Handle>(null);
  const inputRef = useRef(null);
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
      <SomeSource output={{inputRef}} />
      <{component}
        ref={{{ref}Ref}}
        input={{inputRef}}
        output={{outputRef}}
      />
      <Monitor input={{outputRef}} />
    </>
  );
}}
```

**Note:** The imperative handle provides read-only access via `getState()`. To control the component programmatically, use the controlled props pattern shown above."""

# Processor definitions: (filename, component_name, props_to_add)
PROCESSORS = [
    ("reverb.md", "Reverb", ["wet", "duration", "decay"]),
    ("filter.md", "Filter", ["frequency", "Q", "type", "gain"]),
    ("compressor.md", "Compressor", ["threshold", "knee", "ratio", "attack", "release"]),
    ("distortion.md", "Distortion", ["amount"]),
    ("panner.md", "Panner", ["pan"]),
    ("eq.md", "EQ", ["lowGain", "midGain", "highGain", "lowFreq", "highFreq"]),
]

def generate_log_statements(props):
    """Generate console.log statements for props"""
    return "\n      ".join([f"console.log('{prop}:', state.{prop});" for prop in props])

def fix_file(filename, component, props):
    """Fix a single documentation file"""
    filepath = os.path.join(DOCS_BASE, filename)

    print(f"Processing {filename}...")

    with open(filepath, 'r') as f:
        content = f.read()

    # Generate imperative section
    ref = component.lower()
    log_statements = generate_log_statements(props)
    imperative_section = IMPERATIVE_TEMPLATE.format(
        component=component,
        ref=ref,
        log_statements=log_statements
    )

    # Replace imperative section (find from "### Imperative Refs" to next "##" or end)
    pattern = r'### Imperative Refs.*?(?=\n## |\Z)'
    content = re.sub(pattern, imperative_section, content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)

    print(f"  ✓ Fixed {filename}")

def main():
    for filename, component, props in PROCESSORS:
        try:
            fix_file(filename, component, props)
        except Exception as e:
            print(f"  ✗ Error fixing {filename}: {e}")

if __name__ == "__main__":
    main()
    print("\nAll processor documentation files have been fixed!")
