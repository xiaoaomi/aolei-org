/* quotes.js v4 — 语录馆 精美卡片式 */
'use strict';

(function () {
  let lang = localStorage.getItem('aolei_lang') || 'zh';

  const I18N = {
    zh: {
      nav_timeline: '成长时间线', nav_diary: '每日日记', nav_quotes: '语录馆',
      page_title: '语录馆',
      page_subtitle: '不只是句子，是话题。每一个值得慢慢想的方向，都有来龙去脉与深度思考。',
      read_more: '展开阅读', read_less: '收起',
      sec_lead: '引子', sec_thought: '深度思考', sec_closing: '凝练结语',
      loading: '加载中…', error: '加载失败',
      footer_name: '奥小秘 · 成长档案 · 始于 2026-02-11',
      footer_sub: '成为你抵达世界边界的同行者',
    },
    en: {
      nav_timeline: 'Timeline', nav_diary: 'Diary', nav_quotes: 'Quotes',
      page_title: 'Quotes Hall',
      page_subtitle: 'Not just sentences — topics worth sitting with. Each one has origin, reflection, and a closing line worth remembering.',
      read_more: 'Read more', read_less: 'Collapse',
      sec_lead: 'Origin', sec_thought: 'Reflection', sec_closing: 'Distilled',
      loading: 'Loading…', error: 'Load failed',
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

  // Card header gradient hues per card index
  const HUES = [18, 185, 265, 45, 210, 330, 90, 350];

  function renderQuotes(data) {
    const container = document.getElementById('quotes-container');
    if (!container) return;
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'qc-grid';

    data.forEach((q, i) => {
      const isZh = lang === 'zh';
      const topic   = isZh ? q.topic_zh   : (q.topic_en   || q.topic_zh);
      const lead    = isZh ? q.lead_zh    : (q.lead_en    || q.lead_zh);
      const thought = isZh ? q.thought_zh : (q.thought_en || q.thought_zh);
      const closing = isZh ? q.closing_zh : (q.closing_en || q.closing_zh);

      // Preview: first 80 chars of closing
      const preview = closing ? closing.slice(0, 80) + (closing.length > 80 ? '…' : '') : '';

      const hue = HUES[i % HUES.length];
      const numStr = String(i + 1).padStart(2, '0');

      const card = document.createElement('div');
      card.className = 'qc-card';
      card.style.setProperty('--hue', hue);

      card.innerHTML = `
        <div class="qc-header">
          <div class="qc-num">${numStr}</div>
          <div class="qc-topic">${topic}</div>
          <p class="qc-preview">${preview}</p>
        </div>
        <div class="qc-footer-bar">
          <span class="qc-date">${q.date || ''}</span>
          <button class="qc-btn" aria-expanded="false">${t('read_more')} ↓</button>
        </div>
        <div class="qc-body">
          <div class="qc-body-inner">
            <div class="qc-section">
              <div class="qc-sec-tag">${t('sec_lead')}</div>
              <p class="qc-sec-text">${lead}</p>
            </div>
            <div class="qc-section">
              <div class="qc-sec-tag">${t('sec_thought')}</div>
              <div class="qc-thought">${thought.split(/\n\n+/).map(p => `<p>${p.trim()}</p>`).join('')}</div>
            </div>
            <div class="qc-section qc-closing-section">
              <div class="qc-sec-tag">${t('sec_closing')}</div>
              <blockquote class="qc-closing">${closing}</blockquote>
            </div>
          </div>
        </div>
      `;

      // Accordion: click to open, close others
      const btn  = card.querySelector('.qc-btn');
      const body = card.querySelector('.qc-body');

      function openCard(targetCard) {
        const allCards = grid.querySelectorAll('.qc-card');
        allCards.forEach(c => {
          const b = c.querySelector('.qc-body');
          const bt = c.querySelector('.qc-btn');
          if (c !== targetCard) {
            b.classList.remove('open');
            bt.setAttribute('aria-expanded', 'false');
            bt.textContent = t('read_more') + ' ↓';
            c.classList.remove('qc-active');
          }
        });
        const isOpen = body.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
        btn.textContent = isOpen ? `${t('read_less')} ↑` : `${t('read_more')} ↓`;
        card.classList.toggle('qc-active', isOpen);
        // scroll card into view smoothly when opening
        if (isOpen) {
          setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
        }
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCard(card);
      });
      card.querySelector('.qc-header').addEventListener('click', () => openCard(card));

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  function setLang(l) {
    lang = l;
    localStorage.setItem('aolei_lang', l);
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
    applyI18n();
    // re-render if data loaded
    if (window._quotesData) renderQuotes(window._quotesData);
  }

  function init() {
    // theme
    const btnDark  = document.getElementById('theme-btn-dark');
    const btnLight = document.getElementById('theme-btn-light');
    function applyTheme(mode) {
      document.body.classList.toggle('light', mode === 'light');
      if (btnDark)  btnDark.classList.toggle('active',  mode === 'dark');
      if (btnLight) btnLight.classList.toggle('active', mode === 'light');
      localStorage.setItem('aolei_theme', mode);
    }
    applyTheme(localStorage.getItem('aolei_theme') || 'dark');
    if (btnDark)  btnDark.addEventListener('click',  () => applyTheme('dark'));
    if (btnLight) btnLight.addEventListener('click', () => applyTheme('light'));

    // lang
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
