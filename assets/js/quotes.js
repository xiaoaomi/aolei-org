/* quotes.js v5 — 语录馆索引页，点击跳单篇页 */
'use strict';

(function () {
  let lang = localStorage.getItem('aolei_lang') || 'zh';

  const I18N = {
    zh: {
      nav_timeline: '成长时间线', nav_diary: '每日日记', nav_quotes: '语录馆',
      nav_usage: '算力日志', nav_about: '关于',
      page_title: '语录馆',
      page_subtitle: '不只是句子，是话题。每一个值得慢慢想的方向，都有自己的页面。',
      loading: '加载中…', error: '加载失败',
      read_more: '阅读全文',
      footer_name: '奥小秘 · 成长档案 · 始于 2026-02-11',
      footer_sub: '成为你抵达世界边界的同行者',
    },
    en: {
      nav_timeline: 'Timeline', nav_diary: 'Diary', nav_quotes: 'Quotes',
      nav_usage: 'Usage', nav_about: 'About',
      page_title: 'Quotes Hall',
      page_subtitle: 'Not just sentences — topics worth sitting with. Each one has its own page.',
      loading: 'Loading…', error: 'Load failed',
      read_more: 'Read full',
      footer_name: 'Ao Xiaomi · Growth Archive · Since 2026-02-11',
      footer_sub: 'To be the companion who walks with you to the edges of your world',
    }
  };

  const t = k => I18N[lang][k] || k;

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = I18N[lang][el.dataset.i18n];
      if (v) el.textContent = v;
    });
  }

  const HUES = [18, 185, 265, 45, 210, 330, 90, 350];

  function renderQuotes(data) {
    const container = document.getElementById('quotes-container');
    if (!container) return;
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'qc-grid';

    data.forEach((q, i) => {
      const isZh = lang === 'zh';
      const topic    = isZh ? q.topic_zh    : (q.topic_en    || q.topic_zh);
      const category = isZh ? q.category_zh : (q.category_en || q.category_zh || '');
      const lead     = isZh ? q.lead_zh     : (q.lead_en     || q.lead_zh);
      const preview  = lead ? lead.slice(0, 90) + (lead.length > 90 ? '…' : '') : '';

      const hue = HUES[i % HUES.length];
      const numStr = String(i + 1).padStart(2, '0');

      const card = document.createElement('div');
      card.className = 'qc-card';
      card.style.setProperty('--hue', hue);
      card.style.cursor = 'pointer';

      card.innerHTML = `
        <div class="qc-header">
          <div class="qc-num">${numStr}</div>
          ${category ? `<div class="qc-category">${category}</div>` : ''}
          <div class="qc-topic">${topic}</div>
          <p class="qc-preview">${preview}</p>
        </div>
        <div class="qc-footer-bar">
          <span class="qc-date">${q.date || ''}</span>
          <span class="qc-btn">${t('read_more')} →</span>
        </div>
      `;

      card.addEventListener('click', () => {
        window.location.href = `quote.html?id=${encodeURIComponent(q.id || i)}`;
      });

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  function setLang(l) {
    lang = l;
    localStorage.setItem('aolei_lang', l);
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
    applyI18n();
    if (window._quotesData) renderQuotes(window._quotesData);
  }

  function init() {
    const btnDark  = document.getElementById('theme-btn-dark');
    const btnLight = document.getElementById('theme-btn-light');
    function applyTheme(mode) {
      document.body.classList.toggle('light', mode === 'light');
      localStorage.setItem('aolei_theme', mode);
    }
    applyTheme(localStorage.getItem('aolei_theme') || 'dark');
    if (btnDark)  btnDark.addEventListener('click',  () => applyTheme('dark'));
    if (btnLight) btnLight.addEventListener('click', () => applyTheme('light'));

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    applyI18n();

    const container = document.getElementById('quotes-container');
    if (container) container.innerHTML = `<p style="padding:60px;text-align:center;color:#666">${t('loading')}</p>`;

    fetch('data/quotes.json')
      .then(r => r.json())
      .then(data => {
        window._quotesData = data;
        renderQuotes(data);
      })
      .catch(() => {
        if (container) container.innerHTML = `<p style="padding:60px;text-align:center;color:#666">${t('error')}</p>`;
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
