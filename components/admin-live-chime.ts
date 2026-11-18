export function playOrderChime(audio: AudioContext) {
  const start = audio.currentTime;
  for (const [frequency, delay] of [[783.99, 0], [1174.66, 0.10]]) {
    const note = audio.createOscillator();
    const volume = audio.createGain();
    const at = start + delay;
    note.frequency.value = frequency;
    volume.gain.setValueAtTime(0.001, at);
    volume.gain.exponentialRampToValueAtTime(0.09, at + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.001, at + 0.23);
    note.connect(volume).connect(audio.destination);
    note.start(at);
    note.stop(at + 0.24);
    note.onended = () => { note.disconnect(); volume.disconnect(); };
  }
}
