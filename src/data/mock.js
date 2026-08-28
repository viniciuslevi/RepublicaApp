export const initialResidences = [
  {
    id: "rep-1",
    name: "República da Ana, Bruno e Carla",
    code: "REP-4F2A",
    membersCount: 3,
    address: "Rua Universitária, 120",
    description: "Moradia compartilhada padrão do app",
    members: ["Ana", "Bruno", "Carla"],
    adminId: "1",
  },
];

export const initialResidents = [
  { id: "1", name: "Ana", email: "ana@republica.com" },
  { id: "2", name: "Bruno", email: "bruno@republica.com" },
  { id: "3", name: "Carla", email: "carla@republica.com" },
];

export const initialTasks = [
  // Tarefas Únicas / Pontuais
  { id: "t0_1", title: "Trocar resistência do chuveiro", description: "Chuveiro do banheiro social queimou, comprar e trocar", assigneeId: "2", recurrence: "Única", priority: "Alta", done: false },
  { id: "t0_2", title: "Fazer cópia da chave do portão", description: "Levar ao chaveiro da esquina para fazer cópia reserva", assigneeId: "1", recurrence: "Única", priority: "Média", done: false },
  { id: "t0_3", title: "Montar mesa nova de estudos", description: "Montar a escrivaninha que chegou para a sala", assigneeId: null, recurrence: "Única", priority: "Baixa", done: true },

  // Tarefas Diárias
  { id: "t1_1", title: "Lavar a louça do dia", description: "Lavar e secar a louça acumulada na pia", assigneeId: "1", recurrence: "Diária", priority: "Alta", done: false },
  { id: "t1_2", title: "Tirar lixo da cozinha e banheiro", description: "Trocar sacos de lixo e fechar bem", assigneeId: "3", recurrence: "Diária", priority: "Média", done: false },
  { id: "t1_3", title: "Recolher correspondências", description: "Verificar boletos e entregas na portaria/caixa de correio", assigneeId: "2", recurrence: "Diária", priority: "Baixa", done: true },

  // Tarefas Semanais
  { id: "t2_1", title: "Limpar o banheiro completo", description: "Higienizar vaso sanitário, box de vidro e repor toalhas", assigneeId: null, recurrence: "Semanal", priority: "Alta", done: false },
  { id: "t2_2", title: "Colocar lixo reciclável na rua", description: "Coleta seletiva passa toda quarta-feira de manhã", assigneeId: "2", recurrence: "Semanal", priority: "Média", done: true },
  { id: "t2_3", title: "Varrer e passar pano nas áreas comuns", description: "Limpeza geral da sala, corredor e cozinha", assigneeId: "1", recurrence: "Semanal", priority: "Baixa", done: false },

  // Tarefas Mensais
  { id: "t3_1", title: "Comprar produtos de limpeza e mantimentos", description: "Detergentes, sacos de lixo, papel higiênico e desinfetante", assigneeId: "3", recurrence: "Mensal", priority: "Alta", done: false },
  { id: "t3_2", title: "Limpeza profunda da geladeira", description: "Descartar recipientes velhos e lavar prateleiras", assigneeId: "2", recurrence: "Mensal", priority: "Média", done: false },
  { id: "t3_3", title: "Checar botijão de gás e filtros", description: "Verificar se precisa pedir gás reserva ou trocar refil do filtro", assigneeId: null, recurrence: "Mensal", priority: "Baixa", done: true },
];

export const initialExpenses = [
  { id: "e1", description: "Conta de luz", value: 210.5, payerId: "1", participantIds: ["1", "2", "3"] },
  { id: "e2", description: "Mercado da semana", value: 180.0, payerId: "2", participantIds: ["1", "2", "3"] },
  { id: "e3", description: "Internet", value: 120.0, payerId: "3", participantIds: ["1", "2", "3"] },
];


