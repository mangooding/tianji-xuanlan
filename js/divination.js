/**
 * 天机玄览 - 核心占卜逻辑 v2
 * 支持六爻铜钱占卜、动爻、变卦
 */

const Divination = (function() {
  let hexagrams = [];
  let hexagramMap = {};

  async function loadData() {
    const res = await fetch('data/hexagrams.json');
    const data = await res.json();
    hexagrams = data.hexagrams;
    hexagrams.forEach(h => {
      hexagramMap[h.lines.join('')] = h;
    });
  }

  // 投一枚铜钱：3正=老阴(动爻，阴变阳)，2正1反=少阳，1正2反=少阴，0正=老阳(动爻，阳变阴)
  function tossCoin() {
    const coins = [Math.random() > 0.5 ? 1 : 0, Math.random() > 0.5 ? 1 : 0, Math.random() > 0.5 ? 1 : 0];
    const heads = coins.filter(c => c === 1).length; // 正面=1
    if (heads === 3) return { value: 0, changing: true, coins: [1,1,1], name: '老阴' };   // 三阴 → 阴爻，动爻
    if (heads === 2) return { value: 1, changing: false, coins: coins, name: '少阳' };    // 两正一反 → 阳爻
    if (heads === 1) return { value: 0, changing: false, coins: coins, name: '少阴' };    // 一正两反 → 阴爻
    return { value: 1, changing: true, coins: [0,0,0], name: '老阳' };                   // 三阳 → 阳爻，动爻
  }

  function castYao() {
    const result = [];
    for (let i = 0; i < 6; i++) {
      result.push(tossCoin());
    }
    return result;
  }

  function getHexagramFromYao(yao) {
    const key = yao.map(y => y.value).join('');
    return hexagramMap[key] || null;
  }

  function getChangedHexagram(yao) {
    const changed = yao.map(y => y.changing ? (y.value === 1 ? 0 : 1) : y.value);
    const key = changed.join('');
    return hexagramMap[key] || null;
  }

  function getLuckLevel(meaning) {
    const text = meaning || '';
    const great = ['大吉', '元吉', '上上', '亨通', '昌隆'];
    const good = ['吉', '利', '无咎', '可成', '光明'];
    const bad = ['凶', '不利', '小人', '衰败', '困穷', '终乱'];
    const caution = ['艰贞', '惕', '防', '谨', '慎'];

    for (const kw of great) if (text.includes(kw)) return { level: 'great', label: '大吉', class: 'luck-great' };
    for (const kw of bad) if (text.includes(kw)) return { level: 'bad', label: '需谨慎', class: 'luck-bad' };
    for (const kw of caution) if (text.includes(kw)) return { level: 'mixed', label: '中平', class: 'luck-mixed' };
    for (const kw of good) if (text.includes(kw)) return { level: 'good', label: '吉', class: 'luck-good' };
    
    return { level: 'mixed', label: '中平', class: 'luck-mixed' };
  }

  function cast() {
    // 先通过传统六爻铜钱卜卦
    const yao = castYao();
    const hexagram = getHexagramFromYao(yao);
    const changed = getChangedHexagram(yao);
    const luck = getLuckLevel(hexagram?.meaning);

    // 找出变爻位置（1为初爻，6为上爻）
    const changingLines = yao
      .map((y, idx) => y.changing ? idx + 1 : null)
      .filter(Boolean);

    return {
      hexagram,
      changed,
      yao,
      changingLines,
      luck,
      time: new Date().toISOString()
    };
  }

  function getByLines(key) {
    return hexagramMap[key] || null;
  }

  return {
    loadData,
    cast,
    castYao,
    getByLines,
    hexagrams: () => hexagrams
  };
})();
