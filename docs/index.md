---
layout: home

hero:
  name: MOD
  text: Modular Web Audio
  tagline: Build powerful audio applications with composable React components
  image:
    src: /logo.png
    alt: MOD logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/Mode7Labs/mod
    - theme: alt
      text: Try Playground
      link: /playground/

features:
  - icon: 🎛️
    title: Modular Design
    details: Composable audio components that can be connected in any configuration, just like a hardware modular synthesizer.

  - icon: ⚡
    title: Type-Safe
    details: Full TypeScript support with comprehensive type definitions for a great developer experience.

  - icon: 🎨
    title: Headless Components
    details: Render props pattern gives you complete control over the UI while we handle the audio.

  - icon: 🔌
    title: Extensive Library
    details: Sources, processors, CV generators, mixers, and more - everything you need to build complex audio apps.

  - icon: 📊
    title: Real-time Control
    details: React-driven parameter control with smooth automation and real-time updates.

  - icon: 🎵
    title: Professional Audio
    details: Built on the Web Audio API for high-quality, low-latency audio processing.
---

## Quick Example

```tsx
import { AudioProvider, ToneGenerator, Filter, Monitor } from "@mode-7/mod";
import { useRef } from "react";

function SimpleSynth() {
  const toneOut = useRef(null);
  const filterOut = useRef(null);

  return (
    <AudioProvider>
      <ToneGenerator output={toneOut}>
        {({ frequency, setFrequency }) => (
          <input
            type="range"
            min="20"
            max="2000"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
          />
        )}
      </ToneGenerator>

      <Filter input={toneOut} output={filterOut}>
        {({ frequency, setFrequency }) => (
          <input
            type="range"
            min="20"
            max="20000"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
          />
        )}
      </Filter>

      <Monitor input={filterOut} />
    </AudioProvider>
  );
}
```

## Installation

```bash
npm install @mode-7/mod
```

## Why MOD?

**MOD** brings the power and flexibility of modular synthesis to web development. Instead of wrestling with the Web Audio API's low-level nodes, you can compose audio processing chains using familiar React patterns.

- ✅ **Declarative** - Describe what you want, not how to build it
- ✅ **Composable** - Mix and match modules like Lego blocks
- ✅ **Reusable** - Create custom modules and share them
- ✅ **Testable** - Components are easy to test in isolation

## Build with AI Assistants

MOD is designed to work seamlessly with AI coding assistants like Claude, ChatGPT, and Copilot. Our comprehensive documentation makes it easy for LLMs to generate working audio applications.

**Get started with an AI assistant:**

::: code-group
```bash [Claude Code]
# In Claude Code, reference the LLM guide:
@https://mode7labs.github.io/mod/llm-guide

# Then ask to build anything:
"Build me a synthesizer with an LFO-modulated filter"
"Create a drum machine with a step sequencer"
"Make an effects processor with reverb and delay"
```

```bash [Claude Desktop]
# In Claude Desktop, start with:
Read https://mode7labs.github.io/mod/llm-guide

# Then describe what you want:
"Build a simple synth with envelope control"
"Create a mixer with multiple channels"
```

```bash [Chat]
# In any AI chat:
Based on the mod documentation at mode7labs.github.io/mod,
create an audio visualizer with oscilloscope and spectrum analyzer
```
:::

Our [LLM Guide](/llm-guide) includes:
- Complete component reference with props
- 10+ common patterns with working code
- Signal flow examples
- Troubleshooting tips
- Full synthesizer example

## Ready to dive in?

<div class="vp-doc" style="margin-top: 2rem;">
  <a href="/guide/getting-started" class="vp-button brand" style="margin-right: 1rem;">Get Started</a>
  <a href="/llm-guide" class="vp-button brand" style="margin-right: 1rem;">LLM Guide</a>
  <a href="/api/overview" class="vp-button alt">API Reference</a>
</div>
