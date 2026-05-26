"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

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

export default function SituacoesPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [situacoes, setSituacoes] = useState<Situacao[]>([]);

  const [analise, setAnalise] = useState<AnaliseSituacoes>({
    totalRegistros: 0,
    intensidadeMedia: 0,
    areasMaisRecorrentes: [],
    respostasMaisComuns: [],
  });

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

  function gerarAnaliseSituacoes(registros: Situacao[]): AnaliseSituacoes {
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

  useEffect(() => {
    async function carregarSituacoes() {
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

      const { data: registros, error: erroRegistros } = await supabase
        .from("vpp_situation_records")
        .select(
          "id, situation, expected, thought, action_taken, outcome, area, predominant_response, emotional_intensity, pattern_note, created_at"
        )
        .eq("user_id", usuarioAtual.user.id)
        .order("created_at", { ascending: false });

      if (erroRegistros) {
        setSituacoes([]);
        setCarregando(false);
        return;
      }

      const listaRegistros = (registros || []) as Situacao[];

      setSituacoes(listaRegistros);
      setAnalise(gerarAnaliseSituacoes(listaRegistros));
      setCarregando(false);
    }

    carregarSituacoes();
  }, [router]);

  function formatarData(data: string) {
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
            Carregando registros
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando suas situações...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos organizando os registros salvos no seu painel.
          </p>
        </div>
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
                Situações registradas
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                {nomeUsuario
                  ? `${nomeUsuario}, seus registros reais`
                  : "Seus registros reais"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
                Aqui ficam as situações registradas para observar expectativas,
                pensamentos, respostas emocionais, comportamentos e
                consequências.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Link
                href="/situacoes/nova"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
              >
                Registrar nova situação
              </Link>

              <Link
                href="/painel"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
              >
                Voltar ao painel
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Análise inicial dos registros
            </p>

            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Onde seu padrão tem aparecido
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Esta leitura usa apenas os registros salvos. Quanto mais situações
              reais forem registradas, mais clara a repetição tende a ficar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-medium text-[#8A7A68]">
                Total de registros
              </p>

              <p className="mt-2 text-2xl font-semibold text-[#2F2A24]">
                {analise.totalRegistros}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
              <p className="text-sm font-medium text-red-700">
                Intensidade média
              </p>

              <p className="mt-2 text-2xl font-semibold text-[#2F2A24]">
                {analise.intensidadeMedia > 0
                  ? `${analise.intensidadeMedia}/10`
                  : "Sem dados"}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <p className="text-sm font-medium text-blue-700">
                Área mais recorrente
              </p>

              <p className="mt-2 text-lg font-semibold text-[#2F2A24]">
                {analise.areasMaisRecorrentes[0]?.nome || "Sem dados"}
              </p>

              {analise.areasMaisRecorrentes[0] && (
                <p className="mt-1 text-xs text-[#5F564C]">
                  {analise.areasMaisRecorrentes[0].total} registro(s)
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-sm font-medium text-amber-700">
                Resposta mais comum
              </p>

              <p className="mt-2 text-lg font-semibold text-[#2F2A24]">
                {analise.respostasMaisComuns[0]?.nome || "Sem dados"}
              </p>

              {analise.respostasMaisComuns[0] && (
                <p className="mt-1 text-xs text-[#5F564C]">
                  {analise.respostasMaisComuns[0].total} registro(s)
                </p>
              )}
            </div>
          </div>

          {(analise.areasMaisRecorrentes.length > 0 ||
            analise.respostasMaisComuns.length > 0) && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
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

        {situacoes.length === 0 ? (
          <section className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Nenhuma situação registrada
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[#2F2A24]">
              Comece registrando uma situação real
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#5F564C]">
              O teste oferece uma leitura inicial. Os registros ajudam a
              observar como o padrão aparece no cotidiano, em situações
              concretas.
            </p>

            <Link
              href="/situacoes/nova"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
            >
              Registrar primeira situação
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            {situacoes.map((situacao) => (
              <Link
                key={situacao.id}
                href={`/situacoes/${situacao.id}`}
                className="block rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm transition hover:bg-[#FFF8EE] hover:shadow-md sm:p-7"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#8A2E2B]">
                      {situacao.area} • {formatarData(situacao.created_at)}
                    </p>

                    <h2 className="mt-2 text-xl font-semibold text-[#2F2A24]">
                      {situacao.situation}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <span className="rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-3 py-2 text-xs font-semibold text-[#5F564C]">
                      {situacao.predominant_response}
                    </span>

                    <span className="rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-3 py-2 text-xs font-semibold text-[#8A2E2B]">
                      Intensidade {situacao.emotional_intensity}/10
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                    <p className="text-sm font-semibold text-[#2F2A24]">
                      O que eu esperava
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                      {situacao.expected}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                    <p className="text-sm font-semibold text-[#2F2A24]">
                      O que eu pensei
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                      {situacao.thought}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                    <p className="text-sm font-semibold text-[#2F2A24]">
                      O que eu fiz
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                      {situacao.action_taken}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                    <p className="text-sm font-semibold text-[#2F2A24]">
                      O que aconteceu depois
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                      {situacao.outcome}
                    </p>
                  </div>
                </div>

                {situacao.pattern_note && (
                  <div className="mt-4 rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-4">
                    <p className="text-sm font-semibold text-[#2F2A24]">
                      Observação do padrão
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                      {situacao.pattern_note}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}