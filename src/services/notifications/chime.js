// Web Audio API synthesized dual-tone restaurant alert
export function playKitchenChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Tone 1: High crisp ding (587.33 Hz - D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.28, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.8)

    // Tone 2: Warm resonant dong (440.00 Hz - A4)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(440.0, now + 0.16)
    gain2.gain.setValueAtTime(0.001, now)
    gain2.gain.setValueAtTime(0.32, now + 0.16)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.16)
    osc2.stop(now + 1.2)
  } catch (e) {
    console.debug('Audio notification not permitted:', e)
  }
}
