"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type PacienteDetalhe = {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  linked_at: string;

  result_id: string | null;
  predominant_profile: string | null;
  secondary_profiles: string[] | null;
  description: string | null;
  functioning_reading: string | null;
  attention_point: string | null;
  potential: string | null;
  observation_focus: string | null;
  self_observation_question: string | null;
  test_created_at: string | null;
};

type SituacaoPaciente = {
  id: string;
  situation: string;
  expected: string;
  thought: string;
  action_taken: string;
  outcome: string;
  area: string;
  predominant_response: string;
  emotional_intensity: number;
  pattern_note: string | null;
  created_at: string;
};

type VersaoAnamnese = {
  id: string;
  anamnesis_id: string;
  patient_id: string;
  version_number: number;
  main_complaint: Record<string, unknown>;
  symptoms_and_risks: Record<string, unknown>;
  perceived_patterns: Record<string, unknown>;
  trusted_contact: Record<string, unknown>;
  final_notes: Record<string, unknown>;
  submitted_at: string;
  created_at: string;
};

type NotaAnamnese = {
  id: string;
  title: string;
  note: string;
  note_type: string;
  created_at: string;
};

type PreparacaoSessao = {
  id: string;
  therapist_id: string;
  patient_id: string;
  title: string;
  session_date: string | null;
  preparation_note: string | null;
  focus_points: string | null;
  questions_to_explore: string | null;
  risk_points: string | null;
  therapist_private_notes: string | null;
  status: "rascunho" | "preparada" | "realizada" | "arquivada";
  created_at: string;
  updated_at: string;
};

type SonhoPaciente = {
    id: string;
    patient_id: string;
    dream_date: string;
    title: string;
    dream_report: string;
    main_emotions: string | null;
    recurring_people: string | null;
    recurring_places: string | null;
    symbols_or_images: string | null;
    waking_feeling: string | null;
    possible_context: string | null;
    created_at: string;
  };

type ItemResumo = {
  nome: string;
  total: number;
};

function texto(valor: unknown) {
  if (typeof valor !== "string") return "";
  return valor.trim();
}

function formatarData(data: string | null) {
  if (!data) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
}

function formatarDataHora(data: string | null) {
  if (!data) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

function formatarParaInputDatetime(data: string | null) {
  if (!data) return "";

  const date = new Date(data);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

function contarOcorrencias(lista: string[]) {
  const contagem = lista.reduce<Record<string, number>>((acc, item) => {
    const chave = String(item || "").trim();

    if (!chave) return acc;

    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(contagem)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
}

export default function PreSessaoPacientePage() {
  const router = useRouter();
  const params = useParams();

  const pacienteId = String(params.id || "");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [terapeutaId, setTerapeutaId] = useState("");
  const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null);
  const [situacoes, setSituacoes] = useState<SituacaoPaciente[]>([]);
  const [ultimaAnamnese, setUltimaAnamnese] = useState<VersaoAnamnese | null>(
    null
  );
  const [notasAnamnese, setNotasAnamnese] = useState<NotaAnamnese[]>([]);
const [sonhosPaciente, setSonhosPaciente] = useState<SonhoPaciente[]>([]);
const [preparacoes, setPreparacoes] = useState<PreparacaoSessao[]>([]);

  const [preparacaoEditandoId, setPreparacaoEditandoId] = useState<
    string | null
  >(null);

  const [titulo, setTitulo] = useState("Preparação pré-sessão");
  const [dataSessao, setDataSessao] = useState("");
  const [observacaoPreparacao, setObservacaoPreparacao] = useState("");
  const [pontosFoco, setPontosFoco] = useState("");
  const [perguntasExplorar, setPerguntasExplorar] = useState("");
  const [pontosRisco, setPontosRisco] = useState("");
  const [notasPrivadas, setNotasPrivadas] = useState("");
  const [status, setStatus] =
    useState<PreparacaoSessao["status"]>("rascunho");

  useEffect(() => {
    async function carregarDados() {
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

      setTerapeutaId(usuarioAtual.user.id);

      const { data: detalhe, error: erroDetalhe } = await supabase.rpc(
        "get_linked_patient_details",
        {
          p_patient_id: pacienteId,
        }
      );

      if (erroDetalhe) {
        setErro("Não foi possível confirmar o vínculo com este paciente.");
        setCarregando(false);
        return;
      }

      const pacienteEncontrado = Array.isArray(detalhe)
        ? detalhe[0]
        : detalhe;

      if (!pacienteEncontrado) {
        setErro("Paciente não encontrado ou não vinculado a este terapeuta.");
        setCarregando(false);
        return;
      }

      setPaciente(pacienteEncontrado as PacienteDetalhe);

      const { data: registros } = await supabase.rpc(
        "get_linked_patient_situations",
        {
          p_patient_id: pacienteId,
        }
      );

      setSituacoes(((registros || []) as SituacaoPaciente[]).slice(0, 8));

      const { data: versoesAnamnese } = await supabase
        .from("patient_anamnesis_versions")
        .select(
          "id, anamnesis_id, patient_id, version_number, main_complaint, symptoms_and_risks, perceived_patterns, trusted_contact, final_notes, submitted_at, created_at"
        )
        .eq("patient_id", pacienteId)
        .order("version_number", { ascending: false })
        .limit(1);

      const ultimaVersao = (versoesAnamnese || [])[0] as
        | VersaoAnamnese
        | undefined;

      if (ultimaVersao) {
        setUltimaAnamnese(ultimaVersao);

        const { data: notas } = await supabase
          .from("anamnesis_therapist_notes")
          .select("id, title, note, note_type, created_at")
          .eq("patient_id", pacienteId)
          .eq("anamnesis_version_id", ultimaVersao.id)
          .order("created_at", { ascending: false });

        setNotasAnamnese((notas || []) as NotaAnamnese[]);
      }
      const { data: sonhosEncontrados } = await supabase
      .from("patient_dream_entries")
      .select(
        "id, patient_id, dream_date, title, dream_report, main_emotions, recurring_people, recurring_places, symbols_or_images, waking_feeling, possible_context, created_at"
      )
      .eq("patient_id", pacienteId)
      .order("dream_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);
    
    setSonhosPaciente((sonhosEncontrados || []) as SonhoPaciente[]);
      const { data: preparacoesEncontradas } = await supabase
        .from("clinical_session_preparations")
        .select(
          "id, therapist_id, patient_id, title, session_date, preparation_note, focus_points, questions_to_explore, risk_points, therapist_private_notes, status, created_at, updated_at"
        )
        .eq("patient_id", pacienteId)
        .eq("therapist_id", usuarioAtual.user.id)
        .order("created_at", { ascending: false });

      setPreparacoes(
        (preparacoesEncontradas || []) as PreparacaoSessao[]
      );

      setCarregando(false);
    }

    carregarDados();
  }, [router, pacienteId]);

  const areasMaisRecorrentes = useMemo<ItemResumo[]>(() => {
    return contarOcorrencias(situacoes.map((item) => item.area)).slice(0, 3);
  }, [situacoes]);

  const respostasMaisComuns = useMemo<ItemResumo[]>(() => {
    return contarOcorrencias(
      situacoes.map((item) => item.predominant_response)
    ).slice(0, 3);
  }, [situacoes]);

  const intensidadeMedia = useMemo(() => {
    if (situacoes.length === 0) return 0;

    return Math.round(
      situacoes.reduce(
        (soma, item) => soma + Number(item.emotional_intensity || 0),
        0
      ) / situacoes.length
    );
  }, [situacoes]);

  const ultimoSonho = useMemo(() => {
    return sonhosPaciente[0] || null;
  }, [sonhosPaciente]);

  async function recarregarPreparacoes() {
    if (!paciente || !terapeutaId) return;

    const { data } = await supabase
      .from("clinical_session_preparations")
      .select(
        "id, therapist_id, patient_id, title, session_date, preparation_note, focus_points, questions_to_explore, risk_points, therapist_private_notes, status, created_at, updated_at"
      )
      .eq("patient_id", paciente.patient_id)
      .eq("therapist_id", terapeutaId)
      .order("created_at", { ascending: false });

    setPreparacoes((data || []) as PreparacaoSessao[]);
  }

  async function handleSalvarPreparacao() {
    if (!paciente || !terapeutaId) return;

    setErro("");
    setSucesso("");

    if (!titulo.trim()) {
      setErro("Informe um título para a preparação da sessão.");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        therapist_id: terapeutaId,
        patient_id: paciente.patient_id,
        title: titulo.trim(),
        session_date: dataSessao ? new Date(dataSessao).toISOString() : null,
        preparation_note: observacaoPreparacao.trim() || null,
        focus_points: pontosFoco.trim() || null,
        questions_to_explore: perguntasExplorar.trim() || null,
        risk_points: pontosRisco.trim() || null,
        therapist_private_notes: notasPrivadas.trim() || null,
        status,
      };

      if (preparacaoEditandoId) {
        const { error } = await supabase
          .from("clinical_session_preparations")
          .update(payload)
          .eq("id", preparacaoEditandoId)
          .eq("therapist_id", terapeutaId)
          .eq("patient_id", paciente.patient_id);

        if (error) {
          setErro("Não foi possível atualizar a preparação da sessão.");
          return;
        }

        setSucesso("Preparação atualizada com sucesso.");
      } else {
        const { error } = await supabase
          .from("clinical_session_preparations")
          .insert(payload);

        if (error) {
          setErro("Não foi possível salvar a preparação da sessão.");
          return;
        }

        setSucesso("Preparação salva com sucesso.");
      }

      setPreparacaoEditandoId(null);
      setTitulo("Preparação pré-sessão");
      setDataSessao("");
      setObservacaoPreparacao("");
      setPontosFoco("");
      setPerguntasExplorar("");
      setPontosRisco("");
      setNotasPrivadas("");
      setStatus("rascunho");

      await recarregarPreparacoes();
    } finally {
      setSalvando(false);
    }
  }

  function handleEditarPreparacao(preparacao: PreparacaoSessao) {
    setErro("");
    setSucesso("");

    setPreparacaoEditandoId(preparacao.id);
    setTitulo(preparacao.title);
    setDataSessao(formatarParaInputDatetime(preparacao.session_date));
    setObservacaoPreparacao(preparacao.preparation_note || "");
    setPontosFoco(preparacao.focus_points || "");
    setPerguntasExplorar(preparacao.questions_to_explore || "");
    setPontosRisco(preparacao.risk_points || "");
    setNotasPrivadas(preparacao.therapist_private_notes || "");
    setStatus(preparacao.status);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNovaPreparacao() {
    setErro("");
    setSucesso("");
    setPreparacaoEditandoId(null);
    setTitulo("Preparação pré-sessão");
    setDataSessao("");
    setObservacaoPreparacao("");
    setPontosFoco("");
    setPerguntasExplorar("");
    setPontosRisco("");
    setNotasPrivadas("");
    setStatus("rascunho");
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Preparando sessão
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando dados clínicos...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos reunindo os principais dados do paciente para apoiar a
            preparação da sessão.
          </p>
        </div>
      </main>
    );
  }

  if (erro && !paciente) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24]">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Pré-sessão indisponível
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Não foi possível abrir este paciente
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">{erro}</p>

            <Link
              href="/clinico/painel"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Voltar ao painel clínico
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!paciente) return null;

  return (
    <main
      id="topo-pre-sessao"
      className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8"
    >
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            background: white !important;
          }

          .print-card {
            box-shadow: none !important;
            border-color: #ddd !important;
            break-inside: avoid;
          }

          textarea,
          input,
          select {
            border: 1px solid #ddd !important;
          }
        }
      `}</style>

      <section className="mx-auto w-full max-w-6xl">
        <header className="print-card mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Preparação pré-sessão
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                {paciente.patient_name}
              </h1>

              <p className="mt-2 break-words text-sm leading-6 text-[#5F564C]">
                {paciente.patient_email}
              </p>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                Esta página reúne dados clínicos importantes para o terapeuta se
                preparar antes da sessão. Não é diagnóstico automático. É um
                mapa de leitura para orientar a conversa.
              </p>
            </div>

            <div className="no-print flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
              >
                Imprimir
              </button>

              <Link
                href={`/clinico/pacientes/${paciente.patient_id}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
              >
                Voltar ao paciente
              </Link>
            </div>
          </div>
        </header>

        {erro && (
          <div className="no-print mb-6 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="no-print mb-6 rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm leading-6 text-[#5F564C] shadow-sm">
            {sucesso}
          </div>
        )}

        <section className="print-card mb-6 rounded-3xl border border-[#D8C7B1] bg-[#FFF8EE] p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            Resumo automático para a sessão
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Pontos de preparação
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Perfil VPP
              </p>

              <p className="mt-2 text-sm leading-6 text-[#2F2A24]">
                {paciente.predominant_profile || "Sem teste realizado"}
              </p>

              {paciente.attention_point && (
                <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                  <span className="font-semibold">Ponto de atenção:</span>{" "}
                  {paciente.attention_point}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Situações recentes
              </p>

              <p className="mt-2 text-sm leading-6 text-[#2F2A24]">
                {situacoes.length} registro(s) analisado(s)
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Intensidade média:{" "}
                {intensidadeMedia > 0 ? `${intensidadeMedia}/10` : "Sem dados"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Áreas recorrentes
              </p>

              <div className="mt-2 space-y-2">
                {areasMaisRecorrentes.length === 0 ? (
                  <p className="text-sm leading-6 text-[#5F564C]">
                    Sem dados suficientes.
                  </p>
                ) : (
                  areasMaisRecorrentes.map((item) => (
                    <p
                      key={item.nome}
                      className="text-sm leading-6 text-[#5F564C]"
                    >
                      {item.nome}: {item.total} registro(s)
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Respostas recorrentes
              </p>

              <div className="mt-2 space-y-2">
                {respostasMaisComuns.length === 0 ? (
                  <p className="text-sm leading-6 text-[#5F564C]">
                    Sem dados suficientes.
                  </p>
                ) : (
                  respostasMaisComuns.map((item) => (
                    <p
                      key={item.nome}
                      className="text-sm leading-6 text-[#5F564C]"
                    >
                      {item.nome}: {item.total} registro(s)
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8C7C0] bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9A4A3F]">
                Risco / autocuidado
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#2F2A24] [overflow-wrap:anywhere]">
                {texto(ultimaAnamnese?.symptoms_and_risks?.self_harm_or_risk) ||
                  "Não informado na anamnese."}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Padrão percebido pelo paciente
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#2F2A24] [overflow-wrap:anywhere]">
                {texto(
                  ultimaAnamnese?.perceived_patterns?.repeated_reactions
                ) || "Não informado na anamnese."}
              </p>
            </div>
          </div>
        </section>
        <section className="print-card mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Material do diário de sonhos
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Registros recentes do paciente
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                Estes registros não são interpretados automaticamente. Eles
                servem como apoio para observar relatos, emoções, figuras,
                lugares, imagens e contextos que possam ser retomados na sessão.
              </p>
            </div>

            <Link
  href={`/clinico/pacientes/${paciente.patient_id}/sonhos?voltar=pre-sessao`}
  className="no-print inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
>
  Ver diário completo
</Link>   
          </div>

          {!ultimoSonho ? (
            <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
              <p className="text-sm font-medium text-[#2F2A24]">
                Nenhum sonho registrado até o momento.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Quando o paciente registrar sonhos, os dados recentes aparecerão
                aqui como material complementar para a preparação da sessão.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="min-w-0 rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                  Último sonho registrado
                </p>

                <h3 className="mt-2 break-words text-lg font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
                  {ultimoSonho.title}
                </h3>

                <p className="mt-1 text-xs text-[#8A7A68]">
                  Data do sonho: {formatarData(ultimoSonho.dream_date)}
                </p>

                <div className="mt-4 rounded-2xl bg-white p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                    {ultimoSonho.dream_report}
                  </p>
                </div>
              </article>

              <article className="min-w-0 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                  Elementos informados
                </p>

                <div className="mt-3 space-y-3">
                  <ResumoCampo
                    titulo="Emoções principais"
                    texto={ultimoSonho.main_emotions}
                  />

                  <ResumoCampo
                    titulo="Sensação ao acordar"
                    texto={ultimoSonho.waking_feeling}
                  />

                  <ResumoCampo
                    titulo="Pessoas ou figuras"
                    texto={ultimoSonho.recurring_people}
                  />

                  <ResumoCampo
                    titulo="Lugares"
                    texto={ultimoSonho.recurring_places}
                  />

                  <ResumoCampo
                    titulo="Imagens ou cenas marcantes"
                    texto={ultimoSonho.symbols_or_images}
                  />

                  <ResumoCampo
                    titulo="Contexto possível"
                    texto={ultimoSonho.possible_context}
                  />
                </div>
              </article>

              {sonhosPaciente.length > 1 && (
                <article className="lg:col-span-2 rounded-2xl border border-[#E5DDD2] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                    Sonhos recentes
                  </p>

                  <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                    {sonhosPaciente.slice(1).map((sonho) => (
                      <div
                        key={sonho.id}
                        className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4"
                      >
                        <p className="break-words text-sm font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
                          {sonho.title}
                        </p>

                        <p className="mt-1 text-xs text-[#8A7A68]">
                          {formatarData(sonho.dream_date)}
                        </p>

                        <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                          {sonho.dream_report}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              )}
            </div>
          )}
        </section>
        <section className="print-card mb-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Anamnese mais recente
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Versão{" "}
              {ultimaAnamnese?.version_number
                ? ultimaAnamnese.version_number
                : "não enviada"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Enviada em {formatarDataHora(ultimaAnamnese?.submitted_at || null)}
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-[#F7F3EC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                  Motivo da busca
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#2F2A24] [overflow-wrap:anywhere]">
                  {texto(ultimaAnamnese?.main_complaint?.reason_now) ||
                    "Não informado."}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F3EC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                  O que o terapeuta deve saber
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#2F2A24] [overflow-wrap:anywhere]">
                  {texto(
                    ultimaAnamnese?.final_notes?.what_therapist_should_know
                  ) || "Não informado."}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Observações do terapeuta na anamnese
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Pontos já registrados
            </h2>

            {notasAnamnese.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-[#5F564C]">
                Nenhuma observação registrada na última versão da anamnese.
              </p>
            ) : (
              <div className="mt-4 max-h-80 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {notasAnamnese.map((nota) => (
                    <div
                      key={nota.id}
                      className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4"
                    >
                      <p className="text-sm font-semibold text-[#2F2A24]">
                        {nota.title}
                      </p>

                      <p className="mt-1 text-xs text-[#8A7A68]">
                        {nota.note_type.replaceAll("_", " ")} •{" "}
                        {formatarData(nota.created_at)}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                        {nota.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </section>

        <section className="no-print mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
  <div className="mb-5">
    <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
      Preparação do terapeuta
    </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              {preparacaoEditandoId
                ? "Editar preparação"
                : "Nova preparação pré-sessão"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Registre o foco da próxima conversa, hipóteses a investigar,
              pontos de risco e perguntas que podem orientar a sessão.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Título
              </span>

              <input
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                disabled={salvando}
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Data da sessão
              </span>

              <input
                type="datetime-local"
                value={dataSessao}
                onChange={(event) => setDataSessao(event.target.value)}
                disabled={salvando}
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Foco clínico da sessão
              </span>

              <textarea
                value={pontosFoco}
                onChange={(event) => setPontosFoco(event.target.value)}
                disabled={salvando}
                placeholder="Ex: investigar reação de evitação diante de cobrança."
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Perguntas para explorar
              </span>

              <textarea
                value={perguntasExplorar}
                onChange={(event) => setPerguntasExplorar(event.target.value)}
                disabled={salvando}
                placeholder="Ex: o que você espera que aconteça quando alguém discorda de você?"
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Pontos de risco ou cuidado
              </span>

              <textarea
                value={pontosRisco}
                onChange={(event) => setPontosRisco(event.target.value)}
                disabled={salvando}
                placeholder="Ex: observar fala sobre desistência, isolamento ou impulsividade."
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Observação geral da preparação
              </span>

              <textarea
                value={observacaoPreparacao}
                onChange={(event) =>
                  setObservacaoPreparacao(event.target.value)
                }
                disabled={salvando}
                placeholder="Escreva uma síntese livre para entrar melhor preparado na sessão."
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-[#2F2A24]">
              Notas privadas do terapeuta
            </span>

            <textarea
              value={notasPrivadas}
              onChange={(event) => setNotasPrivadas(event.target.value)}
              disabled={salvando}
              placeholder="Anotações internas. Não visíveis ao paciente."
              className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Status
              </span>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PreparacaoSessao["status"])
                }
                disabled={salvando}
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="rascunho">Rascunho</option>
                <option value="preparada">Preparada</option>
                <option value="realizada">Realizada</option>
                <option value="arquivada">Arquivada</option>
              </select>
            </label>
          </div>

          <div className="no-print mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSalvarPreparacao}
              disabled={salvando}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {salvando
                ? "Salvando..."
                : preparacaoEditandoId
                  ? "Salvar alterações"
                  : "Salvar preparação"}
            </button>

            {preparacaoEditandoId && (
              <button
                type="button"
                onClick={handleNovaPreparacao}
                disabled={salvando}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Nova preparação
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Imprimir preparação
            </button>
          </div>
        </section>

        <section className="print-card rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Preparações anteriores
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Histórico de pré-sessões
            </h2>
          </div>

          {preparacoes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
              <p className="text-sm font-medium text-[#2F2A24]">
                Nenhuma preparação salva.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Quando você salvar uma preparação, ela aparecerá aqui para
                consulta e edição.
              </p>
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto pr-1">
              <div className="space-y-3">
                {preparacoes.map((preparacao) => (
                  <article
                    key={preparacao.id}
                    className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
                          {preparacao.title}
                        </p>

                        <p className="mt-1 text-xs text-[#8A7A68]">
                          Sessão: {formatarDataHora(preparacao.session_date)}
                        </p>

                        <p className="mt-1 text-xs text-[#8A7A68]">
                          Criada em {formatarData(preparacao.created_at)}
                        </p>
                      </div>

                      <div className="no-print flex flex-wrap gap-2 sm:justify-end">
                        <span className="rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold capitalize text-[#5F564C]">
                          {preparacao.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleEditarPreparacao(preparacao)}
                          className="rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold text-[#5F564C] transition hover:bg-[#FFF8EE]"
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                    {preparacao.focus_points && (
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                        {preparacao.focus_points}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <a
          href="#topo-pre-sessao"
          className="no-print fixed bottom-5 right-4 z-40 inline-flex min-h-11 items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-4 text-sm font-semibold text-[#5F564C] shadow-lg transition hover:bg-[#FFF8EE] sm:right-6"
        >
          ↑ Topo
        </a>
      </section>
    </main>
  );
}
function ResumoCampo({
    titulo,
    texto: conteudo,
  }: {
    titulo: string;
    texto: string | null;
  }) {
    return (
      <div className="rounded-2xl bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
          {titulo}
        </p>
  
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
          {conteudo?.trim() || "Não informado."}
        </p>
      </div>
    );
  }