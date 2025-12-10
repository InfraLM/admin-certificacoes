import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { useTurmas, useAlunoTurma } from '@/hooks/useApi';
import { Turma } from '@/types/clinic';
import { Search, Users, Calendar, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScheduleReadOnly() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // API hooks
  const { data: turmas = [], isLoading, isError, refetch } = useTurmas();
  const { data: alunoTurma = [] } = useAlunoTurma();

  // Helper for date sorting
  const parseDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`).getTime();
  };

  const filteredTurmas = useMemo(() => {
    const filtered = turmas.filter(
      (turma) =>
        turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.instrutor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const dateA = parseDate(a.data_evento);
      const dateB = parseDate(b.data_evento);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [turmas, searchTerm, sortOrder]);

  const getAlunosCount = (turmaId: string) => {
    return alunoTurma.filter(
      (at) => at.turma_id === turmaId && at.status === 'Inscrito'
    ).length;
  };

  const getStatusColors = (status: Turma['status']) => {
    switch (status) {
      case 'Aberta':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          progressBg: 'bg-blue-100 dark:bg-blue-900/50',
          progressFill: 'bg-blue-500',
          text: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        };
      case 'Em Andamento':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-800',
          progressBg: 'bg-green-100 dark:bg-green-900/50',
          progressFill: 'bg-green-500',
          text: 'text-green-700 dark:text-green-300',
          badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        };
      case 'Finalizada':
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/30',
          border: 'border-gray-200 dark:border-gray-700',
          progressBg: 'bg-gray-100 dark:bg-gray-800/50',
          progressFill: 'bg-gray-400',
          text: 'text-gray-600 dark:text-gray-400',
          badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        };
      case 'Cancelada':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          progressBg: 'bg-red-100 dark:bg-red-900/50',
          progressFill: 'bg-red-500',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        };
      default:
        return {
          bg: 'bg-card',
          border: 'border-border',
          progressBg: 'bg-muted',
          progressFill: 'bg-primary',
          text: 'text-foreground',
          badge: 'bg-muted text-muted-foreground',
        };
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Cronograma de Turmas" description="Visualize as turmas disponíveis e suas vagas" />
        <PageLoading text="Carregando turmas..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Cronograma de Turmas" description="Visualize as turmas disponíveis e suas vagas" />
        <div className="page-container">
          <PageError onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  // Filtrar apenas turmas ativas (não canceladas nem finalizadas)
  const activeTurmas = filteredTurmas.filter(t => t.status !== 'Cancelada' && t.status !== 'Finalizada');
  const inactiveTurmas = filteredTurmas.filter(t => t.status === 'Cancelada' || t.status === 'Finalizada');

  return (
    <>
      <Header
        title="Cronograma de Turmas"
        description="Visualize as turmas disponíveis e suas vagas"
      />

      <div className="page-container">
        {/* Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou instrutor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total de Turmas</p>
            <p className="text-2xl font-bold text-foreground">{turmas.length}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">Turmas Abertas</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {turmas.filter((t) => t.status === 'Aberta').length}
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
            <p className="text-sm text-green-600 dark:text-green-400">Em Andamento</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {turmas.filter((t) => t.status === 'Em Andamento').length}
            </p>
          </div>
        </div>

        {/* Active Classes */}
        {activeTurmas.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Turmas Disponíveis</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeTurmas.map((turma) => {
                const colors = getStatusColors(turma.status);
                const alunosCount = getAlunosCount(turma.id);
                const capacidade = turma.capacidade || 1;
                const progressPercent = (alunosCount / capacidade) * 100;
                const vagasDisponiveis = capacidade - alunosCount;

                return (
                  <Card key={turma.id} className={cn(colors.bg, colors.border, 'border-2')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className={cn("text-lg", colors.text)}>
                          {turma.nome}
                        </CardTitle>
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", colors.badge)}>
                          {turma.status}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Info Grid */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{turma.data_evento || 'Data a definir'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{turma.horario}</span>
                        </div>
                        {turma.local && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{turma.local}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            Vagas
                          </span>
                          <span className={cn("font-medium", colors.text)}>
                            {alunosCount}/{turma.capacidade}
                          </span>
                        </div>
                        <div className={cn("h-3 rounded-full overflow-hidden", colors.progressBg)}>
                          <div
                            className={cn("h-full transition-all duration-300", colors.progressFill)}
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                          />
                        </div>
                        <p className={cn("text-sm font-medium text-center",
                          vagasDisponiveis > 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {vagasDisponiveis > 0
                            ? `${vagasDisponiveis} vaga${vagasDisponiveis > 1 ? 's' : ''} disponíve${vagasDisponiveis > 1 ? 'is' : 'l'}`
                            : 'Turma lotada'
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Inactive Classes */}
        {inactiveTurmas.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-muted-foreground mb-4">Turmas Finalizadas/Canceladas</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
              {inactiveTurmas.map((turma) => {
                const colors = getStatusColors(turma.status);
                const alunosCount = getAlunosCount(turma.id);

                return (
                  <Card key={turma.id} className={cn(colors.bg, colors.border, 'border')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className={cn("text-base", colors.text)}>
                          {turma.nome}
                        </CardTitle>
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", colors.badge)}>
                          {turma.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <p>{turma.data_evento || 'Data a definir'}</p>
                        <p className="mt-1">{alunosCount} alunos inscritos</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {filteredTurmas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma turma encontrada.</p>
          </div>
        )}
      </div>
    </>
  );
}
