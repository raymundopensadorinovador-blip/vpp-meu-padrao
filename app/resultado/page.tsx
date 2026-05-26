"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

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

export default function ResultadoPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [resultado, setResultado] = useState<ResultadoVpp | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState("");

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

      if (role !== "paciente") {
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
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
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
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Resultado do teste VPP
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                {nomeUsuario
                  ? `${nomeUsuario}, sua leitura inicial está pronta`
                  : "Sua leitura inicial está pronta"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
                Este resultado não é diagnóstico. Ele é uma leitura inicial de
                padrão, criada para orientar sua auto-observação e aprofundar o
                processo terapêutico.
              </p>
            </div>

            <Link
              href="/painel"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
            >
              Voltar ao painel
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A7A68]">
            Perfil predominante
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-[#2F2A24]">
            {resultado.predominant_profile}
          </h2>

          {resultado.description && (
            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              {resultado.description}
            </p>
          )}

          {resultado.secondary_profiles?.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-[#8A2E2B]">
                Perfis secundários
              </p>

              <div className="flex flex-wrap gap-2">
                {resultado.secondary_profiles.map((perfil) => (
                  <span
                    key={perfil}
                    className="rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-2 text-sm font-medium text-[#5F564C]"
                  >
                    {perfil}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm sm:p-7">
  <p className="mb-2 text-sm font-medium text-blue-700">
    Leitura do funcionamento
  </p>

  <h2 className="text-xl font-semibold text-[#2F2A24]">
    Como esse padrão tende a operar
  </h2>

  <p className="mt-4 text-sm leading-6 text-[#5F564C]">
    {resultado.functioning_reading ||
      "Ainda não há leitura registrada para este perfil."}
  </p>
</article>

<article className="rounded-3xl border border-red-200 bg-red-50/70 p-5 shadow-sm sm:p-7">
  <p className="mb-2 text-sm font-medium text-red-700">
    Ponto de atenção
  </p>

  <h2 className="text-xl font-semibold text-[#2F2A24]">
    Onde esse padrão pode te prender
  </h2>

  <p className="mt-4 text-sm leading-6 text-[#5F564C]">
    {resultado.attention_point ||
      "Ainda não há ponto de atenção registrado para este perfil."}
  </p>
</article> 
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-green-200 bg-green-50/70 p-5 shadow-sm sm:p-7">
  <p className="mb-2 text-sm font-medium text-green-700">
    Potencial
  </p>

  <h2 className="text-xl font-semibold text-[#2F2A24]">
    O que pode ser reorganizado em força
  </h2>

  <p className="mt-4 text-sm leading-6 text-[#5F564C]">
    {resultado.potential ||
      "Ainda não há potencial registrado para este perfil."}
  </p>
</article> 

<article className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm sm:p-7">
  <p className="mb-2 text-sm font-medium text-amber-700">
    Onde você precisa observar agora
  </p>

  <h2 className="text-xl font-semibold text-[#2F2A24]">
    Comece por aqui
  </h2>

  <p className="mt-4 text-sm leading-6 text-[#5F564C]">
    {resultado.observation_focus ||
      "Ainda não há foco de observação registrado para este perfil."}
  </p>
</article>
        </section>

        <section className="mt-4 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            Pergunta de auto-observação
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Uma pergunta para levar para a vida real
          </h2>

          <div className="mt-5 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
            <p className="text-sm leading-6 text-[#5F564C]">
              {resultado.self_observation_question ||
                "Ainda não há pergunta registrada para este perfil."}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A7A68]">
            Próximo passo
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Transformar resultado em observação real
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            O teste mostra uma leitura inicial. O próximo passo será registrar
            situações reais para observar se esse padrão se repete na prática.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/painel"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
            >
              Voltar ao painel
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