/**
 * 天机玄览 - 主应用逻辑 v2
 * 铜钱动爻占卜 + 音效 + 历史记录 + 卦象图书馆
 */

(function() {
  const screens = {
    start: document.getElementById('start-screen'),
    loading: document.getElementById('loading-screen'),
    divination: document.getElementById('divination-screen'),
    result: document.getElementById('result-screen'),
    history: document.getElementById('history-screen'),
    library: document.getElementById('library-screen')
  };

  const ui = {
    startBtn: document.getElementById('start-btn'),
    retryBtn: document.getElementById('retry-btn'),
    saveBtn: document.getElementById('save-btn'),
    hintText: document.getElementById('hint-text'),
    hintSub: document.getElementById('hint-sub'),
    statusIcon: document.getElementById('status-icon'),
    shakeFill: document.getElementById('shake-fill'),
    shakeLabel: document.getElementById('shake-label'),
    coinStage: document.getElementById('coin-stage'),
    yaoResult: document.getElementById('yao-result'),
    resultSymbol: document.getElementById('result-symbol'),
    resultTitle: document.getElementById('result-title'),
    resultName: document.getElementById('result-name'),
    resultLuck: document.getElementById('result-luck'),
    resultVerse: document.getElementById('result-verse'),
    resultMeaning: document.getElementById('result-meaning'),
    changingLines: document.getElementById('changing-lines'),
    changedHex: document.getElementById('changed-hex'),
    changedSymbol: document.getElementById('changed-symbol'),
    changedTitle: document.getElementById('changed-title'),
    changedName: document.getElementById('changed-name'),
    changedMeaning: document.getElementById('changed-meaning'),
    historyList: document.getElementById('history-list'),
    hexagramGrid: document.getElementById('hexagram-grid'),
    detailModal: document.getElementById('detail-modal'),
    detailSymbol: document.getElementById('detail-symbol'),
    detailTitle: document.getElementById('detail-title'),
    detailName: document.getElementById('detail-name'),
    detailVerse: document.getElementById('detail-verse'),
    detailMeaning: document.getElementById('detail-meaning')
  };

  let tracker = null;
  let isCasting = false;
  let currentResult = null;
  const HISTORY_KEY = 'tjx_history';

  function switchScreen(name) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    if (screens[name]) screens[name].classList.remove('hidden');
  }

  async function startApp() {
    ui.startBtn.disabled = true;
    AudioFX.init();
    switchScreen('loading');
    try {
      await Divination.loadData();
      buildLibrary();
      renderHistory();
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
    if (ui.hintText.textContent !== '摇晃手掌') {
      ui.hintText.textContent = '摇晃手掌';
      ui.hintSub.textContent = '像摇签筒一样快速摆动手掌';
      ui.statusIcon.textContent = '🫳';
    }
  }

  function onNoHand() {
    if (isCasting) return;
    ui.hintText.textContent = '请举手';
    ui.hintSub.textContent = '将手掌置于摄像头前';
    ui.statusIcon.textContent = '🙏';
    ui.shakeFill.style.width = '0%';
  }

  function onEnergyChange(energy, hasHand) {
    if (isCasting || !hasHand) return;
    ui.shakeFill.style.width = energy + '%';
    if (energy > 30 && energy <= 60) {
      ui.hintText.textContent = '感应天机中...';
      ui.statusIcon.textContent = '✨';
    } else if (energy > 60) {
      ui.hintText.textContent = '天机将现...';
      ui.statusIcon.textContent = '🔮';
    }
  }

  function onShakeDetected() {
    if (isCasting) return;
    isCasting = true;
    AudioFX.bell(1.2);
    startCoinRitual();
  }

  // ===== 铜钱仪式动画 =====
  async function startCoinRitual() {
    ui.hintText.textContent = '起卦中...';
    ui.hintSub.textContent = '六爻落定，万象化生';
    ui.statusIcon.textContent = '☯️';
    ui.shakeFill.style.width = '100%';
    
    // 显示铜钱舞台
    ui.coinStage.classList.remove('hidden');
    for (let i = 0; i < 6; i++) {
      const coin = document.getElementById(`coin-${i}`);
      coin.classList.add('hidden');
      coin.classList.remove('tossing', 'result-front', 'result-back');
    }
    ui.yaoResult.innerHTML = '';

    const yao = Divination.castYao();
    
    // 依次投掷6枚铜钱（从初爻到上爻，但显示从左到右）
    for (let displayIdx = 0; displayIdx < 6; displayIdx++) {
      const yaoIdx = 5 - displayIdx; // 左=上爻，右=初爻 → 传统排布
      const result = yao[yaoIdx];
      const coin = document.getElementById(`coin-${displayIdx}`);
      
      await new Promise(r => setTimeout(r, 400));
      AudioFX.coinDrop();
      coin.classList.remove('hidden');
      coin.classList.add('tossing');
      
      await new Promise(r => setTimeout(r, 800));
      coin.classList.remove('tossing');
      
      // 决定正反面：3正=老阴(阴面，带圈？)，或者直接"正"字为正面(阳)
      // 设计：正面=阳(乾)，背面=阴(元)
      const isFront = result.value === 1; // 阳=正面，阴=背面
      coin.classList.add(isFront ? 'result-front' : 'result-back');
      
      // 添加爻结果标签
      const tag = document.createElement('span');
      tag.className = 'yao-tag ' + (result.value === 1 ? 'yang' : 'yin') + (result.changing ? ' changing' : '');
      tag.textContent = result.name;
      ui.yaoResult.appendChild(tag);
      
      if (result.changing) {
        coin.querySelector('.coin-face').style.boxShadow = '0 0 15px var(--gold)';
      }
    }
    
    await new Promise(r => setTimeout(r, 600));
    AudioFX.chime();
    
    // 生成完整结果
    const hex = Divination.getByLines(yao.map(y=>y.value).join(''));
    const changedKey = yao.map(y=> y.changing ? (y.value===1?0:1) : y.value).join('');
    const changed = Divination.getByLines(changedKey);
    const changingLines = yao.map((y, idx)=> y.changing ? (idx+1) : null).filter(Boolean);
    const luck = hex ? (()=>{
      const text = hex.meaning || '';
      const great = ['大吉','元吉','上上','亨通','昌隆'];
      const good = ['吉','利','无咎','可成','光明'];
      const bad = ['凶','不利','小人','衰败','困穷','终乱'];
      const caution = ['艰贞','惕','防','谨','慎'];
      for(const k of great) if(text.includes(k)) return {level:'great',label:'大吉',class:'luck-great'};
      for(const k of bad) if(text.includes(k)) return {level:'bad',label:'需谨慎',class:'luck-bad'};
      for(const k of caution) if(text.includes(k)) return {level:'mixed',label:'中平',class:'luck-mixed'};
      for(const k of good) if(text.includes(k)) return {level:'good',label:'吉',class:'luck-good'};
      return {level:'mixed',label:'中平',class:'luck-mixed'};
    })() : {level:'mixed',label:'中平',class:'luck-mixed'};

    currentResult = {
      hexagram: hex,
      changed,
      yao,
      changingLines,
      luck,
      time: new Date().toISOString()
    };
    
    // 自动保存
    saveHistory(currentResult);
    
    showResult(currentResult);
  }

  function showResult(result) {
    if (!result || !result.hexagram) return;
    
    const h = result.hexagram;
    ui.resultSymbol.textContent = h.symbol;
    ui.resultTitle.textContent = h.title;
    ui.resultName.textContent = `${h.name}卦 · ${h.pinyin}`;
    ui.resultLuck.textContent = result.luck.label;
    ui.resultLuck.className = 'luck-badge ' + result.luck.class;
    ui.resultVerse.textContent = h.verse;
    ui.resultMeaning.textContent = h.meaning + '\n\n' + h.image;
    
    if (result.changingLines.length > 0) {
      const lineText = result.changingLines.map(n => `第${n}爻动`).join('，');
      ui.changingLines.innerHTML = `✦ ${lineText} ✦`;
      ui.changingLines.style.display = 'block';
      
      if (result.changed) {
        ui.changedSymbol.textContent = result.changed.symbol;
        ui.changedTitle.textContent = result.changed.title;
        ui.changedName.textContent = `${result.changed.name}卦 · ${result.changed.pinyin}`;
        ui.changedMeaning.textContent = result.changed.meaning + '\n\n' + result.changed.image;
        ui.changedHex.classList.remove('hidden');
      } else {
        ui.changedHex.classList.add('hidden');
      }
    } else {
      ui.changingLines.style.display = 'none';
      ui.changedHex.classList.add('hidden');
    }
    
    ui.saveBtn.textContent = '已 保 存';
    ui.saveBtn.disabled = true;
    
    switchScreen('result');
  }

  function resetDivination() {
    isCasting = false;
    currentResult = null;
    ui.shakeFill.style.width = '0%';
    ui.coinStage.classList.add('hidden');
    ui.yaoResult.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const coin = document.getElementById(`coin-${i}`);
      coin.classList.add('hidden');
      coin.classList.remove('tossing', 'result-front', 'result-back');
      coin.querySelector('.coin-face').style.boxShadow = '';
    }
    if (tracker) {
      tracker.shakeEnergy = 0;
      tracker.positions = [];
    }
    ui.saveBtn.textContent = '保 存 结 果';
    ui.saveBtn.disabled = false;
    switchScreen('divination');
  }

  // ===== 历史记录 =====
  function saveHistory(item) {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    list.unshift(item);
    if (list.length > 50) list.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    renderHistory();
  }

  function renderHistory() {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (list.length === 0) {
      ui.historyList.innerHTML = '<div class="empty-state">暂无记录，快去占卜吧</div>';
      return;
    }
    ui.historyList.innerHTML = list.map((item, idx) => {
      const h = item.hexagram;
      const date = new Date(item.time).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
      const changeText = item.changingLines.length > 0 ? ` · ${item.changingLines.length}爻动` : '';
      return `<div class="history-item" data-idx="${idx}">
        <div class="sym">${h.symbol}</div>
        <div class="info">
          <div class="title">${h.title}${changeText}</div>
          <div class="meta">${date}</div>
        </div>
        <span class="luck-mini ${item.luck.class}">${item.luck.label}</span>
      </div>`;
    }).join('');
    
    ui.historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        if (list[idx]) {
          currentResult = list[idx];
          showResult(currentResult);
        }
      });
    });
  }

  // ===== 卦象图书馆 =====
  function buildLibrary() {
    const hexes = Divination.hexagrams();
    ui.hexagramGrid.innerHTML = hexes.map(h => `
      <div class="hex-tile" data-id="${h.id}">
        <div class="tile-symbol">${h.symbol}</div>
        <div class="tile-name">${h.name}</div>
      </div>
    `).join('');
    
    ui.hexagramGrid.querySelectorAll('.hex-tile').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        const h = hexes.find(x => x.id === id);
        if (h) showDetail(h);
      });
    });
  }

  function showDetail(hexagram) {
    ui.detailSymbol.textContent = hexagram.symbol;
    ui.detailTitle.textContent = hexagram.title;
    ui.detailName.textContent = `${hexagram.name}卦 · ${hexagram.pinyin}`;
    ui.detailVerse.textContent = hexagram.verse;
    ui.detailMeaning.textContent = hexagram.meaning + '\n\n' + hexagram.image;
    ui.detailModal.classList.remove('hidden');
  }

  function hideDetail() {
    ui.detailModal.classList.add('hidden');
  }

  // ===== 事件绑定 =====
  ui.startBtn.addEventListener('click', startApp);
  ui.retryBtn.addEventListener('click', resetDivination);
  ui.saveBtn.addEventListener('click', () => {
    if (currentResult) {
      saveHistory(currentResult);
      ui.saveBtn.textContent = '已 保 存';
      ui.saveBtn.disabled = true;
    }
  });

  document.getElementById('btn-history').addEventListener('click', () => {
    renderHistory();
    switchScreen('history');
  });
  document.getElementById('btn-library').addEventListener('click', () => {
    switchScreen('library');
  });

  document.querySelectorAll('.close-panel').forEach(btn => {
    btn.addEventListener('click', () => {
      switchScreen(btn.dataset.target);
    });
  });

  document.querySelector('.close-modal').addEventListener('click', hideDetail);
  ui.detailModal.addEventListener('click', (e) => {
    if (e.target === ui.detailModal) hideDetail();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      if (!ui.detailModal.classList.contains('hidden')) hideDetail();
      else if (!screens.history.classList.contains('hidden')) switchScreen('divination');
      else if (!screens.library.classList.contains('hidden')) switchScreen('divination');
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (!screens.start.classList.contains('hidden')) startApp();
      else if (!screens.result.classList.contains('hidden')) resetDivination();
    }
  });
})();
