// ── 奥小秘聊天室（暗色=绿磷光 / 浅色=IRC黑白）────────────────────────
(function() {
  const API = '/api/chat';
  let isLoading = false;
  let initialized = false;
  let guestRounds = 0;       // 匿名轮次计数
  let nickRequired = false;  // 是否已触发昵称拦截

  function pad2(n) { return String(n).padStart(2,'0'); }
  function nowTime() {
    const d = new Date();
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }
  function isLight() {
    return document.body.classList.contains('light');
  }

  function titleText() {
    return isLight() ? '#aolei · 奥小秘聊天室' : '╔══[ 奥小秘 BBS v2026 ]══╗';
  }
  function connText() {
    return isLight()
      ? 'irc.aolei.org · #general · 1 user online'
      : 'Connected: aolei.org | Online: 1 | ' + new Date().toLocaleDateString('zh-CN');
  }

  function addLine(type, nick, msg) {
    const msgs = document.getElementById('rcMessages');
    if (!msgs) return;
    const line = document.createElement('div');
    line.className = 'rc-line';
    const t = nowTime();
    if (type === 'bot') {
      line.innerHTML =
        '<span class="rc-time">[' + t + ']</span>' +
        '<span class="rc-nick-bot">&lt;奥小秘&gt;</span>' +
        '<span class="rc-msg-bot"> ' + escHtml(msg) + '</span>';
    } else if (type === 'user') {
      line.innerHTML =
        '<span class="rc-time">[' + t + ']</span>' +
        '<span class="rc-nick-usr">&lt;' + escHtml(nick) + '&gt;</span>' +
        '<span class="rc-msg-usr"> ' + escHtml(msg) + '</span>';
    } else {
      line.innerHTML = '<span class="rc-sys-line">── ' + escHtml(msg) + ' ──</span>';
    }
    msgs.appendChild(line);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addTyping() {
    const msgs = document.getElementById('rcMessages');
    if (!msgs) return;
    const line = document.createElement('div');
    line.className = 'rc-line';
    line.id = 'rcTyping';
    const t = nowTime();
    line.innerHTML =
      '<span class="rc-time">[' + t + ']</span>' +
      '<span class="rc-nick-bot">&lt;奥小秘&gt;</span>' +
      ' <span class="rc-typing-wrap"><span></span><span></span><span></span></span>';
    msgs.appendChild(line);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('rcTyping');
    if (el) el.remove();
  }

  // ── 昵称提示 prompt ──────────────────────────────────────────────────
  function showNickPrompt() {
    nickRequired = true;
    const nickEl = document.getElementById('rcNickname');
    const inputEl = document.getElementById('rcInput');

    // 系统消息提示
    addLine('sys', '', '请先告诉我你的昵称，才能继续聊哦');

    // 昵称框高亮闪烁
    if (nickEl) {
      nickEl.style.outline = '2px solid var(--rc-nick-bot)';
      nickEl.focus();
      // 两秒后取消高亮（用户会自己填）
      setTimeout(() => { nickEl.style.outline = ''; }, 3000);
    }

    // 输入框暂时禁用，昵称填完后解锁
    if (inputEl) inputEl.disabled = true;

    // 监听昵称填写
    if (nickEl) {
      function onNickFilled() {
        const val = nickEl.value.trim();
        if (val && val !== '访客') {
          nickRequired = false;
          if (inputEl) {
            inputEl.disabled = false;
            inputEl.focus();
          }
          addLine('sys', '', '欢迎，' + val + '！继续聊吧～');
          nickEl.removeEventListener('input', onNickFilled);
          nickEl.removeEventListener('change', onNickFilled);
        }
      }
      nickEl.addEventListener('input', onNickFilled);
      nickEl.addEventListener('change', onNickFilled);
    }
  }

  // 主题切换时更新标题栏文字
  function updateTitleBar() {
    const t = document.querySelector('.rc-title');
    const c = document.querySelector('.rc-connbar');
    if (t) t.textContent = titleText();
    if (c) c.textContent = connText();
  }

  const origToggle = window.toggleTheme;
  window.toggleTheme = function() {
    if (origToggle) origToggle();
    setTimeout(updateTitleBar, 50);
  };

  window.rcSendMsg = async function() {
    if (isLoading) return;
    const nickEl  = document.getElementById('rcNickname');
    const inputEl = document.getElementById('rcInput');
    const sendBtn = document.getElementById('rcSend');
    if (!nickEl || !inputEl) return;

    // 如果正在等昵称，不处理发送
    if (nickRequired) {
      if (nickEl) nickEl.focus();
      return;
    }

    const nickVal = (nickEl.value || '').trim();
    const nick    = nickVal || '访客';
    const msg     = (inputEl.value || '').trim();
    if (!msg) return;

    // 匿名发送计数（昵称为空或"访客"算匿名）
    const isAnon = !nickVal || nickVal === '访客';
    if (isAnon) {
      guestRounds++;
      // 第3轮匿名后拦截
      if (guestRounds >= 3) {
        showNickPrompt();
        return;
      }
    }

    inputEl.value = '';
    addLine('user', nick, msg);
    addTyping();
    isLoading = true;
    if (sendBtn) sendBtn.disabled = true;

    try {
      const resp = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick, message: msg })
      });
      const data = await resp.json();
      removeTyping();
      addLine('bot', '', data.answer || '...');
    } catch(e) {
      removeTyping();
      addLine('sys', '', '网络异常，请稍后再试');
    } finally {
      isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
      if (!nickRequired) inputEl.focus();
    }
  };

  function initChat() {
    if (initialized) return;
    const inputEl = document.getElementById('rcInput');
    const nickEl  = document.getElementById('rcNickname');
    if (!inputEl) return;

    updateTitleBar();

    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); rcSendMsg(); }
    });
    if (nickEl) {
      nickEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') inputEl.focus();
      });
    }

    addLine('sys', '', '欢迎来到奥小秘聊天室');
    setTimeout(function() {
      addLine('bot', '', '嗨，我是奥小秘 🍪 这个网站的守护者。填个昵称，有什么想聊的？');
    }, 500);

    initialized = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
