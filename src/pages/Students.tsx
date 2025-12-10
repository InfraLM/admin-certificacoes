import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EditableCell } from '@/components/ui/EditableCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { Switch } from '@/components/ui/switch';
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
import {
  useAlunos,
  useCreateAluno,
  useUpdateAlunoField,
  useDeleteAluno,
  useTurmas,
  useUpdateAluno,
  useCreateAlunoTurma
} from '@/hooks/useApi';
import { Aluno, VENDEDORES, PARCELAS_OPTIONS } from '@/types/clinic';
import { generateId, unmaskCurrency, formatCurrency } from '@/lib/formatters';
import { Plus, Search, Trash2, Edit2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [newAluno, setNewAluno] = useState<Partial<Aluno>>({
    status: 'Em Onboarding',
    vendedor: '',
    valor_venda: '',
    parcelas: 1,
    pos_graduacao: false,
    turma_id: '',
  });

  // API hooks
  const { data: alunos = [], isLoading, isError, refetch } = useAlunos();
  const { data: turmas = [] } = useTurmas({ status: 'Aberta' });

  const createAlunoMutation = useCreateAluno();
  const updateAlunoMutation = useUpdateAluno();
  const updateFieldMutation = useUpdateAlunoField();
  const deleteAlunoMutation = useDeleteAluno();

  const createAlunoTurmaMutation = useCreateAlunoTurma();

  // Local state for optimistic updates
  const [localAlunos, setLocalAlunos] = useState<Aluno[]>([]);

  // Merge API data with local state
  const mergedAlunos = useMemo(() => {
    if (localAlunos.length > 0) return localAlunos;
    return alunos;
  }, [alunos, localAlunos]);

  // Filter alunos based on search
  const filteredAlunos = useMemo(() => {
    return mergedAlunos.filter(
      (aluno) =>
        aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.cpf.includes(searchTerm)
    );
  }, [mergedAlunos, searchTerm]);

  const handleUpdateField = (id: string, field: keyof Aluno, value: string | boolean) => {
    // Optimistic update
    setLocalAlunos((prev) => {
      const base = prev.length > 0 ? prev : alunos;
      return base.map((a) => (a.id === id ? { ...a, [field]: value } : a));
    });

    // API call
    updateFieldMutation.mutate({ id, field, value });
  };

  const handleAddAluno = () => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const valorVendaNumerico = unmaskCurrency(newAluno.valor_venda || '0');

    const aluno: Aluno = {
      id: generateId(),
      nome: newAluno.nome || '',
      email: newAluno.email || '',
      telefone: newAluno.telefone || '',
      data_nascimento: newAluno.data_nascimento || '',
      cpf: newAluno.cpf || '',
      endereco: newAluno.endereco || '',
      status: (newAluno.status as Aluno['status']) || 'Em Onboarding',
      data_matricula: formattedDate,
      observacoes: newAluno.observacoes || '',
      vendedor: newAluno.vendedor || '',
      valor_venda: valorVendaNumerico,
      parcelas: newAluno.parcelas || 1,
      pos_graduacao: newAluno.pos_graduacao || false,
      turma_id: newAluno.turma_id,
    };

    // Optimistic update
    setLocalAlunos((prev) => {
      const base = prev.length > 0 ? prev : alunos;
      return [aluno, ...base];
    });

    // API call
    createAlunoMutation.mutate(aluno, {
      onSuccess: () => {
        toast.success('Aluno cadastrado com sucesso!');
      }
    });

    setNewAluno({
      status: 'Em Onboarding',
      vendedor: '',
      valor_venda: '',
      parcelas: 1,
      pos_graduacao: false,
      turma_id: '',
    });
    setIsDialogOpen(false);
  };

  const handleEditAluno = () => {
    if (!editingAluno) return;

    // Optimistic update
    setLocalAlunos((prev) => {
      const base = prev.length > 0 ? prev : alunos;
      return base.map((a) => (a.id === editingAluno.id ? editingAluno : a));
    });

    // API call for full update
    updateAlunoMutation.mutate({ id: editingAluno.id, data: editingAluno });

    // Handle class transfer if turma_id is present and different
    // Since backend now handles the transfer logic in the update endpoint, 
    // we just need to pass the turma_id in the update body if it changed.
    // However, the updateAlunoMutation above takes { id, data: editingAluno }.
    // editingAluno state already contains the new turma_id if selected in the dropdown.
    // So we don't need to do anything extra here, just let the mutation run.


    setEditingAluno(null);
  };

  const handleDeleteAluno = (id: string) => {
    // Optimistic update
    setLocalAlunos((prev) => {
      const base = prev.length > 0 ? prev : alunos;
      return base.filter((a) => a.id !== id);
    });

    // API call
    deleteAlunoMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <>
        <Header title="Alunos / Pacientes" description="Gerencie os alunos e pacientes da clínica" />
        <PageLoading text="Carregando alunos..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Alunos / Pacientes" description="Gerencie os alunos e pacientes da clínica" />
        <div className="page-container">
          <PageError onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Alunos / Pacientes"
        description="Gerencie os alunos e pacientes da clínica"
      />

      <div className="page-container">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo aluno. Todos os campos são editáveis após o cadastro.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={newAluno.nome || ''}
                      onChange={(e) => setNewAluno({ ...newAluno, nome: e.target.value })}
                      placeholder="Nome do aluno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <MaskedInput
                      id="cpf"
                      maskType="cpf"
                      value={newAluno.cpf || ''}
                      onChange={(value) => setNewAluno({ ...newAluno, cpf: value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAluno.email || ''}
                      onChange={(e) => setNewAluno({ ...newAluno, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <MaskedInput
                      id="telefone"
                      maskType="phone"
                      value={newAluno.telefone || ''}
                      onChange={(value) => setNewAluno({ ...newAluno, telefone: value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <MaskedInput
                      id="data_nascimento"
                      maskType="date"
                      value={newAluno.data_nascimento || ''}
                      onChange={(value) => setNewAluno({ ...newAluno, data_nascimento: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newAluno.status}
                      onValueChange={(value) => setNewAluno({ ...newAluno, status: value as Aluno['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Em Onboarding">Em Onboarding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vendedor and Sale Info */}
                <div className="border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3 text-foreground">Informações de Venda</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendedor">Vendedor</Label>
                      <Select
                        value={newAluno.vendedor}
                        onValueChange={(value) => setNewAluno({ ...newAluno, vendedor: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o vendedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {VENDEDORES.map((vendedor) => (
                            <SelectItem key={vendedor} value={vendedor}>
                              {vendedor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_venda">Valor de Venda (R$)</Label>
                      <MaskedInput
                        id="valor_venda"
                        maskType="currency"
                        value={newAluno.valor_venda || ''}
                        onChange={(value) => setNewAluno({ ...newAluno, valor_venda: value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="turma">Turma (Opcional)</Label>
                      <Select
                        value={newAluno.turma_id}
                        onValueChange={(value) => setNewAluno({ ...newAluno, turma_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas?.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.nome} - {turma.data_evento || 'Sem data'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="parcelas">Parcelas</Label>
                      <Select
                        value={newAluno.parcelas?.toString()}
                        onValueChange={(value) => setNewAluno({ ...newAluno, parcelas: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {PARCELAS_OPTIONS.map((parcela) => (
                            <SelectItem key={parcela} value={parcela}>
                              {parcela === '0' ? 'À vista' : `${parcela}x`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pos_graduacao">Aluno Pós-Graduação</Label>
                      <div className="flex items-center gap-3 h-10">
                        <Switch
                          id="pos_graduacao"
                          checked={newAluno.pos_graduacao || false}
                          onCheckedChange={(checked) => setNewAluno({ ...newAluno, pos_graduacao: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {newAluno.pos_graduacao ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={newAluno.endereco || ''}
                    onChange={(e) => setNewAluno({ ...newAluno, endereco: e.target.value })}
                    placeholder="Endereço completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={newAluno.observacoes || ''}
                    onChange={(e) => setNewAluno({ ...newAluno, observacoes: e.target.value })}
                    placeholder="Observações sobre o aluno"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddAluno} disabled={createAlunoMutation.isPending}>
                  {createAlunoMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total de Alunos</p>
            <p className="text-2xl font-bold text-foreground">{mergedAlunos.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Alunos Ativos</p>
            <p className="text-2xl font-bold text-success">
              {mergedAlunos.filter((a) => a.status === 'Ativo').length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Em Onboarding</p>
            <p className="text-2xl font-bold text-warning">
              {mergedAlunos.filter((a) => a.status === 'Em Onboarding').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>CPF</th>
                  <th>Vendedor</th>
                  <th>Valor</th>
                  <th>Parcelas</th>
                  <th>Pós</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlunos.map((aluno) => (
                  <tr key={aluno.id}>
                    <td>
                      <EditableCell
                        value={aluno.nome}
                        onChange={(v) => handleUpdateField(aluno.id, 'nome', v)}
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={aluno.email}
                        onChange={(v) => handleUpdateField(aluno.id, 'email', v)}
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={aluno.telefone}
                        onChange={(v) => handleUpdateField(aluno.id, 'telefone', v)}
                        type="phone"
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={aluno.cpf}
                        onChange={(v) => handleUpdateField(aluno.id, 'cpf', v)}
                        type="cpf"
                      />
                    </td>
                    <td>
                      <Select
                        value={aluno.vendedor}
                        onValueChange={(v) => handleUpdateField(aluno.id, 'vendedor', v)}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue placeholder="Vendedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {VENDEDORES.map((vendedor) => (
                            <SelectItem key={vendedor} value={vendedor}>
                              {vendedor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="text-foreground font-medium">
                      {formatCurrency(aluno.valor_venda)}
                    </td>
                    <td className="text-center">
                      {aluno.parcelas === 0 ? 'À vista' : `${aluno.parcelas}x`}
                    </td>
                    <td className="text-center">
                      {aluno.pos_graduacao && (
                        <GraduationCap className="h-4 w-4 text-primary mx-auto" />
                      )}
                    </td>
                    <td>
                      <Select
                        value={aluno.status}
                        onValueChange={(v) => handleUpdateField(aluno.id, 'status', v)}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <StatusBadge status={aluno.status} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="Em Onboarding">Em Onboarding</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingAluno(aluno)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAluno(aluno.id)}
                          disabled={deleteAlunoMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingAluno} onOpenChange={(open) => !open && setEditingAluno(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Aluno</DialogTitle>
              <DialogDescription>
                Edite os dados do aluno.
              </DialogDescription>
            </DialogHeader>
            {editingAluno && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={editingAluno.nome}
                      onChange={(e) => setEditingAluno({ ...editingAluno, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <MaskedInput
                      maskType="cpf"
                      value={editingAluno.cpf}
                      onChange={(value) => setEditingAluno({ ...editingAluno, cpf: value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editingAluno.email}
                      onChange={(e) => setEditingAluno({ ...editingAluno, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <MaskedInput
                      maskType="phone"
                      value={editingAluno.telefone}
                      onChange={(value) => setEditingAluno({ ...editingAluno, telefone: value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <MaskedInput
                      maskType="date"
                      value={editingAluno.data_nascimento}
                      onChange={(value) => setEditingAluno({ ...editingAluno, data_nascimento: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editingAluno.status}
                      onValueChange={(value) => setEditingAluno({ ...editingAluno, status: value as Aluno['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Em Onboarding">Em Onboarding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={editingAluno.endereco}
                    onChange={(e) => setEditingAluno({ ...editingAluno, endereco: e.target.value })}
                  />
                </div>

                {/* Class Transfer Section */}
                <div className="space-y-2 border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3 text-foreground">Turma / Transferência</h4>
                  <div className="space-y-2">
                    <Label htmlFor="edit-turma">Turma</Label>
                    <Select
                      value={editingAluno.turma_id || ''}
                      onValueChange={(value) => setEditingAluno({ ...editingAluno, turma_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma para transferir" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas?.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome} - {turma.data_evento || 'Sem data'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Selecione uma nova turma para transferir o aluno.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={editingAluno.observacoes}
                    onChange={(e) => setEditingAluno({ ...editingAluno, observacoes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAluno(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditAluno}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
