import Link from "next/link";

export default function VppPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-[#E5DDD2] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center sm:justify-start">
            <img
              src="/logo-vpp.jpeg"
              alt="Logo VPP — Meu Padrão"
              className="h-20 w-20 rounded-3xl bg-white object-contain p-2 shadow-sm"
            />
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#D8C7B1] bg-[#FFF8EE] px-4 py-2 text-xs font-medium text-[#5F564C] sm:text-sm">
              VPP — Vetor Psíquico Primário
            </span>

            <span className="rounded-full border border-[#E5DDD2] bg-[#F7F3EC] px-4 py-2 text-xs font-medium text-[#8A7A68] sm:text-sm">
              Acesso antecipado
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Observe seus padrões com mais clareza.
            </h1>

            <p className="max-w-3xl text-base leading-7 text-[#5F564C] sm:text-lg sm:leading-8">
              O VPP — Meu Padrão é uma ferramenta de apoio à consciência de
              padrões emocionais, relacionais e comportamentais. Ele organiza
              respostas, registros e leituras iniciais para ajudar o usuário a
              perceber o que tende a se repetir em sua forma de reagir.
            </p>

            <p className="max-w-3xl text-base leading-7 text-[#5F564C] sm:text-lg sm:leading-8">
              A estrutura do app é inspirada na teoria do Vetor Psíquico
              Primário e nos perfis dos discípulos analisados no livro{" "}
              <strong>Jesus Já Sabia</strong>, Escrito por Raimundo J. Pereira, usando essa base como referência
              para observação de funcionamento, não como rótulo fixo.
            </p>

            <p className="max-w-3xl rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4 text-sm leading-6 text-[#5F564C]">
              O VPP — Meu Padrão não realiza diagnóstico e não substitui
              acompanhamento terapêutico. Ele oferece uma leitura reflexiva e
              organizada para apoiar a conversa clínica, a auto-observação e o
              processo terapêutico.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:max-w-md sm:grid-cols-2">
            <Link
              href="/cadastro"
              className="min-h-11 rounded-2xl bg-[#2F2A24] px-5 py-4 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Criar conta
            </Link>

            <Link
              href="/login"
              className="min-h-11 rounded-2xl border border-[#D8C7B1] bg-white px-5 py-4 text-center text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
            >
              Entrar
            </Link>
          </div>

          <div className="mt-4">
            <Link
              href="/sobre"
              className="inline-flex min-h-11 items-center rounded-2xl px-1 text-sm font-medium text-[#8A2E2B] underline-offset-4 hover:underline"
            >
              Entender melhor o método
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8A2E2B]">
              Primeiro passo
            </p>

            <h2 className="text-lg font-semibold">Reconhecer o padrão</h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              O teste inicial ajuda a identificar qual perfil aparece com mais
              força no funcionamento atual do usuário.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8A2E2B]">
              Observação real
            </p>

            <h2 className="text-lg font-semibold">Registrar situações</h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              O usuário registra acontecimentos concretos, expectativas,
              pensamentos, emoções e respostas para perceber repetições.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8A2E2B]">
              Acompanhamento
            </p>

            <h2 className="text-lg font-semibold">Levar para análise</h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              O app organiza sinais. O acompanhamento terapêutico aprofunda a
              leitura, sustenta o processo e ajuda na reorganização.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}