"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type DreamEntry = {
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
  updated_at: string;
};

type PatientProfile = {
  name: string | null;
};

export default function SonhosPacienteClinicoPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    
    const patientId = String(params?.id || "");
    const voltarParaPreSessao = searchParams.get("voltar") === "pre-sessao";
    const linkVoltar = voltarParaPreSessao
      ? `/clinico/pacientes/${patientId}/pre-sessao`
      : `/clinico/pacientes/${patientId}`;
    const textoBotaoVoltar = voltarParaPreSessao
      ? "Voltar para pré-sessão"
      : "Voltar para ficha";

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nomePaciente, setNomePaciente] = useState("");
  const [sonhos, setSonhos] = useState<DreamEntry[]>([]);

  const sonhosOrdenados = useMemo(() => {
    return [...sonhos].sort((a, b) => {
      const dataA = new Date(a.dream_date).getTime();
      const dataB = new Date(b.dream_date).getTime();

      if (dataA !== dataB) {
        return dataB - dataA;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [sonhos]);

  const ultimoSonho = sonhosOrdenados[0] || null;

  const totalComEmocoes = sonhosOrdenados.filter((sonho) =>
    Boolean(sonho.main_emotions?.trim())
  ).length;

  const totalComSensacaoAoAcordar = sonhosOrdenados.filter((sonho) =>
    Boolean(sonho.waking_feeling?.trim())
  ).length;

  const totalComContexto = sonhosOrdenados.filter((sonho) =>
    Boolean(sonho.possible_context?.trim())
  ).length;

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);
      setErro("");

      if (!patientId) {
        setErro("Paciente não encontrado.");
        setCarregando(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

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
      
      setNomePaciente(pacienteEncontrado.patient_name || "Paciente");  

      const { data: sonhosEncontrados, error: erroSonhos } = await supabase
        .from("patient_dream_entries")
        .select("*")
        .eq("patient_id", patientId)
        .order("dream_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (erroSonhos) {
        setErro("Não foi possível carregar os sonhos deste paciente.");
        setCarregando(false);
        return;
      }

      setSonhos((sonhosEncontrados || []) as DreamEntry[]);
      setCarregando(false);
    }

    carregarDados();
  }, [patientId, router]);

  function formatarData(data: string) {
    if (!data) return "Sem data";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Diário de sonhos
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Carregando registros...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Buscando os sonhos registrados pelo paciente.
          </p>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-700">
            Não foi possível abrir esta área
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-red-900">
            Diário de sonhos indisponível
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-800">{erro}</p>

          <Link
  href={linkVoltar}
  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
>
  {voltarParaPreSessao ? "Voltar para pré-sessão" : "Voltar para ficha do paciente"}
</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Material clínico do paciente
              </p>

              <h1 className="break-words text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl [overflow-wrap:anywhere]">
                Diário de sonhos de {nomePaciente}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
                Esta área organiza os sonhos registrados pelo paciente. O app não
                interpreta os sonhos automaticamente, não atribui significados
                simbólicos fechados e não produz diagnóstico. O conteúdo serve
                como material clínico para escuta, preparação e acompanhamento.
              </p>
            </div>

            <Link
  href={linkVoltar}
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
>
  {textoBotaoVoltar}
</Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Total registrado
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#2F2A24]">
              {sonhosOrdenados.length}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              sonho(s) salvo(s) pelo paciente.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Com emoções descritas
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#2F2A24]">
              {totalComEmocoes}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              registros com emoções anotadas.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Sensação ao acordar
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#2F2A24]">
              {totalComSensacaoAoAcordar}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              registros com sensação inicial.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8A7A68]">
              Contexto possível
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#2F2A24]">
              {totalComContexto}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5F564C]">
              registros com contexto recente.
            </p>
          </article>
        </section>

        {ultimoSonho && (
          <section className="mb-6 rounded-3xl border border-[#D8C7B1] bg-[#FFF8EE] p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Último sonho registrado
            </p>

            <h2 className="break-words text-xl font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
              {ultimoSonho.title}
            </h2>

            <p className="mt-2 text-sm text-[#8A7A68]">
              Registrado para {formatarData(ultimoSonho.dream_date)}
            </p>

            <div className="mt-4 rounded-2xl border border-[#E5DDD2] bg-white p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                {ultimoSonho.dream_report}
              </p>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Histórico de sonhos
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Registros organizados
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
  Use este material como apoio para observar repetições, emoções,
  figuras, lugares e contextos que possam aparecer na escuta clínica.
  O app apenas organiza os registros. A leitura clínica deve ser feita
  pelo terapeuta durante o acompanhamento.
</p> 
          </div>

          {sonhosOrdenados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5 text-sm leading-6 text-[#5F564C]">
              Este paciente ainda não registrou sonhos.
            </div>
          ) : (
            <div className="max-h-[760px] space-y-4 overflow-y-auto pr-1">
              {sonhosOrdenados.map((sonho) => (
                <article
                  key={sonho.id}
                  className="min-w-0 overflow-hidden rounded-3xl border border-[#E5DDD2] bg-[#FAF7F1] p-4 sm:p-5"
                >
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A7A68]">
                      {formatarData(sonho.dream_date)}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
                      {sonho.title}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <InfoBlock titulo="Relato do sonho" texto={sonho.dream_report} destaque />

                    <div className="grid gap-3 md:grid-cols-2">
                      {sonho.main_emotions && (
                        <InfoBlock
                          titulo="Emoções principais"
                          texto={sonho.main_emotions}
                        />
                      )}

                      {sonho.waking_feeling && (
                        <InfoBlock
                          titulo="Sensação ao acordar"
                          texto={sonho.waking_feeling}
                        />
                      )}

                      {sonho.recurring_people && (
                        <InfoBlock
                          titulo="Pessoas ou figuras"
                          texto={sonho.recurring_people}
                        />
                      )}

                      {sonho.recurring_places && (
                        <InfoBlock
                          titulo="Lugares"
                          texto={sonho.recurring_places}
                        />
                      )}
                    </div>

                    {sonho.symbols_or_images && (
                      <InfoBlock
                        titulo="Imagens, símbolos ou cenas marcantes"
                        texto={sonho.symbols_or_images}
                      />
                    )}

                    {sonho.possible_context && (
                      <InfoBlock
                        titulo="Contexto possível do momento"
                        texto={sonho.possible_context}
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function InfoBlock({
  titulo,
  texto,
  destaque = false,
}: {
  titulo: string;
  texto: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-[#E5DDD2] ${
        destaque ? "bg-white" : "bg-white/80"
      } p-4`}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A7A68]">
        {titulo}
      </p>

      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
        {texto}
      </p>
    </div>
  );
}