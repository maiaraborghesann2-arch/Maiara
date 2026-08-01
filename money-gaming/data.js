// ============ Money Gaming — conteúdo: perguntas e fases (PT-BR) ============
//
// Mapas: cada string é uma linha do mundo (tiles de 1 caractere):
//   X = bloco de terra (com grama automática no topo)
//   C = moeda (desafio de perguntas)
//   P = portal de fim de fase
//   S = ponto de partida do jogador
//   . ou espaço = vazio (buracos no chão fazem o jogador cair!)

const TOPICS = {
  'primeiros-passos': [
    {
      q: 'O que é uma reserva de emergência?',
      a: ['Dinheiro guardado para imprevistos, com resgate rápido', 'Um investimento de alto risco para lucrar rápido', 'O limite do cartão de crédito', 'Dinheiro emprestado do banco'],
      correct: 0,
      exp: 'A reserva de emergência é um valor guardado (de 3 a 6 meses de despesas) em aplicações de liquidez diária, para cobrir imprevistos sem precisar de dívidas.',
    },
    {
      q: 'Qual é o primeiro passo para organizar as finanças?',
      a: ['Comprar ações de empresas famosas', 'Mapear todas as receitas e despesas do mês', 'Pedir um empréstimo', 'Cancelar todos os cartões'],
      correct: 1,
      exp: 'Sem saber quanto entra e quanto sai, é impossível planejar. O orçamento é a base de tudo.',
    },
    {
      q: 'O que significa "pagar-se primeiro"?',
      a: ['Quitar todas as contas antes de qualquer coisa', 'Gastar com lazer no início do mês', 'Separar uma parte da renda para poupar assim que ela chega', 'Pagar o salário de funcionários'],
      correct: 2,
      exp: 'Pagar-se primeiro é reservar um percentual da renda para poupança/investimento antes de gastar.',
    },
    {
      q: 'Juros compostos são…',
      a: ['Juros calculados só sobre o valor inicial', 'Juros sobre juros: o rendimento também rende', 'Uma taxa cobrada pelo governo', 'Um tipo de imposto'],
      correct: 1,
      exp: 'Nos juros compostos, o rendimento de cada período é incorporado ao capital e também passa a render.',
    },
    {
      q: 'Qual atitude ajuda a sair das dívidas?',
      a: ['Pagar só o mínimo do cartão todo mês', 'Ignorar as cobranças', 'Fazer novas dívidas para pagar as antigas', 'Negociar taxas e priorizar as dívidas mais caras'],
      correct: 3,
      exp: 'Priorize as dívidas com juros mais altos (cartão e cheque especial) e negocie. Pagar só o mínimo faz a dívida virar bola de neve.',
    },
    {
      q: 'O rotativo do cartão de crédito é…',
      a: ['Uma das dívidas mais caras que existem', 'Um investimento do banco para você', 'Sempre sem juros', 'Um limite extra gratuito'],
      correct: 0,
      exp: 'O rotativo tem uma das maiores taxas de juros do mercado. Evite pagar menos que o valor total da fatura.',
    },
    {
      q: 'Um orçamento 50-30-20 sugere…',
      a: ['50% lazer, 30% contas, 20% doações', '50% necessidades, 30% desejos, 20% poupança/investimentos', '50% poupança, 30% aluguel, 20% comida', '50% cartão, 30% empréstimos, 20% contas'],
      correct: 1,
      exp: 'A regra 50-30-20 é um ponto de partida: metade da renda para o essencial, 30% para estilo de vida e 20% para construir patrimônio.',
    },
    {
      q: 'Inflação é…',
      a: ['O aumento do salário todo ano', 'Uma taxa que o banco paga', 'O aumento geral dos preços, que corrói o poder de compra', 'Um imposto sobre compras'],
      correct: 2,
      exp: 'Com inflação, o mesmo dinheiro compra menos com o tempo. Por isso dinheiro parado perde valor.',
    },
    {
      q: 'Guardar dinheiro "debaixo do colchão" faz você…',
      a: ['Ganhar juros', 'Ficar protegido da inflação', 'Dobrar o valor em um ano', 'Perder poder de compra com a inflação'],
      correct: 3,
      exp: 'Dinheiro parado não rende nada e a inflação corrói seu valor ano após ano.',
    },
    {
      q: 'Qual hábito fortalece a vida financeira?',
      a: ['Registrar os gastos e revisar o orçamento todo mês', 'Comprar por impulso nas promoções', 'Usar o limite total do cheque especial', 'Emprestar o cartão para amigos'],
      correct: 0,
      exp: 'Acompanhar os gastos revela vazamentos no orçamento e permite ajustar a rota antes de virar dívida.',
    },
  ],
  'bases-investimento': [
    {
      q: 'O que é renda fixa?',
      a: ['Investimento cuja regra de rendimento é definida na aplicação', 'Salário mensal de um trabalhador', 'Ações que nunca caem', 'Qualquer investimento sem risco algum'],
      correct: 0,
      exp: 'Na renda fixa (CDB, Tesouro Direto, LCI/LCA) você conhece a regra de remuneração ao investir: prefixada, pós-fixada ou atrelada à inflação.',
    },
    {
      q: 'O que é diversificação?',
      a: ['Investir tudo no ativo que mais subiu', 'Trocar de investimento todo dia', 'Distribuir o dinheiro em diferentes ativos para reduzir riscos', 'Guardar tudo na poupança'],
      correct: 2,
      exp: '"Não coloque todos os ovos na mesma cesta": diversificar reduz o impacto de um ativo ruim na carteira.',
    },
    {
      q: 'O que significa liquidez?',
      a: ['O quanto um investimento rende', 'A facilidade de transformar o investimento em dinheiro', 'O risco de perder tudo', 'A taxa cobrada pela corretora'],
      correct: 1,
      exp: 'Liquidez é a rapidez do resgate. Reserva de emergência pede alta liquidez; objetivos longos aceitam menos.',
    },
    {
      q: 'O que é o Tesouro Direto?',
      a: ['Um banco privado', 'Um tipo de criptomoeda', 'Um fundo de ações', 'Programa de venda de títulos públicos para pessoas físicas'],
      correct: 3,
      exp: 'No Tesouro Direto você empresta dinheiro ao governo federal comprando títulos públicos, os ativos mais seguros do país.',
    },
    {
      q: 'Risco e retorno normalmente…',
      a: ['Andam juntos: maior retorno potencial, maior risco', 'São inversamente proporcionais sempre', 'Não têm relação nenhuma', 'Só existem em criptomoedas'],
      correct: 0,
      exp: 'Não existe almoço grátis: promessa de retorno alto sem risco costuma ser golpe.',
    },
    {
      q: 'O que é o CDI?',
      a: ['Um imposto federal', 'Uma taxa de referência que baliza a renda fixa', 'Uma criptomoeda brasileira', 'O nome do cartão do banco central'],
      correct: 1,
      exp: 'O CDI acompanha de perto a taxa Selic e serve de referência: um CDB de "100% do CDI" rende aproximadamente a taxa básica da economia.',
    },
    {
      q: 'Uma ação representa…',
      a: ['Um empréstimo ao governo', 'Uma dívida da empresa com você', 'Uma pequena fração da propriedade de uma empresa', 'Um seguro contra crises'],
      correct: 2,
      exp: 'Quem compra ações vira sócio: participa dos lucros (dividendos) e da valorização — mas também dos riscos.',
    },
    {
      q: 'O que é um fundo de investimento?',
      a: ['Um condomínio de investidores com gestão profissional', 'Uma conta poupança especial', 'Um empréstimo coletivo', 'Um jogo de apostas regulamentado'],
      correct: 0,
      exp: 'No fundo, vários investidores aplicam juntos e um gestor profissional decide onde alocar, cobrando taxa por isso.',
    },
    {
      q: 'FGC (Fundo Garantidor de Créditos) protege…',
      a: ['Investimentos em ações', 'Até R$ 250 mil por CPF e instituição em produtos como CDB e poupança', 'Criptomoedas', 'Imóveis financiados'],
      correct: 1,
      exp: 'O FGC garante depósitos e títulos como CDB, LCI e LCA até R$ 250 mil por CPF por instituição financeira.',
    },
    {
      q: 'Investir todo mês um valor fixo (aportes regulares) ajuda a…',
      a: ['Garantir lucro em qualquer cenário', 'Eliminar todos os riscos', 'Ficar rico em poucas semanas', 'Construir patrimônio com disciplina e preço médio'],
      correct: 3,
      exp: 'Aportes regulares criam o hábito e diluem o preço de compra ao longo do tempo (preço médio).',
    },
  ],
  'tipos-impostos': [
    {
      q: 'O que é o Imposto de Renda (IR)?',
      a: ['Taxa fixa paga só por empresas', 'Tributo sobre rendimentos de pessoas e empresas', 'Imposto sobre compras no cartão', 'Multa por atraso de contas'],
      correct: 1,
      exp: 'O IR incide sobre salários, lucros e rendimentos de investimentos, geralmente com tabela regressiva nos investimentos.',
    },
    {
      q: 'O que é IOF?',
      a: ['Imposto sobre Operações Financeiras', 'Índice Oficial de Finanças', 'Investimento de Ordem Fixa', 'Imposto sobre Imóveis'],
      correct: 0,
      exp: 'O IOF incide sobre crédito, câmbio e resgates de investimentos em menos de 30 dias.',
    },
    {
      q: 'LCI e LCA são conhecidas por…',
      a: ['Pagarem o maior rendimento do mercado sempre', 'Serem investimentos do exterior', 'Serem isentas de IR para pessoa física', 'Não terem prazo de vencimento'],
      correct: 2,
      exp: 'LCI (imobiliário) e LCA (agronegócio) são isentas de IR para pessoa física, o que aumenta o rendimento líquido.',
    },
    {
      q: 'A tabela regressiva do IR em renda fixa começa em 22,5% e cai até…',
      a: ['20%', '17,5%', '10%', '15%'],
      correct: 3,
      exp: 'Alíquotas: 22,5% (até 180 dias), 20% (até 360), 17,5% (até 720) e 15% (acima de 720 dias).',
    },
    {
      q: 'Sobre vendas de ações acima de R$ 20 mil no mês incide…',
      a: ['IR de 15% sobre o lucro (operações comuns)', 'Nenhum imposto', 'IOF de 38%', 'IPVA'],
      correct: 0,
      exp: 'Operações comuns: vendas acima de R$ 20 mil/mês pagam 15% sobre o lucro. Day trade paga 20% sempre.',
    },
    {
      q: 'Dividendos de ações no Brasil atualmente são…',
      a: ['Tributados em 27,5% na fonte', 'Isentos de IR para pessoa física', 'Tributados como herança', 'Proibidos por lei'],
      correct: 1,
      exp: 'Dividendos distribuídos por empresas brasileiras chegam isentos de IR para a pessoa física (regra vigente, sempre confira mudanças na legislação).',
    },
    {
      q: '"Come-cotas" é…',
      a: ['Uma taxa da corretora', 'Um bônus semestral dos fundos', 'A antecipação semestral do IR em alguns fundos', 'Um imposto municipal'],
      correct: 2,
      exp: 'Em fundos de renda fixa e multimercado, o IR é antecipado a cada 6 meses reduzindo o número de cotas — o famoso come-cotas.',
    },
    {
      q: 'O IPTU é um imposto sobre…',
      a: ['A renda anual', 'Operações na bolsa', 'Veículos automotores', 'A propriedade de imóveis urbanos'],
      correct: 3,
      exp: 'IPTU é municipal e incide sobre imóveis urbanos. Sobre veículos é o IPVA; sobre renda, o IR.',
    },
    {
      q: 'Na poupança, o rendimento para pessoa física é…',
      a: ['Isento de Imposto de Renda', 'Tributado em 22,5%', 'Tributado em 15%', 'Tributado só acima de R$ 1 milhão'],
      correct: 0,
      exp: 'A poupança é isenta de IR — mas isso não a torna automaticamente o melhor investimento: o rendimento costuma perder de outras opções isentas.',
    },
    {
      q: 'Declarar Imposto de Renda serve para…',
      a: ['Pagar imposto em dobro', 'Prestar contas ao fisco e ajustar o que foi pago no ano', 'Abrir conta em banco', 'Aumentar o limite do cartão'],
      correct: 1,
      exp: 'A declaração anual ajusta as contas com a Receita: quem pagou a mais recebe restituição; quem pagou a menos, complementa.',
    },
  ],
  'rendimentos': [
    {
      q: 'Rendimento bruto é…',
      a: ['O rendimento após descontar impostos e taxas', 'O rendimento antes de qualquer desconto', 'Só o valor investido inicialmente', 'O rendimento da poupança'],
      correct: 1,
      exp: 'Bruto = antes dos descontos. Líquido = o que fica no bolso após IR, IOF e taxas.',
    },
    {
      q: 'Um CDB rendeu R$ 100 e teve R$ 15 de IR. O rendimento líquido foi…',
      a: ['R$ 115', 'R$ 100', 'R$ 85', 'R$ 15'],
      correct: 2,
      exp: 'Líquido = bruto − impostos: 100 − 15 = R$ 85.',
    },
    {
      q: 'Para comparar investimentos diferentes, o correto é olhar…',
      a: ['Só o rendimento bruto anunciado', 'A cor do aplicativo do banco', 'Apenas o nome do banco', 'O rendimento líquido, após impostos e taxas'],
      correct: 3,
      exp: 'Um CDB que paga mais bruto pode render menos que uma LCI isenta de IR. Compare sempre o líquido!',
    },
    {
      q: 'O que é rentabilidade real?',
      a: ['Rendimento descontada a inflação', 'Rendimento em dinheiro vivo', 'Rendimento de imóveis', 'Rendimento antes do IR'],
      correct: 0,
      exp: 'Se rendeu 10% e a inflação foi 5%, o poder de compra cresceu cerca de 4,8%. O ganho real é o que importa.',
    },
    {
      q: 'Taxa de administração de um fundo…',
      a: ['É devolvida ao investidor no fim do ano', 'Não afeta o resultado', 'Só existe em fundos ruins', 'Reduz o rendimento líquido do investidor'],
      correct: 3,
      exp: 'Taxas de administração e performance saem do seu bolso e corroem o rendimento ao longo dos anos.',
    },
    {
      q: 'Um investimento paga 12% ao ano com IR de 15% no resgate. O rendimento líquido aproximado é…',
      a: ['12%', '10,2%', '15%', '3%'],
      correct: 1,
      exp: '12% × (1 − 0,15) = 10,2% ao ano líquidos de IR.',
    },
    {
      q: 'Entre um CDB a 100% do CDI (com IR de 15%) e uma LCI a 90% do CDI (isenta), no longo prazo rende mais…',
      a: ['O CDB, sempre', 'Os dois rendem igual', 'A LCI: 90% isento supera 100% menos 15% de IR (85%)', 'Nenhum dos dois rende'],
      correct: 2,
      exp: 'CDB líquido ≈ 85% do CDI (100% × 0,85). A LCI isenta a 90% do CDI entrega mais — por isso o líquido é o que conta.',
    },
    {
      q: '"Rentabilidade passada não garante rentabilidade futura" significa…',
      a: ['O desempenho antigo de um ativo não assegura que ele se repetirá', 'Fundos antigos são sempre piores', 'O passado define o futuro dos investimentos', 'É proibido olhar o histórico'],
      correct: 0,
      exp: 'O histórico ajuda a analisar consistência, mas não é promessa: cenários mudam e o retorno futuro é incerto.',
    },
    {
      q: 'Dividendos recebidos de ações são um exemplo de…',
      a: ['Despesa financeira', 'Imposto retido', 'Amortização', 'Renda passiva'],
      correct: 3,
      exp: 'Dividendos são renda passiva: dinheiro que chega periodicamente sem você vender o patrimônio.',
    },
    {
      q: 'Se a inflação do ano foi 6% e seu investimento rendeu 6% líquidos, seu ganho real foi…',
      a: ['6%', 'Aproximadamente zero', '12%', '3%'],
      correct: 1,
      exp: 'Rendimento igual à inflação apenas preserva o poder de compra: o ganho real é praticamente nulo.',
    },
  ],
};

// ---------- Fases ----------
const LEVELS = [
  {
    id: 'primeiros-passos',
    name: 'Primeiros Passos',
    emoji: '⭐',
    color: 'var(--sky-deep)',
    questionsPerCoin: 1,
    map: [
      '............................................................',
      '............................................................',
      '............................................................',
      '.......................C....................C...............',
      '.....................XXXXX................XXXX..............',
      '..........C.................................................',
      '........XXXXX.......................C.................C.....P',
      '..S...............C..............XXXXX...........XXXXXXXXXXX',
      'XXXXXXXXXXXXXXX..XXXX....XXXXXX...........XXXXX..XXXXXXXXXXX',
      'XXXXXXXXXXXXXXX..XXXX....XXXXXX...........XXXXX..XXXXXXXXXXX',
    ],
  },
  {
    id: 'bases-investimento',
    name: 'Bases de Investimento',
    emoji: '🪙',
    color: 'var(--pink)',
    questionsPerCoin: 2,
    map: [
      '............................................................',
      '............................................................',
      '..............C.............................................',
      '............XXXX...........C...............C................',
      '..........................XXX.....C......XXXX...............',
      '.....C...........................XXX........................',
      '...XXXXX.............................................C.....P',
      '..S..............C..............................XXXXXXXXXXXX',
      'XXXXXXXXXX....XXXXXX....XXXX...XXXXX....XXXXX...XXXXXXXXXXXX',
      'XXXXXXXXXX....XXXXXX....XXXX...XXXXX....XXXXX...XXXXXXXXXXXX',
    ],
  },
  {
    id: 'tipos-impostos',
    name: 'Tipos de Impostos',
    emoji: '🧰',
    color: 'var(--green)',
    questionsPerCoin: 2,
    map: [
      '............................................................',
      '..................C.........................................',
      '................XXXX..........C.............................',
      '.............................XXX........C...................',
      '.......C...............................XXXX......C..........',
      '.....XXXX.......................................XXXX........',
      '..............................................             .',
      '..S.........C.............C..........C...............C.....P',
      'XXXXXXXX..XXXXX...XXX...XXXXX...X..XXXXX...XXX....XXXXXXXXXX',
      'XXXXXXXX..XXXXX...XXX...XXXXX...X..XXXXX...XXX....XXXXXXXXXX',
    ],
  },
  {
    id: 'rendimentos',
    name: 'Rendimentos Brutos e Líquidos',
    emoji: '💰',
    color: 'var(--purple)',
    questionsPerCoin: 3,
    map: [
      '............................................................',
      '..........C.................C...............................',
      '........XXXX...............XXX..............C...............',
      '...........................................XXX..............',
      '.....C..........C....................C......................',
      '...XXXX........XXX.................XXXX..........C..........',
      '................................................XXXX........',
      '..S..................C.....................................P',
      'XXXXXXX...XXX....XXXXXXX...XX...XXXX...XX...XXX...XXXXXXXXXX',
      'XXXXXXX...XXX....XXXXXXX...XX...XXXX...XX...XXX...XXXXXXXXXX',
    ],
  },
];

const BADGES = [
  { id: 'poupador', emoji: '🐷', name: 'Poupador Iniciante', cost: 50 },
  { id: 'cofre', emoji: '🧱', name: 'Cofre de Tijolos', cost: 120 },
  { id: 'grafico', emoji: '📈', name: 'Mestre dos Gráficos', cost: 200 },
  { id: 'diamante', emoji: '💎', name: 'Mãos de Diamante', cost: 300 },
  { id: 'foguete', emoji: '🚀', name: 'Rumo à Lua', cost: 450 },
  { id: 'coroa', emoji: '👑', name: 'Rei das Finanças', cost: 600 },
];

const XP_PER_CORRECT = 20;
const COINS_PER_COIN = 10;      // moedas ganhas por moeda coletada no mapa
const LEVEL_BONUS_COINS = 50;   // bônus ao completar a fase
const BOSS_QUESTIONS = 5;       // perguntas do portal
const BOSS_MIN_CORRECT = 4;     // acertos mínimos para passar no portal
const PORTAL_COIN_RATIO = 0.7;  // fração das moedas da fase exigida no portal
const XP_PER_LEVEL = 100;
const MAX_HEARTS = 3;
