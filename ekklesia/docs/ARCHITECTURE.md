# Arquitetura da experiência

> Referência de direção: `docs/storyboard.png` (Fase 1 — Storyboard da
> Experiência, 15 quadros). **O arquivo ainda não está versionado neste
> repositório** — este protótipo foi construído a partir da imagem fornecida na
> conversa. Commite o PNG em `docs/` para que a referência fique junto do
> código.

O storyboard não é para ser reproduzido literalmente. Ele define a narrativa, o
ritmo e a paleta; a implementação decide como cada quadro vira movimento.

---

## O princípio: o scroll é o tempo

Não existe timeline que "toca". Existe **um número**, `0..1`, que diz onde a
narrativa está. A rolagem escreve esse número; tudo o mais o lê. Rolar para
trás roda a narrativa para trás, porque não há estado acumulado em lugar
nenhum — toda posição, rotação e opacidade é uma função pura do progresso.

Isso vale inclusive para o pó da queda (`Dust.tsx`): as partículas têm posição
em forma fechada, não simulada. Um sistema de partículas com estado ficaria
preso no ar assim que o usuário rolasse para cima.

```
rolagem
   │
   ▼
ScrollTrigger (scrub)  ──escreve──▶  progressStore.raw
                                          │
                     ticker do GSAP ──amortece──▶ progressStore.progress
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
            useFrame (WebGL)                         subscribe (DOM)
        semente, câmera, pó, sombra              legendas, hero, header
```

### Por que `ref` e não `useState`

O scrub escreve um valor novo a cada quadro. Passar isso por estado do React
re-renderizaria a árvore inteira ~60 vezes por segundo. `progressStore` é um
objeto mutável: a camada 3D **puxa** o valor dentro de `useFrame`, a camada DOM
**recebe** via `subscribe` e escreve `style` direto no elemento. Nenhuma
reconciliação no caminho quente.

### Por que um único ticker

Lenis, ScrollTrigger e o amortecimento rodam no mesmo `gsap.ticker`
(`SmoothScroll.tsx`). Dois loops de `requestAnimationFrame` independentes
deixariam DOM e WebGL defasados em um quadro — o suficiente para a legenda
"atrasar" visivelmente em relação à semente.

---

## Decisões estruturais

**Um `<Canvas>` que nunca desmonta.** A jornada dos 15 quadros é um único
movimento de câmera: semente → solo → raízes → caule → copa. Montar um canvas
por seção destruiria a continuidade justamente na transição mais importante
(quadro 10, a raiz percebida como caule). Capítulos futuros adicionam objetos a
*esta* cena.

**A câmera nunca reseta.** O Ato I termina com ela já descendo e apontada para
o solo (`choreography.ts` → `camera`). É exatamente a posição de que o quadro 06
("a câmera atravessa a superfície") precisa para continuar sem corte.

**Sem `pin`.** O palco é `position: fixed` e simplesmente nunca se move; o
`ScrollDriver` é uma coluna vazia cuja única função é ter altura. Nada para o
navegador fixar, nada para recalcular no resize.

**Híbrido de verdade.** O hero do quadro 04 é HTML real — `<h1>`, `<button>`,
foco, seleção de texto, indexação. A semente ao lado é a malha do canvas
compartilhado. Cada camada faz o que faz bem.

---

## Mapa dos arquivos

| Arquivo | Papel |
| --- | --- |
| `lib/scroll/progressStore.ts` | O número. Fonte única de verdade. |
| `lib/scene/sharedState.ts` | Posição da semente, publicada para o backdrop. |
| `lib/scroll/choreography.ts` | **A lista de planos.** Todos os keyframes do Ato I. |
| `lib/scroll/acts.ts` | Os 15 quadros do storyboard + faixas de scroll do Ato I. |
| `lib/math.ts` | `track()`, `window4()`, easings, `damp()`. |
| `components/scroll/SmoothScroll.tsx` | Lenis + ticker único + amortecimento. |
| `components/scroll/ScrollDriver.tsx` | A trilha de rolagem e o ScrollTrigger. |
| `components/experience/ExperienceCanvas.tsx` | O palco persistente. |
| `components/experience/CameraRig.tsx` | Câmera contínua + fundo. |
| `components/experience/Backdrop.tsx` | Fundo iluminado: wash, light pool, sombra projetada, grão. |
| `components/experience/StudioEnvironment.tsx` | Environment map gerado (PMREM), sem asset externo. |
| `components/experience/Lighting.tsx` | Key com shadow map + fill + rim. |
| `components/experience/GroundShadow.tsx` | Shadow catcher real + oclusão de contato. |
| `components/experience/Seed.tsx` | Coreografia da semente. |
| `components/experience/seedGeometry.ts` | Geometria + mapas de cor/rugosidade/normal procedurais. |
| `components/stage/Overlay.tsx` | Camada HTML fixa. |
| `components/stage/Caption.tsx` | Narração em itálico dos quadros. |
| `components/stage/Hero.tsx` | Quadro 04, em HTML acessível, reveal em máscara. |
| `components/stage/ScrollIndicator.tsx` | Indicador de scroll discreto. |
| `components/stage/BeatReadout.tsx` | Leitura de progresso, só com `?debug`. |

**Para retimar qualquer coisa, edite `choreography.ts`.** Os componentes só
amostram tracks; nenhum deles contém números de tempo.

---

## Direção visual do Ato I

Quatro coisas fazem o peso da imagem, e nenhuma delas é a geometria:

1. **O fundo é uma superfície iluminada, não um preenchimento.** `#ECDACB`
   chapado lê como janela vazia; o mesmo tom com wash vertical, poça de luz,
   vinheta e grão lê como fundo fotografado.
2. **A poça de luz e a sombra projetada seguem a posição da semente na tela.**
   É isso que integra objeto e tipografia no quadro 04 — os dois passam a estar
   no mesmo ambiente de luz, em vez de serem duas camadas empilhadas.
3. **Sombra de verdade.** Um shadow map (VSM, que é o único tipo nativo que
   respeita `shadow.radius`) projeta a silhueta real da semente e muda quando
   ela gira. Por cima, um sprite de gradiente dá a oclusão de contato que
   1024 px de shadow map não resolvem.
4. **Material com mapas.** Cor, rugosidade e normal são gerados a partir da
   *mesma* função de relevo da geometria, então o detalhe pintado coincide com
   o detalhe modelado. Sem environment map, um material PBR não tem o que
   refletir — é por isso que objetos three.js sem HDR parecem plástico.

O quadro 01 não tem texto: só areia, luz e o objeto. A narração entra com o
giro. Para restaurar a legenda de abertura, basta um `<Caption>` para
`semente` em `Overlay.tsx`.

## Estado atual

Construído: quadros **01 → 04** (semente, despertar, queda, home).
Planejado: quadros 05 → 15.

Rode com `?debug` na URL para ver o progresso global e o progresso local de
cada beat enquanto rola — indispensável para ajustar keyframes.

## Como estender para o Ato II

1. Acrescente as faixas dos novos beats em `acts.ts` e aumente
   `ACT_ONE_TRACK_VH` (ou crie uma segunda trilha com seu próprio
   `ScrollDriver` e um segundo store, se preferir capítulos independentes).
2. Escreva os tracks em `choreography.ts`, continuando de onde a câmera parou
   (`y ≈ -1.02`, `targetY ≈ -1.30`, descendo).
3. Adicione os objetos novos (solo, raízes) dentro do `<Canvas>` existente,
   cada um lendo `progressStore` no seu próprio `useFrame`. A ordem de leitura
   não importa: o store só é atualizado pelo ticker, então todos os
   consumidores enxergam o mesmo valor no mesmo quadro.

O quadro 10 — raiz virando caule — é o ponto que decide a arquitetura do Ato
II. A leitura recomendada é uma geometria só, com a câmera invertendo o sentido
da subida, e não dois objetos com crossfade.

---

## Acessibilidade

- `prefers-reduced-motion` desliga a inércia do Lenis, o amortecimento, a
  deriva ociosa e o pó. A experiência continua dirigida pelo scroll, que é
  controlada pelo usuário por definição.
- As legendas e o hero são texto real, disponíveis para leitores de tela.
- O hero usa `inert` até chegar de fato — o CTA não entra na ordem de tabulação
  antes de estar visível.
- Sem JavaScript, um bloco `<noscript>` devolve a página como conteúdo estático
  legível em vez de uma tela creme vazia.
