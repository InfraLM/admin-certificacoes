// Types based on the PostgreSQL tables (all VARCHAR in DB)
// 
// TABLE MAPPING:
// - Aluno              → ci_alunos
// - Turma              → ci_turmas
// - AlunoTurma         → ci_aluno_turma
// - Financeiro         → ci_financeiro
// - FinanceiroAluno    → ci_financeiro_aluno
// - FinanceiroTurma    → ci_financeiro_turma

/**
 * Represents a student/patient record
 * PostgreSQL table: ci_alunos_pacientes
 */
export interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string; // dd/mm/yyyy format
  cpf: string;
  endereco: string;
  status: 'Ativo' | 'Inativo' | 'Em Onboarding' | 'Boas-vindas' | 'Envio do Livro' | 'Grupo da Turma' | 'Concluído';
  data_matricula: string; // dd/mm/yyyy format
  observacoes: string;
  // New fields
  vendedor: string;
  valor_venda: string; // NUMERIC returns string from PG
  parcelas: number; // INTEGER returns number
  pos_graduacao: boolean;
  turma_id?: string;
}

/**
 * Represents a class/treatment group
 * PostgreSQL table: ci_turmas_tratamentos
 */
export interface Turma {
  id: string;
  nome: string;
  descricao: string;
  data_evento: string; // dd/mm/yyyy format
  horario: string;
  local: string;
  capacidade: number; // INTEGER returns number
  instrutor: string;
  status: 'Aberta' | 'Em Andamento' | 'Finalizada' | 'Cancelada';
}

export interface AlunoTurma {
  id: string;
  aluno_id: string;
  turma_id: string;
  data_matricula: string;
  status: 'Inscrito' | 'Concluido' | 'Cancelado';
  aluno_nome?: string;
  turma_nome?: string;
}

/**
 * Represents a financial record (income or expense)
 * PostgreSQL table: ci_financeiro
 * Note: turma_id is stored in junction tables (ci_financeiro_aluno or ci_financeiro_turma)
 */
export interface Financeiro {
  id: string;
  categoria: string;
  descricao: string;
  quantidade: number; // INTEGER returns number
  valor_unitario: string; // NUMERIC returns string
  valor_total: string; // NUMERIC returns string
  tipo: 'Entrada' | 'Saída';
  data: string; // dd/mm/yyyy format
  observacoes: string;
  // From LEFT JOIN in queries:
  turma_id?: string;
  turma_nome?: string;
}

/**
 * Represents a student enrollment linked to a financial record
 * PostgreSQL table: ci_financeiro_aluno
 */
export interface FinanceiroAluno {
  aluno_id: string;
  financeiro_id: string;
  turma_id?: string;
  valor_matricula: number;
  tipo: 'Entrada' | 'Saída';
  data: string;
  // From JOIN queries:
  aluno_nome?: string;
  aluno_email?: string;
  turma_nome?: string;
  categoria?: string;
  descricao?: string;
  valor_total?: string;
}

/**
 * Represents a class expense linked to a financial record
 * PostgreSQL table: ci_financeiro_turma
 */
export interface FinanceiroTurma {
  financeiro_id: string;
  turma_id: string;
  tipo: 'Entrada' | 'Saída';
  valor: number;
  data: string;
  // From JOIN queries:
  turma_nome?: string;
  categoria?: string;
  descricao?: string;
  quantidade?: number;
  valor_unitario?: string;
  valor_total?: string;
  observacoes?: string;
}

export type OnboardingStatus = 'Boas-vindas' | 'Envio do Livro' | 'Grupo da Turma' | 'Concluído';

export interface OnboardingItem {
  aluno: Aluno;
  etapa: OnboardingStatus;
  progresso: number;
}

export const VENDEDORES = [
  'MARCELO',
  'MATHEUS',
  'VICTORIA',
  'RANY',
  'ANA KAROLYNA',
  'MURILO',
  'GUSTAVO',
  'ANA BEATRIZ',
  'LEIA',
  'MAISA',
  'RICARDO',
  'WEBER',
  'IAN',
] as const;

export const PARCELAS_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
