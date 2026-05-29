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

  anamnesis_status?: string | null;
  anamnesis_current_version?: number | null;
  anamnesis_last_submitted_at?: string | null;

  next_session_date?: string | null;
  next_session_title?: string | null;
  next_session_status?: string | null;
};

type ProximaSessaoPainel = {
  patient_id: string;
  patient_name: string;
  title: string | null;
  session_status: string | null;
  session_date: string | null;
  next_session_date: string | null;
};

export default function ClinicoPainelPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
const [nomeUsuario, setNomeUsuario] = useState("");
const [roleUsuario, setRoleUsuario] = useState<Role | null>(null);
const [ativandoModoPaciente, setAtivandoModoPaciente] = useState(false);
const [pacientes, setPacientes] = useState<PacienteVinculado[]>([]);
const [proximasSessoesPainel, setProximasSessoesPainel] = useState<
  ProximaSessaoPainel[]
>([]);
const [erro, setErro] = useState("");

  useEffect(() => {
    async function verificarAcesso() {
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
      
      setRoleUsuario(role);
      setNomeUsuario(perfil.name || "");  

      const { data: pacientesVinculados, error: erroPacientes } =
        await supabase.rpc("get_linked_patients_for_therapist");

        if (erroPacientes) {
          console.error("ERRO AO BUSCAR PACIENTES VINCULADOS:", erroPacientes);
        
          setErro(
            `Não foi possível carregar os pacientes vinculados. Erro: ${
              erroPacientes.message || "erro desconhecido"
            }`
          );
        
          setPacientes([]);
          setCarregando(false);
          return;
        }

        const listaPacientes = (pacientesVinculados || []) as PacienteVinculado[];
        const idsPacientes = listaPacientes.map((paciente) => paciente.patient_id);
        
        if (idsPacientes.length === 0) {
          setPacientes([]);
          setProximasSessoesPainel([]);
          setCarregando(false);
          return;
        }  
        
        const { data: anamnesesDosPacientes, error: erroAnamneses } = await supabase
          .from("patient_anamneses")
          .select("patient_id, status, current_version, last_submitted_at")
          .in("patient_id", idsPacientes);
        
        if (erroAnamneses) {
          console.error("ERRO AO BUSCAR ANAMNESES DOS PACIENTES:", erroAnamneses);
        }
        
        const anamnesesPorPaciente = new Map(
          (anamnesesDosPacientes || []).map((item) => [item.patient_id, item])
        );
        
        const agoraIso = new Date().toISOString();
        
        const { data: sessoesDosPacientes, error: erroSessoes } = await supabase
          .from("clinical_sessions")
          .select("patient_id, title, session_status, session_date, next_session_date")
          .in("patient_id", idsPacientes)
          .in("session_status", ["agendada", "remarcada"])
          .not("next_session_date", "is", null)
          .gte("next_session_date", agoraIso)
          .order("next_session_date", { ascending: true });
        
        if (erroSessoes) {
          console.error("ERRO AO BUSCAR PRÓXIMAS SESSÕES:", erroSessoes);
        }
        
        const nomesPacientesPorId = new Map(
          listaPacientes.map((paciente) => [paciente.patient_id, paciente.patient_name])
        );
        
        const todasProximasSessoes = (sessoesDosPacientes || []).map((sessao) => ({
          patient_id: sessao.patient_id,
          patient_name: nomesPacientesPorId.get(sessao.patient_id) || "Paciente",
          title: sessao.title || null,
          session_status: sessao.session_status || null,
          session_date: sessao.session_date || null,
          next_session_date: sessao.next_session_date || null,
        }));
        
        setProximasSessoesPainel(todasProximasSessoes);
        
        const proximasSessoesPorPaciente = new Map<
          string,
          ProximaSessaoPainel
        >();
        
        todasProximasSessoes.forEach((sessao) => {
          if (!proximasSessoesPorPaciente.has(sessao.patient_id)) {
            proximasSessoesPorPaciente.set(sessao.patient_id, sessao);
          }
        });
        
        const pacientesComDadosClinicos = listaPacientes.map((paciente) => {
          const anamnese = anamnesesPorPaciente.get(paciente.patient_id);
          const proximaSessao = proximasSessoesPorPaciente.get(paciente.patient_id);
        
          return {
            ...paciente,
            anamnesis_status: anamnese?.status || null,
            anamnesis_current_version: anamnese?.current_version || null,
            anamnesis_last_submitted_at: anamnese?.last_submitted_at || null,
            next_session_date: proximaSessao?.next_session_date || null,
            next_session_title: proximaSessao?.title || null,
            next_session_status: proximaSessao?.session_status || null,
          };
        });
        
        setPacientes(pacientesComDadosClinicos);
        setCarregando(false);      
    }

    verificarAcesso();
  }, [router]);

  async function handleUsarComoPaciente() {
    setErro("");
  
    if (roleUsuario === "ambos") {
      router.push("/painel");
      return;
    }
  
    setAtivandoModoPaciente(true);
  
    try {
      const { error } = await supabase.rpc(
        "enable_patient_mode_for_current_user"
      );
  
      if (error) {
        setErro("Não foi possível ativar o modo paciente para esta conta.");
        return;
      }
  
      setRoleUsuario("ambos");
      router.push("/painel");
    } finally {
      setAtivandoModoPaciente(false);
    }
  }

  async function handleSair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function formatarData(data: string | null) {
    if (!data) return "Não realizado";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(data));
  }
  function formatarDataHora(data: string | null | undefined) {
    if (!data) return "Não informado";
  
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(data));
  }
  const totalPacientes = pacientes.length;

  const totalComTeste = useMemo(() => {
    return pacientes.filter((paciente) => paciente.latest_profile).length;
  }, [pacientes]);

  const totalRegistros = useMemo(() => {
    return pacientes.reduce(
      (soma, paciente) => soma + Number(paciente.situation_count || 0),
      0
    );
  }, [pacientes]);

  const pacientesComRegistros = useMemo(() => {
    return pacientes.filter(
      (paciente) => Number(paciente.situation_count || 0) > 0
    ).length;
  }, [pacientes]);
  const proximaSessaoDoPainel = useMemo(() => {
    return proximasSessoesPainel[0] || null;
  }, [proximasSessoesPainel]);
  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Verificando acesso clínico
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Carregando painel...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando seu perfil antes de abrir a área clínica.
          </p>
        </div>
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
                Área clínica
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Painel do terapeuta
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
                {nomeUsuario
                  ? `${nomeUsuario}, acompanhe pacientes vinculados, resultados do teste VPP e registros de situações reais.`
                  : "Acompanhe pacientes vinculados, resultados do teste VPP e registros de situações reais."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Link
                href="/perfil"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
              >
                Meu perfil
              </Link>
              <button
  type="button"
  onClick={handleUsarComoPaciente}
  disabled={ativandoModoPaciente}
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
>
  {ativandoModoPaciente ? "Ativando..." : "Usar como paciente"}
</button>
<Link
  href="/clinico/perfil-profissional"
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
>
  Perfil profissional
</Link>

<Link
  href="/clinico/financeiro"
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] px-5 text-sm font-semibold text-[#8A2E2B] shadow-sm transition hover:bg-white lg:w-auto"
>
  Financeiro
</Link>

<Link
  href="/clinico/sobre"
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
>
  Sobre a área clínica
</Link> 

              <button
                type="button"
                onClick={handleSair}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {erro && (
          <div className="mb-6 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
            {erro}
          </div>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Pacientes vinculados
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {totalPacientes}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              {totalPacientes === 1
                ? "1 paciente ativo."
                : `${totalPacientes} pacientes ativos.`}
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Testes recebidos
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {totalComTeste}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Resultados VPP disponíveis.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Registros reais
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {totalRegistros}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Situações registradas pelos pacientes.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Pacientes com registros
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#2F2A24]">
              {pacientesComRegistros}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              Com pelo menos 1 situação registrada.
            </p>
          </article>
          </section>

          <section className="mb-6 rounded-3xl border border-[#D8C7B1] bg-[#FFF8EE] p-5 shadow-sm sm:p-7">
  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="min-w-0">
      <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
        Próximas sessões
      </p>

      {proximaSessaoDoPainel?.next_session_date ? (
        <>
          <h2 className="break-words text-xl font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
            Mais próxima: {proximaSessaoDoPainel.patient_name} —{" "}
            {formatarDataHora(proximaSessaoDoPainel.next_session_date)}
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Lista de próximas sessões registradas no controle clínico.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Nenhuma próxima sessão registrada
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Quando você registrar uma próxima sessão em algum paciente, ela
            aparecerá aqui no painel.
          </p>
        </>
      )}
    </div>

    {proximaSessaoDoPainel?.patient_id && (
      <Link
        href={`/clinico/pacientes/${proximaSessaoDoPainel.patient_id}/sessoes`}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
      >
        Abrir mais próxima
      </Link>
    )}
  </div>

  {proximasSessoesPainel.length > 0 && (
    <div className="max-h-64 overflow-y-auto pr-1">
      <div className="space-y-3">
        {proximasSessoesPainel.map((sessao) => (
          <div
            key={`${sessao.patient_id}-${sessao.next_session_date}`}
            className="rounded-2xl border border-[#D8C7B1] bg-white p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
                  {sessao.patient_name}
                </p>

                <p className="mt-1 text-sm leading-6 text-[#5F564C]">
                  {formatarDataHora(sessao.next_session_date)}
                </p>

                {sessao.title && (
                  <p className="mt-1 break-words text-xs text-[#8A7A68] [overflow-wrap:anywhere]">
                    {sessao.title}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <span className="w-fit rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-3 py-2 text-xs font-semibold capitalize text-[#5F564C]">
                  {sessao.session_status || "agendada"}
                </span>

                <Link
                  href={`/clinico/pacientes/${sessao.patient_id}/sessoes`}
                  className="w-fit rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold text-[#5F564C] transition hover:bg-[#FFF8EE]"
                >
                  Abrir
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</section>

<section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Pacientes
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                {totalPacientes > 0
                  ? "Pacientes vinculados"
                  : "Nenhum paciente vinculado"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                O terapeuta visualiza apenas pacientes que iniciaram vínculo
                com sua conta.
              </p>
            </div>

            {pacientes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5">
                <p className="text-sm font-medium text-[#2F2A24]">
                  Aguardando vínculo de paciente
                </p>

                <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                  Para aparecer aqui, o paciente precisa entrar no próprio
                  painel, clicar em “Vincular terapeuta” e informar o e-mail da
                  sua conta de terapeuta.
                </p>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto pr-1 sm:max-h-[620px]">
                <div className="space-y-3">
                  {pacientes.map((paciente) => (
                  <Link
                    key={paciente.patient_id}
                    href={`/clinico/pacientes/${paciente.patient_id}`}
                    className="block rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4 transition hover:bg-[#FFF8EE] hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-[#2F2A24]">
                          {paciente.patient_name}
                        </h3>

                        <p className="mt-1 break-words text-sm text-[#5F564C]">
                          {paciente.patient_email}
                        </p>

                        <p className="mt-2 text-xs text-[#8A7A68]">
                          Vinculado em {formatarData(paciente.linked_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
  <span className="rounded-2xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-semibold text-blue-700">
    {paciente.latest_profile || "Sem teste"}
  </span>

  <span className="rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-700">
    {Number(paciente.situation_count || 0)} registro(s)
  </span>

  {paciente.anamnesis_current_version && paciente.anamnesis_current_version > 0 ? (
    <span className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
      Anamnese v{paciente.anamnesis_current_version}
    </span>
  ) : (
    <span className="rounded-2xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-semibold text-[#8A7A68]">
      Anamnese pendente
    </span>
  )}
{paciente.next_session_date && (
  <span className="rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] px-3 py-2 text-xs font-semibold text-[#8A2E2B]">
    Sessão marcada
  </span>
)}  
</div> 
<div className="rounded-2xl bg-white p-3">
  <p className="text-xs font-medium text-[#8A7A68]">
    Próxima sessão
  </p>

  <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
    {paciente.next_session_date
      ? formatarDataHora(paciente.next_session_date)
      : "Não agendada"}
  </p>
</div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-medium text-[#8A7A68]">
                          Último teste
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
                          {formatarData(paciente.latest_test_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-medium text-[#8A7A68]">
                          Perfil predominante
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
                          {paciente.latest_profile || "Ainda sem resultado"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
  <p className="text-xs font-medium text-[#8A7A68]">
    Anamnese
  </p>

  <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
    {paciente.anamnesis_current_version && paciente.anamnesis_current_version > 0
      ? `Versão ${paciente.anamnesis_current_version}`
      : "Pendente"}
  </p>

  {paciente.anamnesis_last_submitted_at && (
    <p className="mt-1 text-xs text-[#8A7A68]">
      Atualizada em {formatarData(paciente.anamnesis_last_submitted_at)}
    </p>
  )}
</div> 
                    </div>
                  </Link>
                      ))}
                      </div>
                    </div>
                  )}
          </article>

          <aside className="space-y-4">
            <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Leitura clínica
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                O app organiza sinais. O terapeuta interpreta padrões.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                A área clínica não transforma o VPP em diagnóstico automático.
                Ela ajuda o terapeuta a observar repetições, levantar hipóteses
                e construir devolutivas com mais clareza.
              </p>
            </article>

            <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-medium text-[#8A7A68]">
                Consentimento e vínculo
              </p>

              <p className="text-sm leading-6 text-[#5F564C]">
                O terapeuta só acessa pacientes vinculados. O vínculo é iniciado
                pelo paciente no próprio painel, preservando consentimento e
                controle de acesso aos dados.
              </p>
            </article>
          </aside>
        </section>

        <section className="mt-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            Caminho clínico
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Da observação do padrão para a devolutiva
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                1. Resultado do teste
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                O terapeuta visualiza perfil predominante, perfis secundários e
                pontos de atenção.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                2. Situações reais
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                O paciente registra acontecimentos concretos e o terapeuta
                observa repetições ao longo do processo.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                3. Devolutiva
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                A leitura clínica organiza hipóteses, padrões percebidos e
                perguntas de investigação.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}