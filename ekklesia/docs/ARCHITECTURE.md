# Arquitetura

Duas coisas rodam nesta página: um filme controlado pelo scroll, e um site
comum. Elas se encontram uma vez, no fim da abertura, e não compartilham
sistema nenhum além do scroll suave.

---

## 1. A abertura

O princípio: **o scroll é o tempo**. Não existe timeline que "toca" — existe um
número, `0..1`, que diz onde a narrativa está. A rolagem escreve esse número; o
vídeo o lê. Rolar para trás roda o filme para trás, porque a posição é função
pura do progresso e não há estado acumulado em lugar nenhum.

```
rolagem
   │
   ▼
ScrollTrigger (scrub)  ──escreve──▶  cinematicStore.raw
                                          │
                     ticker do GSAP ──amortece──▶ .progress
                                          │
                                    subscribe (DOM)
                                          │
                          videoProgressFor(scroll) × duration
                                          │
                                  video.currentTime
```

**Um único ticker.** Lenis, ScrollTrigger e o amortecimento rodam no mesmo
`gsap.ticker` (`SmoothScroll.tsx`). Dois loops de `requestAnimationFrame`
independentes ficariam defasados em um quadro.

**Nada de `useState` no caminho quente.** O scrub escreve um valor novo a cada
quadro; passar isso por estado do React re-renderizaria a árvore ~60 vezes por
segundo. `cinematicStore` é um objeto mutável e o componente escreve
`currentTime` direto no elemento.

**Buscas são coalescidas, não enfileiradas.** O alvo é atualizado todo quadro,
mas uma busca só é emitida quando o elemento não está buscando. Pedir uma nova
posição enquanto a anterior não resolveu faz o navegador descartar as
intermediárias — a imagem congela e depois pula.

**O palco é `position: sticky`.** É todo o mecanismo de fixação: sem
`position: fixed`, sem pin em JS, nada para o navegador recalcular no resize.

### Trocar o filme

`lib/cinematic/config.ts` é o contrato inteiro. `VIDEO_SRC` e
`AUTHORED_DURATION`, e nada mais no projeto sabe qual filme está tocando. Um
filme de outra duração mapeia proporcionalmente sozinho, porque a curva é
normalizada pela duração autorada e reexpandida contra a duração real do
elemento. O arquivo traz a receita de ffmpeg e os dois requisitos que não são
negociáveis: **8 bits** (nenhum navegador decodifica H.264 10 bits) e
**keyframe em todo quadro** (scrubbing busca posições arbitrárias).

---

## 2. O site

Tudo abaixo da abertura é HTML rolando normalmente. O único script que o toca é
`useReveal`, que escreve um atributo por elemento, uma vez, e para.

**Reveals são IntersectionObserver + CSS, nunca GSAP.** A abertura já tem um
ScrollTrigger, o Lenis e o único ticker; um segundo sistema de animação no mesmo
scroll só teria chances de discordar do primeiro no resize. O que o conteúdo
precisa é de uma flag "isto já foi visto", e é isso que ele tem.

Uma armadilha registrada no código: o atributo vai no **invólucro** das linhas
mascaradas, nunca na linha. A linha se esconde transladando para fora de um
`overflow: hidden`, então um observer olhando para ela a veria como
permanentemente recortada por um ancestral e nunca dispararia.

**O cabeçalho não mede nada por quadro.** Ele inverte sobre as seções escuras
por `IntersectionObserver` (um elemento fixo não herda de quem ele cobre), e sai
do caminho na descida com um listener passivo que difere a leitura para um
quadro.

**Todo o texto mora em `lib/site/content.ts`.** Os layouts são construídos para
aceitar linhas mais longas ou mais curtas do que as que estão lá. O que não vem
dos materiais do projeto está marcado `placeholder: true`.

---

## 3. O que não roda mais

`components/experience/*`, `lib/scroll/choreography.ts`, os stores de ato em
`lib/scroll/stage.ts`, os componentes em `components/stage/` além de
`Experience.tsx`, e os estilos de tudo isso em `styles/legacy.css`.

Era a experiência procedural em Three.js/R3F que precedeu o filme: semente,
solo, raízes e broto construídos com shaders e geometria. Foi substituída, mas
nada foi apagado — nenhum desses arquivos é importado, então estão fora do
bundle além de estarem fora do quadro. Existe exatamente **um** sistema visual
rodando. `styles/legacy.css` não é importado por ninguém; uma linha em
`globals.css` o traria de volta junto com os componentes.
