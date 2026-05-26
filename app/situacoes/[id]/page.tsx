"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type Situacao = {
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

export default function DetalheSituacaoPage() {
  const router = useRouter();
  const params = useParams();

  const situacaoId = String(params.id || "");

  const [carregando, setCarregando] = useState(true);
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarSituacao() {
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

      if (role !== "paciente" && role !== "ambos") {
        router.replace("/clinico/painel");
        return;
      } 

      const { data: registro, error: erroRegistro } = await supabase
        .from("vpp_situation_records")
        .select(
          "id, situation, expected, thought, action_taken, outcome, area, predominant_response, emotional_intensity, pattern_note, created_at"
        )
        .eq("id", situacaoId)
        .eq("user_id", usuarioAtual.user.id)
        .maybeSingle();

      if (erroRegistro || !registro) {
        setSituacao(null);
        setCarregando(false);
        return;
      }

      setSituacao(registro as Situacao);
      setCarregando(false);
    }

    carregarSituacao();
  }, [router, situacaoId]);

  async function handleExcluirSituacao() {
    if (!situacao) return;

    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta situação? Essa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    setErro("");
    setExcluindo(true);

    try {
      const { data: usuarioAtual, error: erroUsuario } =
        await supabase.auth.getUser();

      if (erroUsuario || !usuarioAtual.user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("vpp_situation_records")
        .delete()
        .eq("id", situacao.id)
        .eq("user_id", usuarioAtual.user.id);

      if (error) {
        setErro("Não foi possível excluir esta situação.");
        return;
      }

      router.replace("/situacoes");
    } finally {
      setExcluindo(false);
    }
  }

  function formatarData(data: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(data));
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando situação
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando registro...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos abrindo a situação registrada.
          </p>
        </div>
      </main>
    );
  }

  if (!situacao) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Registro não encontrado
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Essa situação não foi encontrada
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              O registro pode ter sido removido ou não pertence ao seu usuário.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/situacoes"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Voltar para registros
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
      <section className="mx-auto w-full max-w-4xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Detalhe da situação
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Registro de situação real
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
                Registrado em {formatarData(situacao.created_at)}. Esta leitura
                ajuda a observar a relação entre expectativa, pensamento, reação
                e consequência.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Link
                href={`/situacoes/${situacao.id}/editar`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
              >
                Editar
              </Link>

              <button
                type="button"
                onClick={handleExcluirSituacao}
                disabled={excluindo}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#E8C7C0] bg-white px-5 text-sm font-semibold text-[#9A4A3F] shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>

              <Link
                href="/situacoes"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
              >
                Voltar aos registros
              </Link>

              <Link
                href="/painel"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
              >
                Voltar ao painel
              </Link>
            </div>
          </div>
        </header>

        {erro && (
          <div className="mb-6 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
            {erro}
          </div>
        )}

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-sm font-semibold text-blue-700">
              {situacao.area}
            </span>

            <span className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-2 text-sm font-semibold text-amber-700">
              {situacao.predominant_response}
            </span>

            <span className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-2 text-sm font-semibold text-red-700">
              Intensidade {situacao.emotional_intensity}/10
            </span>
          </div>

          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            O que aconteceu
          </p>

          <h2 className="text-xl font-semibold leading-8 text-[#2F2A24]">
            {situacao.situation}
          </h2>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Expectativa
            </p>

            <h2 className="text-lg font-semibold text-[#2F2A24]">
              O que você esperava
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              {situacao.expected}
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Pensamento
            </p>

            <h2 className="text-lg font-semibold text-[#2F2A24]">
              O que você pensou
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              {situacao.thought}
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Reação
            </p>

            <h2 className="text-lg font-semibold text-[#2F2A24]">
              O que você fez
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              {situacao.action_taken}
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Consequência
            </p>

            <h2 className="text-lg font-semibold text-[#2F2A24]">
              O que aconteceu depois
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              {situacao.outcome}
            </p>
          </article>
        </section>

        {situacao.pattern_note && (
          <section className="mt-4 rounded-3xl border border-[#D8C7B1] bg-[#FFF8EE] p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Observação do padrão
            </p>

            <h2 className="text-lg font-semibold text-[#2F2A24]">
              O que você percebeu
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              {situacao.pattern_note}
            </p>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A7A68]">
            Próximo passo
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Compare este registro com outros momentos
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Um registro isolado mostra um recorte. A repetição aparece quando
            várias situações começam a revelar expectativas parecidas, reações
            parecidas ou consequências parecidas.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/situacoes/nova"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
            >
              Registrar nova situação
            </Link>

            <Link
              href="/situacoes"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Ver todos os registros
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}