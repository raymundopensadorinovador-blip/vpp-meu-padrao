"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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

type NotaClinica = {
    id: string;
    title: string;
    note: string;
    note_type: "observacao" | "hipotese" | "devolutiva" | "encaminhamento";
    shared_with_patient: boolean;
    created_at: string;
  };

type EncaminhamentoClinico = {
    id: string;
    destination_type: string;
    destination_name: string | null;
    destination_contact: string | null;
    patient_name_snapshot: string;
    patient_email_snapshot: string | null;
    reason: string;
    clinical_summary: string;
    observations: string | null;
    therapist_name_snapshot: string;
    therapist_location: string | null;
    therapist_registry: string | null;
    stamp_text: string | null;
    signature_text: string | null;
    referral_date: string;
    status: string;
    created_at: string;
  };

type ItemResumo = {
  nome: string;
  total: number;
};

type AnaliseSituacoes = {
  totalRegistros: number;
  intensidadeMedia: number;
  areasMaisRecorrentes: ItemResumo[];
  respostasMaisComuns: ItemResumo[];
};

function contarOcorrencias(lista: string[]) {
  const contagem = lista.reduce<Record<string, number>>((acc, item) => {
    if (!item) return acc;

    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(contagem)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
}

function gerarAnaliseSituacoes(registros: SituacaoPaciente[]): AnaliseSituacoes {
  const totalRegistros = registros.length;

  if (totalRegistros === 0) {
    return {
      totalRegistros: 0,
      intensidadeMedia: 0,
      areasMaisRecorrentes: [],
      respostasMaisComuns: [],
    };
  }

  const intensidadeMedia = Math.round(
    registros.reduce(
      (soma, item) => soma + Number(item.emotional_intensity || 0),
      0
    ) / totalRegistros
  );

  const areasMaisRecorrentes = contarOcorrencias(
    registros.map((item) => item.area)
  ).slice(0, 3);

  const respostasMaisComuns = contarOcorrencias(
    registros.map((item) => item.predominant_response)
  ).slice(0, 3);

  return {
    totalRegistros,
    intensidadeMedia,
    areasMaisRecorrentes,
    respostasMaisComuns,
  };
}

const nomesDestino: Record<string, string> = {
    medico_clinico: "Médico clínico",
    psiquiatra: "Psiquiatra",
    psicologo: "Psicólogo",
    neurologista: "Neurologista",
    outro: "Outro",
  };

export default function ClinicoPacienteDetalhePage() {
  const router = useRouter();
  const params = useParams();

  const pacienteId = String(params.id || "");
  const formularioNotaRef = useRef<HTMLDivElement | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null);
  const [nomeTerapeutaLogado, setNomeTerapeutaLogado] = useState("");
  const [situacoes, setSituacoes] = useState<SituacaoPaciente[]>([]);
const [notasClinicas, setNotasClinicas] = useState<NotaClinica[]>([]);
const [encaminhamentos, setEncaminhamentos] = useState<EncaminhamentoClinico[]>(
    []
  );
const [tituloNota, setTituloNota] = useState("");
const [textoNota, setTextoNota] = useState("");
const [tipoNota, setTipoNota] =
  useState<NotaClinica["note_type"]>("observacao");

const [notaEditandoId, setNotaEditandoId] = useState<string | null>(null);
const [salvandoNota, setSalvandoNota] = useState(false);
const [excluindoNotaId, setExcluindoNotaId] = useState<string | null>(null);

const [mostrandoEncerrarVinculo, setMostrandoEncerrarVinculo] =
  useState(false);
const [motivoEncerramento, setMotivoEncerramento] = useState("alta");
const [observacaoEncerramento, setObservacaoEncerramento] = useState("");
const [encerrandoVinculo, setEncerrandoVinculo] = useState(false);

const [erro, setErro] = useState("");
const [sucessoNota, setSucessoNota] = useState("");

  useEffect(() => {
    async function carregarPaciente() {
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
setNomeTerapeutaLogado(perfil.name || "Seu terapeuta");
      const { data: detalhe, error: erroDetalhe } = await supabase.rpc(
        "get_linked_patient_details",
        {
          p_patient_id: pacienteId,
        }
      );

      if (erroDetalhe) {
        setErro("Não foi possível carregar este paciente vinculado.");
        setPaciente(null);
        setCarregando(false);
        return;
      }

      const pacienteEncontrado = Array.isArray(detalhe)
        ? detalhe[0]
        : detalhe;

      if (!pacienteEncontrado) {
        setErro("Paciente não encontrado ou não vinculado a este terapeuta.");
        setPaciente(null);
        setCarregando(false);
        return;
      }

      const { data: registros, error: erroRegistros } = await supabase.rpc(
        "get_linked_patient_situations",
        {
          p_patient_id: pacienteId,
        }
      );

      if (erroRegistros) {
        setSituacoes([]);
      } else {
        setSituacoes((registros || []) as SituacaoPaciente[]);
      }
      
      const { data: notas, error: erroNotas } = await supabase
      .from("clinical_notes")
      .select("id, title, note, note_type, shared_with_patient, created_at")
      .eq("patient_id", pacienteId)
      .order("created_at", { ascending: false });
    
    if (erroNotas) {
      setNotasClinicas([]);
    } else {
      setNotasClinicas((notas || []) as NotaClinica[]);
    }
    
    const { data: encaminhamentosDoPaciente, error: erroEncaminhamentos } =
    await supabase.rpc("get_linked_patient_referrals", {
      p_patient_id: pacienteId,
    });
  
  
  if (erroEncaminhamentos) {
    setEncaminhamentos([]);
  } else {
    setEncaminhamentos(
      (encaminhamentosDoPaciente || []) as EncaminhamentoClinico[]
    );
  }   
    
    setPaciente(pacienteEncontrado as PacienteDetalhe);
setCarregando(false);
}

carregarPaciente();
}, [router, pacienteId]);

  const analise = useMemo(() => {
    return gerarAnaliseSituacoes(situacoes);
  }, [situacoes]);

  async function carregarNotasClinicas(patientId: string) {
    const { data: notasAtualizadas } = await supabase
      .from("clinical_notes")
      .select("id, title, note, note_type, shared_with_patient, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
  
    setNotasClinicas((notasAtualizadas || []) as NotaClinica[]);
  }

  async function handleSalvarNotaClinica() {
    if (!paciente) return;
  
    setErro("");
    setSucessoNota("");
  
    if (!tituloNota.trim() || !textoNota.trim()) {
      setErro("Informe um título e uma anotação clínica.");
      return;
    }
  
    setSalvandoNota(true);
  
    try {
      const { data: usuarioAtual, error: erroUsuario } =
        await supabase.auth.getUser();
  
      if (erroUsuario || !usuarioAtual.user) {
        router.replace("/login");
        return;
      }
  
      if (notaEditandoId) {
        const { error } = await supabase
          .from("clinical_notes")
          .update({
            title: tituloNota.trim(),
            note: textoNota.trim(),
            note_type: tipoNota,
          })
          .eq("id", notaEditandoId)
          .eq("therapist_id", usuarioAtual.user.id)
          .eq("patient_id", paciente.patient_id);
  
        if (error) {
          setErro("Não foi possível atualizar a anotação clínica.");
          return;
        }
  
        await carregarNotasClinicas(paciente.patient_id);
  
        setTituloNota("");
        setTextoNota("");
        setTipoNota("observacao");
        setNotaEditandoId(null);
        setSucessoNota("Anotação clínica atualizada com sucesso.");
        return;
      }
  
      const { error } = await supabase.from("clinical_notes").insert({
        therapist_id: usuarioAtual.user.id,
        patient_id: paciente.patient_id,
        title: tituloNota.trim(),
        note: textoNota.trim(),
        note_type: tipoNota,
        shared_with_patient: false,
      });
  
      if (error) {
        setErro("Não foi possível salvar a anotação clínica.");
        return;
      }
  
      await carregarNotasClinicas(paciente.patient_id);
  
      setTituloNota("");
      setTextoNota("");
      setTipoNota("observacao");
      setSucessoNota("Anotação clínica salva com sucesso.");
    } finally {
      setSalvandoNota(false);
    }
  } 

  function handleIniciarEdicaoNota(nota: NotaClinica) {
    setErro("");
    setSucessoNota("");
  
    setNotaEditandoId(nota.id);
    setTituloNota(nota.title);
    setTextoNota(nota.note);
    setTipoNota(nota.note_type);
  
    setTimeout(() => {
        formularioNotaRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
  }
  
  function handleCancelarEdicaoNota() {
    setErro("");
    setSucessoNota("");
  
    setNotaEditandoId(null);
    setTituloNota("");
    setTextoNota("");
    setTipoNota("observacao");
  }

  async function handleExcluirNotaClinica(notaId: string) {
    if (!paciente) return;
  
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta anotação clínica? Essa ação não poderá ser desfeita."
    );
  
    if (!confirmar) return;
  
    setErro("");
    setSucessoNota("");
    setExcluindoNotaId(notaId);
  
    try {
      const { error } = await supabase
        .from("clinical_notes")
        .delete()
        .eq("id", notaId)
        .eq("patient_id", paciente.patient_id);
  
      if (error) {
        setErro("Não foi possível excluir a anotação clínica.");
        return;
      }
  
      await carregarNotasClinicas(paciente.patient_id);
      setSucessoNota("Anotação clínica excluída com sucesso.");
    } finally {
      setExcluindoNotaId(null);
    }
  }

  async function handleEncerrarVinculo() {
    if (!paciente) return;
  
    setErro("");
  
    const confirmar = window.confirm(
      "Tem certeza que deseja encerrar o vínculo com este paciente? Ele deixará de aparecer na sua lista de pacientes ativos."
    );
  
    if (!confirmar) return;
  
    setEncerrandoVinculo(true);
  
    try {
      const { error } = await supabase.rpc("end_patient_therapist_link", {
        p_patient_id: paciente.patient_id,
        p_ended_reason: motivoEncerramento,
        p_ended_note: observacaoEncerramento.trim() || null,
      });
  
      if (error) {
        console.error("ERRO AO ENCERRAR VÍNCULO:", error);
      
        setErro(
          `Não foi possível encerrar o vínculo com este paciente. Erro: ${
            error.message || "erro desconhecido"
          }`
        );
      
        return;
      }
      
      const { data: sessaoAtual } = await supabase.auth.getSession();
      
      await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessaoAtual.session?.access_token || ""}`,
        },
        body: JSON.stringify({
          userId: paciente.patient_id,
          title: "Atualização no vínculo terapêutico",
          message: `${nomeTerapeutaLogado || "Seu terapeuta"} encerrou o vínculo terapêutico com você no VPP — Meu Padrão. Seus registros continuam disponíveis na sua área do paciente.`,
          url: "/painel",
        }),
      });  
      
      router.replace("/clinico/painel");  
    } finally {
      setEncerrandoVinculo(false);
    }
  }

  function formatarData(data: string | null) {
    if (!data) return "Não realizado";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(data));
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando paciente
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando dados clínicos...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando o vínculo antes de abrir os registros.
          </p>
        </div>
      </main>
    );
  }

  if (!paciente) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Paciente não encontrado
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Não foi possível abrir este paciente
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              {erro ||
                "O paciente pode não estar vinculado a você ou o vínculo pode ter sido removido."}
            </p>
            
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

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="min-w-0">
      <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
        Paciente vinculado
      </p>

      <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
        {paciente.patient_name}
      </h1>

      <p className="mt-2 break-words text-sm leading-6 text-[#5F564C]">
        {paciente.patient_email}
      </p>

      <p className="mt-2 text-xs text-[#8A7A68]">
        Vinculado em {formatarData(paciente.linked_at)}
      </p>
    </div>

    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
      <button
        type="button"
        onClick={() => setMostrandoEncerrarVinculo((valor) => !valor)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#E8C7C0] bg-white px-5 text-sm font-semibold text-[#9A4A3F] shadow-sm transition hover:bg-red-50 lg:w-auto"
      >
        Encerrar vínculo
      </button>

      <Link
        href={`/clinico/pacientes/${paciente.patient_id}/encaminhamentos/novo`}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
      >
        Novo encaminhamento
      </Link>
      <Link
  href={`/clinico/pacientes/${paciente.patient_id}/anamnese`}
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-white lg:w-auto"
>
  Ver anamnese
</Link>
      <Link
        href="/clinico/painel"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
      >
        Voltar ao painel clínico
      </Link>
    </div>
  </div>
</header>
        {mostrandoEncerrarVinculo && (
  <section className="mb-6 rounded-3xl border border-[#E8C7C0] bg-white p-5 shadow-sm sm:p-7">
    <div className="mb-5">
      <p className="mb-2 text-sm font-medium text-[#9A4A3F]">
        Encerrar vínculo clínico
      </p>

      <h2 className="text-xl font-semibold text-[#2F2A24]">
        Remover paciente da lista ativa
      </h2>

      <p className="mt-3 text-sm leading-6 text-[#5F564C]">
  O vínculo será encerrado e o paciente deixará de aparecer na sua lista
  ativa. O histórico clínico já registrado será preservado para consulta
  profissional.
</p>
    </div>

    <div className="grid gap-5 md:grid-cols-2">
      <label className="block">
        <span className="text-sm font-medium text-[#2F2A24]">
          Motivo do encerramento
        </span>

        <select
          value={motivoEncerramento}
          onChange={(event) => setMotivoEncerramento(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B] focus:bg-white"
          disabled={encerrandoVinculo}
        >
          <option value="alta">Alta / encerramento terapêutico</option>
          <option value="pausa">Pausa no acompanhamento</option>
          <option value="encaminhamento">
            Encaminhamento para outro profissional
          </option>
          <option value="administrativo">
            Pendência administrativa
          </option>
          <option value="outro">Outro motivo</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[#2F2A24]">
          Observação opcional
        </span>

        <input
          type="text"
          value={observacaoEncerramento}
          onChange={(event) => setObservacaoEncerramento(event.target.value)}
          placeholder="Ex: encerrado após devolutiva final"
          className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
          disabled={encerrandoVinculo}
        />
      </label>
    </div>

    <div className="mt-5 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
    <p className="text-sm leading-6 text-[#5F564C]">
  Esta ação preserva os registros já criados e encerra apenas o vínculo
  ativo. Caso o acompanhamento seja retomado no futuro, o paciente poderá
  iniciar um novo vínculo pelo próprio painel.
</p>
    </div>

    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={handleEncerrarVinculo}
        disabled={encerrandoVinculo}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#E8C7C0] bg-white px-5 text-sm font-semibold text-[#9A4A3F] shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {encerrandoVinculo ? "Encerrando..." : "Confirmar encerramento"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMostrandoEncerrarVinculo(false);
          setMotivoEncerramento("alta");
          setObservacaoEncerramento("");
        }}
        disabled={encerrandoVinculo}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        Cancelar
      </button>
    </div>
  </section>
)}

<section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Perfil predominante
            </p>

            <p className="mt-3 text-lg font-semibold text-[#2F2A24]">
              {paciente.predominant_profile || "Sem teste"}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Último teste: {formatarData(paciente.test_created_at)}
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Registros reais
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {analise.totalRegistros}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Situações registradas.
            </p>
          </article>

          <article className="rounded-3xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-700">
              Área mais recorrente
            </p>

            <p className="mt-3 text-lg font-semibold text-[#2F2A24]">
              {analise.areasMaisRecorrentes[0]?.nome || "Sem dados"}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              {analise.areasMaisRecorrentes[0]
                ? `${analise.areasMaisRecorrentes[0].total} registro(s)`
                : "Sem registros suficientes."}
            </p>
          </article>

          <article className="rounded-3xl border border-red-200 bg-red-50/70 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              Intensidade média
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {analise.intensidadeMedia > 0
                ? `${analise.intensidadeMedia}/10`
                : "—"}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Média dos registros.
            </p>
          </article>
        </section>

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            Resultado do teste VPP
          </p>

          {paciente.predominant_profile ? (
            <>
              <h2 className="text-2xl font-semibold text-[#2F2A24]">
                {paciente.predominant_profile}
              </h2>

              {paciente.secondary_profiles &&
                paciente.secondary_profiles.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {paciente.secondary_profiles.map((perfil) => (
                      <span
                        key={perfil}
                        className="rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-3 py-2 text-xs font-semibold text-[#5F564C]"
                      >
                        {perfil}
                      </span>
                    ))}
                  </div>
                )}

              {paciente.description && (
                <p className="mt-4 text-sm leading-6 text-[#5F564C]">
                  {paciente.description}
                </p>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
              <p className="text-sm font-medium text-[#2F2A24]">
                O paciente ainda não realizou o teste VPP.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
  Quando o paciente responder ao teste, a leitura inicial ficará disponível
  para apoiar a observação clínica.
</p>
            </div>
          )}
        </section>

        {paciente.predominant_profile && (
          <section className="mb-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-blue-700">
                Como o padrão opera
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Leitura do funcionamento
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#5F564C]">
                {paciente.functioning_reading ||
                  "Ainda não há leitura registrada para este resultado."}
              </p>
            </article>

            <article className="rounded-3xl border border-red-200 bg-red-50/70 p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-red-700">
                Onde pode prender
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Ponto de atenção
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#5F564C]">
                {paciente.attention_point ||
                  "Ainda não há ponto de atenção registrado para este resultado."}
              </p>
            </article>

            <article className="rounded-3xl border border-green-200 bg-green-50/70 p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-green-700">
                Potencial
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                O que pode virar força
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#5F564C]">
                {paciente.potential ||
                  "Ainda não há potencial registrado para este resultado."}
              </p>
            </article>

            <article className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-amber-700">
                Comece por aqui
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Foco de observação
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#5F564C]">
                {paciente.observation_focus ||
                  "Ainda não há foco de observação registrado para este resultado."}
              </p>
            </article>
          </section>
        )}

        {paciente.self_observation_question && (
          <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Pergunta de auto-observação
            </p>

            <div className="rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-4">
              <p className="text-sm leading-6 text-[#5F564C]">
                {paciente.self_observation_question}
              </p>
            </div>
          </section>
        )}

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Repetições nos registros
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              O que aparece na vida real
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
  Esta leitura considera apenas as situações registradas pelo paciente. Não
  se trata de diagnóstico, mas de material de observação para a conversa
  clínica.
</p>
          </div>

          {situacoes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
              <p className="text-sm font-medium text-[#2F2A24]">
                Nenhum registro de situação ainda.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Quando o paciente registrar situações reais, elas aparecerão
                aqui para análise clínica.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                <p className="text-sm font-semibold text-[#2F2A24]">
                  Áreas mais repetidas
                </p>

                <div className="mt-3 space-y-2">
                  {analise.areasMaisRecorrentes.map((item) => (
                    <div
                      key={item.nome}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-[#5F564C]">
                        {item.nome}
                      </span>

                      <span className="font-semibold text-[#8A2E2B]">
                        {item.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
  <p className="text-sm font-semibold text-[#2F2A24]">
    Respostas mais repetidas
  </p> 

                <div className="mt-3 space-y-2">
                  {analise.respostasMaisComuns.map((item) => (
                    <div
                      key={item.nome}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-[#5F564C]">
                        {item.nome}
                      </span>

                      <span className="font-semibold text-[#8A2E2B]">
                        {item.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
        Encaminhamentos clínicos
      </p>

      <h2 className="text-xl font-semibold text-[#2F2A24]">
        Documentos emitidos para este paciente
      </h2>

      <p className="mt-3 text-sm leading-6 text-[#5F564C]">
        Consulte os encaminhamentos já criados ou emita um novo documento para
        acompanhamento complementar.
      </p>
    </div>

    <Link
      href={`/clinico/pacientes/${paciente.patient_id}/encaminhamentos/novo`}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
    >
      Novo encaminhamento
    </Link>
  </div>

  {encaminhamentos.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
      <p className="text-sm font-medium text-[#2F2A24]">
        Nenhum encaminhamento criado.
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
  Quando um encaminhamento for salvo, ele aparecerá aqui para consulta,
  impressão ou salvamento em PDF.
</p>
    </div>
  ) : (
    <div className="space-y-3">
      {encaminhamentos.map((encaminhamento) => (
        <Link
          key={encaminhamento.id}
          href={`/clinico/pacientes/${paciente.patient_id}/encaminhamentos/${encaminhamento.id}`}
          className="block rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4 transition hover:bg-[#FFF8EE] hover:shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2F2A24]">
                {nomesDestino[encaminhamento.destination_type] || "Outro"}
              </p>

              <p className="mt-1 text-sm leading-6 text-[#5F564C]">
                {encaminhamento.destination_name ||
                  "Destino específico não informado"}
              </p>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5F564C]">
                {encaminhamento.reason}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold capitalize text-[#5F564C]">
                {encaminhamento.status}
              </span>

              <span className="rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-700">
                {formatarData(encaminhamento.referral_date)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )}
</section>
        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
  <div className="mb-5">
    <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
      Anotações clínicas
    </p>

    <h2 className="text-xl font-semibold text-[#2F2A24]">
      Observações do terapeuta
    </h2>

    <p className="mt-3 text-sm leading-6 text-[#5F564C]">
  Registre observações, hipóteses e pontos para devolutiva. Essas anotações
  ficam disponíveis apenas para o terapeuta.
</p>
  </div>

  {sucessoNota && (
    <div className="mb-5 rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#5F564C]">
      {sucessoNota}
    </div>
  )}

<div
  ref={formularioNotaRef}
  className="scroll-mt-6 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4"
>
  {notaEditandoId && (
  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-[#5F564C]">
    Você está editando uma anotação clínica existente. Salve as alterações ou
    cancele para criar uma nova.
  </div>
)} 
    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
      <label className="block">
        <span className="text-sm font-medium text-[#2F2A24]">
          Título da anotação
        </span>

        <input
          type="text"
          value={tituloNota}
          onChange={(event) => setTituloNota(event.target.value)}
          placeholder="Ex: hipótese sobre resposta predominante"
          className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-white px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B]"
          disabled={salvandoNota}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[#2F2A24]">
          Tipo
        </span>

        <select
          value={tipoNota}
          onChange={(event) =>
            setTipoNota(event.target.value as NotaClinica["note_type"])
          }
          className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-white px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B]"
          disabled={salvandoNota}
        >
          <option value="observacao">Observação</option>
          <option value="hipotese">Hipótese</option>
          <option value="devolutiva">Devolutiva</option>
          <option value="encaminhamento">Encaminhamento</option>
        </select>
      </label>
    </div>

    <label className="mt-4 block">
      <span className="text-sm font-medium text-[#2F2A24]">
        Anotação clínica
      </span>

      <textarea
        value={textoNota}
        onChange={(event) => setTextoNota(event.target.value)}
        placeholder="Escreva uma observação clínica, hipótese ou ponto para devolutiva."
        className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B]"
        disabled={salvandoNota}
      />
    </label>

    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
  <button
    type="button"
    onClick={handleSalvarNotaClinica}
    disabled={salvandoNota}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
  >
    {salvandoNota
      ? "Salvando..."
      : notaEditandoId
        ? "Salvar alterações"
        : "Salvar anotação clínica"}
  </button>

  {notaEditandoId && (
    <button
      type="button"
      onClick={handleCancelarEdicaoNota}
      disabled={salvandoNota}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      Cancelar edição
    </button>
  )}
</div>
  </div>

  <div className="mt-5">
    {notasClinicas.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
        <p className="text-sm font-medium text-[#2F2A24]">
          Nenhuma anotação clínica registrada.
        </p>

        <p className="mt-2 text-sm leading-6 text-[#5F564C]">
          As anotações criadas aqui ficarão disponíveis apenas para o terapeuta.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {notasClinicas.map((nota) => (
          <article
            key={nota.id}
            className="rounded-2xl border border-[#E5DDD2] bg-white p-4"
          >
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2F2A24]">
                  {nota.title}
                </p>

                <p className="mt-1 text-xs text-[#8A7A68]">
                  {formatarData(nota.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
  <span className="w-fit rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-3 py-2 text-xs font-semibold capitalize text-[#5F564C]">
    {nota.note_type}
  </span>

  <button
    type="button"
    onClick={() => handleIniciarEdicaoNota(nota)}
    disabled={salvandoNota || excluindoNotaId === nota.id}
    className="w-fit rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold text-[#5F564C] transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60"
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() => handleExcluirNotaClinica(nota.id)}
    disabled={excluindoNotaId === nota.id}
    className="w-fit rounded-2xl border border-[#E8C7C0] bg-white px-3 py-2 text-xs font-semibold text-[#9A4A3F] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {excluindoNotaId === nota.id ? "Excluindo..." : "Excluir"}
  </button>
</div>   
            </div>

            <p className="text-sm leading-6 text-[#5F564C]">
              {nota.note}
            </p>

            {!nota.shared_with_patient && (
              <p className="mt-3 text-xs font-medium text-[#8A7A68]">
                Visível apenas para o terapeuta.
              </p>
            )}
          </article>
        ))}
      </div>
    )}
  </div>
</section>
        <section className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Situações registradas
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Registros recentes do paciente
            </h2>
          </div>

          {situacoes.length === 0 ? (
            <p className="text-sm leading-6 text-[#5F564C]">
              Nenhuma situação registrada até agora.
            </p>
          ) : (
            <div className="space-y-3">
              {situacoes.map((situacao) => (
                <article
                  key={situacao.id}
                  className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4"
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2F2A24]">
                        {situacao.situation}
                      </p>

                      <p className="mt-1 text-xs text-[#8A7A68]">
                        {formatarData(situacao.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span className="rounded-2xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-semibold text-blue-700">
                        {situacao.area}
                      </span>

                      <span className="rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-700">
                        {situacao.predominant_response}
                      </span>

                      <span className="rounded-2xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-semibold text-red-700">
                        {situacao.emotional_intensity}/10
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-medium text-[#8A7A68]">
                        Esperava
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#5F564C]">
                        {situacao.expected}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-medium text-[#8A7A68]">
                        Pensou
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#5F564C]">
                        {situacao.thought}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-medium text-[#8A7A68]">
                        Fez
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#5F564C]">
                        {situacao.action_taken}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-medium text-[#8A7A68]">
                        Depois
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#5F564C]">
                        {situacao.outcome}
                      </p>
                    </div>
                  </div>

                  {situacao.pattern_note && (
                    <div className="mt-3 rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-3">
                      <p className="text-xs font-medium text-[#8A7A68]">
                        Observação do padrão
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#5F564C]">
                        {situacao.pattern_note}
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