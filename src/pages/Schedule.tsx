import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EditableCell } from '@/components/ui/EditableCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTurmas, useAlunoTurma, useCreateTurma, useUpdateTurmaField, useDeleteTurma, useFinanceiro } from '@/hooks/useApi';
import { Turma } from '@/types/clinic';
import { generateId, formatCurrency, unmaskCurrency } from '@/lib/formatters';
import { Plus, Search, Trash2, Eye, Users, ChevronUp, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Schedule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [expandedTurmas, setExpandedTurmas] = useState<Set<string>>(new Set());
  const [newTurma, setNewTurma] = useState<Partial<Turma>>({
    status: 'Aberta',
    data_evento: '',
  });

  // API hooks
  const { data: turmas = [], isLoading, isError, refetch } = useTurmas();
  const { data: alunoTurma = [] } = useAlunoTurma();
  const { data: financeiro = [] } = useFinanceiro();
  const createMutation = useCreateTurma();
  const updateFieldMutation = useUpdateTurmaField();
  const deleteMutation = useDeleteTurma();

  // Local state for optimistic updates
  const [localTurmas, setLocalTurmas] = useState<Turma[]>([]);

  // Merge API data with local state
  const mergedTurmas = useMemo(() => {
    if (localTurmas.length > 0) return localTurmas;
    return turmas;
  }, [turmas, localTurmas]);

  // Helper for date sorting
  const parseDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`).getTime();
  };

  const filteredTurmas = useMemo(() => {
    const filtered = mergedTurmas.filter(
      (turma) =>
        turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.instrutor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const dateA = parseDate(a.data_evento);
      const dateB = parseDate(b.data_evento);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [mergedTurmas, searchTerm, sortOrder]);

  const getAlunosCount = (turmaId: string) => {
    return alunoTurma.filter(
      (at) => at.turma_id === turmaId && at.status === 'Inscrito'
    ).length;
  };

  const getTurmaGastos = (turmaId: string) => {
    return financeiro
      .filter((f) => f.turma_id === turmaId && f.tipo === 'Saída')
      .reduce((acc, f) => acc + parseFloat(f.valor_total), 0);
  };

  const getTurmaGanhos = (turmaId: string) => {
    return financeiro
      .filter((f) => f.turma_id === turmaId && f.tipo === 'Entrada')
      .reduce((acc, f) => acc + parseFloat(f.valor_total), 0);
  };

  const getTurmaSaldo = (turmaId: string) => {
    return getTurmaGanhos(turmaId) - getTurmaGastos(turmaId);
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
        };
      case 'Em Andamento':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-800',
          progressBg: 'bg-green-100 dark:bg-green-900/50',
          progressFill: 'bg-green-500',
          text: 'text-green-700 dark:text-green-300',
        };
      case 'Finalizada':
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/30',
          border: 'border-gray-200 dark:border-gray-700',
          progressBg: 'bg-gray-100 dark:bg-gray-800/50',
          progressFill: 'bg-gray-400',
          text: 'text-gray-600 dark:text-gray-400',
        };
      case 'Cancelada':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          progressBg: 'bg-red-100 dark:bg-red-900/50',
          progressFill: 'bg-red-500',
          text: 'text-red-700 dark:text-red-300',
        };
      default:
        return {
          bg: 'bg-card',
          border: 'border-border',
          progressBg: 'bg-muted',
          progressFill: 'bg-primary',
          text: 'text-foreground',
        };
    }
  };

  const toggleExpand = (turmaId: string) => {
    setExpandedTurmas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(turmaId)) {
        newSet.delete(turmaId);
      } else {
        newSet.add(turmaId);
      }
      return newSet;
    });
  };

  const handleUpdateField = (id: string, field: keyof Turma, value: string) => {
    // Optimistic update
    setLocalTurmas((prev) => {
      const base = prev.length > 0 ? prev : turmas;
      return base.map((t) => (t.id === id ? { ...t, [field]: value } : t));
    });

    // API call
    updateFieldMutation.mutate({ id, field, value });
  };

  const handleAddTurma = () => {
    const turma: Turma = {
      id: generateId(),
      nome: newTurma.nome || '',
      descricao: newTurma.descricao || '',
      data_evento: newTurma.data_evento || '',
      horario: newTurma.horario || '',
      local: newTurma.local || '',
      capacidade: Number(newTurma.capacidade) || 10,
      instrutor: newTurma.instrutor || '',
      status: (newTurma.status as Turma['status']) || 'Aberta',
    };

    // Optimistic update
    setLocalTurmas((prev) => {
      const base = prev.length > 0 ? prev : turmas;
      return [turma, ...base];
    });

    // API call
    createMutation.mutate(turma);

    setNewTurma({ status: 'Aberta', data_evento: '' });
    setIsDialogOpen(false);
  };

  const handleDeleteTurma = (id: string) => {
    // Optimistic update
    setLocalTurmas((prev) => {
      const base = prev.length > 0 ? prev : turmas;
      return base.filter((t) => t.id !== id);
    });
    setExpandedTurmas(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    // API call
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <>
        <Header title="Turmas" description="Gerencie as turmas e cronogramas de tratamento" />
        <PageLoading text="Carregando turmas..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Turmas" description="Gerencie as turmas e cronogramas de tratamento" />
        <div className="page-container">
          <PageError onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Turmas (v1.1)"
        description="Gerencie as turmas e cronogramas de tratamento"
      />

      <div className="page-container">
        {/* Actions Bar */}
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
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Mais recentes</SelectItem>
                <SelectItem value="asc">Mais antigas</SelectItem>
              </SelectContent>
            </Select>


            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Turma
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Nova Turma</DialogTitle>
                  <DialogDescription>
                    Configure os detalhes da nova turma ou tratamento.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Turma</Label>
                      <Input
                        value={newTurma.nome || ''}
                        onChange={(e) => setNewTurma({ ...newTurma, nome: e.target.value })}
                        placeholder="Ex: Fisioterapia Manhã"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instrutor</Label>
                      <Input
                        value={newTurma.instrutor || ''}
                        onChange={(e) => setNewTurma({ ...newTurma, instrutor: e.target.value })}
                        placeholder="Nome do instrutor"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data do Evento</Label>
                      <MaskedInput
                        maskType="date"
                        value={newTurma.data_evento || ''}
                        onChange={(value) => setNewTurma({ ...newTurma, data_evento: value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        value={newTurma.horario || ''}
                        onChange={(e) => setNewTurma({ ...newTurma, horario: e.target.value })}
                        placeholder="08:00 - 10:00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Local</Label>
                      <Input
                        value={newTurma.local || ''}
                        onChange={(e) => setNewTurma({ ...newTurma, local: e.target.value })}
                        placeholder="Sala 101"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Capacidade</Label>
                      <Input
                        type="number"
                        value={newTurma.capacidade || ''}
                        onChange={(e) => setNewTurma({ ...newTurma, capacidade: parseInt(e.target.value) || 0 })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={newTurma.descricao || ''}
                      onChange={(e) => setNewTurma({ ...newTurma, descricao: e.target.value })}
                      placeholder="Descrição da turma"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newTurma.status}
                      onValueChange={(value) => setNewTurma({ ...newTurma, status: value as Turma['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aberta">Aberta</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Finalizada">Finalizada</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddTurma} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Criando...' : 'Criar Turma'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total de Turmas</p>
            <p className="text-2xl font-bold text-foreground">{mergedTurmas.length}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">Turmas Abertas</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {mergedTurmas.filter((t) => t.status === 'Aberta').length}
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
            <p className="text-sm text-green-600 dark:text-green-400">Em Andamento</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {mergedTurmas.filter((t) => t.status === 'Em Andamento').length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Finalizadas</p>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {mergedTurmas.filter((t) => t.status === 'Finalizada').length}
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTurmas.map((turma) => {
            const colors = getStatusColors(turma.status);
            const isExpanded = expandedTurmas.has(turma.id);
            const alunosCount = getAlunosCount(turma.id);
            const capacidade = turma.capacidade || 1;
            const progressPercent = (alunosCount / capacidade) * 100;
            const ganhos = getTurmaGanhos(turma.id);
            const gastos = getTurmaGastos(turma.id);
            const saldo = getTurmaSaldo(turma.id);

            return (
              <Card key={turma.id} className={cn(colors.bg, colors.border, 'border-2 transition-all')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className={cn("text-lg truncate", colors.text)}>
                        {turma.nome}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {turma.data_evento || 'Data a definir'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => toggleExpand(turma.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Alunos</span>
                      <span className={cn("font-medium", colors.text)}>
                        {alunosCount}/{turma.capacidade}
                      </span>
                    </div>
                    <div className={cn("h-2 rounded-full overflow-hidden", colors.progressBg)}>
                      <div
                        className={cn("h-full transition-all duration-300", colors.progressFill)}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Financial Summary */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                            <span className="text-xs text-green-600 dark:text-green-400">Ganhos</span>
                          </div>
                          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                            {formatCurrency(ganhos)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                            <span className="text-xs text-red-600 dark:text-red-400">Gastos</span>
                          </div>
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {formatCurrency(gastos)}
                          </p>
                        </div>
                        <div className={cn(
                          "rounded-lg p-2 text-center",
                          saldo >= 0
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-orange-100 dark:bg-orange-900/30"
                        )}>
                          <span className={cn(
                            "text-xs",
                            saldo >= 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-orange-600 dark:text-orange-400"
                          )}>Saldo</span>
                          <p className={cn(
                            "text-sm font-semibold",
                            saldo >= 0
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-orange-700 dark:text-orange-300"
                          )}>
                            {formatCurrency(saldo)}
                          </p>
                        </div>
                      </div>

                      {/* Editable Fields */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Data:</span>
                          <div className="flex-1">
                            <MaskedInput
                              maskType="date"
                              value={turma.data_evento}
                              onChange={(v) => handleUpdateField(turma.id, 'data_evento', v)}
                              className="h-8"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Instrutor:</span>
                          <EditableCell
                            value={turma.instrutor}
                            onChange={(v) => handleUpdateField(turma.id, 'instrutor', v)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Horário:</span>
                          <EditableCell
                            value={turma.horario}
                            onChange={(v) => handleUpdateField(turma.id, 'horario', v)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Local:</span>
                          <EditableCell
                            value={turma.local}
                            onChange={(v) => handleUpdateField(turma.id, 'local', v)}
                          />
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <Select
                          value={turma.status}
                          onValueChange={(v) => handleUpdateField(turma.id, 'status', v)}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <StatusBadge status={turma.status} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aberta">Aberta</SelectItem>
                            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                            <SelectItem value="Finalizada">Finalizada</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedTurma(turma)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTurma(turma.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Turma Details Dialog */}
        <Dialog open={!!selectedTurma} onOpenChange={(open) => !open && setSelectedTurma(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTurma?.nome}</DialogTitle>
              <DialogDescription>
                Detalhes da turma e alunos inscritos
              </DialogDescription>
            </DialogHeader>
            {selectedTurma && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Instrutor</p>
                    <p className="font-medium">{selectedTurma.instrutor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Evento</p>
                    <p className="font-medium">{selectedTurma.data_evento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{selectedTurma.horario}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="font-medium">{selectedTurma.local}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Descrição</p>
                  <p className="text-sm">{selectedTurma.descricao || 'Sem descrição'}</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Alunos Inscritos</h4>
                  <div className="space-y-2">
                    {alunoTurma
                      .filter(at => at.turma_id === selectedTurma.id)
                      .map((at) => (
                        <div key={at.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <div>
                            <p className="text-sm font-medium">{at.aluno_nome || 'Nome não encontrado'}</p>
                            <p className="text-xs text-muted-foreground">{at.aluno_email}</p>
                          </div>
                          <StatusBadge status={at.status} />
                        </div>
                      ))}
                    {alunoTurma.filter(at => at.turma_id === selectedTurma.id).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum aluno inscrito nesta turma.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
