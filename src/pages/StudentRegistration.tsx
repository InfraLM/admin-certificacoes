import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAluno, useTurmas } from '@/hooks/useApi';
import { Aluno, VENDEDORES, PARCELAS_OPTIONS } from '@/types/clinic';
import { generateId, unmaskCurrency } from '@/lib/formatters';
import { UserPlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentRegistration() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newAluno, setNewAluno] = useState<Partial<Aluno>>({
    status: 'Em Onboarding',
    vendedor: '',
    valor_venda: '',
    parcelas: 1,
    pos_graduacao: false,
    turma_id: '',
  });

  const { data: turmas } = useTurmas({ status: 'Aberta' });

  const createAlunoMutation = useCreateAluno();


  const resetForm = () => {
    setNewAluno({
      status: 'Em Onboarding',
      vendedor: '',
      valor_venda: '',
      parcelas: 1,
      pos_graduacao: false,
      turma_id: '',
    });
    setIsSubmitted(false);
  };

  const handleAddAluno = () => {
    // Validação básica
    if (!newAluno.nome || !newAluno.cpf || !newAluno.email) {
      toast.error('Preencha os campos obrigatórios: Nome, CPF e Email');
      return;
    }

    // Validate turma if financial record will be created (which is effectively always for a student)
    // Or just make it required generally
    if (!newAluno.turma_id) {
      toast.error('Selecione uma turma para o aluno');
      return;
    }

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
      status: 'Em Onboarding',
      data_matricula: formattedDate,
      observacoes: newAluno.observacoes || '',
      vendedor: newAluno.vendedor || '',
      valor_venda: valorVendaNumerico,
      parcelas: newAluno.parcelas || 1,
      pos_graduacao: newAluno.pos_graduacao || false,
      turma_id: newAluno.turma_id,
    };

    // API call
    createAlunoMutation.mutate(aluno, {
      onSuccess: () => {
        toast.success('Aluno cadastrado com sucesso!');
        setIsSubmitted(true);
      },
      onError: (error) => {
        toast.error('Erro ao cadastrar aluno: ' + error.message);
      },
    });
  };

  if (isSubmitted) {
    return (
      <>
        <Header
          title="Cadastrar Aluno"
          description="Registre um novo aluno no sistema"
        />
        <div className="page-container">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Aluno Cadastrado!</h2>
                <p className="text-muted-foreground">
                  O aluno foi cadastrado com sucesso e está em processo de onboarding.
                </p>
                <Button onClick={resetForm} className="mt-4">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Outro Aluno
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Cadastrar Aluno"
        description="Registre um novo aluno no sistema"
      />

      <div className="page-container">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Novo Aluno
            </CardTitle>
            <CardDescription>
              Preencha os dados do novo aluno. Campos com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Dados Pessoais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={newAluno.nome || ''}
                    onChange={(e) => setNewAluno({ ...newAluno, nome: e.target.value })}
                    placeholder="Nome do aluno"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
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
                  <Label htmlFor="email">Email *</Label>
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
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={newAluno.endereco || ''}
                    onChange={(e) => setNewAluno({ ...newAluno, endereco: e.target.value })}
                    placeholder="Endereço completo"
                  />
                </div>
              </div>

              {/* Informações de Venda */}
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
                    <Label htmlFor="turma">Turma *</Label>
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

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={newAluno.observacoes || ''}
                  onChange={(e) => setNewAluno({ ...newAluno, observacoes: e.target.value })}
                  placeholder="Observações sobre o aluno"
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Limpar
                </Button>
                <Button onClick={handleAddAluno} disabled={createAlunoMutation.isPending}>
                  {createAlunoMutation.isPending ? 'Cadastrando...' : 'Cadastrar Aluno'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
