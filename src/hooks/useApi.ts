import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alunosAPI, turmasAPI, financeiroAPI, alunoTurmaAPI } from '@/lib/api';
import { toast } from 'sonner';

// Debug logging
console.log('🪝 [useApi] Hooks carregados');
console.log('🪝 [useApi] Todas as requisições vão para o backend PostgreSQL');

// ============ ALUNOS HOOKS ============
export function useAlunos(params?: { search?: string; status?: string; vendedor?: string }) {
  return useQuery({
    queryKey: ['alunos', params],
    queryFn: () => alunosAPI.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  });
}

export function useAluno(id: string) {
  return useQuery({
    queryKey: ['alunos', id],
    queryFn: () => alunosAPI.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAluno() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => alunosAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Aluno cadastrado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useCreateAluno] Erro:', error);
      toast.error(`Erro ao cadastrar aluno: ${error.message}`);
    },
  });
}

export function useUpdateAluno() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => alunosAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Aluno atualizado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useUpdateAluno] Erro:', error);
      toast.error(`Erro ao atualizar aluno: ${error.message}`);
    },
  });
}

export function useUpdateAlunoField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: any }) => 
      alunosAPI.updateField(id, field, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Campo atualizado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useUpdateAlunoField] Erro:', error);
      toast.error(`Erro ao atualizar campo: ${error.message}`);
    },
  });
}

export function useDeleteAluno() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => alunosAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Aluno removido com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useDeleteAluno] Erro:', error);
      toast.error(`Erro ao remover aluno: ${error.message}`);
    },
  });
}

// ============ TURMAS HOOKS ============
export function useTurmas(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ['turmas', params],
    queryFn: () => turmasAPI.getAll(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useTurma(id: string) {
  return useQuery({
    queryKey: ['turmas', id],
    queryFn: () => turmasAPI.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTurmaAlunos(id: string) {
  return useQuery({
    queryKey: ['turmas', id, 'alunos'],
    queryFn: () => turmasAPI.getAlunos(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useTurmaFinanceiro(id: string) {
  return useQuery({
    queryKey: ['turmas', id, 'financeiro'],
    queryFn: () => turmasAPI.getFinanceiro(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateTurma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => turmasAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma criada com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useCreateTurma] Erro:', error);
      toast.error(`Erro ao criar turma: ${error.message}`);
    },
  });
}

export function useUpdateTurma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => turmasAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma atualizada com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useUpdateTurma] Erro:', error);
      toast.error(`Erro ao atualizar turma: ${error.message}`);
    },
  });
}

export function useUpdateTurmaField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: any }) =>
      turmasAPI.updateField(id, field, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Campo atualizado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useUpdateTurmaField] Erro:', error);
      toast.error(`Erro ao atualizar campo: ${error.message}`);
    },
  });
}

export function useDeleteTurma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => turmasAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma removida com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useDeleteTurma] Erro:', error);
      toast.error(`Erro ao remover turma: ${error.message}`);
    },
  });
}

// ============ FINANCEIRO HOOKS ============
export function useFinanceiro(params?: { search?: string; tipo?: string; turma_id?: string }) {
  return useQuery({
    queryKey: ['financeiro', params],
    queryFn: () => financeiroAPI.getAll(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useFinanceiroResumo(params?: { turma_id?: string; data_inicio?: string; data_fim?: string }) {
  return useQuery({
    queryKey: ['financeiro', 'resumo', params],
    queryFn: () => financeiroAPI.getResumo(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useCreateFinanceiro() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => financeiroAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      toast.success('Registro financeiro criado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useCreateFinanceiro] Erro:', error);
      toast.error(`Erro ao criar registro: ${error.message}`);
    },
  });
}

export function useUpdateFinanceiroField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: any }) =>
      financeiroAPI.updateField(id, field, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      toast.success('Campo atualizado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useUpdateFinanceiroField] Erro:', error);
      toast.error(`Erro ao atualizar campo: ${error.message}`);
    },
  });
}

export function useDeleteFinanceiro() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => financeiroAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      toast.success('Registro removido com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useDeleteFinanceiro] Erro:', error);
      toast.error(`Erro ao remover registro: ${error.message}`);
    },
  });
}

// ============ ALUNO-TURMA HOOKS ============
export function useAlunoTurma() {
  return useQuery({
    queryKey: ['aluno-turma'],
    queryFn: () => alunoTurmaAPI.getAll(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useAlunoTurmaByAluno(alunoId: string) {
  return useQuery({
    queryKey: ['aluno-turma', 'aluno', alunoId],
    queryFn: () => alunoTurmaAPI.getByAluno(alunoId),
    enabled: !!alunoId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useAlunoTurmaByTurma(turmaId: string) {
  return useQuery({
    queryKey: ['aluno-turma', 'turma', turmaId],
    queryFn: () => alunoTurmaAPI.getByTurma(turmaId),
    enabled: !!turmaId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateAlunoTurma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => alunoTurmaAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aluno-turma'] });
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Inscrição criada com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useCreateAlunoTurma] Erro:', error);
      toast.error(`Erro ao criar inscrição: ${error.message}`);
    },
  });
}

export function useDeleteAlunoTurma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => alunoTurmaAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aluno-turma'] });
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Inscrição removida com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useDeleteAlunoTurma] Erro:', error);
      toast.error(`Erro ao remover inscrição: ${error.message}`);
    },
  });
}