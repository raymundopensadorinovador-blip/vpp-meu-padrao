"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  }

  async function handleRecuperarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    const emailLimpo = email.trim().toLowerCase();

    if (!validarEmail(emailLimpo)) {
      setErro("Informe um e-mail válido.");
      return;
    }

    setCarregando(true);

    try {
      const redirectTo = `${window.location.origin}/nova-senha`;

      const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
        redirectTo,
      });

      if (error) {
        setErro(
          "Não foi possível enviar o link de recuperação. Confira o e-mail e tente novamente."
        );
        return;
      }

      setSucesso(
        "Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha."
      );
      setEmail("");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
          >
            Voltar para o início
          </Link>
        </div>

        <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <p className="mb-3 text-sm font-medium text-[#8A2E2B]">
              Recuperação de acesso
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
              Esqueci minha senha
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              Informe o e-mail usado no cadastro. Você receberá um link para
              criar uma nova senha e voltar a acessar o VPP — Meu Padrão.
            </p>
          </div>

          {erro && (
            <div className="mb-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="mb-5 rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#5F564C]">
              {sucesso}
            </div>
          )}

          <form onSubmit={handleRecuperarSenha} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#2F2A24]"
              >
                E-mail cadastrado
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                className="min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                autoComplete="email"
                disabled={carregando}
                required
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="min-h-11 w-full rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando
                ? "Enviando link..."
                : "Enviar link de recuperação"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
            <p className="text-sm leading-6 text-[#5F564C]">
              Por segurança, se o e-mail estiver cadastrado, o Supabase enviará
              um link para redefinir a senha. O link levará para a página de
              criação de nova senha.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-center text-sm text-[#5F564C]">
            <p>
              Lembrou a senha?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#8A2E2B] underline-offset-4 hover:underline"
              >
                Entrar novamente
              </Link>
            </p>

            <p>
              Ainda não tem acesso?{" "}
              <Link
                href="/cadastro"
                className="font-semibold text-[#8A2E2B] underline-offset-4 hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#8A7A68]">
          O VPP — Meu Padrão não realiza diagnóstico e não substitui terapia. O
          app ajuda na consciência dos padrões; o processo terapêutico aprofunda
          a transformação.
        </p>
      </section>
    </main>
  );
}