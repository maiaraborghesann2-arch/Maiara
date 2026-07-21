// ============ Money Gaming — plataforma 2D + quiz de finanças ============
(function () {
  'use strict';

  var STORAGE_KEY = 'money-gaming-save-v2';

  // ---------- estado persistente ----------
  function defaultState() {
    return {
      xp: 0,
      coins: 0,
      completed: [],   // ids de fases concluídas
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

  // ---------- DOM ----------
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var screenEl = document.getElementById('screen');
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  // ---------- constantes do mundo ----------
  var TILE = 48;
  var GRAVITY = 0.55;
  var MOVE_SPEED = 3.4;
  var JUMP_VEL = -11.5;

  // ---------- sessão de fase ----------
  // run = { level, tiles, coinsMap, portal, player, camX, heartsLeft,
  //         collected, coinsTotal, minCoins, pool, poolIdx, paused }
  var run = null;
  var rafId = null;
  var mode = 'home'; // home | play | quiz | rewards | profile | result | gameover

  var input = { left: false, right: false, jumpQueued: false, act: false };

  // ---------- helpers ----------
  function level() { return Math.floor(state.xp / XP_PER_LEVEL) + 1; }
  function fmtPct(n) { return String(n).replace('.', ','); }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function updateHud() {
    var hearts = document.getElementById('hud-hearts');
    var n = run ? run.heartsLeft : MAX_HEARTS;
    var html = '';
    for (var i = 0; i < MAX_HEARTS; i++) html += '<span class="' + (i < n ? '' : 'off') + '">♥</span>';
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

  function showOverlay(node) {
    screenEl.innerHTML = '';
    screenEl.appendChild(node);
    screenEl.classList.remove('hidden');
    screenEl.scrollTop = 0;
  }

  function hideOverlay() {
    screenEl.classList.add('hidden');
    screenEl.innerHTML = '';
  }

  // ---------- fila de perguntas por fase ----------
  function nextQuestions(n) {
    var out = [];
    while (out.length < n) {
      if (run.poolIdx >= run.pool.length) {
        run.pool = shuffle(TOPICS[run.level.id]);
        run.poolIdx = 0;
      }
      out.push(run.pool[run.poolIdx++]);
    }
    return out;
  }

  // ---------- construção da fase ----------
  function buildLevel(lv) {
    var rows = lv.map;
    var h = rows.length, w = 0;
    rows.forEach(function (r) { w = Math.max(w, r.length); });
    var tiles = [];
    var coins = [];
    var portal = null;
    var spawn = { x: TILE, y: 0 };
    for (var y = 0; y < h; y++) {
      tiles.push([]);
      for (var x = 0; x < w; x++) {
        var ch = rows[y][x] || '.';
        tiles[y][x] = ch === 'X' ? 1 : 0;
        if (ch === 'C') coins.push({ tx: x, ty: y, taken: false });
        if (ch === 'P') portal = { tx: x, ty: y };
        if (ch === 'S') spawn = { x: x * TILE + 10, y: y * TILE };
      }
    }
    return { tiles: tiles, w: w, h: h, coins: coins, portal: portal, spawn: spawn };
  }

  function startLevel(lv) {
    var world = buildLevel(lv);
    run = {
      level: lv,
      world: world,
      heartsLeft: MAX_HEARTS,
      collected: 0,
      coinsTotal: world.coins.length,
      minCoins: Math.ceil(world.coins.length * PORTAL_COIN_RATIO),
      pool: shuffle(TOPICS[lv.id]),
      poolIdx: 0,
      player: {
        x: world.spawn.x, y: world.spawn.y,
        vx: 0, vy: 0, w: 28, h: 42,
        onGround: false, facing: 1, frame: 0,
      },
      camX: 0,
      paused: false,
      time: 0,
    };
    mode = 'play';
    hideOverlay();
    updateHud();
    toast(lv.emoji + ' ' + lv.name + ' — colete ' + run.minCoins + ' moedas e vá ao portal!');
    if (!rafId) loop();
  }

  function respawn() {
    var p = run.player;
    p.x = run.world.spawn.x; p.y = run.world.spawn.y;
    p.vx = 0; p.vy = 0;
  }

  function loseHeart(msg) {
    run.heartsLeft--;
    updateHud();
    if (run.heartsLeft <= 0) {
      showGameOver();
    } else if (msg) {
      toast(msg + ' ♥ restantes: ' + run.heartsLeft);
    }
  }

  // ---------- física ----------
  function solid(tx, ty) {
    if (tx < 0 || tx >= run.world.w) return true; // paredes laterais
    if (ty < 0) return false;
    if (ty >= run.world.h) return false;          // abismo
    return run.world.tiles[ty][tx] === 1;
  }

  function moveAxis(p, dx, dy) {
    p.x += dx; p.y += dy;
    var x0 = Math.floor(p.x / TILE), x1 = Math.floor((p.x + p.w - 1) / TILE);
    var y0 = Math.floor(p.y / TILE), y1 = Math.floor((p.y + p.h - 1) / TILE);
    for (var ty = y0; ty <= y1; ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        if (!solid(tx, ty)) continue;
        if (dx > 0) { p.x = tx * TILE - p.w; p.vx = 0; }
        else if (dx < 0) { p.x = (tx + 1) * TILE; p.vx = 0; }
        else if (dy > 0) { p.y = ty * TILE - p.h; p.vy = 0; p.onGround = true; }
        else if (dy < 0) { p.y = (ty + 1) * TILE; p.vy = 0; }
        x0 = Math.floor(p.x / TILE); x1 = Math.floor((p.x + p.w - 1) / TILE);
        y0 = Math.floor(p.y / TILE); y1 = Math.floor((p.y + p.h - 1) / TILE);
      }
    }
  }

  function nearTile(p, t, radius) {
    var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    var tx = t.tx * TILE + TILE / 2, ty = t.ty * TILE + TILE / 2;
    return Math.abs(cx - tx) < radius && Math.abs(cy - ty) < radius;
  }

  function nearestCoin() {
    for (var i = 0; i < run.world.coins.length; i++) {
      var c = run.world.coins[i];
      if (!c.taken && nearTile(run.player, c, TILE * 1.2)) return c;
    }
    return null;
  }

  function atPortal() {
    return run.world.portal && nearTile(run.player, run.world.portal, TILE * 1.1);
  }

  function step() {
    var p = run.player;
    run.time++;

    p.vx = 0;
    if (input.left) { p.vx = -MOVE_SPEED; p.facing = -1; }
    if (input.right) { p.vx = MOVE_SPEED; p.facing = 1; }

    if (input.jumpQueued && p.onGround) {
      p.vy = JUMP_VEL;
      p.onGround = false;
    }
    input.jumpQueued = false;

    p.vy = Math.min(p.vy + GRAVITY, 14);
    p.onGround = false;
    moveAxis(p, p.vx, 0);
    moveAxis(p, 0, p.vy);
    if (p.vx !== 0 && p.onGround) p.frame++;

    // caiu no abismo
    if (p.y > run.world.h * TILE + 100) {
      respawn();
      loseHeart('Caiu no buraco!');
      return;
    }

    // ação B
    if (input.act) {
      input.act = false;
      var c = nearestCoin();
      if (c) return openCoinQuiz(c);
      if (atPortal()) return tryPortal();
    }
  }

  // ---------- render ----------
  function resize() {
    var stage = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = stage.clientWidth * dpr;
    canvas.height = stage.clientHeight * dpr;
    canvas.style.width = stage.clientWidth + 'px';
    canvas.style.height = stage.clientHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);

  function draw() {
    var W = canvas.clientWidth, H = canvas.clientHeight;
    var world = run.world;
    var p = run.player;

    // câmera
    var target = p.x + p.w / 2 - W / 2;
    run.camX = Math.max(0, Math.min(target, world.w * TILE - W));
    var camX = run.camX;
    var camY = world.h * TILE - H; // ancora o chão na base da tela

    // céu
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#7dd3f7');
    sky.addColorStop(1, '#c9ecfb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // nuvens (parallax)
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (var ci = 0; ci < 6; ci++) {
      var cx = ((ci * 340 - camX * 0.4) % (W + 300) + W + 300) % (W + 300) - 150;
      var cy = 40 + (ci % 3) * 55;
      ctx.fillRect(cx, cy, 70, 16);
      ctx.fillRect(cx + 14, cy - 12, 42, 14);
    }

    // tiles
    var tx0 = Math.floor(camX / TILE), tx1 = Math.ceil((camX + W) / TILE);
    for (var ty = 0; ty < world.h; ty++) {
      for (var tx = tx0; tx <= tx1 && tx < world.w; tx++) {
        if (tx < 0 || world.tiles[ty][tx] !== 1) continue;
        var sx = tx * TILE - camX, sy = ty * TILE - camY;
        // terra
        ctx.fillStyle = '#6b4023';
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = '#4a2a14';
        ctx.fillRect(sx + 6, sy + 14, 8, 8);
        ctx.fillRect(sx + 28, sy + 30, 10, 8);
        // grama no topo
        if (ty === 0 || world.tiles[ty - 1][tx] !== 1) {
          ctx.fillStyle = '#59a626';
          ctx.fillRect(sx, sy, TILE, 12);
          ctx.fillStyle = '#7cc93f';
          ctx.fillRect(sx, sy, TILE, 5);
          ctx.fillStyle = '#59a626';
          ctx.fillRect(sx + 8, sy + 12, 6, 4);
          ctx.fillRect(sx + 30, sy + 12, 6, 4);
        }
      }
    }

    // moedas
    run.world.coins.forEach(function (c) {
      if (c.taken) return;
      var bob = Math.sin(run.time / 15 + c.tx) * 4;
      var sx = c.tx * TILE - camX + TILE / 2, sy = c.ty * TILE - camY + TILE / 2 + bob;
      if (sx < -TILE || sx > W + TILE) return;
      ctx.fillStyle = '#f08c1b';
      ctx.beginPath(); ctx.arc(sx, sy, 13, 0, 7); ctx.fill();
      ctx.fillStyle = '#f4c531';
      ctx.beginPath(); ctx.arc(sx, sy, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#f08c1b';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', sx, sy + 1);
    });

    // portal
    if (world.portal) {
      var px = world.portal.tx * TILE - camX, py = world.portal.ty * TILE - camY;
      var glow = 4 + Math.sin(run.time / 10) * 3;
      ctx.fillStyle = 'rgba(122,63,191,.35)';
      ctx.fillRect(px - glow, py - TILE - glow, TILE + glow * 2, TILE * 2 + glow * 2);
      ctx.fillStyle = '#7a3fbf';
      ctx.fillRect(px, py - TILE, TILE, TILE * 2);
      ctx.fillStyle = '#b78ae0';
      ctx.fillRect(px + 8, py - TILE + 8, TILE - 16, TILE * 2 - 16);
      // bandeira
      ctx.fillStyle = '#17181c';
      ctx.fillRect(px + TILE - 6, py - TILE - 26, 4, 28);
      ctx.fillStyle = '#e84a8a';
      ctx.beginPath();
      ctx.moveTo(px + TILE - 2, py - TILE - 26);
      ctx.lineTo(px + TILE + 22, py - TILE - 18);
      ctx.lineTo(px + TILE - 2, py - TILE - 10);
      ctx.fill();
    }

    // jogador (pixel guy: cabelo preto, camisa vermelha, calça azul)
    var fx = p.x - camX, fy = p.y - camY;
    var walk = p.onGround && p.vx !== 0 ? Math.floor(p.frame / 6) % 2 : 0;
    ctx.save();
    ctx.translate(fx + p.w / 2, 0);
    ctx.scale(p.facing, 1);
    ctx.translate(-p.w / 2, 0);
    // pernas
    ctx.fillStyle = '#2b4fc9';
    if (!p.onGround) {
      ctx.fillRect(2, fy + 30, 9, 10);
      ctx.fillRect(17, fy + 32, 9, 8);
    } else if (walk) {
      ctx.fillRect(1, fy + 30, 9, 12);
      ctx.fillRect(18, fy + 30, 9, 12);
    } else {
      ctx.fillRect(5, fy + 30, 8, 12);
      ctx.fillRect(15, fy + 30, 8, 12);
    }
    // tênis
    ctx.fillStyle = '#f2ede1';
    ctx.fillRect(walk && p.onGround ? 0 : 4, fy + 39, 11, 3);
    ctx.fillRect(walk && p.onGround ? 18 : 15, fy + 39, 11, 3);
    // camisa
    ctx.fillStyle = '#d8342c';
    ctx.fillRect(3, fy + 16, 22, 15);
    // braço
    ctx.fillRect(22, fy + 17, 6, 11);
    // cabeça
    ctx.fillStyle = '#f0b98a';
    ctx.fillRect(5, fy + 2, 18, 15);
    // cabelo
    ctx.fillStyle = '#17181c';
    ctx.fillRect(4, fy, 20, 6);
    ctx.fillRect(4, fy + 2, 5, 8);
    // olho
    ctx.fillRect(17, fy + 8, 3, 3);
    ctx.restore();

    // dica de interação
    var c2 = nearestCoin();
    var hint = null;
    if (c2) hint = 'APERTE B PARA COLETAR';
    else if (atPortal()) hint = run.collected >= run.minCoins ? 'APERTE B PARA ENTRAR NO PORTAL' : 'PORTAL TRANCADO: ' + run.collected + '/' + run.minCoins + ' MOEDAS';
    if (hint) {
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var tw = ctx.measureText(hint).width + 24;
      ctx.fillStyle = 'rgba(23,24,28,.85)';
      ctx.fillRect(W / 2 - tw / 2, 14, tw, 30);
      ctx.fillStyle = '#f4c531';
      ctx.fillText(hint, W / 2, 30);
    }

    // placar da fase
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(23,24,28,.85)';
    ctx.fillRect(8, H - 34, 150, 26);
    ctx.fillStyle = '#f4c531';
    ctx.fillText('MOEDAS ' + run.collected + '/' + run.coinsTotal, 18, H - 21);
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    if (mode !== 'play' || !run) return;
    step();
    if (mode === 'play' && run) draw();
  }

  // ---------- quiz de moeda ----------
  function openCoinQuiz(coin) {
    mode = 'quiz';
    var qs = nextQuestions(run.level.questionsPerCoin);
    runQuiz({
      title: '🪙 DESAFIO DA MOEDA',
      questions: qs,
      needAll: true,
      onWin: function () {
        coin.taken = true;
        run.collected++;
        state.coins += COINS_PER_COIN;
        state.xp += XP_PER_CORRECT * qs.length;
        save(); updateHud();
        toast('Moeda coletada! +' + COINS_PER_COIN + ' 🪙  +' + (XP_PER_CORRECT * qs.length) + ' XP');
        resumePlay();
      },
      onFail: function () {
        loseHeart('Resposta errada! A moeda continua lá.');
        if (run) resumePlay();
      },
    });
  }

  // ---------- portal ----------
  function tryPortal() {
    if (run.collected < run.minCoins) {
      toast('Portal trancado! Colete ' + run.minCoins + ' moedas (você tem ' + run.collected + ').');
      return;
    }
    mode = 'quiz';
    var qs = nextQuestions(BOSS_QUESTIONS);
    runQuiz({
      title: '🌀 DESAFIO FINAL DO PORTAL',
      questions: qs,
      needAll: false,
      minCorrect: BOSS_MIN_CORRECT,
      onWin: function (correct) {
        state.coins += LEVEL_BONUS_COINS;
        state.xp += XP_PER_CORRECT * correct;
        if (state.completed.indexOf(run.level.id) === -1) state.completed.push(run.level.id);
        save(); updateHud();
        showLevelComplete(correct);
      },
      onFail: function (correct) {
        loseHeart('Faltou pouco! Acertos: ' + correct + '/' + BOSS_QUESTIONS + ' (precisa de ' + BOSS_MIN_CORRECT + ').');
        if (run) resumePlay();
      },
    });
  }

  function resumePlay() {
    if (!run) return;
    mode = 'play';
    hideOverlay();
  }

  // ---------- quiz genérico (overlay) ----------
  // cfg = { title, questions, needAll, minCorrect, onWin(correct), onFail(correct) }
  function runQuiz(cfg) {
    var idx = 0, correct = 0;

    function ask() {
      var q = cfg.questions[idx];
      var node = el(
        '<div class="panel">' +
          '<div class="q-topic">' + cfg.title + '</div>' +
          '<div class="q-progress">PERGUNTA ' + (idx + 1) + '/' + cfg.questions.length + '</div>' +
          '<div class="q-text">' + q.q + '</div>' +
          '<div class="answers"></div>' +
          '<div class="explain-slot"></div>' +
        '</div>'
      );
      var answersEl = node.querySelector('.answers');
      q.a.forEach(function (text, i) {
        var b = el('<button class="answer">' + text + '</button>');
        b.addEventListener('click', function () {
          node.querySelectorAll('.answer').forEach(function (bb) { bb.setAttribute('disabled', ''); });
          state.totalAnswered++;
          var right = i === q.correct;
          node.querySelectorAll('.answer')[q.correct].classList.add('correct');
          if (right) { correct++; state.totalCorrect++; }
          else b.classList.add('wrong');
          save();

          var slot = node.querySelector('.explain-slot');
          slot.appendChild(el('<div class="explain">💡 ' + q.exp + '</div>'));

          // no desafio da moeda um erro já encerra
          var failNow = !right && cfg.needAll;
          var last = idx + 1 >= cfg.questions.length;
          var label = failNow ? 'CONTINUAR ➤' : (last ? 'VER RESULTADO ★' : 'PRÓXIMA ➤');
          var next = el('<button class="btn">' + label + '</button>');
          next.addEventListener('click', function () {
            if (failNow) return cfg.onFail(correct);
            idx++;
            if (idx < cfg.questions.length) return ask();
            var passed = cfg.needAll ? correct === cfg.questions.length
                                     : correct >= (cfg.minCorrect || cfg.questions.length);
            if (passed) cfg.onWin(correct);
            else cfg.onFail(correct);
          });
          slot.appendChild(next);
        });
        answersEl.appendChild(b);
      });
      showOverlay(node);
    }
    ask();
  }

  // ---------- telas ----------
  function showHome() {
    run = null;
    mode = 'home';
    updateHud();
    var node = el(
      '<div class="panel">' +
        '<div class="title-card">' +
          '<div class="t1">TROQUE</div>' +
          '<div class="t2">O SCROLL</div>' +
          '<div class="tmid">═ POR UM ═</div>' +
          '<div class="t3">JOGO</div>' +
          '<div class="t4">DE FINANÇAS</div>' +
        '</div>' +
        '<div class="center"><span class="banner">MAPA DE FASES <span class="star">★</span></span></div>' +
        '<div class="quest-list"></div>' +
        '<div class="howto">◀ ▶ andar &nbsp; A pular &nbsp; B coletar/entrar</div>' +
      '</div>'
    );
    var list = node.querySelector('.quest-list');
    LEVELS.forEach(function (lv, i) {
      var done = state.completed.indexOf(lv.id) !== -1;
      var locked = i > 0 && state.completed.indexOf(LEVELS[i - 1].id) === -1;
      var card = el(
        '<button class="quest-card' + (locked ? ' locked' : '') + '" style="--c:' + lv.color + '">' +
          '<span class="quest-emoji">' + (locked ? '🔒' : lv.emoji) + '</span>' +
          '<span class="quest-info">' +
            '<div class="quest-pct">FASE ' + (i + 1) + (done ? ' ✔' : '') + '</div>' +
            '<div class="quest-name">' + lv.name + '</div>' +
          '</span>' +
          '<span class="quest-arrow">➤</span>' +
        '</button>'
      );
      card.addEventListener('click', function () {
        if (locked) return toast('Complete a fase anterior para desbloquear!');
        startLevel(lv);
      });
      list.appendChild(card);
    });
    showOverlay(node);
  }

  function showLevelComplete(bossCorrect) {
    mode = 'result';
    var lv = run.level;
    var idx = LEVELS.indexOf(lv);
    var next = LEVELS[idx + 1];
    var node = el(
      '<div class="panel center">' +
        '<div class="big-emoji">🏆</div>' +
        '<div class="result-title">FASE COMPLETA!</div>' +
        '<div class="result-sub">' + lv.emoji + ' ' + lv.name +
          '<br/>Moedas do mapa: ' + run.collected + '/' + run.coinsTotal +
          '<br/>Desafio final: ' + bossCorrect + '/' + BOSS_QUESTIONS + '</div>' +
        '<div class="reward-line">BÔNUS DE FASE: +' + LEVEL_BONUS_COINS + ' 🪙</div>' +
        (next ? '<button class="btn">PRÓXIMA FASE ➤</button>' : '<div class="reward-line">🎉 VOCÊ ZEROU O JOGO!</div>') +
        '<button class="btn alt">MAPA DE FASES ★</button>' +
        '<button class="btn warn">RECOMPENSAS 🎁</button>' +
      '</div>'
    );
    run = null;
    updateHud();
    if (next) node.querySelector('.btn').addEventListener('click', function () { startLevel(next); });
    node.querySelector('.btn.alt').addEventListener('click', showHome);
    node.querySelector('.btn.warn').addEventListener('click', showRewards);
    showOverlay(node);
  }

  function showGameOver() {
    mode = 'gameover';
    var lv = run.level;
    run = null;
    updateHud();
    var node = el(
      '<div class="panel center">' +
        '<div class="big-emoji">💔</div>' +
        '<div class="result-title" style="color:var(--red)">GAME OVER</div>' +
        '<div class="result-sub">Suas vidas acabaram!<br/>Moedas e XP ganhos ficam salvos.</div>' +
        '<button class="btn warn">TENTAR DE NOVO ↺</button>' +
        '<button class="btn alt">MAPA DE FASES ★</button>' +
      '</div>'
    );
    node.querySelector('.btn.warn').addEventListener('click', function () { startLevel(lv); });
    node.querySelector('.btn.alt').addEventListener('click', showHome);
    showOverlay(node);
  }

  function showRewards() {
    run = null;
    mode = 'rewards';
    updateHud();
    var node = el(
      '<div class="panel">' +
        '<div class="center"><span class="banner">RECOMPENSAS 🎁</span></div>' +
        '<div class="result-sub center">Troque suas moedas por medalhas!</div>' +
        '<div class="badge-grid"></div>' +
        '<button class="btn alt">MAPA DE FASES ★</button>' +
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
          if (state.coins < badge.cost) return toast('Moedas insuficientes! Complete fases para ganhar mais 🪙');
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
    showOverlay(node);
  }

  function showProfile() {
    run = null;
    mode = 'profile';
    updateHud();
    var acc = state.totalAnswered ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;
    var node = el(
      '<div class="panel">' +
        '<div class="center"><span class="banner">JOGADOR 🎮</span></div>' +
        '<div class="q-text">' +
          '<div class="stat-row"><span>NÍVEL</span><span>' + level() + '</span></div>' +
          '<div class="stat-row"><span>XP TOTAL</span><span>' + state.xp + '</span></div>' +
          '<div class="stat-row"><span>MOEDAS</span><span>' + state.coins + ' 🪙</span></div>' +
          '<div class="stat-row"><span>FASES COMPLETAS</span><span>' + state.completed.length + '/' + LEVELS.length + '</span></div>' +
          '<div class="stat-row"><span>MEDALHAS</span><span>' + state.badges.length + '/' + BADGES.length + '</span></div>' +
          '<div class="stat-row"><span>PRECISÃO</span><span>' + acc + '%</span></div>' +
        '</div>' +
        '<button class="btn alt">MAPA DE FASES ★</button>' +
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
    showOverlay(node);
  }

  // ---------- controles ----------
  function bindHold(id, prop) {
    var b = document.getElementById(id);
    function down(e) { e.preventDefault(); input[prop] = true; b.classList.add('pressed'); }
    function up(e) { e.preventDefault(); input[prop] = false; b.classList.remove('pressed'); }
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  bindHold('btn-left', 'left');
  bindHold('btn-right', 'right');

  function bindTap(id, fn) {
    var b = document.getElementById(id);
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      b.classList.add('pressed');
      setTimeout(function () { b.classList.remove('pressed'); }, 120);
      fn();
    });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  bindTap('btn-a', function () { if (mode === 'play') input.jumpQueued = true; });
  bindTap('btn-b', function () { if (mode === 'play') input.act = true; });

  // controle reserva: tocar na tela do jogo pula — ou interage se
  // estiver perto de uma moeda/portal (útil quando a barra do navegador
  // cobre os botões A/B no celular)
  canvas.addEventListener('pointerdown', function (e) {
    if (mode !== 'play' || !run) return;
    e.preventDefault();
    if (nearestCoin() || atPortal()) input.act = true;
    else input.jumpQueued = true;
  });

  // teclado (PC)
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
    if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyZ') { if (mode === 'play') { e.preventDefault(); input.jumpQueued = true; } }
    if (e.code === 'KeyX' || e.code === 'Enter') { if (mode === 'play') input.act = true; }
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
  });

  // navegação (START / SELECT)
  document.querySelectorAll('[data-nav]').forEach(function (b) {
    b.addEventListener('click', function () {
      var nav = b.getAttribute('data-nav');
      if (nav === 'home') showHome();
      else if (nav === 'rewards') showRewards();
    });
  });
  // botão A fora do jogo abre o perfil? Mantém A/B só para o jogo;
  // perfil fica acessível pelo toque longo em SELECT? Simples: duplo uso —
  // SELECT abre recompensas, e o perfil tem atalho no mapa de fases.
  // (atalho: segurar SELECT — omitido; card no rodapé do mapa)
  document.querySelector('.pad-title').addEventListener('click', showProfile);

  // hook de depuração (console)
  window.MG = { input: input, getMode: function () { return mode; }, getRun: function () { return run; } };

  // ---------- boot ----------
  resize();
  updateHud();
  showHome();
  loop();
})();
