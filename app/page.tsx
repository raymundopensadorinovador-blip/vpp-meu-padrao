"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

export default function HomePage() {
  const [carregando, setCarregando] = useState(true);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    async function carregarSessao() {
      const { data: usuarioAtual } = await supabase.auth.getUser();

      if (!usuarioAtual.user) {
        setRole(null);
        setCarregando(false);
        return;
      }

      const { data: perfil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", usuarioAtual.user.id)
        .maybeSingle();

      const roleEncontrado = String(perfil?.role || "").trim();

      if (roleEncontrado === "terapeuta") {
        setRole("terapeuta");
      } else if (roleEncontrado === "paciente") {
        setRole("paciente");
      } else {
        setRole(null);
      }

      setCarregando(false);
    }

    carregarSessao();
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-6 py-10 text-[#2F2A24]">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl flex-col items-center justify-center text-center">
        <p className="mb-4 rounded-full border border-[#D8C7B1] bg-white px-4 py-2 text-sm text-[#5F564C]">
          VPP — Vetor Psíquico Primário
        </p>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          VPP — Meu Padrão
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5F564C]">
          Descubra qual padrão dos discípulos mais se aproxima do seu
          funcionamento e observe como você tende a reagir antes mesmo de
          perceber.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          {carregando ? (
            <div className="rounded-2xl border border-[#D8C7B1] bg-white px-6 py-4 text-center font-semibold text-[#5F564C] shadow-sm">
              Verificando acesso...
            </div>
          ) : role === "terapeuta" ? (
            <>
              <Link
                href="/clinico/painel"
                className="rounded-2xl bg-[#2F2A24] px-6 py-4 text-center font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Voltar ao painel clínico
              </Link>

              <Link
                href="/vpp"
                className="rounded-2xl border border-[#D8C7B1] bg-white px-6 py-4 text-center font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
              >
                Saiba mais sobre o VPP
              </Link>
            </>
          ) : role === "paciente" ? (
            <>
              <Link
                href="/painel"
                className="rounded-2xl bg-[#2F2A24] px-6 py-4 text-center font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Voltar ao meu painel
              </Link>

              <Link
                href="/vpp"
                className="rounded-2xl border border-[#D8C7B1] bg-white px-6 py-4 text-center font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
              >
                Saiba mais sobre o VPP
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/vpp"
                className="rounded-2xl bg-[#2F2A24] px-6 py-4 text-center font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Começar
              </Link>

              <Link
                href="/sobre"
                className="rounded-2xl border border-[#D8C7B1] bg-white px-6 py-4 text-center font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
              >
                Saiba mais sobre o VPP
              </Link>
            </>
          )}
        </div>

        <p className="mt-8 max-w-xl text-sm leading-6 text-[#8A7A68]">
          Esta ferramenta não realiza diagnóstico e não substitui acompanhamento
          terapêutico. Ela oferece uma leitura reflexiva sobre padrões de
          funcionamento.
        </p>
      </section>
    </main>
  );
}