"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

export default function ClinicoSobrePage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);

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
        .select("role")
        .eq("id", usuarioAtual.user.id)
        .maybeSingle();

      if (erroPerfil || !perfil) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const role = String(perfil.role || "").trim() as Role;

      if (role !== "terapeuta") {
        router.replace("/painel");
        return;
      }

      setCarregando(false);
    }

    verificarAcesso();
  }, [router]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Verificando acesso clínico
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Carregando orientação...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando seu perfil antes de abrir esta página.
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
                Área clínica
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Como o terapeuta deve usar o VPP
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
                Esta área será criada para apoiar a leitura de padrões, não para
                substituir escuta clínica, interpretação cuidadosa ou construção
                conjunta com o paciente.
              </p>
            </div>

            <Link
              href="/clinico/painel"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
            >
              Ir para o painel
            </Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Princípio central
            </p>

            <h2 className="text-xl font-semibold leading-8 text-[#2F2A24]">
              O app mostra sinais. O terapeuta constrói sentido.
            </h2>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              O resultado do teste VPP deve ser tratado como uma leitura inicial
              de funcionamento. Ele pode indicar tendências, repetições e pontos
              de atenção, mas não deve ser usado como rótulo fixo sobre o
              paciente.
            </p>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              A função clínica é observar se aquilo que aparece no teste também
              se confirma nas situações reais registradas, na fala do paciente e
              na forma como ele organiza suas expectativas diante da realidade.
            </p>
          </article>

          <aside className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A7A68]">
              Frase guia
            </p>

            <h2 className="text-xl font-semibold leading-8 text-[#2F2A24]">
              Teste não é sentença.
              <br />
              Padrão não é identidade.
            </h2>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              O objetivo não é encaixar o paciente em uma categoria. É ajudá-lo
              a perceber como certos modos de funcionar se repetem e como podem
              ser reorganizados.
            </p>
          </aside>
        </section>

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            Fluxo clínico sugerido
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Da escuta ao padrão percebido
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                1. Escutar antes de interpretar
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Antes de explicar o padrão, o terapeuta observa como o paciente
                narra a situação, onde ele insiste, o que evita e qual
                expectativa aparece por trás da fala.
              </p>
            </article>

            <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                2. Comparar teste e vida real
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                O resultado do teste ganha valor quando encontra repetição nos
                registros concretos: pensamento, emoção, reação e consequência.
              </p>
            </article>

            <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                3. Construir a devolutiva
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                A devolutiva deve organizar o padrão em linguagem humana,
                clara, validável e sem transformar hipótese clínica em decreto
                divino. Já temos problemas suficientes.
              </p>
            </article>
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              O que a área clínica deve fazer
            </p>

            <ul className="space-y-3 text-sm leading-6 text-[#5F564C]">
              <li>• Mostrar pacientes vinculados ao terapeuta.</li>
              <li>• Exibir resultado do teste VPP do paciente.</li>
              <li>• Organizar registros de situações reais.</li>
              <li>
                • Apontar repetições de expectativa, reação e consequência.
              </li>
              <li>• Apoiar a construção de devolutivas clínicas.</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              O que a área clínica não deve fazer
            </p>

            <ul className="space-y-3 text-sm leading-6 text-[#5F564C]">
              <li>• Não deve diagnosticar automaticamente.</li>
              <li>• Não deve substituir o processo terapêutico.</li>
              <li>• Não deve rotular o paciente como um perfil fixo.</li>
              <li>• Não deve liberar dados sem vínculo e consentimento.</li>
              <li>• Não deve transformar o terapeuta em apertador de botão.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            Base ética
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Dados emocionais exigem cuidado real
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Os registros do paciente devem ser tratados como informações
            sensíveis. O terapeuta só deve acessar dados de pacientes vinculados
            a ele, e a plataforma precisa deixar esse limite claro desde o
            começo.
          </p>

          <div className="mt-5 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
            <p className="text-sm leading-6 text-[#5F564C]">
              Para o MVP, a regra será simples: paciente vê os próprios dados.
              Terapeuta vê apenas pacientes vinculados. Supervisão clínica fica
              para uma etapa futura, com permissões próprias.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/clinico/painel"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
            >
              Voltar ao painel clínico
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Ir para login
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}