"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type ResumoSituacoes = {
  total: number;
  areaMaisRecorrente: string;
  respostaMaisComum: string;
  intensidadeMedia: number;
};

type ResultadoResumo = {
  predominant_profile: string;
  secondary_profiles: string[];
  observation_focus: string | null;
};

export default function PainelPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [roleUsuario, setRoleUsuario] = useState<Role | null>(null);
  const [codigoTerapeuta, setCodigoTerapeuta] = useState("");
  const [ativandoAreaClinica, setAtivandoAreaClinica] = useState(false);
  const [mensagemAtivacaoClinica, setMensagemAtivacaoClinica] = useState("");
  const [erroAtivacaoClinica, setErroAtivacaoClinica] = useState("");
  
  const [resumoSituacoes, setResumoSituacoes] = useState<ResumoSituacoes>({
    total: 0,
    areaMaisRecorrente: "Ainda sem registros",
    respostaMaisComum: "Ainda sem registros",
    intensidadeMedia: 0,
  });

  const [resultadoResumo, setResultadoResumo] =
    useState<ResultadoResumo | null>(null);

  function encontrarMaisRecorrente(lista: string[]) {
    if (lista.length === 0) {
      return "Ainda sem registros";
    }

    const contagem = lista.reduce<Record<string, number>>((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0];
  }

  function gerarLeituraResumo(resumo: ResumoSituacoes) {
    if (resumo.total === 0) {
      return "Quando você começar a registrar situações reais, o app mostrará os primeiros sinais de repetição do seu padrão.";
    }

    return `Nos registros atuais, seu padrão aparece mais na área ${resumo.areaMaisRecorrente}, com resposta mais comum "${resumo.respostaMaisComum}" e intensidade emocional média de ${resumo.intensidadeMedia}/10.`;
  }

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

if (role !== "paciente" && role !== "ambos") {
  router.replace("/clinico/painel");
  return;
}

setRoleUsuario(role);
setNomeUsuario(perfil.name || "");

      const { data: registros } = await supabase
        .from("vpp_situation_records")
        .select("area, predominant_response, emotional_intensity")
        .eq("user_id", usuarioAtual.user.id);

      const listaRegistros = registros || [];
      const total = listaRegistros.length;

      const areaMaisRecorrente = encontrarMaisRecorrente(
        listaRegistros.map((item) => item.area).filter(Boolean)
      );

      const respostaMaisComum = encontrarMaisRecorrente(
        listaRegistros.map((item) => item.predominant_response).filter(Boolean)
      );

      const intensidadeMedia =
        total > 0
          ? Math.round(
              listaRegistros.reduce(
                (soma, item) => soma + Number(item.emotional_intensity || 0),
                0
              ) / total
            )
          : 0;

      setResumoSituacoes({
        total,
        areaMaisRecorrente,
        respostaMaisComum,
        intensidadeMedia,
      });

      const { data: resultadoEncontrado } = await supabase
        .from("vpp_test_results")
        .select("predominant_profile, secondary_profiles, observation_focus")
        .eq("user_id", usuarioAtual.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setResultadoResumo((resultadoEncontrado as ResultadoResumo) || null);
      setCarregando(false);
    }

    verificarAcesso();
  }, [router]);

  async function handleAtivarAreaClinica(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    const codigoLimpo = codigoTerapeuta.trim().toUpperCase();
  
    setMensagemAtivacaoClinica("");
    setErroAtivacaoClinica("");
  
    if (!codigoLimpo) {
      setErroAtivacaoClinica("Informe o código de terapeuta para ativar a área clínica.");
      return;
    }
  
    setAtivandoAreaClinica(true);
  
    const { error } = await supabase.rpc("activate_clinical_area_with_code", {
      p_code: codigoLimpo,
    });
  
    setAtivandoAreaClinica(false);
  
    if (error) {
      console.error("ERRO AO ATIVAR ÁREA CLÍNICA:", error);
  
      if (error.message?.includes("invalid_or_used_therapist_code")) {
        setErroAtivacaoClinica(
          "Código inválido ou já utilizado. Confira o código e tente novamente."
        );
        return;
      }
  
      if (error.message?.includes("clinical_area_already_enabled")) {
        setRoleUsuario("ambos");
        setMensagemAtivacaoClinica("Sua área clínica já estava ativada.");
        return;
      }
  
      if (error.message?.includes("user_already_therapist")) {
        router.replace("/clinico/painel");
        return;
      }
  
      setErroAtivacaoClinica(
        "Não foi possível ativar a área clínica agora. Tente novamente em instantes."
      );
      return;
    }
  
    setCodigoTerapeuta("");
    setRoleUsuario("ambos");
    setMensagemAtivacaoClinica(
      "Área clínica ativada com sucesso. Agora você também pode acessar o painel clínico."
    );
  }

  async function handleSair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Verificando acesso
          </p>

          <h1 className="mt-3 text-2xl font-semibold">Carregando painel...</h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando seu perfil antes de abrir sua área do VPP.
          </p>
        </div>
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
                Painel do usuário
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                VPP — Meu Padrão
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F564C]">
                {nomeUsuario
                  ? `${nomeUsuario}, este é seu espaço para observar padrões, registrar situações reais e acompanhar repetições do seu funcionamento.`
                  : "Este é seu espaço para observar padrões, registrar situações reais e acompanhar repetições do seu funcionamento."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/perfil"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
              >
                Meu perfil
              </Link>
              {roleUsuario === "ambos" && (
  <Link
    href="/clinico/painel"
    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
  >
    Ir para área clínica
  </Link>
)}
              <Link
                href="/vincular-terapeuta"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
              >
                Vincular terapeuta
              </Link>

              <button
                type="button"
                onClick={handleSair}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
              >
                Sair
              </button>
            </div>
          </div>
          </header>

{roleUsuario === "paciente" && (
  <section className="mb-6 rounded-3xl border border-[#D8C7B1] bg-[#FFF8EE] p-5 shadow-sm sm:p-7">
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="min-w-0">
        <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
          Área clínica
        </p>

        <h2 className="text-xl font-semibold text-[#2F2A24]">
          Ativar acesso como terapeuta
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#5F564C]">
          Se você também vai atuar como terapeuta no VPP — Meu Padrão,
          informe um código de acesso de terapeuta para liberar o painel
          clínico nesta mesma conta.
        </p>

        <p className="mt-3 text-sm leading-6 text-[#5F564C]">
          Essa ativação transforma sua conta em perfil duplo: paciente e
          terapeuta. Sem código válido, o painel clínico continua
          bloqueado.
        </p>
      </div>

      <form
        onSubmit={handleAtivarAreaClinica}
        className="rounded-2xl border border-[#E5DDD2] bg-white p-4 shadow-sm"
      >
        <label
          htmlFor="codigo-terapeuta"
          className="text-sm font-medium text-[#2F2A24]"
        >
          Código de terapeuta
        </label>

        <input
          id="codigo-terapeuta"
          type="text"
          value={codigoTerapeuta}
          onChange={(event) =>
            setCodigoTerapeuta(event.target.value.toUpperCase())
          }
          placeholder="VPP-TERAPEUTA-000"
          disabled={ativandoAreaClinica}
          className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-white px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] disabled:cursor-not-allowed disabled:opacity-70"
        />

        {erroAtivacaoClinica && (
          <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {erroAtivacaoClinica}
          </p>
        )}

        {mensagemAtivacaoClinica && (
          <p className="mt-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
            {mensagemAtivacaoClinica}
          </p>
        )}

        <button
          type="submit"
          disabled={ativandoAreaClinica}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {ativandoAreaClinica
            ? "Ativando área clínica..."
            : "Ativar área clínica"}
        </button>
      </form>
    </div>
  </section>
)}

{roleUsuario === "ambos" && mensagemAtivacaoClinica && (
  <section className="mb-6 rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-green-800">
          Área clínica liberada
        </p>

        <p className="mt-2 text-sm leading-6 text-green-800">
          {mensagemAtivacaoClinica}
        </p>
      </div>

      <Link
        href="/clinico/painel"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
      >
        Ir para área clínica
      </Link>
    </div>
  </section>
)}

<section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-[#8A7A68]">
                Status atual
              </p>

              {resultadoResumo ? (
                <>
                  <h2 className="text-xl font-semibold text-[#2F2A24]">
                    Seu teste VPP já foi realizado
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                    Seu perfil predominante atual é{" "}
                    <span className="font-semibold text-[#8A2E2B]">
                      {resultadoResumo.predominant_profile}
                    </span>
                    .
                  </p>

                  {resultadoResumo.secondary_profiles?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {resultadoResumo.secondary_profiles.map((perfil) => (
                        <span
                          key={perfil}
                          className="rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-3 py-2 text-xs font-semibold text-[#5F564C]"
                        >
                          {perfil}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-[#2F2A24]">
                    Seu teste VPP ainda não foi realizado
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                    Responda ao teste inicial para receber uma primeira leitura
                    do seu padrão predominante, perfis secundários e pontos de
                    observação.
                  </p>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm leading-6 text-[#5F564C]">
                {resultadoResumo?.observation_focus
                  ? resultadoResumo.observation_focus
                  : "O resultado não é diagnóstico. Ele funciona como uma lente inicial de observação para apoiar sua consciência sobre padrões."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/teste"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
              >
                {resultadoResumo ? "Refazer teste VPP" : "Fazer teste VPP"}
              </Link>

              {resultadoResumo && (
                <Link
                  href="/resultado"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
                >
                  Ver resultado completo
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Resumo dos seus registros
              </p>

              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Primeiros sinais de repetição
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                Este resumo usa as situações reais que você registrou para
                mostrar onde seu padrão aparece com mais frequência.
              </p>

              <div className="mt-4 rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-4">
                <p className="text-sm font-semibold text-[#2F2A24]">
                  Leitura inicial dos registros
                </p>

                <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                  {gerarLeituraResumo(resumoSituacoes)}
                </p>
              </div>
            </div>

            <Link
              href="/situacoes"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Ver registros
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-medium text-[#8A7A68]">
                Situações registradas
              </p>

              <p className="mt-2 text-2xl font-semibold text-[#2F2A24]">
                {resumoSituacoes.total}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <p className="text-sm font-medium text-blue-700">
                Área mais recorrente
              </p>

              <p className="mt-2 text-lg font-semibold text-[#2F2A24]">
                {resumoSituacoes.areaMaisRecorrente}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-sm font-medium text-amber-700">
                Resposta mais comum
              </p>

              <p className="mt-2 text-lg font-semibold text-[#2F2A24]">
                {resumoSituacoes.respostaMaisComum}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
              <p className="text-sm font-medium text-red-700">
                Intensidade média
              </p>

              <p className="mt-2 text-lg font-semibold text-[#2F2A24]">
                {resumoSituacoes.intensidadeMedia > 0
                  ? `${resumoSituacoes.intensidadeMedia}/10`
                  : "Ainda sem dados"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F3EC] text-lg">
              01
            </div>

            <h3 className="text-lg font-semibold text-[#2F2A24]">
              Fazer teste VPP
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Responda às perguntas para identificar seu perfil predominante e
              pontos iniciais de observação.
            </p>

            <Link
              href="/teste"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Fazer teste VPP
            </Link>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F3EC] text-lg">
              02
            </div>

            <h3 className="text-lg font-semibold text-[#2F2A24]">
              Registrar situação real
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Registre acontecimentos concretos: o que você esperava, pensou,
              sentiu, fez e percebeu depois.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/situacoes/nova"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
              >
                Registrar situação
              </Link>

              <Link
                href="/situacoes"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#F7F3EC] px-5 text-sm font-semibold text-[#5F564C] transition hover:bg-[#FFF8EE]"
              >
                Ver registros
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F3EC] text-lg">
              03
            </div>

            <h3 className="text-lg font-semibold text-[#2F2A24]">
              Acompanhar evolução
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Acompanhe repetições, áreas mais sensíveis, intensidade emocional
              e mudanças no modo de responder.
            </p>

            <Link
              href="/resultado"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
            >
              Ver meu resultado
            </Link>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Onde observar agora
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Comece percebendo suas repetições
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Antes de tentar mudar tudo, observe onde o mesmo tipo de reação
              aparece. Muitas vezes, o padrão começa na expectativa criada antes
              da situação acontecer.
            </p>

            <div className="mt-5 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-medium text-[#2F2A24]">
                Pergunta de auto-observação
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Em quais situações eu costumo esperar uma coisa, encontrar outra
                e responder quase sempre do mesmo jeito?
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A7A68]">
              Frase guia
            </p>

            <h2 className="text-xl font-semibold leading-8 text-[#2F2A24]">
              App = consciência.
              <br />
              Processo terapêutico = transformação.
            </h2>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              O aplicativo ajuda a organizar sinais. O processo terapêutico
              aprofunda a compreensão e sustenta a reorganização.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}