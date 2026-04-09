/**
 * 天机玄览 - 主应用逻辑
 */

(function() {
  // DOM 元素
  const screens = {
    start: document.getElementById('start-screen'),
    loading: document.getElementById('loading-screen'),
    divination: document.getElementById('divination-screen'),
    result: document.getElementById('result-screen')
  };

  const ui = {
    startBtn: document.getElementById('start-btn'),
    retryBtn: document.getElementById('retry-btn'),
    hintText: document.getElementById('hint-text'),
    hintSub: document.getElementById('hint-sub'),
    statusIcon: document.getElementById('status-icon'),
    shakeFill: document.getElementById('shake-fill'),
    shakeLabel: document.getElementById('shake-label'),
    resultSymbol: document.getElementById('result-symbol'),
    resultTitle: document.getElementById('result-title'),
    resultName: document.getElementById('result-name'),
    resultLuck: document.getElementById('result-luck'),
    resultVerse: document.getElementById('result-verse'),
    resultMeaning: document.getElementById('result-meaning')
  };

  let tracker = null;
  let isCasting = false;

  function switchScreen(name) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[name].classList.remove('hidden');
  }

  async function startApp() {
    ui.startBtn.disabled = true;
    switchScreen('loading');
    
    try {
      await Divination.loadData();
      tracker = new HandTracker({
        onShake: onShakeDetected,
        onHandDetected: onHandDetected,
        onNoHand: onNoHand,
        onEnergyChange: onEnergyChange
      });
      await tracker.init();
      switchScreen('divination');
    } catch (err) {
      console.error(err);
      alert('摄像头启动失败，请确保已允许摄像头权限');
      switchScreen('start');
      ui.startBtn.disabled = false;
    }
  }

  function onHandDetected() {
    if (isCasting) return;
    ui.hintText.textContent = '摇晃手掌';
    ui.hintSub.textContent = '像摇签筒一样快速摆动手掌';
    ui.statusIcon.textContent = '🫳';
  }

  function onNoHand() {
    if (isCasting) return;
    ui.hintText.textContent = '请举手';
    ui.hintSub.textContent = '将手掌置于摄像头前';
    ui.statusIcon.textContent = '🙏';
    ui.shakeFill.style.width = '0%';
  }

  function onEnergyChange(energy, hasHand) {
    if (isCasting) return;
    if (hasHand) {
      ui.shakeFill.style.width = energy + '%';
      if (energy > 30) {
        ui.hintText.textContent = '感应天机中...';
        ui.statusIcon.textContent = energy > 60 ? '✨' : '🫳';
      }
    }
  }

  function onShakeDetected() {
    if (isCasting) return;
    isCasting = true;
    
    ui.hintText.textContent = '天机已现';
    ui.hintSub.textContent = '正在解卦...';
    ui.statusIcon.textContent = '🔮';
    ui.shakeFill.style.width = '100%';
    
    // 延迟片刻增加仪式感
    setTimeout(() => {
      const result = Divination.cast();
      showResult(result);
    }, 1200);
  }

  function showResult(result) {
    if (!result) return;
    
    ui.resultSymbol.textContent = result.symbol;
    ui.resultTitle.textContent = result.title;
    ui.resultName.textContent = `${result.name}卦 · ${result.pinyin}`;
    ui.resultLuck.textContent = result.luck.label;
    ui.resultLuck.className = 'luck-badge ' + result.luck.class;
    ui.resultVerse.textContent = result.verse;
    ui.resultMeaning.textContent = result.meaning + '\n\n' + result.image;
    
    switchScreen('result');
  }

  function resetDivination() {
    isCasting = false;
    ui.shakeFill.style.width = '0%';
    if (tracker) {
      tracker.shakeEnergy = 0;
      tracker.positions = [];
    }
    switchScreen('divination');
  }

  // 事件绑定
  ui.startBtn.addEventListener('click', startApp);
  ui.retryBtn.addEventListener('click', resetDivination);

  // 键盘辅助
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      if (!screens.start.classList.contains('hidden')) {
        startApp();
      } else if (!screens.result.classList.contains('hidden')) {
        resetDivination();
      }
    }
  });
})();
