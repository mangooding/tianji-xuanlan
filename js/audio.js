/**
 * 天机玄览 - 音效系统
 * 纯 Web Audio API 合成，无需外部音频文件
 */

const AudioFX = (function() {
  let ctx = null;

  function init() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  // 铃铛声：高频衰减正弦波
  function bell(intensity = 1) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 1.5);
    
    gain.gain.setValueAtTime(0.3 * intensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.5);
  }

  // 铜钱落地声：噪声 + 低频敲击
  function coinDrop() {
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // 金属敲击
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
    
    // 短促噪声模拟金属震颤
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.1, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    noise.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);
  }

  // 道磬声：清亮的仪式结束音
  function chime() {
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // 基频
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, t); // C5
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.4, t + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 3);
    
    // 泛音
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1056, t);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.15, t + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 2.5);
  }

  // 低沉鼓点/心跳，营造紧张感
  function heartbeat() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  return { init, bell, coinDrop, chime, heartbeat };
})();
