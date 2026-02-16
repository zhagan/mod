import React from 'react';
import { MODULE_DEFINITIONS } from '../moduleDefinitions';

interface SidebarProps {
  isSidebarOpen: boolean;
  isMobileView: boolean;
  handleSaveSketch: () => void;
  handleSketchFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  startSidebarDrag: (type: string) => (event: React.PointerEvent<HTMLButtonElement>) => void;
  startSidebarTouchDrag: (type: string) => (event: React.TouchEvent<HTMLButtonElement>) => void;
  handleAddModule: (type: string) => void;
  isSaveDisabled: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  isMobileView,
  handleSaveSketch,
  handleSketchFileChange,
  startSidebarDrag,
  startSidebarTouchDrag,
  handleAddModule,
  isSaveDisabled,
}) => {
  const renderModuleButton = (type: string) => (
    <button
      key={type}
      onClick={() => {
        if (!isMobileView) {
          handleAddModule(type);
        }
      }}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('moduleType', type)}
      onPointerDown={startSidebarDrag(type)}
      onTouchStart={startSidebarTouchDrag(type)}
      style={{
        borderLeft: `4px solid ${MODULE_DEFINITIONS[type].color}`,
        cursor: 'grab',
      }}
    >
      {MODULE_DEFINITIONS[type].label}
    </button>
  );

  return (
    <div className={`sidebar${isSidebarOpen ? ' open' : ''}`}>
      <a href="/mod/" className="sidebar-header">
        <h1 className="sidebar-title">MOD</h1>
      </a>

      <div className="module-category sketch-controls">
        <h3>Sketches</h3>
        <button onClick={handleSaveSketch} disabled={isSaveDisabled}>
          Save Sketch
        </button>
        <label className="file-button">
          Load Sketch
          <input type="file" accept="application/json" onChange={handleSketchFileChange} />
        </label>
      </div>

      <div className="module-category">
        <h3>Sub-Sketch</h3>
        {renderModuleButton('SubSketch')}
      </div>

      <div className="module-category">
        <h3>Sources</h3>
        {renderModuleButton('ToneGenerator')}
        {renderModuleButton('NoiseGenerator')}
        {renderModuleButton('Microphone')}
        {renderModuleButton('MP3Deck')}
        {renderModuleButton('Fluidsynth')}
        {renderModuleButton('MidiPlayer')}
        {renderModuleButton('StreamingAudioDeck')}
      </div>

      <div className="module-category">
        <h3>CV</h3>
        {renderModuleButton('LFO')}
        {renderModuleButton('ADSR')}
        {renderModuleButton('Sequencer')}
        {renderModuleButton('Clock')}
      </div>

      <div className="module-category">
        <h3>Processors</h3>
        {renderModuleButton('Filter')}
        {renderModuleButton('Delay')}
        {renderModuleButton('Reverb')}
        {renderModuleButton('Compressor')}
        {renderModuleButton('Distortion')}
        {renderModuleButton('DiodeFilter')}
        {renderModuleButton('Panner')}
        {renderModuleButton('EQ')}
        {renderModuleButton('Chorus')}
        {renderModuleButton('Phaser')}
        {renderModuleButton('Flanger')}
        {renderModuleButton('Tremolo')}
        {renderModuleButton('BitCrusher')}
        {renderModuleButton('Limiter')}
        {renderModuleButton('Gate')}
        {renderModuleButton('AutoWah')}
        {renderModuleButton('RingModulator')}
        {renderModuleButton('VCA')}
      </div>

      <div className="module-category">
        <h3>Mixers</h3>
        {renderModuleButton('CrossFade')}
        {renderModuleButton('Mixer')}
      </div>

      <div className="module-category">
        <h3>Output</h3>
        {renderModuleButton('Monitor')}
      </div>

      <div className="module-category">
        <h3>Visualizations</h3>
        {renderModuleButton('Oscilloscope')}
        {renderModuleButton('SpectrumAnalyzer')}
        {renderModuleButton('LevelMeter')}
      </div>
    </div>
  );
};
