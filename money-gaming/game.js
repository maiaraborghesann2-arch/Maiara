// ============ Money Gaming — lógica do jogo ============
(function () {
  'use strict';

  var STORAGE_KEY = 'money-gaming-save-v1';

  function defaultState() {
    return {
      xp: 0,
      coins: 0,
      progress: {}, // questId -> array de índices de perguntas acertadas
      badges: [],
      totalCorrect: 0,
      totalAnswered: 0,
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {}
    return defaultState();
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = load();
  var screen = document.getElementById('screen');
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  // sessão da quest atual
  var session = null; // { quest, order, idx, hearts, correct, coinsWon, xpWon }

  // ---------- helpers ----------
  function level() { return Math.floor(state.xp / XP_PER_LEVEL) + 1; }

  function questDone(questId) {
    return (state.progress[questId] || []).length;
  }

  function questPct(quest) {
    return Math.round((questDone(quest.id) / quest.questions.length) * 100);
  }

  function fmtPct(n) { return String(n).replace('.', ','); }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  function coinBurst(x, y) {
    var target = document.getElementById('hud-coins').getBoundingClientRect();
    for (var i = 0; i < 5; i++) {
      var c = document.createElement('div');
      c.className = 'coin-fly';
      c.style.left = (x + (Math.random() * 40 - 20)) + 'px';
      c.style.top = (y + (Math.random() * 20 - 10)) + 'px';
      c.style.setProperty('--dx', (target.left - x) + 'px');
      c.style.setProperty('--dy', (target.top - y) + 'px');
      c.style.animationDelay = (i * 60) + 'ms';
      document.body.appendChild(c);
      setTimeout(function (el) { return function () { el.remove(); }; }(c), 900 + i * 60);
    }
  }

  function updateHud(heartsCount) {
    var hearts = document.getElementById('hud-hearts');
    var n = (typeof heartsCount === 'number') ? heartsCount : MAX_HEARTS;
    var html = '';
    for (var i = 0; i < MAX_HEARTS; i++) {
      html += '<span class="' + (i < n ? '' : 'off') + '">♥</span>';
    }
    hearts.innerHTML = html;
    document.getElementById('hud-level').textContent = level();
    document.getElementById('hud-coins').textContent = state.coins;
    document.getElementById('hud-xpfill').style.width = (state.xp % XP_PER_LEVEL) + '%';
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function render(node) {
    screen.innerHTML = '';
    screen.appendChild(node);
    screen.scrollTop = 0;
  }

  // ---------- telas ----------
  function showHome() {
    session = null;
    updateHud();
    var node = el(
      '<div>' +
        '<div class="title-card">' +
          '<div class="t1">TROQUE</div>' +
          '<div class="t2">O SCROLL</div>' +
          '<div class="t1" style="font-size:10px;color:var(--ink)">═ POR UM ═</div>' +
          '<div class="t3">JOGO</div>' +
          '<div class="t4">DE FINANÇAS</div>' +
        '</div>' +
        '<div class="center"><span class="banner">QUEST MENU <span class="star">★</span></span></div>' +
        '<div class="quest-list"></div>' +
      '</div>'
    );
    var list = node.querySelector('.quest-list');
    QUESTS.forEach(function (quest) {
      var pct = questPct(quest);
      var card = el(
        '<button class="quest-card" style="--c:' + quest.color + '">' +
          '<span class="quest-emoji">' + quest.emoji + '</span>' +
          '<span class="quest-info">' +
            '<div class="quest-pct">' + fmtPct(pct) + '<small>%</small></div>' +
            '<div class="quest-name">' + quest.name + '</div>' +
          '</span>' +
          '<span class="quest-arrow">➤</span>' +
        '</button>'
      );
      card.addEventListener('click', function () { startQuest(quest); });
      list.appendChild(card);
    });
    render(node);
  }

  function startQuest(quest) {
    var doneList = state.progress[quest.id] || [];
    // perguntas ainda não acertadas primeiro; se tudo feito, replay completo
    var pending = [];
    quest.questions.forEach(function (_, i) {
      if (doneList.indexOf(i) === -1) pending.push(i);
    });
    var order = pending.length ? pending : quest.questions.map(function (_, i) { return i; });
    session = { quest: quest, order: order, idx: 0, hearts: MAX_HEARTS, correct: 0, coinsWon: 0, xpWon: 0 };
    showQuestion();
  }

  function showQuestion() {
    var s = session;
    updateHud(s.hearts);
    var qIndex = s.order[s.idx];
    var q = s.quest.questions[qIndex];
    var node = el(
      '<div>' +
        '<div class="q-topic">' + s.quest.emoji + ' ' + s.quest.name + '</div>' +
        '<div class="q-progress">PERGUNTA ' + (s.idx + 1) + '/' + s.order.length + '</div>' +
        '<div class="q-text">' + q.q + '</div>' +
        '<div class="answers"></div>' +
        '<div class="explain-slot"></div>' +
      '</div>'
    );
    var answersEl = node.querySelector('.answers');
    q.a.forEach(function (text, i) {
      var b = el('<button class="answer">' + text + '</button>');
      b.addEventListener('click', function (ev) { answer(i, qIndex, node, b, ev); });
      answersEl.appendChild(b);
    });
    render(node);
  }

  function answer(chosen, qIndex, node, btn, ev) {
    var s = session;
    var q = s.quest.questions[qIndex];
    var buttons = node.querySelectorAll('.answer');
    buttons.forEach(function (b) { b.setAttribute('disabled', ''); });
    state.totalAnswered++;

    var isRight = chosen === q.correct;
    buttons[q.correct].classList.add('correct');

    if (isRight) {
      s.correct++;
      s.coinsWon += COINS_PER_CORRECT;
      s.xpWon += XP_PER_CORRECT;
      state.coins += COINS_PER_CORRECT;
      state.xp += XP_PER_CORRECT;
      state.totalCorrect++;
      var doneList = state.progress[s.quest.id] || (state.progress[s.quest.id] = []);
      if (doneList.indexOf(qIndex) === -1) doneList.push(qIndex);
      coinBurst(ev.clientX || innerWidth / 2, ev.clientY || innerHeight / 2);
      toast('+' + COINS_PER_CORRECT + ' moedas  +' + XP_PER_CORRECT + ' XP');
    } else {
      btn.classList.add('wrong');
      s.hearts--;
      toast('Ops! Perdeu 1 vida ♥');
    }
    save();
    updateHud(s.hearts);

    var slot = node.querySelector('.explain-slot');
    slot.appendChild(el('<div class="explain">💡 ' + q.exp + '</div>'));

    var next = el('<button class="btn">' + (s.hearts <= 0 ? 'FIM DE JOGO' : (s.idx + 1 < s.order.length ? 'PRÓXIMA ➤' : 'VER RESULTADO ★')) + '</button>');
    next.addEventListener('click', function () {
      if (s.hearts <= 0) return showGameOver();
      s.idx++;
      if (s.idx < s.order.length) showQuestion();
      else showResult();
    });
    slot.appendChild(next);
  }

  function showResult() {
    var s = session;
    var pct = questPct(s.quest);
    var bonus = 0;
    if (pct === 100 && s.correct === s.order.length) {
      bonus = QUEST_BONUS_COINS;
      state.coins += bonus;
      save();
    }
    updateHud(s.hearts);
    var node = el(
      '<div class="center">' +
        '<div class="big-emoji">' + (pct === 100 ? '🏆' : '🎉') + '</div>' +
        '<div class="result-title">QUEST ' + (pct === 100 ? 'COMPLETA!' : 'AVANÇOU!') + '</div>' +
        '<div class="result-sub">' + s.quest.name + '<br/>Acertos: ' + s.correct + '/' + s.order.length +
          '<br/>Progresso da quest: ' + fmtPct(pct) + '%</div>' +
        '<div class="reward-line">+' + s.coinsWon + ' 🪙  +' + s.xpWon + ' XP' +
          (bonus ? '<br/>BÔNUS DE QUEST: +' + bonus + ' 🪙' : '') + '</div>' +
        '<button class="btn">QUEST MENU ★</button>' +
        '<button class="btn alt">RECOMPENSAS 🎁</button>' +
      '</div>'
    );
    node.querySelector('.btn').addEventListener('click', showHome);
    node.querySelector('.btn.alt').addEventListener('click', showRewards);
    render(node);
  }

  function showGameOver() {
    var s = session;
    var node = el(
      '<div class="center">' +
        '<div class="big-emoji">💔</div>' +
        '<div class="result-title" style="color:var(--red)">GAME OVER</div>' +
        '<div class="result-sub">Suas vidas acabaram!<br/>Mas o que você acertou está salvo:<br/>+' +
          s.coinsWon + ' 🪙  +' + s.xpWon + ' XP</div>' +
        '<button class="btn warn">TENTAR DE NOVO ↺</button>' +
        '<button class="btn alt">QUEST MENU ★</button>' +
      '</div>'
    );
    var quest = s.quest;
    node.querySelector('.btn.warn').addEventListener('click', function () { startQuest(quest); });
    node.querySelector('.btn.alt').addEventListener('click', showHome);
    render(node);
  }

  function showRewards() {
    session = null;
    updateHud();
    var node = el(
      '<div>' +
        '<div class="center"><span class="banner">RECOMPENSAS 🎁</span></div>' +
        '<div class="result-sub center">Troque suas moedas por medalhas!</div>' +
        '<div class="badge-grid"></div>' +
        '<button class="btn alt">QUEST MENU ★</button>' +
      '</div>'
    );
    var grid = node.querySelector('.badge-grid');
    BADGES.forEach(function (badge) {
      var owned = state.badges.indexOf(badge.id) !== -1;
      var card = el(
        '<div class="badge ' + (owned ? '' : 'locked') + '">' +
          '<div class="b-emoji">' + badge.emoji + '</div>' +
          '<div class="b-name">' + badge.name + '</div>' +
          (owned
            ? '<div class="b-cost" style="color:var(--green-dark)">CONQUISTADA ✔</div>'
            : '<div class="b-cost">' + badge.cost + ' 🪙</div><button>RESGATAR</button>') +
        '</div>'
      );
      if (!owned) {
        card.querySelector('button').addEventListener('click', function () {
          if (state.coins < badge.cost) {
            toast('Moedas insuficientes! Complete quests para ganhar mais 🪙');
            return;
          }
          state.coins -= badge.cost;
          state.badges.push(badge.id);
          save();
          toast('Medalha "' + badge.name + '" conquistada! ' + badge.emoji);
          showRewards();
        });
      }
      grid.appendChild(card);
    });
    node.querySelector('.btn.alt').addEventListener('click', showHome);
    render(node);
  }

  function showProfile() {
    session = null;
    updateHud();
    var acc = state.totalAnswered
      ? Math.round((state.totalCorrect / state.totalAnswered) * 100)
      : 0;
    var totalQ = 0, doneQ = 0;
    QUESTS.forEach(function (q) { totalQ += q.questions.length; doneQ += questDone(q.id); });
    var node = el(
      '<div>' +
        '<div class="center"><span class="banner">JOGADOR 🎮</span></div>' +
        '<div class="q-text">' +
          '<div class="stat-row"><span>NÍVEL</span><span>' + level() + '</span></div>' +
          '<div class="stat-row"><span>XP TOTAL</span><span>' + state.xp + '</span></div>' +
          '<div class="stat-row"><span>MOEDAS</span><span>' + state.coins + ' 🪙</span></div>' +
          '<div class="stat-row"><span>MEDALHAS</span><span>' + state.badges.length + '/' + BADGES.length + '</span></div>' +
          '<div class="stat-row"><span>PERGUNTAS FEITAS</span><span>' + doneQ + '/' + totalQ + '</span></div>' +
          '<div class="stat-row"><span>PRECISÃO</span><span>' + acc + '%</span></div>' +
        '</div>' +
        '<button class="btn alt">QUEST MENU ★</button>' +
        '<button class="btn warn">ZERAR PROGRESSO ⚠</button>' +
      '</div>'
    );
    node.querySelector('.btn.alt').addEventListener('click', showHome);
    node.querySelector('.btn.warn').addEventListener('click', function () {
      if (confirm('Tem certeza? Todo o progresso será apagado.')) {
        state = defaultState();
        save();
        toast('Progresso zerado. Bom jogo!');
        showHome();
      }
    });
    render(node);
  }

  // ---------- navegação (gamepad) ----------
  document.querySelectorAll('[data-nav]').forEach(function (b) {
    b.addEventListener('click', function () {
      var nav = b.getAttribute('data-nav');
      if (nav === 'home') showHome();
      else if (nav === 'rewards') showRewards();
      else if (nav === 'profile') showProfile();
    });
  });

  showHome();
})();
