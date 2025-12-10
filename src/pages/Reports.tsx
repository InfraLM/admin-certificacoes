import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { formatCurrency } from '@/lib/formatters';
import { Users, BookOpen, DollarSign, TrendingUp, Calendar, UserCheck } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAlunos, useTurmas, useFinanceiro, useAlunoTurma } from '@/hooks/useApi';

const COLORS = ['hsl(172, 66%, 35%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(199, 89%, 48%)'];

export default function Reports() {
  // Fetch data from API
  const { data: alunos = [], isLoading: loadingAlunos, isError: errorAlunos, refetch: refetchAlunos } = useAlunos();
  const { data: turmas = [], isLoading: loadingTurmas, isError: errorTurmas, refetch: refetchTurmas } = useTurmas();
  const { data: financeiro = [], isLoading: loadingFinanceiro, isError: errorFinanceiro, refetch: refetchFinanceiro } = useFinanceiro();
  const { data: alunoTurma = [], isLoading: loadingAlunoTurma, isError: errorAlunoTurma, refetch: refetchAlunoTurma } = useAlunoTurma();

  const isLoading = loadingAlunos || loadingTurmas || loadingFinanceiro || loadingAlunoTurma;
  const isError = errorAlunos || errorTurmas || errorFinanceiro || errorAlunoTurma;

  if (isLoading) {
    return (
      <>
        <Header
          title="Relatórios"
          description="Visualização de métricas e indicadores da clínica"
        />
        <PageLoading text="Carregando relatórios..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header
          title="Relatórios"
          description="Visualização de métricas e indicadores da clínica"
        />
        <div className="page-container">
          <PageError onRetry={() => {
            refetchAlunos();
            refetchTurmas();
            refetchFinanceiro();
            refetchAlunoTurma();
          }} />
        </div>
      </>
    );
  }

  // Calculate metrics
  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter((a) => a.status === 'Ativo').length;
  const alunosOnboarding = alunos.filter((a) => a.status === 'Em Onboarding').length;
  const alunosInativos = alunos.filter((a) => a.status === 'Inativo').length;

  const totalTurmas = turmas.length;
  const turmasAtivas = turmas.filter((t) => t.status === 'Em Andamento' || t.status === 'Aberta').length;

  const totalEntradas = financeiro
    .filter((f) => f.tipo === 'Entrada')
    .reduce((acc, f) => acc + parseFloat(f.valor_total || '0'), 0);

  const totalSaidas = financeiro
    .filter((f) => f.tipo === 'Saída')
    .reduce((acc, f) => acc + parseFloat(f.valor_total || '0'), 0);

  const saldo = totalEntradas - totalSaidas;

  const inscricoesAtivas = alunoTurma.filter((at) => at.status === 'Inscrito').length;

  // Chart data - Alunos por Status
  const alunosStatusData = [
    { name: 'Ativos', value: alunosAtivos, fill: 'hsl(142, 71%, 45%)' },
    { name: 'Onboarding', value: alunosOnboarding, fill: 'hsl(38, 92%, 50%)' },
    { name: 'Inativos', value: alunosInativos, fill: 'hsl(215, 15%, 45%)' },
  ].filter((d) => d.value > 0);

  // Chart data - Financeiro por Categoria
  const financeiroByCategoria: { [key: string]: { entrada: number; saida: number } } = {};
  financeiro.forEach((f) => {
    if (!financeiroByCategoria[f.categoria]) {
      financeiroByCategoria[f.categoria] = { entrada: 0, saida: 0 };
    }
    if (f.tipo === 'Entrada') {
      financeiroByCategoria[f.categoria].entrada += parseFloat(f.valor_total || '0');
    } else {
      financeiroByCategoria[f.categoria].saida += parseFloat(f.valor_total || '0');
    }
  });

  const financeiroChartData = Object.entries(financeiroByCategoria).map(([categoria, valores]) => ({
    categoria,
    entrada: valores.entrada,
    saida: valores.saida,
  }));

  // Turmas por Status
  const turmasStatusData = [
    { name: 'Abertas', value: turmas.filter((t) => t.status === 'Aberta').length },
    { name: 'Em Andamento', value: turmas.filter((t) => t.status === 'Em Andamento').length },
    { name: 'Finalizadas', value: turmas.filter((t) => t.status === 'Finalizada').length },
    { name: 'Canceladas', value: turmas.filter((t) => t.status === 'Cancelada').length },
  ].filter((d) => d.value > 0);

  // Top Turmas by Inscritos
  const turmasComInscritos = turmas
    .map((turma) => ({
      ...turma,
      inscritos: alunoTurma.filter(
        (at) => at.turma_id === turma.id && at.status === 'Inscrito'
      ).length,
    }))
    .sort((a, b) => b.inscritos - a.inscritos)
    .slice(0, 5);

  // Recent Financial Activity (últimas 5 movimentações)
  const recentFinanceiro = [...financeiro]
    .sort((a, b) => {
      // Converter dd/mm/yyyy para comparação
      const dateA = a.data.split('/').reverse().join('');
      const dateB = b.data.split('/').reverse().join('');
      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  return (
    <>
      <Header
        title="Relatórios"
        description="Visualização de métricas e indicadores da clínica"
      />

      <div className="page-container">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Total Alunos"
            value={totalAlunos}
            icon={Users}
            variant="primary"
          />
          <MetricCard
            title="Alunos Ativos"
            value={alunosAtivos}
            icon={UserCheck}
            variant="success"
          />
          <MetricCard
            title="Turmas Ativas"
            value={turmasAtivas}
            icon={BookOpen}
            variant="primary"
          />
          <MetricCard
            title="Inscrições"
            value={inscricoesAtivas}
            icon={Calendar}
            variant="default"
          />
          <MetricCard
            title="Entradas"
            value={formatCurrency(totalEntradas)}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Saldo"
            value={formatCurrency(saldo)}
            icon={DollarSign}
            variant={saldo >= 0 ? 'success' : 'destructive'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Alunos por Status */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 text-foreground">Alunos por Status</h3>
            {alunosStatusData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={alunosStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {alunosStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhum aluno cadastrado
              </div>
            )}
          </div>

          {/* Turmas por Status */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 text-foreground">Turmas por Status</h3>
            {turmasStatusData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={turmasStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {turmasStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhuma turma cadastrada
              </div>
            )}
          </div>
        </div>

        {/* Financial Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 text-foreground">Financeiro por Categoria</h3>
          {financeiroChartData.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeiroChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="categoria" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="entrada" name="Entradas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saida" name="Saídas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
              Nenhuma movimentação financeira cadastrada
            </div>
          )}
        </div>

        {/* Summary Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Turmas by Inscritos */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 text-foreground">Turmas com Mais Inscritos</h3>
            {turmasComInscritos.length > 0 ? (
              <div className="space-y-3">
                {turmasComInscritos.map((turma, index) => (
                  <div
                    key={turma.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{turma.nome}</p>
                        <p className="text-sm text-muted-foreground">{turma.instrutor}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{turma.inscritos}</p>
                      <p className="text-xs text-muted-foreground">inscritos</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Nenhuma turma com inscrições
              </div>
            )}
          </div>

          {/* Recent Financial Activity */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 text-foreground">Movimentações Recentes</h3>
            {recentFinanceiro.length > 0 ? (
              <div className="space-y-3">
                {recentFinanceiro.map((registro) => (
                  <div
                    key={registro.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          registro.tipo === 'Entrada'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {registro.tipo === 'Entrada' ? '+' : '-'}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{registro.categoria}</p>
                        <p className="text-sm text-muted-foreground">{registro.data}</p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        registro.tipo === 'Entrada' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {registro.tipo === 'Entrada' ? '+' : '-'}
                      {formatCurrency(parseFloat(registro.valor_total || '0'))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Nenhuma movimentação financeira
              </div>
            )}
          </div>
        </div>

        {/* Empty State - Show only if ALL data is empty */}
        {totalAlunos === 0 && totalTurmas === 0 && financeiro.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <DollarSign className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Nenhum Dado Disponível
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastre alunos, turmas e movimentações financeiras para visualizar os relatórios.
            </p>
          </div>
        )}
      </div>
    </>
  );
}