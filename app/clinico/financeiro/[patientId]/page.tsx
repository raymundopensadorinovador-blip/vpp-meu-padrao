"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type PacienteDetalhe = {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  linked_at: string;
};

type PlanoTipo =
  | "sessao_avulsa"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "pacote"
  | "personalizado";

type PlanoStatus = "ativo" | "pausado" | "encerrado";

type PagamentoStatus = "recebido" | "pendente" | "cancelado" | "estornado";

type MetodoPagamento = "pix" | "dinheiro" | "cartao" | "transferencia" | "outro";

type PlanoFinanceiro = {
  id: string;
  therapist_id: string;
  patient_id: string;
  plan_type: PlanoTipo;
  agreed_amount: number;
  payment_day: number;
  started_at: string;
  status: PlanoStatus;
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
  payment_method: MetodoPagamento;
  status: PagamentoStatus;
  notes: string | null;
  notified_patient: boolean;
  created_at: string;
  updated_at: string;
};

const nomesPlano: Record<PlanoTipo, string> = {
  sessao_avulsa: "Sessão avulsa",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  pacote: "Pacote",
  personalizado: "Personalizado",
};

const nomesMetodo: Record<MetodoPagamento, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

const nomesStatusPagamento: Record<PagamentoStatus, string> = {
  recebido: "Recebido",
  pendente: "Pendente",
  cancelado: "Cancelado",
  estornado: "Estornado",
};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function primeiroDiaMesAtual() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

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

function formatarMesReferencia(data: string | null | undefined) {
  if (!data) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(data));
}

export default function FinanceiroPacientePage() {
  const router = useRouter();
  const params = useParams();

  const patientId = String(params.patientId || "");

  const [carregando, setCarregando] = useState(true);
  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);
  const [notificandoId, setNotificandoId] = useState<string | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [therapistId, setTherapistId] = useState("");
const [therapistName, setTherapistName] = useState("");
const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null);
  const [plano, setPlano] = useState<PlanoFinanceiro | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoClinico[]>([]);

  const [planType, setPlanType] = useState<PlanoTipo>("mensal");
  const [agreedAmount, setAgreedAmount] = useState("");
  const [paymentDay, setPaymentDay] = useState("10");
  const [startedAt, setStartedAt] = useState(hojeISO());
  const [planStatus, setPlanStatus] = useState<PlanoStatus>("ativo");
  const [planNotes, setPlanNotes] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(hojeISO());
  const [referenceMonth, setReferenceMonth] = useState(primeiroDiaMesAtual());
  const [paymentMethod, setPaymentMethod] = useState<MetodoPagamento>("pix");
  const [paymentStatus, setPaymentStatus] = useState<PagamentoStatus>("recebido");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [notificarPaciente, setNotificarPaciente] = useState(true);

  async function carregarPagamentos(terapeuta: string) {
    const { data, error } = await supabase
      .from("clinical_payments")
      .select(
        "id, therapist_id, patient_id, financial_plan_id, amount, payment_date, reference_month, payment_method, status, notes, notified_patient, created_at, updated_at"
      )
      .eq("therapist_id", terapeuta)
      .eq("patient_id", patientId)
      .order("payment_date", { ascending: false });

    if (error) {
      setErro("Não foi possível carregar o histórico de pagamentos.");
      setPagamentos([]);
      return;
    }

    setPagamentos((data || []) as PagamentoClinico[]);
  }

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
      .select("name, role")
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
      setTherapistName(perfil.name || "Seu terapeuta");

      const { data: detalhe, error: erroDetalhe } = await supabase.rpc(
        "get_linked_patient_details",
        {
          p_patient_id: patientId,
        }
      );

      if (erroDetalhe) {
        setErro("Não foi possível confirmar o vínculo com este paciente.");
        setCarregando(false);
        return;
      }

      const pacienteEncontrado = Array.isArray(detalhe) ? detalhe[0] : detalhe;

      if (!pacienteEncontrado) {
        setErro("Paciente não encontrado ou não vinculado a este terapeuta.");
        setCarregando(false);
        return;
      }

      setPaciente({
        patient_id: pacienteEncontrado.patient_id,
        patient_name: pacienteEncontrado.patient_name,
        patient_email: pacienteEncontrado.patient_email,
        linked_at: pacienteEncontrado.linked_at,
      });

      const { data: planoEncontrado, error: erroPlano } = await supabase
        .from("clinical_financial_plans")
        .select(
          "id, therapist_id, patient_id, plan_type, agreed_amount, payment_day, started_at, status, notes, created_at, updated_at"
        )
        .eq("therapist_id", usuarioAtual.user.id)
        .eq("patient_id", patientId)
        .maybeSingle();

      if (erroPlano) {
        setErro("Não foi possível carregar o plano financeiro deste paciente.");
      }

      if (planoEncontrado) {
        const planoAtual = planoEncontrado as PlanoFinanceiro;

        setPlano(planoAtual);
        setPlanType(planoAtual.plan_type);
        setAgreedAmount(String(planoAtual.agreed_amount || ""));
        setPaymentDay(String(planoAtual.payment_day || "10"));
        setStartedAt(planoAtual.started_at || hojeISO());
        setPlanStatus(planoAtual.status);
        setPlanNotes(planoAtual.notes || "");
        setPaymentAmount(String(planoAtual.agreed_amount || ""));
      }

      await carregarPagamentos(usuarioAtual.user.id);

      setCarregando(false);
    }

    carregarDados();
  }, [router, patientId]);

  const totalRecebido = useMemo(() => {
    return pagamentos
      .filter((pagamento) => pagamento.status === "recebido")
      .reduce((soma, pagamento) => soma + Number(pagamento.amount || 0), 0);
  }, [pagamentos]);

  const ultimoPagamento = pagamentos[0] || null;

  const recebeuNoMesAtual = useMemo(() => {
    const mesAtual = primeiroDiaMesAtual();

    return pagamentos.some(
      (pagamento) =>
        pagamento.status === "recebido" &&
        pagamento.reference_month?.slice(0, 7) === mesAtual.slice(0, 7)
    );
  }, [pagamentos]);

  async function handleSalvarPlano(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paciente || !therapistId) return;

    setErro("");
    setSucesso("");

    const valor = Number(agreedAmount.replace(",", "."));
    const dia = Number(paymentDay);

    if (!valor || valor < 0) {
      setErro("Informe um valor acordado válido.");
      return;
    }

    if (!dia || dia < 1 || dia > 31) {
      setErro("Informe um dia de vencimento entre 1 e 31.");
      return;
    }

    if (!startedAt) {
      setErro("Informe a data de início do acompanhamento.");
      return;
    }

    setSalvandoPlano(true);

    try {
      const payload = {
        therapist_id: therapistId,
        patient_id: paciente.patient_id,
        plan_type: planType,
        agreed_amount: valor,
        payment_day: dia,
        started_at: startedAt,
        status: planStatus,
        notes: planNotes.trim() || null,
      };

      if (plano) {
        const { data, error } = await supabase
          .from("clinical_financial_plans")
          .update(payload)
          .eq("id", plano.id)
          .eq("therapist_id", therapistId)
          .eq("patient_id", paciente.patient_id)
          .select()
          .single();

        if (error) {
          setErro("Não foi possível atualizar o plano financeiro.");
          return;
        }

        setPlano(data as PlanoFinanceiro);
        setSucesso("Plano financeiro atualizado com sucesso.");
      } else {
        const { data, error } = await supabase
          .from("clinical_financial_plans")
          .insert(payload)
          .select()
          .single();

        if (error) {
          setErro("Não foi possível criar o plano financeiro.");
          return;
        }

        setPlano(data as PlanoFinanceiro);
        setSucesso("Plano financeiro criado com sucesso.");
      }

      setPaymentAmount(String(valor));
    } finally {
      setSalvandoPlano(false);
    }
  }

  async function enviarPushConfirmacaoPagamento(valor: string) {
    if (!paciente) return false;
  
    const nomeProfissional = therapistName.trim() || "Seu terapeuta";
  
    const { data: sessaoAtual } = await supabase.auth.getSession();
  
    const resposta = await fetch("/api/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessaoAtual.session?.access_token || ""}`,
      },
      body: JSON.stringify({
        userId: paciente.patient_id,
        title: "Pagamento confirmado",
        message: `${nomeProfissional} confirmou o recebimento do seu pagamento de ${valor} no VPP — Meu Padrão.`,
        url: "/painel",
      }),
    });
  
    return resposta.ok;
  }

  async function handleRegistrarPagamento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paciente || !therapistId) return;

    setErro("");
    setSucesso("");

    const valor = Number(paymentAmount.replace(",", "."));

    if (!valor || valor < 0) {
      setErro("Informe um valor de pagamento válido.");
      return;
    }

    if (!paymentDate) {
      setErro("Informe a data do pagamento.");
      return;
    }

    if (!referenceMonth) {
      setErro("Informe o mês de referência.");
      return;
    }

    setSalvandoPagamento(true);

    try {
      let pushEnviado = false;

      if (paymentStatus === "recebido" && notificarPaciente) {
        pushEnviado = await enviarPushConfirmacaoPagamento(formatarMoeda(valor));
      }

      const { data, error } = await supabase
        .from("clinical_payments")
        .insert({
          therapist_id: therapistId,
          patient_id: paciente.patient_id,
          financial_plan_id: plano?.id || null,
          amount: valor,
          payment_date: paymentDate,
          reference_month: referenceMonth,
          payment_method: paymentMethod,
          status: paymentStatus,
          notes: paymentNotes.trim() || null,
          notified_patient: pushEnviado,
        })
        .select()
        .single();

      if (error) {
        setErro("Não foi possível registrar o pagamento.");
        return;
      }

      setPagamentos((atuais) => [data as PagamentoClinico, ...atuais]);
      setPaymentNotes("");
      setSucesso(
        pushEnviado
          ? "Pagamento registrado e paciente notificado."
          : "Pagamento registrado com sucesso."
      );
    } finally {
      setSalvandoPagamento(false);
    }
  }

  async function handleNotificarPagamento(pagamento: PagamentoClinico) {
    if (!paciente || pagamento.status !== "recebido") return;

    setErro("");
    setSucesso("");
    setNotificandoId(pagamento.id);

    try {
      const pushEnviado = await enviarPushConfirmacaoPagamento(
        formatarMoeda(pagamento.amount)
      );

      if (!pushEnviado) {
        setErro("Não foi possível enviar a notificação ao paciente.");
        return;
      }

      const { data, error } = await supabase
        .from("clinical_payments")
        .update({ notified_patient: true })
        .eq("id", pagamento.id)
        .eq("therapist_id", therapistId)
        .eq("patient_id", paciente.patient_id)
        .select()
        .single();

      if (error) {
        setErro("A notificação foi enviada, mas não foi possível atualizar o registro.");
        return;
      }

      setPagamentos((atuais) =>
        atuais.map((item) =>
          item.id === pagamento.id ? (data as PagamentoClinico) : item
        )
      );

      setSucesso("Paciente notificado sobre a confirmação do pagamento.");
    } finally {
      setNotificandoId(null);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F0E8] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Financeiro clínico
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Carregando paciente...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos buscando plano financeiro e pagamentos registrados.
          </p>
        </div>
      </main>
    );
  }

  if (!paciente) {
    return (
      <main className="min-h-screen bg-[#F6F0E8] px-4 py-6 text-[#2F2A24]">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Financeiro indisponível
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Não foi possível abrir este paciente
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              {erro || "Paciente não encontrado ou não vinculado a este terapeuta."}
            </p>

            <Link
              href="/clinico/financeiro"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Voltar ao financeiro
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F0E8] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A7A68]">
              Financeiro clínico
            </p>

            <div className="space-y-1">
              <h1 className="break-words text-2xl font-semibold text-[#2F2A24] sm:text-3xl [overflow-wrap:anywhere]">
                {paciente.patient_name}
              </h1>

              <p className="break-words text-sm leading-relaxed text-[#6F6257] [overflow-wrap:anywhere]">
                {paciente.patient_email}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:w-auto">
            <Link
              href={`/clinico/pacientes/${paciente.patient_id}`}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-4 py-2 text-sm font-medium text-[#5F564C] transition hover:bg-[#F7F3EC] sm:w-auto"
            >
              Ficha do paciente
            </Link>

            <Link
              href="/clinico/financeiro"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 sm:w-auto"
            >
              Voltar ao financeiro
            </Link>
          </div>
        </header>

        {(erro || sucesso) && (
          <section className="space-y-2">
            {erro && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm leading-6 text-[#5F564C] shadow-sm">
                {sucesso}
              </div>
            )}
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl bg-[#2F2A24] p-5 text-white shadow-sm">
            <p className="text-sm text-white/70">Valor acordado</p>

            <p className="mt-3 text-3xl font-semibold">
              {plano ? formatarMoeda(plano.agreed_amount) : "Sem plano"}
            </p>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Plano financeiro atual do paciente.
            </p>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Vencimento
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {plano ? `Dia ${plano.payment_day}` : "--"}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Dia de vencimento acordado.
            </p>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Total recebido
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {formatarMoeda(totalRecebido)}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Soma de pagamentos registrados como recebidos.
            </p>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Status do mês
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {recebeuNoMesAtual ? "Em dia" : "Pendente"}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Baseado nos pagamentos recebidos no mês atual.
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 space-y-1">
              <p className="text-sm font-medium text-[#8A2E2B]">
                Plano financeiro
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Acordo terapêutico financeiro
              </h2>

              <p className="text-sm leading-6 text-[#5F564C]">
                Configure o tipo de plano, valor, vencimento e início do acompanhamento.
              </p>
            </div>

            <form onSubmit={handleSalvarPlano} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Tipo de plano
                </span>

                <select
                  value={planType}
                  onChange={(event) => setPlanType(event.target.value as PlanoTipo)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvandoPlano}
                >
                  <option value="sessao_avulsa">Sessão avulsa</option>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                  <option value="pacote">Pacote</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[#2F2A24]">
                    Valor acordado
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={agreedAmount}
                    onChange={(event) => setAgreedAmount(event.target.value)}
                    placeholder="Ex: 300"
                    className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                    disabled={salvandoPlano}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[#2F2A24]">
                    Dia de vencimento
                  </span>

                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDay}
                    onChange={(event) => setPaymentDay(event.target.value)}
                    placeholder="Ex: 10"
                    className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                    disabled={salvandoPlano}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[#2F2A24]">
                    Início do acompanhamento
                  </span>

                  <input
                    type="date"
                    value={startedAt}
                    onChange={(event) => setStartedAt(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white"
                    disabled={salvandoPlano}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[#2F2A24]">
                    Status do plano
                  </span>

                  <select
                    value={planStatus}
                    onChange={(event) => setPlanStatus(event.target.value as PlanoStatus)}
                    className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B] focus:bg-white"
                    disabled={salvandoPlano}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="pausado">Pausado</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Observações privadas
                </span>

                <textarea
                  value={planNotes}
                  onChange={(event) => setPlanNotes(event.target.value)}
                  placeholder="Ex: valor combinado, exceções, observações internas..."
                  className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvandoPlano}
                />
              </label>

              <button
                type="submit"
                disabled={salvandoPlano}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvandoPlano
                  ? "Salvando..."
                  : plano
                    ? "Atualizar plano"
                    : "Criar plano financeiro"}
              </button>
            </form>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 space-y-1">
              <p className="text-sm font-medium text-[#8A2E2B]">
                Registrar pagamento
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Pagamento recebido ou pendente
              </h2>

              <p className="text-sm leading-6 text-[#5F564C]">
                Registre pagamentos e, quando desejar, envie uma confirmação por push ao paciente.
              </p>
            </div>

            <form onSubmit={handleRegistrarPagamento} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[#2F2A24]">
                    Valor
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="Ex: 300"
                    className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                    disabled={salvandoPagamento}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[#2F2A24]">
                    Data do pagamento
                  </span>

                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white"
                    disabled={salvandoPagamento}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[#2F2A24]">
                    Mês de referência
                  </span>

                  <input
                    type="date"
                    value={referenceMonth}
                    onChange={(event) => setReferenceMonth(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white"
                    disabled={salvandoPagamento}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[#2F2A24]">
                    Forma de pagamento
                  </span>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as MetodoPagamento)
                    }
                    className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B] focus:bg-white"
                    disabled={salvandoPagamento}
                  >
                    <option value="pix">Pix</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="transferencia">Transferência</option>
                    <option value="outro">Outro</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Status do pagamento
                </span>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(event.target.value as PagamentoStatus)
                  }
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvandoPagamento}
                >
                  <option value="recebido">Recebido</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="estornado">Estornado</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Observação
                </span>

                <textarea
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  placeholder="Ex: referente ao mês, sessão avulsa, ajuste combinado..."
                  className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvandoPagamento}
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                <input
                  type="checkbox"
                  checked={notificarPaciente}
                  onChange={(event) => setNotificarPaciente(event.target.checked)}
                  disabled={salvandoPagamento || paymentStatus !== "recebido"}
                  className="mt-1 h-4 w-4 accent-[#8A2E2B]"
                />

                <span className="text-sm leading-6 text-[#5F564C]">
                  Enviar push ao paciente confirmando o pagamento recebido.
                </span>
              </label>

              <button
                type="submit"
                disabled={salvandoPagamento}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvandoPagamento ? "Registrando..." : "Registrar pagamento"}
              </button>
            </form>
          </article>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Histórico financeiro
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Pagamentos registrados
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                Acompanhe pagamentos recebidos, pendentes, cancelados ou estornados.
              </p>
            </div>

            {ultimoPagamento && (
              <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] px-4 py-3">
                <p className="text-xs font-medium text-[#8A7A68]">
                  Último pagamento
                </p>

                <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
                  {formatarMoeda(ultimoPagamento.amount)} em{" "}
                  {formatarData(ultimoPagamento.payment_date)}
                </p>
              </div>
            )}
          </div>

          {pagamentos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
              <p className="text-sm font-medium text-[#2F2A24]">
                Nenhum pagamento registrado.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Quando houver pagamentos registrados, eles aparecerão aqui no histórico.
              </p>
            </div>
          ) : (
            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {pagamentos.map((pagamento) => (
                <article
                  key={pagamento.id}
                  className="rounded-3xl border border-[#E5DDD2] bg-[#F7F3EC] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[#2F2A24]">
                        {formatarMoeda(pagamento.amount)}
                      </p>

                      <p className="mt-1 text-sm text-[#5F564C]">
                        {formatarMesReferencia(pagamento.reference_month)} •{" "}
                        {formatarData(pagamento.payment_date)}
                      </p>

                      <p className="mt-1 text-xs text-[#8A7A68]">
                        {nomesMetodo[pagamento.payment_method]}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <span className="w-fit rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold text-[#5F564C]">
                        {nomesStatusPagamento[pagamento.status]}
                      </span>

                      {pagamento.notified_patient && (
                        <span className="w-fit rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                          Paciente notificado
                        </span>
                      )}

                      {pagamento.status === "recebido" &&
                        !pagamento.notified_patient && (
                          <button
                            type="button"
                            onClick={() => handleNotificarPagamento(pagamento)}
                            disabled={notificandoId === pagamento.id}
                            className="w-fit rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold text-[#5F564C] transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {notificandoId === pagamento.id
                              ? "Enviando..."
                              : "Notificar paciente"}
                          </button>
                        )}
                    </div>
                  </div>

                  {pagamento.notes && (
                    <div className="mt-3 rounded-2xl bg-white p-3">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                        {pagamento.notes}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}