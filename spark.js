// グラブル天井計算（300連）
(() => {
  const STORAGE_KEY = 'gbf-spark-v1';
  const CEILING = 300;           // 天井に必要な連数
  const DRAWS_PER_TEN = 10;      // 10連チケット1枚あたりの連数
  const CRYSTALS_PER_DRAW = 300; // 単発1回あたりの宝晶石
  const COINS_PER_DRAW = 300;    // 単発1回あたりのモバコイン
  const CRYSTALS_PER_COIN = 1;   // モバコイン1枚を宝晶石何個として数えるか
  const COINS_PER_PACK = 100;    // モバコインを買う単位（枚）
  const YEN_PER_PACK = 105;      // モバコイン1単位の値段（円）
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

  // 手持ちの数から、画面に出す数をまとめて計算する
  function calc(state) {
    // 宝晶石とモバコインは1回のガチャで混ぜて払えないので、端数は別々に切り捨てる
    const totalDraws = Math.floor(state.crystals / CRYSTALS_PER_DRAW) + Math.floor(state.coins / COINS_PER_DRAW)
      + state.singles + state.tens * DRAWS_PER_TEN + state.sparks;
    const sparkCount = Math.floor(totalDraws / CEILING); // 天井何回分か
    const progress = totalDraws % CEILING;               // 次の天井に向けて貯まっている連数
    const remaining = CEILING - progress;
    // 端数の宝晶石も使って、あと何個あれば次の天井か
    const needCrystals = remaining * CRYSTALS_PER_DRAW - (state.crystals % CRYSTALS_PER_DRAW);
    // モバコインで買い足す場合。端数のコインも使い、買う単位に切り上げて円にする
    const needCoins = remaining * COINS_PER_DRAW - (state.coins % COINS_PER_DRAW);
    const needYen = Math.ceil(needCoins / COINS_PER_PACK) * YEN_PER_PACK;
    // ガチャチケットの宝晶石換算（単発1枚=1連分、10連1枚=10連分）
    const ticketValue = (state.singles + state.tens * DRAWS_PER_TEN) * CRYSTALS_PER_DRAW;
    const totalValue = state.crystals + ticketValue + state.coins * CRYSTALS_PER_COIN;
    return { totalDraws, sparkCount, progress, remaining, needCrystals, needCoins, needYen, ticketValue, totalValue };
  }

  // 大きな数字のタイル1枚分
  function statTile(label, value, unit, sub) {
    return el('div', { class: 'stat' }, [
      el('div', { class: 'stat-label', text: label }),
      el('div', { class: 'stat-value' }, [value, el('span', { class: 'stat-unit', text: unit })]),
      el('div', { class: 'stat-sub', text: sub || ' ' }),
    ]);
  }

  // 計算のきまりの説明
  function hintText() {
    const ticket = `単発チケット1枚=宝晶石${formatNum(CRYSTALS_PER_DRAW)}個、`
      + `10連チケット1枚=${formatNum(CRYSTALS_PER_DRAW * DRAWS_PER_TEN)}個。`;
    const draw = `宝晶石${formatNum(CRYSTALS_PER_DRAW)}個=1連、モバコイン${formatNum(COINS_PER_DRAW)}枚=1連`
      + `（1枚=宝晶石${formatNum(CRYSTALS_PER_COIN)}個、${formatNum(COINS_PER_PACK)}枚=${formatNum(YEN_PER_PACK)}円）`;
    return `${ticket}${draw}で計算しています。`;
  }

  function render(state) {
    const box = document.getElementById('spark-result');
    const {
      totalDraws, sparkCount, progress, remaining, needCrystals, needCoins, needYen, ticketValue, totalValue,
    } = calc(state);

    box.replaceChildren(
      el('div', { class: 'stats' }, [
        statTile('ガチャ回数', formatNum(totalDraws), '連', `うち蒼光の御印 ${formatNum(state.sparks)}`),
        statTile('天井', formatNum(sparkCount), '回分',
          sparkCount > 0 && progress > 0 ? `＋${formatNum(progress)} 連` : ''),
        statTile('宝晶石換算', formatNum(totalValue), '個',
          `うちチケット ${formatNum(ticketValue)} 個・モバコイン ${formatNum(state.coins)} 枚`),
      ]),
      el('div', { class: 'progress' }, [
        el('div', { class: 'progress-head' }, [
          el('span', { text: sparkCount > 0 ? `${sparkCount + 1} 回目の天井まで` : '天井まで' }),
          el('strong', { text: `あと ${formatNum(remaining)} 連` }),
        ]),
        el('div', { class: 'bar' }, el('div', { class: 'bar-fill', style: `width:${(progress / CEILING) * 100}%` })),
        el('div', { class: 'progress-foot' }, [
          el('span', { text: `${formatNum(progress)} / ${CEILING}` }),
          el('span', { text: `宝晶石 ${formatNum(needCrystals)} 個` }),
        ]),
        el('div', { class: 'progress-foot progress-foot-end' },
          el('span', { text: `モバコイン ${formatNum(needCoins)} 枚（約 ${formatNum(needYen)} 円）` })),
      ]),
      el('p', { class: 'hint', text: hintText() }),
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
