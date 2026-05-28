"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type PacienteBasico = {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  linked_at: string;
};

type SessaoClinica = {
  id: string;
  therapist_id: string;
  patient_id: string;
  session_date: string;
  session_status: "agendada" | "realizada" | "cancelada" | "remarcada" | "arquivada";
  title: string;
  session_focus: string | null;
  session_notes: string | null;
  post_session_observations: string | null;
  next_session_date: string | null;
  created_at: string;
  updated_at: string;
};

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

export default function SessoesPacientePage() {
  const router = useRouter();
  const params = useParams();

  const pacienteId = String(params.id || "");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [terapeutaId, setTerapeutaId] = useState("");
  const [paciente, setPaciente] = useState<PacienteBasico | null>(null);
  const [sessoes, setSessoes] = useState<SessaoClinica[]>([]);
  const [sessaoEditandoId, setSessaoEditandoId] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("Sessão clínica");
  const [dataSessao, setDataSessao] = useState("");
  const [status, setStatus] = useState<SessaoClinica["session_status"]>("agendada");
  const [focoSessao, setFocoSessao] = useState("");
  const [notasSessao, setNotasSessao] = useState("");
  const [observacoesPosSessao, setObservacoesPosSessao] = useState("");
  const [proximaSessao, setProximaSessao] = useState("");

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

      setPaciente({
        patient_id: pacienteEncontrado.patient_id,
        patient_name: pacienteEncontrado.patient_name,
        patient_email: pacienteEncontrado.patient_email,
        linked_at: pacienteEncontrado.linked_at,
      });

      const { data: sessoesEncontradas } = await supabase
        .from("clinical_sessions")
        .select(
          "id, therapist_id, patient_id, session_date, session_status, title, session_focus, session_notes, post_session_observations, next_session_date, created_at, updated_at"
        )
        .eq("patient_id", pacienteId)
        .eq("therapist_id", usuarioAtual.user.id)
        .order("session_date", { ascending: false });

      setSessoes((sessoesEncontradas || []) as SessaoClinica[]);
      setCarregando(false);
    }

    carregarDados();
  }, [router, pacienteId]);

  async function recarregarSessoes() {
    if (!paciente || !terapeutaId) return;

    const { data } = await supabase
      .from("clinical_sessions")
      .select(
        "id, therapist_id, patient_id, session_date, session_status, title, session_focus, session_notes, post_session_observations, next_session_date, created_at, updated_at"
      )
      .eq("patient_id", paciente.patient_id)
      .eq("therapist_id", terapeutaId)
      .order("session_date", { ascending: false });

    setSessoes((data || []) as SessaoClinica[]);
  }

  function limparFormulario() {
    setSessaoEditandoId(null);
    setTitulo("Sessão clínica");
    setDataSessao("");
    setStatus("agendada");
    setFocoSessao("");
    setNotasSessao("");
    setObservacoesPosSessao("");
    setProximaSessao("");
  }

  async function handleSalvarSessao() {
    if (!paciente || !terapeutaId) return;

    setErro("");
    setSucesso("");

    if (!titulo.trim()) {
      setErro("Informe um título para a sessão.");
      return;
    }

    if (!dataSessao) {
      setErro("Informe a data e hora da sessão.");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        therapist_id: terapeutaId,
        patient_id: paciente.patient_id,
        title: titulo.trim(),
        session_date: new Date(dataSessao).toISOString(),
        session_status: status,
        session_focus: focoSessao.trim() || null,
        session_notes: notasSessao.trim() || null,
        post_session_observations: observacoesPosSessao.trim() || null,
        next_session_date: proximaSessao
          ? new Date(proximaSessao).toISOString()
          : null,
      };

      if (sessaoEditandoId) {
        const { error } = await supabase
          .from("clinical_sessions")
          .update(payload)
          .eq("id", sessaoEditandoId)
          .eq("therapist_id", terapeutaId)
          .eq("patient_id", paciente.patient_id);

        if (error) {
          setErro("Não foi possível atualizar a sessão.");
          return;
        }

        setSucesso("Sessão atualizada com sucesso.");
      } else {
        const { error } = await supabase.from("clinical_sessions").insert(payload);

        if (error) {
          setErro("Não foi possível salvar a sessão.");
          return;
        }

        setSucesso("Sessão salva com sucesso.");
      }

      limparFormulario();
      await recarregarSessoes();
    } finally {
      setSalvando(false);
    }
  }

  function handleEditarSessao(sessao: SessaoClinica) {
    setErro("");
    setSucesso("");

    setSessaoEditandoId(sessao.id);
    setTitulo(sessao.title);
    setDataSessao(formatarParaInputDatetime(sessao.session_date));
    setStatus(sessao.session_status);
    setFocoSessao(sessao.session_focus || "");
    setNotasSessao(sessao.session_notes || "");
    setObservacoesPosSessao(sessao.post_session_observations || "");
    setProximaSessao(formatarParaInputDatetime(sessao.next_session_date));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleExcluirSessao(sessaoId: string) {
    if (!paciente || !terapeutaId) return;

    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este registro de sessão?"
    );

    if (!confirmar) return;

    setErro("");
    setSucesso("");
    setExcluindoId(sessaoId);

    try {
      const { error } = await supabase
        .from("clinical_sessions")
        .delete()
        .eq("id", sessaoId)
        .eq("therapist_id", terapeutaId)
        .eq("patient_id", paciente.patient_id);

      if (error) {
        setErro("Não foi possível excluir a sessão.");
        return;
      }

      await recarregarSessoes();
      setSucesso("Sessão excluída com sucesso.");
    } finally {
      setExcluindoId(null);
    }
  }

  const proximaSessaoAtiva = sessoes
    .filter(
      (sessao) =>
        sessao.next_session_date &&
        ["agendada", "remarcada"].includes(sessao.session_status)
    )
    .sort(
      (a, b) =>
        new Date(a.next_session_date || "").getTime() -
        new Date(b.next_session_date || "").getTime()
    )[0];

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando sessões
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando histórico clínico...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando o vínculo antes de abrir o controle de sessões.
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
              Sessões indisponíveis
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
      id="topo-sessoes"
      className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8"
    >
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Controle de sessões
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                {paciente.patient_name}
              </h1>

              <p className="mt-2 break-words text-sm leading-6 text-[#5F564C]">
                {paciente.patient_email}
              </p>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                Registre sessões agendadas, realizadas, remarcadas ou
                canceladas. Use este espaço para acompanhar o processo clínico
                com mais clareza.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Link
                href={`/clinico/pacientes/${paciente.patient_id}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
              >
                Voltar ao paciente
              </Link>

              <Link
                href={`/clinico/pacientes/${paciente.patient_id}/pre-sessao`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
              >
                Preparar sessão
              </Link>
            </div>
          </div>
        </header>

        {erro && (
          <div className="mb-6 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-6 rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm leading-6 text-[#5F564C] shadow-sm">
            {sucesso}
          </div>
        )}

        {proximaSessaoAtiva?.next_session_date && (
          <section className="mb-6 rounded-3xl border border-[#D8C7B1] bg-[#FFF8EE] p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Próxima sessão
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              {formatarDataHora(proximaSessaoAtiva.next_session_date)}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Esta data foi registrada como próxima sessão no histórico clínico.
            </p>
          </section>
        )}

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Registrar sessão
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              {sessaoEditandoId ? "Editar sessão" : "Nova sessão"}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_240px_220px]">
            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Título
              </span>

              <input
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                disabled={salvando}
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Data e hora
              </span>

              <input
                type="datetime-local"
                value={dataSessao}
                onChange={(event) => setDataSessao(event.target.value)}
                disabled={salvando}
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Status
              </span>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as SessaoClinica["session_status"])
                }
                disabled={salvando}
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="agendada">Agendada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
                <option value="remarcada">Remarcada</option>
                <option value="arquivada">Arquivada</option>
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Foco da sessão
              </span>

              <textarea
                value={focoSessao}
                onChange={(event) => setFocoSessao(event.target.value)}
                disabled={salvando}
                placeholder="Ex: trabalhar reação de evitação diante de cobrança."
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Notas da sessão
              </span>

              <textarea
                value={notasSessao}
                onChange={(event) => setNotasSessao(event.target.value)}
                disabled={salvando}
                placeholder="Registre pontos trabalhados durante a sessão."
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Observações pós-sessão
              </span>

              <textarea
                value={observacoesPosSessao}
                onChange={(event) => setObservacoesPosSessao(event.target.value)}
                disabled={salvando}
                placeholder="Registre percepção clínica após a sessão."
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Próxima sessão
              </span>

              <input
                type="datetime-local"
                value={proximaSessao}
                onChange={(event) => setProximaSessao(event.target.value)}
                disabled={salvando}
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-xs leading-5 text-[#8A7A68]">
                Esta data aparecerá como indicação da próxima sessão.
              </p>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSalvarSessao}
              disabled={salvando}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {salvando
                ? "Salvando..."
                : sessaoEditandoId
                  ? "Salvar alterações"
                  : "Salvar sessão"}
            </button>

            {sessaoEditandoId && (
              <button
                type="button"
                onClick={limparFormulario}
                disabled={salvando}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Nova sessão
              </button>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Histórico de sessões
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Sessões registradas
            </h2>
          </div>

          {sessoes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
              <p className="text-sm font-medium text-[#2F2A24]">
                Nenhuma sessão registrada.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Ao registrar uma sessão, ela aparecerá aqui no histórico.
              </p>
            </div>
          ) : (
            <div className="max-h-[560px] overflow-y-auto pr-1">
              <div className="space-y-3">
                {sessoes.map((sessao) => (
                  <article
                    key={sessao.id}
                    className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
                          {sessao.title}
                        </p>

                        <p className="mt-1 text-xs text-[#8A7A68]">
                          {formatarDataHora(sessao.session_date)}
                        </p>

                        {sessao.next_session_date && (
                          <p className="mt-1 text-xs font-medium text-[#8A2E2B]">
                            Próxima: {formatarDataHora(sessao.next_session_date)}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <span className="rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold capitalize text-[#5F564C]">
                          {sessao.session_status}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleEditarSessao(sessao)}
                          disabled={excluindoId === sessao.id}
                          className="rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold text-[#5F564C] transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcluirSessao(sessao.id)}
                          disabled={excluindoId === sessao.id}
                          className="rounded-2xl border border-[#E8C7C0] bg-white px-3 py-2 text-xs font-semibold text-[#9A4A3F] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {excluindoId === sessao.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </div>

                    {sessao.session_focus && (
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                        {sessao.session_focus}
                      </p>
                    )}

                    {sessao.post_session_observations && (
                      <div className="mt-3 rounded-2xl border border-[#D8C7B1] bg-white p-3">
                        <p className="text-xs font-medium text-[#8A7A68]">
                          Pós-sessão
                        </p>

                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                          {sessao.post_session_observations}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <a
          href="#topo-sessoes"
          className="fixed bottom-5 right-4 z-40 inline-flex min-h-11 items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-4 text-sm font-semibold text-[#5F564C] shadow-lg transition hover:bg-[#FFF8EE] sm:right-6"
        >
          ↑ Topo
        </a>
      </section>
    </main>
  );
}