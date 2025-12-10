import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EditableCell } from '@/components/ui/EditableCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/MaskedInput';
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
import { useFinanceiro, useFinanceiroResumo, useTurmas, useCreateFinanceiro, useUpdateFinanceiroField, useDeleteFinanceiro } from '@/hooks/useApi';
import { Financeiro } from '@/types/clinic';
import { generateId, formatCurrency, calculateTotal } from '@/lib/formatters';
import { Plus, Search, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function Financial() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterTurma, setFilterTurma] = useState<string>('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRegistro, setNewRegistro] = useState<Partial<Financeiro>>({
    tipo: 'Entrada',
    quantidade: 1,
    valor_unitario: '0.00',
  });

  // API hooks
  const { data: registros = [], isLoading, isError, refetch } = useFinanceiro({
    search: searchTerm || undefined,
    tipo: filterTipo !== 'todos' ? filterTipo : undefined,
    turma_id: filterTurma !== 'todas' ? filterTurma : undefined,
  });
  const { data: resumo } = useFinanceiroResumo({
    turma_id: filterTurma !== 'todas' ? filterTurma : undefined,
  });
  const { data: turmas = [] } = useTurmas();
  const createMutation = useCreateFinanceiro();
  const updateFieldMutation = useUpdateFinanceiroField();
  const deleteMutation = useDeleteFinanceiro();

  // Local state for optimistic updates
  const [localRegistros, setLocalRegistros] = useState<Financeiro[]>([]);

  // Merge API data with local state
  const mergedRegistros = useMemo(() => {
    if (localRegistros.length > 0) return localRegistros;
    return registros;
  }, [registros, localRegistros]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      entradas: resumo?.entradas || 0,
      saidas: resumo?.saidas || 0,
      saldo: resumo?.saldo || 0,
    };
  }, [resumo]);

  const handleUpdateField = (id: string, field: keyof Financeiro, value: string) => {
    // Optimistic update
    setLocalRegistros((prev) => {
      const base = prev.length > 0 ? prev : registros;
      return base.map((r) => {
        if (r.id !== id) return r;

        const updated = { ...r, [field]: value };

        // Recalculate total if quantidade or valor_unitario changed
        if (field === 'quantidade' || field === 'valor_unitario') {
          updated.valor_total = calculateTotal(
            field === 'quantidade' ? value : r.quantidade,
            field === 'valor_unitario' ? value : r.valor_unitario
          );
        }

        return updated;
      });
    });

    // API call
    updateFieldMutation.mutate({ id, field, value });
  };

  const handleAddRegistro = () => {
    // Validate turma_id is required
    if (!newRegistro.turma_id) {
      toast.error('Selecione uma turma para o registro financeiro');
      return;
    }

    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const valorTotal = calculateTotal(
      newRegistro.quantidade || 1,
      newRegistro.valor_unitario || '0.00'
    );

    const registro: Financeiro = {
      id: generateId(),
      categoria: newRegistro.categoria || '',
      descricao: newRegistro.descricao || '',
      quantidade: Number(newRegistro.quantidade) || 1,
      valor_unitario: newRegistro.valor_unitario || '0.00',
      valor_total: valorTotal,
      tipo: (newRegistro.tipo as Financeiro['tipo']) || 'Entrada',
      data: newRegistro.data || formattedDate,
      turma_id: newRegistro.turma_id,
      observacoes: newRegistro.observacoes || '',
    };

    // Optimistic update
    setLocalRegistros((prev) => {
      const base = prev.length > 0 ? prev : registros;
      return [registro, ...base];
    });

    // API call
    createMutation.mutate(registro);

    setNewRegistro({ tipo: 'Entrada', quantidade: 1, valor_unitario: '0.00' });
    setIsDialogOpen(false);
  };

  const handleDeleteRegistro = (id: string) => {
    // Optimistic update
    setLocalRegistros((prev) => {
      const base = prev.length > 0 ? prev : registros;
      return base.filter((r) => r.id !== id);
    });

    // API call
    deleteMutation.mutate(id);
  };

  const getTurmaNome = (turmaId?: string) => {
    if (!turmaId) return '-';
    const turma = turmas.find((t) => t.id === turmaId);
    return turma?.nome || '-';
  };

  if (isLoading) {
    return (
      <>
        <Header title="Financeiro" description="Controle de entradas e saídas financeiras" />
        <PageLoading text="Carregando dados financeiros..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Financeiro" description="Controle de entradas e saídas financeiras" />
        <div className="page-container">
          <PageError onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Financeiro"
        description="Controle de entradas e saídas financeiras"
      />

      <div className="page-container">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-success/20 bg-success/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Entradas</p>
                <p className="text-3xl font-bold text-success">{formatCurrency(totals.entradas)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Saídas</p>
                <p className="text-3xl font-bold text-destructive">{formatCurrency(totals.saidas)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                <p className={`text-3xl font-bold ${totals.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(totals.saldo)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por categoria ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Entrada">Entradas</SelectItem>
                <SelectItem value="Saída">Saídas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTurma} onValueChange={setFilterTurma}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Turmas</SelectItem>
                <SelectItem value="sem_turma">Sem Turma</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Registro Financeiro</DialogTitle>
                <DialogDescription>
                  Adicione uma nova entrada ou saída financeira.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newRegistro.tipo}
                      onValueChange={(value) => setNewRegistro({ ...newRegistro, tipo: value as Financeiro['tipo'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saída">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input
                      value={newRegistro.categoria || ''}
                      onChange={(e) => setNewRegistro({ ...newRegistro, categoria: e.target.value })}
                      placeholder="Ex: Mensalidade"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={newRegistro.descricao || ''}
                    onChange={(e) => setNewRegistro({ ...newRegistro, descricao: e.target.value })}
                    placeholder="Descrição do registro"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={newRegistro.quantidade || ''}
                      onChange={(e) => setNewRegistro({ ...newRegistro, quantidade: parseInt(e.target.value) || 0 })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Unitário</Label>
                    <MaskedInput
                      maskType="currency"
                      value={newRegistro.valor_unitario || ''}
                      onChange={(value) => setNewRegistro({ ...newRegistro, valor_unitario: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Total</Label>
                    <Input
                      value={formatCurrency(
                        calculateTotal(
                          newRegistro.quantidade || '1',
                          newRegistro.valor_unitario || '0.00'
                        )
                      )}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <MaskedInput
                      maskType="date"
                      value={newRegistro.data || ''}
                      onChange={(value) => setNewRegistro({ ...newRegistro, data: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Turma *</Label>
                    <Select
                      value={newRegistro.turma_id || ''}
                      onValueChange={(value) => setNewRegistro({ ...newRegistro, turma_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome} - {turma.data_evento || 'Sem data'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={newRegistro.observacoes || ''}
                    onChange={(e) => setNewRegistro({ ...newRegistro, observacoes: e.target.value })}
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddRegistro} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Valor Unit.</th>
                  <th>Valor Total</th>
                  <th>Turma</th>
                  <th>Observações</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {mergedRegistros.map((registro) => (
                  <tr key={registro.id}>
                    <td>
                      <EditableCell
                        value={registro.data}
                        onChange={(v) => handleUpdateField(registro.id, 'data', v)}
                        type="date"
                      />
                    </td>
                    <td>
                      <Select
                        value={registro.tipo}
                        onValueChange={(v) => handleUpdateField(registro.id, 'tipo', v)}
                      >
                        <SelectTrigger className="h-8 w-[100px]">
                          <StatusBadge status={registro.tipo} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Entrada">Entrada</SelectItem>
                          <SelectItem value="Saída">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <EditableCell
                        value={registro.categoria}
                        onChange={(v) => handleUpdateField(registro.id, 'categoria', v)}
                      />
                    </td>
                    <td className="max-w-[200px]">
                      <EditableCell
                        value={registro.descricao}
                        onChange={(v) => handleUpdateField(registro.id, 'descricao', v)}
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={registro.quantidade}
                        onChange={(v) => handleUpdateField(registro.id, 'quantidade', v)}
                        type="number"
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={registro.valor_unitario}
                        onChange={(v) => handleUpdateField(registro.id, 'valor_unitario', v)}
                        type="currency"
                      />
                    </td>
                    <td className={`font-medium ${registro.tipo === 'Entrada' ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(registro.valor_total)}
                    </td>
                    <td className="text-muted-foreground text-sm">
                      {getTurmaNome(registro.turma_id)}
                    </td>
                    <td className="max-w-[150px]">
                      <EditableCell
                        value={registro.observacoes}
                        onChange={(v) => handleUpdateField(registro.id, 'observacoes', v)}
                        placeholder="-"
                      />
                    </td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRegistro(registro.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
