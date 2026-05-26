import Link from "next/link";

export default function SobrePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/vpp"
          className="mb-5 inline-flex min-h-11 items-center rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm font-semibold text-[#5F564C] shadow-sm hover:bg-[#FFF8EE]"
        >
          Voltar
        </Link>

        <section className="rounded-3xl border border-[#E5DDD2] bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
            Sobre o método
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Sobre o VPP
          </h1>

          <div className="mt-6 space-y-6 text-base leading-7 text-[#5F564C]">
            <p>
              O VPP — Vetor Psíquico Primário — é um modelo que organiza a
              forma como padrões de comportamento se formam, se mantêm e se
              repetem ao longo do tempo.
            </p>

            <p>
              Antes de qualquer comportamento, já existe uma forma de
              funcionamento ativa: o que a pessoa espera, como interpreta o que
              acontece e como responde a partir disso.
            </p>

            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-5">
              <h2 className="font-semibold text-[#2F2A24]">
                Por que os discípulos?
              </h2>

              <p className="mt-3">
                Os padrões apresentados neste app foram organizados a partir da
                análise de personagens dos Evangelhos, descritos no livro{" "}
                <strong>Jesus Já Sabia</strong>.
              </p>

              <p className="mt-3">
                Eles são usados como referência prática para observar diferentes
                formas de reação diante de pressão, dúvida, conflito,
                pertencimento, controle e propósito.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#2F2A24]">
                O que este app faz
              </h2>

              <p className="mt-3">
                Ele ajuda você a identificar qual padrão aparece com mais
                frequência, entender como esse padrão funciona e observar como
                ele se manifesta no dia a dia.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#2F2A24]">
                O que este app não faz
              </h2>

              <p className="mt-3">
                Este app não realiza diagnóstico, não substitui acompanhamento
                terapêutico e não interpreta a sua história completa. Ele
                organiza uma leitura inicial de padrão.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-5">
              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Por que o acompanhamento importa?
              </h2>

              <p className="mt-3">
                Perceber o padrão é apenas o começo. A mudança envolve
                compreender como ele se formou, onde se repete, quais
                resistências aparecem e como sustentar novas respostas.
              </p>

              <p className="mt-3">
                O app aponta. O processo terapêutico aprofunda.
              </p>
            </div>

            <p>
              Use o resultado como ponto de observação, não como conclusão final.
              Observe o que você espera antes das situações, como reage e o que
              tende a se repetir.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}