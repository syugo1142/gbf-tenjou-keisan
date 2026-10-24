// グラブル天井計算（300連）。素材トラッカーとは独立したページで、このフォルダだけで動く
(() => {
  const STORAGE_KEY = 'gbf-spark-v1';
  const CEILING = 300;           // 天井に必要な連数
  const CRYSTALS_PER_DRAW = 300; // 単発1回あたりの宝晶石
  const COINS_PER_DRAW = 300;    // 単発1回あたりのモバコイン（1枚＝宝晶石1個）
  const YEN_PER_100_COINS = 105; // モバコインは100枚＝105円の単位で買う
  const FIELDS = ['crystals', 'singles', 'tens', 'coins', 'sparks'];

  // DOM 生成ヘルパー。文字列は textContent で入れるので XSS の心配がない
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key in node) node[key] = value;
      else node.setAttribute(key, value);
    }
    for (const child of [].concat(children)) {
      if (child == null) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  // 数値入力を 0 以上の整数に丸める
  function toCount(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  function formatNum(n) {
    return n.toLocaleString('ja-JP');
  }

  function load() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch {}
    return Object.fromEntries(FIELDS.map((k) => [k, toCount(data?.[k])]));
  }

  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  // 大きな数字のタイル1枚分
  function statTile(label, value, unit, sub, extraClass = '') {
    return el('div', { class: `stat ${extraClass}` }, [
      el('div', { class: 'stat-label', text: label }),
      el('div', { class: 'stat-value' }, [value, el('span', { class: 'stat-unit', text: unit })]),
      el('div', { class: 'stat-sub', text: sub || ' ' }),
    ]);
  }

  function render(s) {
    const box = document.getElementById('spark-result');
    // 宝晶石とモバコインは1回のガチャで混ぜて払えないので、端数は別々に切り捨てる
    const now = Math.floor(s.crystals / CRYSTALS_PER_DRAW) + Math.floor(s.coins / COINS_PER_DRAW)
      + s.singles + s.tens * 10 + s.sparks;
    const sparkCount = Math.floor(now / CEILING); // 天井何回分か
    const progress = now % CEILING;               // 次の天井に向けて貯まっている連数
    const remaining = CEILING - progress;
    // 端数の宝晶石も使って、あと何個あれば次の天井か
    const needCrystals = remaining * CRYSTALS_PER_DRAW - (s.crystals % CRYSTALS_PER_DRAW);
    // モバコインで買い足す場合。端数のコインも使い、100枚単位に切り上げて円にする
    const needCoins = remaining * COINS_PER_DRAW - (s.coins % COINS_PER_DRAW);
    const needYen = Math.ceil(needCoins / 100) * YEN_PER_100_COINS;
    // ガチャチケットの宝晶石換算（単発1枚=300個、10連1枚=3000個）
    const singleValue = s.singles * CRYSTALS_PER_DRAW;
    const tenValue = s.tens * CRYSTALS_PER_DRAW * 10;
    const ticketValue = singleValue + tenValue;

    box.replaceChildren(
      el('div', { class: 'stats' }, [
        statTile('ガチャ回数', formatNum(now), '連', `うちガチャPt ${formatNum(s.sparks)}`),
        statTile('天井', formatNum(sparkCount), '回分',
          sparkCount > 0 && progress > 0 ? `＋${formatNum(progress)} 連` : '', sparkCount > 0 ? 'reached' : ''),
        statTile('宝晶石換算', formatNum(s.crystals + ticketValue + s.coins), '個',
          `うちチケット ${formatNum(ticketValue)} 個・モバコイン ${formatNum(s.coins)} 枚`),
      ]),
      el('div', { class: 'progress' }, [
        el('div', { class: 'progress-head' }, [
          el('span', { text: sparkCount > 0 ? `${sparkCount + 1} 回目の天井まで` : '天井まで' }),
          el('strong', { text: `あと ${formatNum(remaining)} 連` }),
        ]),
        el('div', { class: 'bar' }, el('div', { class: 'bar-fill', style: `width:${(progress / CEILING) * 100}%` })),
        el('div', { class: 'progress-foot' }, [
          el('span', { text: `${formatNum(progress)} / ${CEILING}` }),
          el('span', { text: `宝晶石なら ${formatNum(needCrystals)} 個` }),
        ]),
        el('div', { class: 'progress-foot' }, [
          el('span'),
          el('span', { text: `モバコインなら ${formatNum(needCoins)} 枚（約 ${formatNum(needYen)} 円）` }),
        ]),
      ]),
      el('p', {
        class: 'hint',
        text: `チケット内訳: 単発 ${formatNum(s.singles)} 枚＝${formatNum(singleValue)} 個、10連 ${formatNum(s.tens)} 枚＝${formatNum(tenValue)} 個。宝晶石300個=1連、モバコイン300枚=1連（1枚=宝晶石1個、100枚=105円）、10連チケット=10連で計算しています。`,
      }),
    );
  }

  const state = load();
  const form = document.getElementById('spark-form');
  for (const key of FIELDS) form.elements[key].value = state[key] || '';
  form.addEventListener('input', () => {
    for (const key of FIELDS) state[key] = toCount(form.elements[key].value);
    save(state);
    render(state);
  });
  render(state);
})();
