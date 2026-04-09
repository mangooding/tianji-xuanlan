/**
 * 占卜核心逻辑
 */

const Divination = (function() {
  let hexagrams = [];

  async function loadData() {
    const res = await fetch('data/hexagrams.json');
    const data = await res.json();
    hexagrams = data.hexagrams;
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
    if (!hexagrams.length) return null;
    const idx = Math.floor(Math.random() * hexagrams.length);
    const h = hexagrams[idx];
    const luck = getLuckLevel(h.meaning);
    return { ...h, luck };
  }

  return {
    loadData,
    cast
  };
})();
