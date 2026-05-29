"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type PacienteVinculado = {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  linked_at: string;
  latest_profile: string | null;
  latest_test_at: string | null;
  situation_count: number;
};

type PlanoFinanceiro = {
  id: string;
  therapist_id: string;
  patient_id: string;
  plan_type:
    | "sessao_avulsa"
    | "semanal"
    | "quinzenal"
    | "mensal"
    | "pacote"
    | "personalizado";
  agreed_amount: number;
  payment_day: number;
  started_at: string;
  status: "ativo" | "pausado" | "encerrado";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PagamentoClinico = {
  id: string;
  therapist_id: string;
  patient_id: string;
  financial_plan_id: string | null;
  amount: number;
  payment_date: string;
  reference_month: string;
  payment_method: "pix" | "dinheiro" | "cartao" | "transferencia" | "outro";
  status: "recebido" | "pendente" | "cancelado" | "estornado";
  notes: string | null;
  notified_patient: boolean;
  created_at: string;
  updated_at: string;
};

const nomesPlano: Record<PlanoFinanceiro["plan_type"], string> = {
  sessao_avulsa: "Sessão avulsa",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  pacote: "Pacote",
  personalizado: "Personalizado",
};

const nomesStatusPlano: Record<PlanoFinanceiro["status"], string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};

function formatarMoeda(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

function formatarData(data: string | null | undefined) {
  if (!data) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
}

function inicioDoMesAtual() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function fimDoMesAtual() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
}

function calcularStatusFinanceiro(plano?: PlanoFinanceiro, recebeuNoMes?: boolean) {
  if (!plano) {
    return {
      label: "Sem plano",
      classe:
        "border-[#D8C7B1] bg-white text-[#8A7A68]",
    };
  }

  if (plano.status === "pausado") {
    return {
      label: "Pausado",
      classe:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (plano.status === "encerrado") {
    return {
      label: "Encerrado",
      classe:
        "border-[#E5DDD2] bg-[#F7F3EC] text-[#8A7A68]",
    };
  }

  if (recebeuNoMes) {
    return {
      label: "Em dia",
      classe:
        "border-green-200 bg-green-50 text-green-700",
    };
  }

  const hoje = new Date();
  const diaAtual = hoje.getDate();

  if (diaAtual > plano.payment_day) {
    return {
      label: "Pendente",
      classe:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (plano.payment_day - diaAtual <= 5) {
    return {
      label: "Vence em breve",
      classe:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Aguardando",
    classe:
      "border-blue-200 bg-blue-50 text-blue-700",
  };
}

export default function FinanceiroClinicoPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [therapistId, setTherapistId] = useState("");
  const [pacientes, setPacientes] = useState<PacienteVinculado[]>([]);
  const [planos, setPlanos] = useState<PlanoFinanceiro[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoClinico[]>([]);

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);
      setErro("");

      const { data: usuarioAtual, error: erroUsuario } =
        await supabase.auth.getUser();

      if (erroUsuario || !usuarioAtual.user) {
        router.replace("/login");
        return;
      }

      const { data: perfil, error: erroPerfil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", usuarioAtual.user.id)
        .maybeSingle();

      if (erroPerfil || !perfil) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const role = String(perfil.role || "").trim() as Role;

      if (role !== "terapeuta" && role !== "ambos") {
        router.replace("/painel");
        return;
      }

      setTherapistId(usuarioAtual.user.id);

      const { data: pacientesVinculados, error: erroPacientes } =
        await supabase.rpc("get_linked_patients_for_therapist");

      if (erroPacientes) {
        setErro("Não foi possível carregar os pacientes vinculados.");
        setPacientes([]);
        setPlanos([]);
        setPagamentos([]);
        setCarregando(false);
        return;
      }

      const listaPacientes = (pacientesVinculados || []) as PacienteVinculado[];
      const idsPacientes = listaPacientes.map((paciente) => paciente.patient_id);

      setPacientes(listaPacientes);

      if (idsPacientes.length === 0) {
        setPlanos([]);
        setPagamentos([]);
        setCarregando(false);
        return;
      }

      const { data: planosEncontrados, error: erroPlanos } = await supabase
        .from("clinical_financial_plans")
        .select(
          "id, therapist_id, patient_id, plan_type, agreed_amount, payment_day, started_at, status, notes, created_at, updated_at"
        )
        .eq("therapist_id", usuarioAtual.user.id)
        .in("patient_id", idsPacientes)
        .order("created_at", { ascending: false });

      if (erroPlanos) {
        setErro("Não foi possível carregar os planos financeiros.");
        setPlanos([]);
      } else {
        setPlanos((planosEncontrados || []) as PlanoFinanceiro[]);
      }

      const { data: pagamentosEncontrados, error: erroPagamentos } = await supabase
        .from("clinical_payments")
        .select(
          "id, therapist_id, patient_id, financial_plan_id, amount, payment_date, reference_month, payment_method, status, notes, notified_patient, created_at, updated_at"
        )
        .eq("therapist_id", usuarioAtual.user.id)
        .in("patient_id", idsPacientes)
        .gte("reference_month", inicioDoMesAtual())
        .lte("reference_month", fimDoMesAtual())
        .order("payment_date", { ascending: false });

      if (erroPagamentos) {
        setPagamentos([]);
      } else {
        setPagamentos((pagamentosEncontrados || []) as PagamentoClinico[]);
      }

      setCarregando(false);
    }

    carregarDados();
  }, [router]);

  const planosPorPaciente = useMemo(() => {
    return new Map(planos.map((plano) => [plano.patient_id, plano]));
  }, [planos]);

  const pagamentosRecebidosNoMes = useMemo(() => {
    return pagamentos.filter((pagamento) => pagamento.status === "recebido");
  }, [pagamentos]);

  const pacientesComPagamentoNoMes = useMemo(() => {
    return new Set(
      pagamentosRecebidosNoMes.map((pagamento) => pagamento.patient_id)
    );
  }, [pagamentosRecebidosNoMes]);

  const totalRecebidoMes = useMemo(() => {
    return pagamentosRecebidosNoMes.reduce(
      (soma, pagamento) => soma + Number(pagamento.amount || 0),
      0
    );
  }, [pagamentosRecebidosNoMes]);

  const totalPrevistoAtivo = useMemo(() => {
    return planos
      .filter((plano) => plano.status === "ativo")
      .reduce((soma, plano) => soma + Number(plano.agreed_amount || 0), 0);
  }, [planos]);

  const totalPendenteEstimado = Math.max(totalPrevistoAtivo - totalRecebidoMes, 0);

  const pacientesSemPlano = useMemo(() => {
    return pacientes.filter((paciente) => !planosPorPaciente.get(paciente.patient_id));
  }, [pacientes, planosPorPaciente]);

  const pacientesPendentes = useMemo(() => {
    return pacientes.filter((paciente) => {
      const plano = planosPorPaciente.get(paciente.patient_id);
      if (!plano || plano.status !== "ativo") return false;
      return !pacientesComPagamentoNoMes.has(paciente.patient_id);
    });
  }, [pacientes, planosPorPaciente, pacientesComPagamentoNoMes]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F0E8] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Financeiro clínico
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Carregando dados financeiros...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos organizando pacientes, planos e pagamentos registrados.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F0E8] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A7A68]">
              Área clínica
            </p>

            <div className="space-y-1">
              <h1 className="break-words text-2xl font-semibold text-[#2F2A24] sm:text-3xl">
                Financeiro clínico
              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-[#6F6257]">
                Organize planos, vencimentos e pagamentos dos pacientes vinculados.
                Esta área é privada do terapeuta e não substitui controle contábil
                ou emissão fiscal.
              </p>
            </div>
          </div>

          <Link
            href="/clinico/painel"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-4 py-2 text-sm font-medium text-[#5F564C] transition hover:bg-[#F7F3EC] sm:w-auto"
          >
            Voltar ao painel clínico
          </Link>
        </header>

        {erro && (
          <div className="rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
            {erro}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl bg-[#2F2A24] p-5 text-white shadow-sm">
            <p className="text-sm text-white/70">Recebido no mês</p>

            <p className="mt-3 text-3xl font-semibold">
              {formatarMoeda(totalRecebidoMes)}
            </p>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Pagamentos marcados como recebidos.
            </p>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Previsto ativo
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {formatarMoeda(totalPrevistoAtivo)}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Soma dos planos ativos configurados.
            </p>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Pendente estimado
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {formatarMoeda(totalPendenteEstimado)}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Diferença entre previsto ativo e recebido no mês.
            </p>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Sem plano financeiro
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {pacientesSemPlano.length}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Paciente(s) ainda sem plano configurado.
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                  Pacientes vinculados
                </p>

                <h2 className="text-xl font-semibold text-[#2F2A24]">
                  Organização financeira por paciente
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                  Abra um paciente para configurar plano, registrar pagamentos e
                  acompanhar vencimentos.
                </p>
              </div>
            </div>

            {pacientes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
                <p className="text-sm font-medium text-[#2F2A24]">
                  Nenhum paciente vinculado.
                </p>

                <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                  Quando houver pacientes vinculados, eles aparecerão aqui para
                  organização financeira.
                </p>
              </div>
            ) : (
              <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                {pacientes.map((paciente) => {
                  const plano = planosPorPaciente.get(paciente.patient_id);
                  const recebeuNoMes = pacientesComPagamentoNoMes.has(
                    paciente.patient_id
                  );
                  const statusFinanceiro = calcularStatusFinanceiro(
                    plano,
                    recebeuNoMes
                  );

                  return (
                    <Link
                      key={paciente.patient_id}
                      href={`/clinico/financeiro/${paciente.patient_id}`}
                      className="block rounded-3xl border border-[#E5DDD2] bg-[#F7F3EC] p-4 transition hover:bg-[#FFF8EE] hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-base font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
                            {paciente.patient_name}
                          </p>

                          <p className="mt-1 break-words text-sm text-[#5F564C] [overflow-wrap:anywhere]">
                            {paciente.patient_email}
                          </p>

                          <p className="mt-2 text-xs text-[#8A7A68]">
                            Vinculado em {formatarData(paciente.linked_at)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <span
                            className={`w-fit rounded-2xl border px-3 py-2 text-xs font-semibold ${statusFinanceiro.classe}`}
                          >
                            {statusFinanceiro.label}
                          </span>

                          {plano && (
                            <span className="w-fit rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold text-[#5F564C]">
                              Vence dia {plano.payment_day}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-medium text-[#8A7A68]">
                            Plano
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
                            {plano ? nomesPlano[plano.plan_type] : "Não configurado"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-medium text-[#8A7A68]">
                            Valor acordado
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
                            {plano ? formatarMoeda(plano.agreed_amount) : "Não informado"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-medium text-[#8A7A68]">
                            Status do plano
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
                            {plano ? nomesStatusPlano[plano.status] : "Sem plano"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <article className="rounded-3xl bg-[#2F2A24] p-5 text-white shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-white/70">
                Visão do mês
              </p>

              <h2 className="text-xl font-semibold">
                {pacientesPendentes.length} paciente(s) com pagamento pendente
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/70">
                A pendência é estimada com base nos planos ativos e pagamentos
                recebidos no mês atual.
              </p>
            </article>

            <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Próximas melhorias
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Controle financeiro clínico
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                Na próxima etapa, cada paciente terá uma página financeira própria
                para configurar plano, registrar pagamento e enviar confirmação por push.
              </p>
            </article>

            <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-[#8A7A68]">
                Observação
              </p>

              <p className="text-sm leading-6 text-[#5F564C]">
                Esta área organiza recebimentos clínicos e acordos terapêuticos.
                Ela não substitui contabilidade, emissão fiscal ou controle bancário.
              </p>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}