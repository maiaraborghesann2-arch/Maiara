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
| `components/experience/Lighting.tsx` | Key com deriva de azimute + fill + rim. |
| `components/experience/GroundShadow.tsx` | Sombras de contato projetadas nas duas superfícies. |
| `components/experience/Motes.tsx` | Partículas ambientes, para dar paralaxe ao vazio. |
| `components/experience/Seed.tsx` | Coreografia da semente. |
| `components/experience/seedGeometry.ts` | Grão procedural + mapas de cor/rugosidade/AO/normal. |
| `components/stage/Overlay.tsx` | Camada HTML fixa. |
| `components/stage/Caption.tsx` | Narração em itálico dos quadros. |
| `components/stage/Hero.tsx` | Quadro 04, em HTML acessível, reveal em máscara. |
| `components/stage/ScrollIndicator.tsx` | Indicador de scroll discreto. |
| `components/stage/BeatReadout.tsx` | Leitura de progresso, só com `?debug`. |

**Para retimar qualquer coisa, edite `choreography.ts`.** Os componentes só
amostram tracks; nenhum deles contém números de tempo.

---

## Direção visual do Ato I

Cinco decisões carregam a imagem, e nenhuma delas é "mais elementos":

1. **A escala aparente é trabalho de lente, não de escala.** A semente tem
   tamanho constante; quem muda é a câmera — abre larga (5% da altura do
   quadro), avança em macro para o giro, recua na queda. Objetos reais não
   crescem, e deixar a lente fazer esse trabalho é a maior parte do motivo pelo
   qual a sequência lê como fotografada.

2. **A chegada da semente é a causa da Home.** Ela não desliza para o hero: cai,
   toca a terra e fica parada. Quem se move é a câmera — dolly lateral para a
   esquerda, com o alvo acompanhando o próprio `x` para transladar em vez de
   girar. O quadro sai de cima do objeto e abre a coluna de texto à esquerda.
   Uma rotação manteria a semente presa ao centro e destruiria o efeito.

3. **O fundo é uma superfície fotografada.** Wash vertical, poça de luz que
   segue a semente, névoa atmosférica, vinheta e uma textura de fibra esticada
   sob tudo. Tire qualquer uma e o quadro volta a ser "janela de navegador
   vazia".

4. **A sombra conta a distância.** Duas superfícies — o parapeito e a terra —
   cada uma com sua própria autoridade. Opacidade, espalhamento e deslocamento
   na direção da luz derivam do *vão* entre a semente e cada superfície. A do
   parapeito se dissolve enquanto a da terra resolve de um borrão enorme até um
   contato fechado. É a sombra dizendo ao olho quanto de queda ainda falta.

5. **A rede de ranhuras precisa de domínio deformado.** `min` dos três campos de
   ridge (não a soma) produz uma rede de linhas em vez de manchas isoladas; e
   avaliar esses campos em coordenadas retas dá uma regularidade de cestaria.
   Deformar o espaço antes de medir é o que torna a rede orgânica.

**Sobre o shadow map:** foi tentado e descartado. VSM é o único tipo nativo que
respeita `shadow.radius`, mas sangra quando a luz acompanha um objeto em queda
por um frustum apertado — deixava um oval cinza solto na areia durante o pouso.
Num objeto que lê com sessenta pixels de altura, o detalhe de silhueta que o
mapa compra é invisível; o artefato não era. As sombras são desenhadas
diretamente, o que também elimina um passe de render por quadro.

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
