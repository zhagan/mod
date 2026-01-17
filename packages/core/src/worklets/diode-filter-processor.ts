class DiodeFilterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0.1, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
      { name: 'drive', defaultValue: 0.0, minValue: 0, maxValue: 10, automationRate: 'a-rate' },
    ];
  }

  constructor() {
    super();
    // State for up to 2 channels (expandable)
    this._stages = [[], []]; // per-channel [s1, s2, s3, s4]
    this._prevOut = [0, 0];
    this.sampleRate = sampleRate;
  }

  process(inputs, outputs, parameters) {
    const inputChannels = inputs[0] || [];
    const outputChannels = outputs[0] || [];

    const numChannels = Math.max(inputChannels.length, outputChannels.length, 1);

    for (let ch = 0; ch < numChannels; ch++) {
      const input = inputChannels[ch] || new Float32Array(128);
      const output = outputChannels[ch] || new Float32Array(128);

      if (!this._stages[ch] || this._stages[ch].length !== 4) {
        this._stages[ch] = [0, 0, 0, 0];
        this._prevOut[ch] = 0;
      }

      const s = this._stages[ch];

      const cutoffParam = parameters.cutoff;
      const resParam = parameters.resonance;
      const driveParam = parameters.drive;

      for (let i = 0; i < output.length; i++) {
        const inSample = input[i] || 0;

        const cutoff = cutoffParam.length > 1 ? cutoffParam[i] : cutoffParam[0];
        const resonance = resParam.length > 1 ? resParam[i] : resParam[0];
        const drive = driveParam.length > 1 ? driveParam[i] : driveParam[0];

        // clamp cutoff
        const fc = Math.max(20, Math.min(this.sampleRate * 0.5 - 1, cutoff));

        // simple one-pole coeff (per-sample)
        const g = Math.exp(-2 * Math.PI * fc / this.sampleRate);
        const b = 1 - g;

        // Input with drive and feedback (resonance) taken from previous output
        const feedback = resonance * this._prevOut[ch];
        // soft clip input using tanh for diode-like nonlinearity
        const u = Math.tanh((inSample - feedback) * (1 + drive));

        // four cascaded one-pole filters
        s[0] = b * u + g * s[0];
        s[1] = b * s[0] + g * s[1];
        s[2] = b * s[1] + g * s[2];
        s[3] = b * s[2] + g * s[3];

        // output is last stage
        const out = s[3];
        // store for feedback next sample
        this._prevOut[ch] = out;

        output[i] = out;
      }
    }

    return true;
  }
}

registerProcessor('diode-filter-processor', DiodeFilterProcessor);
