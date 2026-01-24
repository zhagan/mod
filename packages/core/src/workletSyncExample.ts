import { WorkletTransport } from './transportWorklet';
import { Scheduler } from './scheduler';
import { PhaseSequencer } from './sequencer';

export async function runWorkletSyncExample(context: AudioContext): Promise<() => void> {
  const transport = await WorkletTransport.create(context, { bpm: 124, startBeat: 0 });
  const scheduler = new Scheduler(transport, { lookaheadMs: 100, intervalMs: 25 });
  scheduler.start(false);

  const tickStop = transport.onTick((tick) => scheduler.advance(tick.time));

  const gateA = context.createGain();
  gateA.gain.value = 0;
  gateA.connect(context.destination);

  const gateB = context.createGain();
  gateB.gain.value = 0;
  gateB.connect(context.destination);

  const seqA = new PhaseSequencer({
    stepsPerCycle: 16,
    stepLengthBeats: 0.25,
    onStep: (event) => {
      gateA.gain.setValueAtTime(1, event.time);
      gateA.gain.setValueAtTime(0, event.time + 0.02);
    },
  });

  const seqB = new PhaseSequencer({
    stepsPerCycle: 12,
    stepLengthBeats: 0.5,
    onStep: (event) => {
      gateB.gain.setValueAtTime(1, event.time);
      gateB.gain.setValueAtTime(0, event.time + 0.03);
    },
  });

  scheduler.add(seqA);
  scheduler.add(seqB);

  transport.start(context.currentTime + 0.05);

  return () => {
    tickStop();
    scheduler.stop();
    transport.stop();
    transport.dispose();
  };
}
