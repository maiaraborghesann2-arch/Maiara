# 🎮 Money Gaming — Finanças Level Up!

Jogo de finanças baseado em recompensas, com estética retrô pixel-art (estilo Game Boy). Troque o scroll por quests de educação financeira!

## Como funciona

Agora é um **plataforma 2D** com controles reais no gamepad:

- **◀ ▶** andam, **A** pula, **B** interage (no PC: setas/WASD, espaço e X).
- **4 fases** em ordem de dificuldade: Primeiros Passos ⭐, Bases de Investimento 🪙, Tipos de Impostos 🧰 e Rendimentos Brutos e Líquidos 💰. Cada fase desbloqueia a próxima.
- **Moedas no mapa**: chegue perto e aperte **B** — abre um desafio de 1 a 3 perguntas (conforme a fase). Acertou tudo, coleta a moeda (**+10 🪙** e XP); errou, perde uma vida e a moeda continua lá.
- **Portal de fim de fase**: só destrava com ~70% das moedas do mapa. Ao entrar, vem o **desafio final de 5 perguntas** (mínimo 4 acertos). Passou: bônus de +50 moedas e próxima fase liberada.
- **Vidas (♥♥♥)**: errar perguntas ou cair em buracos custa vida; três perdas = Game Over (o que já foi ganho fica salvo).
- **Níveis**: a cada 100 XP você sobe de nível na barra do topo.
- **Recompensas 🎁** (SELECT): troque moedas por medalhas colecionáveis.
- **Perfil 🎮** (toque em "FINANÇAS LEVEL UP!"): estatísticas do jogador.
- Progresso salvo automaticamente no aparelho (`localStorage`).

## Rodando

Sem build, sem dependências — é 100% estático:

```bash
cd money-gaming
python3 -m http.server 8080
# abra http://localhost:8080
```

Ou publique a pasta em qualquer host estático (GitHub Pages, Netlify, Vercel).

## Mobile-first (PWA)

- Layout otimizado para celular (moldura de console em telas grandes).
- Instalável na tela inicial (manifest + service worker com cache offline).
- Funciona offline após o primeiro acesso.

## Estrutura

| Arquivo | Função |
| --- | --- |
| `index.html` | Estrutura da tela: HUD, área de jogo e gamepad |
| `styles.css` | Estética pixel-art (fonte Press Start 2P, grade de papel, botões A/B) |
| `data.js` | Conteúdo das quests, perguntas e medalhas (edite aqui para adicionar conteúdo) |
| `game.js` | Lógica: estado, telas, recompensas, persistência |
| `sw.js` / `manifest.webmanifest` | PWA: offline + instalação |
