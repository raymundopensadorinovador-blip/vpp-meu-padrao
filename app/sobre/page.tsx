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
          <div className="mb-6 flex justify-center sm:justify-start">
            <img
              src="/logo-vpp.jpeg"
              alt="Logo VPP — Meu Padrão"
              className="h-20 w-20 rounded-3xl bg-white object-contain p-2 shadow-sm"
            />
          </div>

          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
            Sobre o método
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Sobre o VPP
          </h1>

          <div className="mt-6 space-y-6 text-base leading-7 text-[#5F564C]">
            <p>
              O VPP — Vetor Psíquico Primário — é uma proposta de leitura dos
              padrões que influenciam a forma como uma pessoa percebe, espera,
              sente e responde às situações da vida.
            </p>

            <p>
              A ideia central é que muitos comportamentos não aparecem isolados.
              Eles costumam estar ligados a expectativas internas, interpretações
              repetidas, respostas emocionais e formas aprendidas de lidar com a
              realidade.
            </p>

            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-5">
              <h2 className="font-semibold text-[#2F2A24]">
                Por que os discípulos?
              </h2>

              <p className="mt-3">
                Os perfis usados no app foram organizados a partir da análise
                dos discípulos nos Evangelhos, apresentada no livro{" "}
                <strong>Jesus Já Sabia</strong>. Escrito por Raimundo J. Pereira.
              </p>

              <p className="mt-3">
                Eles funcionam como referências simbólicas e práticas para
                observar diferentes formas de reação diante de pressão, dúvida,
                conflito, pertencimento, medo, controle, impulso, entrega e
                propósito.
              </p>

              <p className="mt-3">
                Esses perfis não devem ser lidos como rótulos fixos. Eles são
                pontos de observação para ajudar a pessoa a reconhecer tendências
                de funcionamento.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#2F2A24]">
                O que este app faz
              </h2>

              <p className="mt-3">
                O app ajuda o usuário a responder um teste inicial, registrar
                situações reais, organizar repetições e observar como seus
                padrões aparecem no cotidiano.
              </p>

              <p className="mt-3">
                Para o terapeuta, a área clínica permite acompanhar pacientes
                vinculados, visualizar resultados, ler registros, criar
                anotações clínicas e emitir encaminhamentos quando necessário.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#2F2A24]">
                O que este app não faz
              </h2>

              <p className="mt-3">
                O VPP — Meu Padrão não realiza diagnóstico, não substitui
                acompanhamento terapêutico e não interpreta toda a história de
                uma pessoa de forma automática.
              </p>

              <p className="mt-3">
                O resultado deve ser usado como leitura inicial e material de
                reflexão, não como conclusão definitiva sobre identidade,
                personalidade ou saúde mental.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-5">
              <h2 className="text-xl font-semibold text-[#2F2A24]">
                Por que o acompanhamento importa?
              </h2>

              <p className="mt-3">
                Perceber um padrão é apenas o começo. A mudança envolve
                compreender como ele se formou, em quais situações se repete,
                quais resistências aparecem e quais novas respostas podem ser
                construídas com mais consciência.
              </p>

              <p className="mt-3">
                O app organiza sinais. O processo terapêutico aprofunda a
                leitura, sustenta o cuidado e favorece a reorganização.
              </p>
            </div>

            <p>
              Use o resultado como ponto de observação. Repare no que você
              espera antes das situações, como interpreta o que acontece, como
              reage emocionalmente e quais respostas tendem a se repetir.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}