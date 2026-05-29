"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type ResultadoVpp = {
  id: string;
  predominant_profile: string;
  secondary_profiles: string[];
  description: string | null;
  functioning_reading: string | null;
  attention_point: string | null;
  potential: string | null;
  observation_focus: string | null;
  self_observation_question: string | null;
  created_at: string;
};

function separarNomePerfil(perfil: string) {
  const partes = perfil.split(" — ");

  return {
    nome: partes[0] || perfil,
    vetor: partes[1] || "",
  };
}

function formatarDataResultado(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(data));
}

export default function ResultadoPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [resultado, setResultado] = useState<ResultadoVpp | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const perfilSeparado = resultado
  ? separarNomePerfil(resultado.predominant_profile)
  : null;
  useEffect(() => {
    async function carregarResultado() {
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

      setNomeUsuario(perfil.name || "");

      const { data: resultadoEncontrado, error: erroResultado } =
        await supabase
          .from("vpp_test_results")
          .select(
            "id, predominant_profile, secondary_profiles, description, functioning_reading, attention_point, potential, observation_focus, self_observation_question, created_at"
          )
          .eq("user_id", usuarioAtual.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (erroResultado) {
        setResultado(null);
        setCarregando(false);
        return;
      }

      setResultado(resultadoEncontrado as ResultadoVpp | null);
      setCarregando(false);
    }

    carregarResultado();
  }, [router]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando resultado
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando sua leitura VPP...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos procurando o resultado mais recente do seu teste.
          </p>
        </div>
      </main>
    );
  }

  if (!resultado) {
    return (
      <main className="min-h-screen bg-[#F6F0E8] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Resultado não encontrado
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Você ainda não fez o teste VPP
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              Para ver sua leitura inicial, responda primeiro às 36 perguntas do
              teste.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/teste"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Fazer teste VPP
              </Link>

              <Link
                href="/painel"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
              >
                Voltar ao painel
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
      <header className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm">
  <div className="border-b border-[#E5DDD2] p-5 sm:p-7">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A7A68]">
          Resultado do teste VPP
        </p>

        <h1 className="break-words text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl [overflow-wrap:anywhere]">
          {nomeUsuario
            ? `${nomeUsuario}, sua leitura inicial está pronta`
            : "Sua leitura inicial está pronta"}
        </h1>

        <p className="max-w-3xl text-sm leading-relaxed text-[#6F6257]">
          Este resultado não define quem você é. Ele organiza sinais do seu
          funcionamento para ajudar você a observar repetições, reações,
          expectativas e possibilidades de mudança.
        </p>
      </div>

      <Link
        href="/painel"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#F7F3EC] lg:w-auto"
      >
        Voltar ao painel
      </Link>
    </div>
  </div>

  <div className="grid gap-4 bg-[#FFF8EE] p-5 sm:p-7 md:grid-cols-3">
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#2F2A24]">
        Leitura inicial
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        O teste aponta uma direção predominante de funcionamento, não um rótulo
        definitivo.
      </p>
    </article>

    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#2F2A24]">
        Observe no cotidiano
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        O valor do resultado aparece quando você começa a reconhecer esse padrão
        em situações reais.
      </p>
    </article>

    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#2F2A24]">
        Leve para a escuta
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        Com acompanhamento, essa leitura pode ser aprofundada com mais cuidado,
        contexto e precisão clínica.
      </p>
    </article>
  </div>
</header>

<section className="mb-6 rounded-3xl bg-[#2F2A24] p-5 text-white shadow-sm sm:p-7">
  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-medium text-white/70">
        Perfil predominante
      </p>

      <h2 className="mt-3 break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl [overflow-wrap:anywhere]">
        {perfilSeparado?.nome || resultado.predominant_profile}
      </h2>

      {perfilSeparado?.vetor && (
        <p className="mt-2 break-words text-lg font-medium text-white/80 [overflow-wrap:anywhere]">
          {perfilSeparado.vetor}
        </p>
      )}
{resultado.description && (
  <div className="mt-5 max-h-44 max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 pr-3">
    <p className="break-words text-sm leading-6 text-white/75 [overflow-wrap:anywhere]">
      {resultado.description}
    </p>
  </div>
)}
      
    </div>

    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
        Resultado gerado em
      </p>

      <p className="mt-2 text-sm font-semibold text-white">
        {formatarDataResultado(resultado.created_at)}
      </p>
    </div>
  </div>

  {resultado.secondary_profiles?.length > 0 && (
    <div className="mt-6 border-t border-white/10 pt-5">
      <p className="mb-3 text-sm font-medium text-white/70">
        Perfis secundários que também apareceram
      </p>

      <div className="flex flex-wrap gap-2">
        {resultado.secondary_profiles.map((perfil) => (
          <span
            key={perfil}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/85"
          >
            {perfil}
          </span>
        ))}
      </div>
    </div>
  )}
</section>       

<section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
  <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
    <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
      Leitura do funcionamento
    </p>

    <h2 className="text-xl font-semibold text-[#2F2A24]">
      Como esse padrão pode aparecer na prática
    </h2>

    <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl border border-[#E5DDD2] bg-[#FFF8EE] p-4 pr-3">
  <p className="break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
    {resultado.functioning_reading ||
      "Ainda não há leitura registrada para este perfil."}
  </p>
</div> 

    <div className="mt-5 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
      <p className="text-sm leading-6 text-[#5F564C]">
        Use esta leitura como ponto de partida. Ela ganha mais precisão quando
        você observa situações reais e percebe como reage diante de frustrações,
        vínculos, escolhas e expectativas.
      </p>
    </div>
  </article>

  <article className="rounded-3xl border border-[#E8C7C0] bg-red-50/80 p-5 shadow-sm sm:p-7">
    <p className="mb-2 text-sm font-medium text-red-700">
      Ponto de atenção
    </p>

    <h2 className="text-xl font-semibold text-[#2F2A24]">
      Onde esse padrão pode gerar sofrimento
    </h2>

    <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-[#E8C7C0] bg-white/70 p-4 pr-3">
  <p className="break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
    {resultado.attention_point ||
      "Ainda não há ponto de atenção registrado para este perfil."}
  </p>
</div> 

    <p className="mt-5 text-sm leading-6 text-[#5F564C]">
      Esse ponto não deve ser lido como falha pessoal. Ele indica uma região do
      funcionamento que merece observação, cuidado e elaboração.
    </p>
  </article>
</section>

<section className="mt-4 grid gap-4 lg:grid-cols-2">
  <article className="rounded-3xl border border-green-200 bg-green-50/80 p-5 shadow-sm sm:p-7">
    <p className="mb-2 text-sm font-medium text-green-700">
      Potencial
    </p>

    <h2 className="text-xl font-semibold text-[#2F2A24]">
      O que pode se tornar força
    </h2>

    <div className="mt-4 max-h-52 overflow-y-auto rounded-2xl border border-green-200 bg-white/70 p-4 pr-3">
  <p className="break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
    {resultado.potential ||
      "Ainda não há potencial registrado para este perfil."}
  </p>
</div>
  </article>

  <article className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm sm:p-7">
    <p className="mb-2 text-sm font-medium text-amber-700">
      Foco de observação
    </p>

    <h2 className="text-xl font-semibold text-[#2F2A24]">
      Comece observando isto
    </h2>

    <div className="mt-4 max-h-52 overflow-y-auto rounded-2xl border border-amber-200 bg-white/70 p-4 pr-3">
  <p className="break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
    {resultado.observation_focus ||
      "Ainda não há foco de observação registrado para este perfil."}
  </p>
</div>
  </article>
</section> 

<section className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
  <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
    Pergunta de auto-observação
  </p>

  <h2 className="text-xl font-semibold text-[#2F2A24]">
    Uma pergunta para levar para a vida real
  </h2>

  <div className="mt-5 max-h-52 overflow-y-auto rounded-3xl border border-[#D8C7B1] bg-[#FFF8EE] p-5 pr-3">
  <p className="break-words text-lg font-semibold leading-8 text-[#2F2A24] [overflow-wrap:anywhere]">
    {resultado.self_observation_question ||
      "Ainda não há pergunta registrada para este perfil."}
  </p>
</div> 

  <p className="mt-4 text-sm leading-6 text-[#5F564C]">
    Anote situações em que essa pergunta fizer sentido. A repetição observada no
    cotidiano é mais importante do que tentar entender tudo de uma vez.
  </p>
</section>     

<section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
  <p className="mb-2 text-sm font-medium text-[#8A7A68]">
    Próximo passo
  </p>

  <h2 className="text-xl font-semibold text-[#2F2A24]">
    Transformar resultado em observação real
  </h2>

  <p className="mt-3 text-sm leading-6 text-[#5F564C]">
    O teste mostra uma leitura inicial. O próximo passo é registrar situações
    reais para observar como esse padrão aparece no cotidiano: o que você espera,
    como interpreta, que emoção surge e como reage.
  </p>

  <div className="mt-5 grid gap-4 md:grid-cols-3">
    <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
      <p className="text-sm font-semibold text-[#2F2A24]">
        1. Observe situações reais
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        Perceba momentos em que a reação parece maior, repetida ou difícil de
        controlar.
      </p>
    </article>

    <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
      <p className="text-sm font-semibold text-[#2F2A24]">
        2. Registre o que aconteceu
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        Anote pensamento, emoção, expectativa, realidade e comportamento.
      </p>
    </article>

    <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
      <p className="text-sm font-semibold text-[#2F2A24]">
        3. Leve para o acompanhamento
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        Com o terapeuta, esses registros podem ajudar a construir uma devolutiva
        mais precisa.
      </p>
    </article>
  </div>

  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
    <Link
      href="/painel"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
    >
      Voltar ao painel
    </Link>

    <Link
      href="/situacoes/nova"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] px-5 text-sm font-semibold text-[#8A2E2B] shadow-sm transition hover:bg-white sm:w-auto"
    >
      Registrar situação
    </Link>

    <Link
      href="/teste"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
    >
      Refazer teste
    </Link>
  </div>
</section>  
      </section>
    </main>
  );
}