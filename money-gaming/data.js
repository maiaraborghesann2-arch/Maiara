// ============ Money Gaming — conteúdo das quests (PT-BR) ============
const QUESTS = [
  {
    id: 'primeiros-passos',
    name: 'Primeiros Passos',
    emoji: '⭐',
    color: 'var(--sky-deep)',
    questions: [
      {
        q: 'O que é uma reserva de emergência?',
        a: [
          'Dinheiro guardado para imprevistos, com resgate rápido',
          'Um investimento de alto risco para lucrar rápido',
          'O limite do cartão de crédito',
          'Dinheiro emprestado do banco',
        ],
        correct: 0,
        exp: 'A reserva de emergência é um valor guardado (geralmente de 3 a 6 meses de despesas) em aplicações de liquidez diária, para cobrir imprevistos sem precisar de dívidas.',
      },
      {
        q: 'Qual é o primeiro passo para organizar as finanças?',
        a: [
          'Comprar ações de empresas famosas',
          'Mapear todas as receitas e despesas do mês',
          'Pedir um empréstimo',
          'Cancelar todos os cartões',
        ],
        correct: 1,
        exp: 'Sem saber quanto entra e quanto sai, é impossível planejar. O orçamento é a base de tudo.',
      },
      {
        q: 'O que significa "pagar-se primeiro"?',
        a: [
          'Quitar todas as contas antes de qualquer coisa',
          'Gastar com lazer no início do mês',
          'Separar uma parte da renda para poupar assim que ela chega',
          'Pagar o salário de funcionários',
        ],
        correct: 2,
        exp: 'Pagar-se primeiro é reservar um percentual da renda para poupança/investimento antes de gastar, tratando o próprio futuro como a conta mais importante.',
      },
      {
        q: 'Juros compostos são…',
        a: [
          'Juros calculados só sobre o valor inicial',
          'Juros sobre juros: o rendimento também rende',
          'Uma taxa cobrada pelo governo',
          'Um tipo de imposto',
        ],
        correct: 1,
        exp: 'Nos juros compostos, o rendimento de cada período é incorporado ao capital e também passa a render. É o motor do crescimento de longo prazo.',
      },
      {
        q: 'Qual atitude ajuda a sair das dívidas?',
        a: [
          'Pagar só o mínimo do cartão todo mês',
          'Ignorar as cobranças',
          'Fazer novas dívidas para pagar as antigas',
          'Negociar taxas e priorizar as dívidas mais caras',
        ],
        correct: 3,
        exp: 'Priorize as dívidas com juros mais altos (como cartão e cheque especial) e negocie. Pagar só o mínimo faz a dívida crescer como bola de neve.',
      },
    ],
  },
  {
    id: 'bases-investimento',
    name: 'Bases de Investimento',
    emoji: '🪙',
    color: 'var(--pink)',
    questions: [
      {
        q: 'O que é renda fixa?',
        a: [
          'Investimento cuja regra de rendimento é definida no momento da aplicação',
          'Salário mensal de um trabalhador',
          'Ações que nunca caem',
          'Qualquer investimento sem risco algum',
        ],
        correct: 0,
        exp: 'Na renda fixa (CDB, Tesouro Direto, LCI/LCA) você conhece a regra de remuneração ao investir: prefixada, pós-fixada ou atrelada à inflação.',
      },
      {
        q: 'O que é diversificação?',
        a: [
          'Investir tudo no ativo que mais subiu',
          'Trocar de investimento todo dia',
          'Distribuir o dinheiro em diferentes ativos para reduzir riscos',
          'Guardar tudo na poupança',
        ],
        correct: 2,
        exp: '"Não coloque todos os ovos na mesma cesta": diversificar reduz o impacto de um ativo ruim na carteira como um todo.',
      },
      {
        q: 'O que significa liquidez?',
        a: [
          'O quanto um investimento rende',
          'A facilidade de transformar o investimento em dinheiro',
          'O risco de perder tudo',
          'A taxa cobrada pela corretora',
        ],
        correct: 1,
        exp: 'Liquidez é a rapidez com que você resgata o dinheiro. Reserva de emergência pede alta liquidez; objetivos longos aceitam menos.',
      },
      {
        q: 'O que é o Tesouro Direto?',
        a: [
          'Um banco privado',
          'Um tipo de criptomoeda',
          'Um fundo de ações',
          'Programa de venda de títulos públicos do governo para pessoas físicas',
        ],
        correct: 3,
        exp: 'O Tesouro Direto permite emprestar dinheiro ao governo federal comprando títulos públicos, considerados os ativos mais seguros do país.',
      },
      {
        q: 'Risco e retorno normalmente…',
        a: [
          'Andam juntos: maior retorno potencial, maior risco',
          'São inversamente proporcionais sempre',
          'Não têm relação nenhuma',
          'Só existem em criptomoedas',
        ],
        correct: 0,
        exp: 'Não existe almoço grátis: promessas de retorno alto sem risco costumam ser golpe. Avalie sempre o binômio risco × retorno.',
      },
    ],
  },
  {
    id: 'tipos-impostos',
    name: 'Tipos de Impostos',
    emoji: '🧰',
    color: 'var(--green)',
    questions: [
      {
        q: 'O que é o Imposto de Renda (IR)?',
        a: [
          'Taxa fixa paga só por empresas',
          'Tributo sobre rendimentos de pessoas e empresas',
          'Imposto sobre compras no cartão',
          'Multa por atraso de contas',
        ],
        correct: 1,
        exp: 'O IR incide sobre salários, lucros e rendimentos de investimentos. Nos investimentos, geralmente segue tabela regressiva: quanto mais tempo investido, menor a alíquota.',
      },
      {
        q: 'O que é IOF?',
        a: [
          'Imposto sobre Operações Financeiras',
          'Índice Oficial de Finanças',
          'Investimento de Ordem Fixa',
          'Imposto sobre Imóveis',
        ],
        correct: 0,
        exp: 'O IOF incide sobre operações de crédito, câmbio e resgates de investimentos em menos de 30 dias — mais um motivo para não resgatar cedo demais.',
      },
      {
        q: 'LCI e LCA são conhecidas por…',
        a: [
          'Pagarem o maior rendimento do mercado sempre',
          'Serem investimentos do exterior',
          'Serem isentas de IR para pessoa física',
          'Não terem prazo de vencimento',
        ],
        correct: 2,
        exp: 'LCI (imobiliário) e LCA (agronegócio) são isentas de Imposto de Renda para pessoas físicas, o que aumenta o rendimento líquido.',
      },
      {
        q: 'A tabela regressiva do IR em renda fixa começa em 22,5% e cai até…',
        a: ['20%', '17,5%', '10%', '15%'],
        correct: 3,
        exp: 'Alíquotas: 22,5% (até 180 dias), 20% (até 360), 17,5% (até 720) e 15% (acima de 720 dias). Paciência reduz imposto!',
      },
      {
        q: 'Sobre vendas de ações acima de R$ 20 mil no mês incide…',
        a: [
          'IR de 15% sobre o lucro (operações comuns)',
          'Nenhum imposto',
          'IOF de 38%',
          'IPVA',
        ],
        correct: 0,
        exp: 'Em operações comuns com ações, vendas acima de R$ 20 mil/mês têm IR de 15% sobre o lucro. Day trade paga 20% independentemente do valor.',
      },
    ],
  },
  {
    id: 'rendimentos',
    name: 'Rendimentos Brutos e Líquidos',
    emoji: '💰',
    color: 'var(--purple)',
    questions: [
      {
        q: 'Rendimento bruto é…',
        a: [
          'O rendimento após descontar impostos e taxas',
          'O rendimento antes de qualquer desconto',
          'Só o valor investido inicialmente',
          'O rendimento da poupança',
        ],
        correct: 1,
        exp: 'Bruto = antes dos descontos. Líquido = o que efetivamente fica no seu bolso após IR, IOF e taxas.',
      },
      {
        q: 'Um CDB rendeu R$ 100 e teve R$ 15 de IR. O rendimento líquido foi…',
        a: ['R$ 115', 'R$ 100', 'R$ 85', 'R$ 15'],
        correct: 2,
        exp: 'Líquido = bruto − impostos: 100 − 15 = R$ 85.',
      },
      {
        q: 'Para comparar investimentos diferentes, o correto é olhar…',
        a: [
          'Só o rendimento bruto anunciado',
          'A cor do aplicativo do banco',
          'Apenas o nome do banco',
          'O rendimento líquido, após impostos e taxas',
        ],
        correct: 3,
        exp: 'Um CDB que paga mais bruto pode render menos que uma LCI isenta de IR. Compare sempre o líquido!',
      },
      {
        q: 'O que é rentabilidade real?',
        a: [
          'Rendimento descontada a inflação',
          'Rendimento em dinheiro vivo',
          'Rendimento de imóveis',
          'Rendimento antes do IR',
        ],
        correct: 0,
        exp: 'Se o investimento rendeu 10% e a inflação foi 5%, seu poder de compra cresceu cerca de 4,8%. É a inflação que define o ganho real.',
      },
      {
        q: 'Taxa de administração de um fundo…',
        a: [
          'É devolvida ao investidor no fim do ano',
          'Não afeta o resultado',
          'Só existe em fundos ruins',
          'Reduz o rendimento líquido do investidor',
        ],
        correct: 3,
        exp: 'Taxas de administração e performance saem do seu bolso e corroem o rendimento. Compare custos antes de investir.',
      },
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
const COINS_PER_CORRECT = 10;
const QUEST_BONUS_COINS = 30;
const XP_PER_LEVEL = 100;
const MAX_HEARTS = 3;
