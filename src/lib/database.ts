// Database table names - match exactly with PostgreSQL tables
export const DB_TABLES = {
  ALUNOS: 'ci_alunos_pacientes',
  TURMAS: 'ci_turmas_tratamentos',
  ALUNO_TURMA: 'ci_aluno_turma',
  FINANCEIRO: 'ci_financeiro',
} as const;

// Column mappings for each table
// These match the exact column names in PostgreSQL

export const ALUNO_COLUMNS = {
  id: 'id',
  nome: 'nome',
  email: 'email',
  telefone: 'telefone',
  data_nascimento: 'data_nascimento',
  cpf: 'cpf',
  endereco: 'endereco',
  status: 'status',
  data_matricula: 'data_matricula',
  observacoes: 'observacoes',
  vendedor: 'vendedor',
  valor_venda: 'valor_venda',
  parcelas: 'parcelas',
  pos_graduacao: 'pos_graduacao',
} as const;

export const TURMA_COLUMNS = {
  id: 'id',
  nome: 'nome',
  descricao: 'descricao',
  data_inicio: 'data_inicio',
  data_fim: 'data_fim',
  horario: 'horario',
  local: 'local',
  capacidade: 'capacidade',
  instrutor: 'instrutor',
  status: 'status',
  valor: 'valor',
} as const;

export const ALUNO_TURMA_COLUMNS = {
  id: 'id',
  aluno_id: 'aluno_id',
  turma_id: 'turma_id',
  data_inscricao: 'data_inscricao',
  status: 'status',
} as const;

export const FINANCEIRO_COLUMNS = {
  id: 'id',
  categoria: 'categoria',
  descricao: 'descricao',
  quantidade: 'quantidade',
  valor_unitario: 'valor_unitario',
  valor_total: 'valor_total',
  tipo: 'tipo',
  data: 'data',
  turma_id: 'turma_id',
  observacoes: 'observacoes',
} as const;

// Type aliases for database table rows (for future Supabase integration)
export type CiAlunosPacientes = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cpf: string;
  endereco: string;
  status: string;
  data_matricula: string;
  observacoes: string;
  vendedor: string;
  valor_venda: string;
  parcelas: string;
  pos_graduacao: boolean;
};

export type CiTurmasTratamentos = {
  id: string;
  nome: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  horario: string;
  local: string;
  capacidade: string;
  instrutor: string;
  status: string;
  valor: string;
};

export type CiAlunoTurma = {
  id: string;
  aluno_id: string;
  turma_id: string;
  data_inscricao: string;
  status: string;
};

export type CiFinanceiro = {
  id: string;
  categoria: string;
  descricao: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  tipo: string;
  data: string;
  turma_id: string | null;
  observacoes: string;
};
