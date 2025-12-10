import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { useAlunos, useTurmas, useFinanceiroResumo } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/formatters';
import { Users, BookOpen, DollarSign, UserPlus, TrendingUp, TrendingDown } from 'lucide-react';
import { Aluno, Turma } from '@/types/clinic';

export default function Dashboard() {
  const { data: alunos = [], isLoading: loadingAlunos, isError: errorAlunos, refetch: refetchAlunos } = useAlunos();
  const { data: turmas = [], isLoading: loadingTurmas, isError: errorTurmas, refetch: refetchTurmas } = useTurmas();
  const { data: resumo, isLoading: loadingResumo, isError: errorResumo, refetch: refetchResumo } = useFinanceiroResumo();

  const isLoading = loadingAlunos || loadingTurmas || loadingResumo;
  const isError = errorAlunos || errorTurmas || errorResumo;

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" description="Visão geral da clínica" />
        <PageLoading text="Carregando dashboard..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Dashboard" description="Visão geral da clínica" />
        <div className="page-container">
          <PageError onRetry={() => {
            refetchAlunos();
            refetchTurmas();
            refetchResumo();
          }} />
        </div>
      </>
    );
  }

  // Calculate metrics
  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter(a => a.status === 'Ativo').length;
  const alunosOnboarding = alunos.filter(a => a.status === 'Em Onboarding').length;
  const turmasAbertas = turmas.filter(t => t.status === 'Aberta' || t.status === 'Em Andamento').length;

  const totalEntradas = resumo?.entradas || 0;
  const totalSaidas = resumo?.saidas || 0;
  const saldo = resumo?.saldo || 0;

  // Recent students
  const recentAlunos = [...alunos]
    .sort((a, b) => {
      const dateA = a.data_matricula.split('/').reverse().join('');
      const dateB = b.data_matricula.split('/').reverse().join('');
      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  const alunoColumns: Column<Aluno>[] = [
    { key: 'nome', header: 'Nome' },
    { key: 'telefone', header: 'Telefone' },
    { key: 'data_matricula', header: 'Matrícula' },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  // Active classes
  const activeTurmas = turmas.filter(
    t => t.status === 'Aberta' || t.status === 'Em Andamento'
  );

  const turmaColumns: Column<Turma>[] = [
    { key: 'nome', header: 'Turma' },
    { key: 'instrutor', header: 'Instrutor' },
    { key: 'data_evento', header: 'Data' },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <>
      <Header
        title="Dashboard"
        description="Visão geral da clínica"
      />

      <div className="page-container">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Alunos"
            value={totalAlunos}
            subtitle={`${alunosAtivos} ativos`}
            icon={Users}
            variant="primary"
          />
          <MetricCard
            title="Turmas Ativas"
            value={turmasAbertas}
            subtitle={`de ${turmas.length} turmas`}
            icon={BookOpen}
            variant="success"
          />
          <MetricCard
            title="Em Onboarding"
            value={alunosOnboarding}
            subtitle="aguardando integração"
            icon={UserPlus}
            variant="warning"
          />
          <MetricCard
            title="Saldo do Mês"
            value={formatCurrency(saldo)}
            subtitle={saldo >= 0 ? 'Positivo' : 'Negativo'}
            icon={saldo >= 0 ? TrendingUp : TrendingDown}
            variant={saldo >= 0 ? 'success' : 'destructive'}
          />
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="metric-card border-l-4 border-l-success">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Total Entradas</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalEntradas)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success/50" />
            </div>
          </div>
          <div className="metric-card border-l-4 border-l-destructive">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Total Saídas</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalSaidas)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive/50" />
            </div>
          </div>
          <div className="metric-card border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Saldo Atual</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(saldo)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary/50" />
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Students */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Alunos Recentes</h2>
              <a href="/students" className="text-sm font-medium text-primary hover:underline">
                Ver todos →
              </a>
            </div>
            <DataTable
              data={recentAlunos}
              columns={alunoColumns}
              emptyMessage="Nenhum aluno cadastrado"
            />
          </div>

          {/* Active Classes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Turmas Ativas</h2>
              <a href="/schedule" className="text-sm font-medium text-primary hover:underline">
                Ver todas →
              </a>
            </div>
            <DataTable
              data={activeTurmas}
              columns={turmaColumns}
              emptyMessage="Nenhuma turma ativa"
            />
          </div>
        </div>
      </div>
    </>
  );
}
