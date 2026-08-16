# Ekklesia Connect

Experiência web cinematográfica controlada por scroll — a jornada de uma
semente que se torna árvore.

**Estado: protótipo do Ato I** (quadros 01 → 04 do storyboard: semente →
giro → queda → chegada à Home). Os quadros 05 a 15 ainda não foram
construídos.

## Stack

Next.js 16 (App Router) · React 19 · Three.js via React Three Fiber ·
GSAP/ScrollTrigger · Lenis

## Rodando

```bash
cd ekklesia
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção
npm run typecheck
```

Abra `http://localhost:3000/?debug` para ver o progresso do scroll e de cada
beat em tempo real — é o que se usa para ajustar os keyframes.

## O que ler primeiro

- **`docs/ARCHITECTURE.md`** — como o scroll dirige a cena e por quê.
- **`lib/scroll/choreography.ts`** — todos os tempos e posições do Ato I em um
  arquivo só. É aqui que se retima a sequência.

## Referência de arte

`docs/storyboard.png` — Fase 1, 15 quadros. Direção de arte e narrativa, não
imagem a ser reproduzida literalmente. **O arquivo ainda não está no
repositório**; commite-o em `docs/`.

## Nota sobre o repositório

A raiz deste repositório contém um projeto separado e não relacionado
("Lyken Agency", em Vite). O site da Ekklesia Connect vive inteiramente dentro
de `ekklesia/` e não compartilha nada com ele.
