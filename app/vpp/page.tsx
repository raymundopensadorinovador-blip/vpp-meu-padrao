import Link from "next/link";

export default function VppPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-[#E5DDD2] bg-white p-6 shadow-sm sm:p-8">
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
              Uma ferramenta para observar seus padrões antes que eles se repitam.
            </h1>

            <p className="max-w-3xl text-base leading-7 text-[#5F564C] sm:text-lg sm:leading-8">
              O VPP — Meu Padrão ajuda você a identificar tendências de
              funcionamento emocional e comportamental a partir de uma leitura
              estruturada, inspirada nos padrões dos discípulos analisados no
              livro <strong>Jesus Já Sabia</strong>.
            </p>

            <p className="max-w-3xl rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4 text-sm leading-6 text-[#5F564C]">
              Este app não realiza diagnóstico e não substitui acompanhamento
              terapêutico. Ele organiza uma leitura inicial para ajudar você a
              observar o que se repete e levar isso com mais clareza para o
              processo de análise.
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
              Saiba mais sobre o método VPP
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8A2E2B]">
              Primeiro passo
            </p>
            <h2 className="text-lg font-semibold">Identifique seu padrão</h2>
            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Responda perguntas simples para perceber qual vetor aparece com
              mais força no seu funcionamento atual.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8A2E2B]">
              Observação real
            </p>
            <h2 className="text-lg font-semibold">Registre situações</h2>
            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Anote o que aconteceu, o que você esperava, como reagiu e o que
              se repetiu.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8A2E2B]">
              Processo
            </p>
            <h2 className="text-lg font-semibold">Leve para análise</h2>
            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              O app aponta o padrão. O acompanhamento ajuda a aprofundar,
              sustentar e reorganizar.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}