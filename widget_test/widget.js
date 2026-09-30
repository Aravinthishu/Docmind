(function () {
  'use strict';

  const scriptTag = document.currentScript;
  const PUBLIC_KEY = scriptTag.getAttribute('data-key');
  const API_BASE = scriptTag.getAttribute('data-api-base') || 'https://yourapp.com/api';

  if (!PUBLIC_KEY) {
    console.error('[DocMind Widget] Missing data-key attribute on script tag.');
    return;
  }

  const SESSION_KEY = 'docmind_session_id';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  let config = {
    bot_name: 'Assistant',
    welcome_message: 'Hi! How can I help you today?',
    primary_color: '#22855B',
    font_family: 'Inter, system-ui, sans-serif',
    position: 'bottom-right',
  };

  let isOpen = false;

  const THUMB_UP = '<svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
  const THUMB_DOWN = '<svg viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>';

  // ---------- Styles ----------
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .dm-widget-root { position: fixed; z-index: 999999; font-family: ${config.font_family}; }
      .dm-widget-root.br { bottom: 20px; right: 20px; }
      .dm-widget-root.bl { bottom: 20px; left: 20px; }

      .dm-bubble {
        width: 60px; height: 60px; border-radius: 50%;
        background: ${config.primary_color};
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; border: none; transition: transform 0.2s ease;
      }
      .dm-bubble:hover { transform: scale(1.08); }
      .dm-bubble svg { width: 26px; height: 26px; stroke: #fff; transition: opacity 0.15s ease, transform 0.15s ease; }

      .dm-panel {
        position: absolute; bottom: 76px; width: 360px; max-width: calc(100vw - 40px);
        height: 520px; max-height: calc(100vh - 120px);
        background: #0b2a1e; border-radius: 16px; overflow: hidden;
        box-shadow: 0 16px 48px rgba(0,0,0,0.35);
        display: flex; flex-direction: column;
        opacity: 0; transform: translateY(16px) scale(0.96);
        pointer-events: none; transition: opacity 0.22s ease, transform 0.22s ease;
      }
      .dm-widget-root.br .dm-panel { right: 0; }
      .dm-widget-root.bl .dm-panel { left: 0; }
      .dm-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

      .dm-header {
        background: ${config.primary_color}; padding: 16px 18px;
        display: flex; align-items: center; gap: 10px; flex-shrink: 0;
      }
      .dm-avatar {
        width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 600; font-size: 13px; flex-shrink: 0;
      }
      .dm-header-title { color: #fff; font-weight: 600; font-size: 14px; }
      .dm-header-sub { color: rgba(255,255,255,0.75); font-size: 11px; }

      .dm-messages {
        flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
      }
      .dm-messages::-webkit-scrollbar { width: 6px; }
      .dm-messages::-webkit-scrollbar-thumb { background: #145238; border-radius: 3px; }

      .dm-msg { max-width: 82%; padding: 9px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.45; animation: dmSlideIn 0.25s ease; word-wrap: break-word; }
      .dm-msg.bot { background: #123a28; color: #e8f3ee; border-bottom-left-radius: 4px; align-self: flex-start; }
      .dm-msg.user { background: #facc15; color: #0b2a1e; font-weight: 500; border-bottom-right-radius: 4px; align-self: flex-end; }

      .dm-bot-wrap { display: flex; flex-direction: column; gap: 4px; align-self: flex-start; max-width: 82%; }
      .dm-bot-wrap .dm-msg { max-width: 100%; }

      .dm-feedback { display: flex; gap: 2px; padding-left: 4px; opacity: 0.55; transition: opacity 0.15s ease; }
      .dm-bot-wrap:hover .dm-feedback, .dm-feedback:focus-within { opacity: 1; }
      .dm-fb {
        width: 24px; height: 24px; border: none; background: transparent; border-radius: 6px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.15s ease;
      }
      .dm-fb:hover { background: #123a28; }
      .dm-fb svg { width: 14px; height: 14px; stroke: #7fae98; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .dm-fb.active[data-v="1"] svg { stroke: #facc15; fill: #facc15; }
      .dm-fb.active[data-v="-1"] svg { stroke: #f87171; fill: #f87171; }

      @keyframes dmSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

      .dm-typing { display: flex; gap: 4px; padding: 10px 13px; background: #123a28; border-radius: 14px; border-bottom-left-radius: 4px; align-self: flex-start; width: fit-content; }
      .dm-typing span { width: 6px; height: 6px; border-radius: 50%; background: #7fae98; animation: dmBounce 1.2s infinite ease-in-out; }
      .dm-typing span:nth-child(2) { animation-delay: 0.15s; }
      .dm-typing span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes dmBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }

      .dm-input-row { display: flex; align-items: center; gap: 8px; padding: 12px; border-top: 1px solid #123a28; flex-shrink: 0; background: #0b2a1e; }
      .dm-input {
        flex: 1; background: #123a28; border: 1px solid #1a4a33; border-radius: 999px;
        padding: 9px 14px; color: #fff; font-size: 13px; outline: none; transition: border-color 0.15s ease;
      }
      .dm-input:focus { border-color: ${config.primary_color}; }
      .dm-input::placeholder { color: #5c8a75; }
      .dm-send {
        width: 34px; height: 34px; border-radius: 50%; background: ${config.primary_color};
        border: none; display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; transition: transform 0.15s ease, opacity 0.15s ease;
      }
      .dm-send:hover { transform: scale(1.06); }
      .dm-send:disabled { opacity: 0.4; cursor: default; transform: none; }
      .dm-send svg { width: 15px; height: 15px; fill: #fff; }

      .dm-footer { text-align: center; font-size: 10px; color: #3f6a55; padding: 6px 0 10px; }
    `;
    document.head.appendChild(style);
  }

  // ---------- DOM ----------
  let els = {};

  function buildDOM() {
    const root = document.createElement('div');
    root.className = 'dm-widget-root ' + (config.position === 'bottom-left' ? 'bl' : 'br');

    root.innerHTML = `
      <div class="dm-panel" id="dm-panel">
        <div class="dm-header">
          <div class="dm-avatar">${escapeHtml(config.bot_name.charAt(0).toUpperCase())}</div>
          <div>
            <div class="dm-header-title">${escapeHtml(config.bot_name)}</div>
            <div class="dm-header-sub">Online</div>
          </div>
        </div>
        <div class="dm-messages" id="dm-messages"></div>
        <div class="dm-input-row">
          <input class="dm-input" id="dm-input" type="text" placeholder="Type a message..." />
          <button class="dm-send" id="dm-send">
            <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          </button>
        </div>
        <div class="dm-footer">Powered by DocMind</div>
      </div>
      <button class="dm-bubble" id="dm-bubble">
        <svg id="dm-icon-chat" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <svg id="dm-icon-close" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" style="display:none; position:absolute;">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    document.body.appendChild(root);

    els = {
      panel: root.querySelector('#dm-panel'),
      bubble: root.querySelector('#dm-bubble'),
      iconChat: root.querySelector('#dm-icon-chat'),
      iconClose: root.querySelector('#dm-icon-close'),
      messages: root.querySelector('#dm-messages'),
      input: root.querySelector('#dm-input'),
      send: root.querySelector('#dm-send'),
    };

    els.bubble.addEventListener('click', togglePanel);
    els.send.addEventListener('click', sendMessage);
    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    renderMessage('bot', config.welcome_message);
  }

  function togglePanel() {
    isOpen = !isOpen;
    els.panel.classList.toggle('open', isOpen);
    els.iconChat.style.display = isOpen ? 'none' : 'block';
    els.iconClose.style.display = isOpen ? 'block' : 'none';
    if (isOpen) els.input.focus();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // logId is only passed for real AI answers — those get feedback buttons
  function renderMessage(role, text, logId) {
    const bubble = document.createElement('div');
    bubble.className = `dm-msg ${role}`;
    bubble.textContent = text;

    if (role === 'bot' && logId) {
      const wrap = document.createElement('div');
      wrap.className = 'dm-bot-wrap';
      wrap.appendChild(bubble);
      wrap.appendChild(buildFeedbackRow(logId));
      els.messages.appendChild(wrap);
    } else {
      els.messages.appendChild(bubble);
    }
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function paintFeedback(row, value) {
    row.querySelectorAll('.dm-fb').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.v) === value);
    });
  }

  function buildFeedbackRow(logId) {
    const row = document.createElement('div');
    row.className = 'dm-feedback';
    row.innerHTML =
      `<button class="dm-fb" data-v="1" aria-label="Helpful">${THUMB_UP}</button>` +
      `<button class="dm-fb" data-v="-1" aria-label="Not helpful">${THUMB_DOWN}</button>`;

    let current = 0;
    row.querySelectorAll('.dm-fb').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const clicked = Number(btn.dataset.v);
        const next = current === clicked ? 0 : clicked; // clicking again removes the rating
        const previous = current;
        current = next;
        paintFeedback(row, current);

        const ok = await sendFeedback(logId, next);
        if (!ok) {
          current = previous;
          paintFeedback(row, current);
        }
      });
    });
    return row;
  }

  async function sendFeedback(logId, value) {
    try {
      const res = await fetch(`${API_BASE}/widget/feedback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Public-Key': PUBLIC_KEY },
        body: JSON.stringify({ log_id: logId, feedback: value, session_id: sessionId }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'dm-typing';
    typing.id = 'dm-typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    els.messages.appendChild(typing);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('dm-typing-indicator');
    if (el) el.remove();
  }

  async function sendMessage() {
    const text = els.input.value.trim();
    if (!text) return;

    renderMessage('user', text);
    els.input.value = '';
    els.send.disabled = true;
    showTyping();

    try {
      const res = await fetch(`${API_BASE}/widget/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Public-Key': PUBLIC_KEY,
        },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });

      hideTyping();

      if (!res.ok) {
        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          renderMessage('bot', errData.error || 'This assistant has reached its usage limit for now.');
        } else {
          renderMessage('bot', "Sorry, I couldn't process that. Please try again.");
        }
        return;
      }

      const data = await res.json();
      renderMessage('bot', data.answer, data.log_id);
    } catch (err) {
      hideTyping();
      renderMessage('bot', "I'm having trouble connecting. Please try again shortly.");
    } finally {
      els.send.disabled = false;
    }
  }

  // ---------- Init ----------
  async function init() {
    try {
      const res = await fetch(`${API_BASE}/widget/config/`, {
        headers: { 'X-Public-Key': PUBLIC_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        config = { ...config, ...data };
      }
    } catch (err) {
      console.warn('[DocMind Widget] Using default theme — config fetch failed.');
    }

    injectStyles();
    buildDOM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();