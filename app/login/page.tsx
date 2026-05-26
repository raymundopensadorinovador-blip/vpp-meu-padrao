"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    const emailLimpo = email.trim().toLowerCase();

    if (!validarEmail(emailLimpo)) {
      setErro("Informe um e-mail válido.");
      return;
    }

    if (!senha) {
      setErro("Informe sua senha.");
      return;
    }

    setCarregando(true);

    try {
      const { data: login, error: erroLogin } =
        await supabase.auth.signInWithPassword({
          email: emailLimpo,
          password: senha,
        });

      if (erroLogin) {
        setErro("E-mail ou senha inválidos.");
        return;
      }

      const userId = login.user?.id;

      if (!userId) {
        setErro("Login realizado, mas não foi possível identificar o usuário.");
        return;
      }

      const { data: perfil, error: erroPerfil } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (erroPerfil) {
        setErro("Não foi possível carregar seu perfil.");
        return;
      }

      if (!perfil) {
        setErro("Seu usuário existe, mas não encontramos seu perfil no app.");
        return;
      }

      const role = perfil.role as Role;

      if (role === "terapeuta") {
        router.push("/clinico/painel");
        return;
      }

      router.push("/painel");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-md flex-col justify-center">
        <Link
          href="/vpp"
          className="mb-5 inline-flex min-h-11 w-fit items-center rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm font-semibold text-[#5F564C] shadow-sm hover:bg-[#FFF8EE]"
        >
          Voltar
        </Link>

        <section className="rounded-3xl border border-[#E5DDD2] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex justify-center">
  <img
    src="/logo-vpp.jpeg"
    alt="Logo VPP — Meu Padrão"
    className="h-20 w-20 rounded-3xl object-cover shadow-sm"
  />
</div>

<p className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
  Acesso
</p>

<h1 className="mt-3 text-3xl font-bold">Entrar</h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Acesse sua conta para continuar acompanhando seus padrões e
            registros.
          </p>

          {erro && (
            <div className="mt-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-[#5F564C]">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-4 text-sm outline-none focus:border-[#8A2E2B]"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                disabled={carregando}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#5F564C]">Senha</span>

              <div className="mt-2 flex items-center rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] focus-within:border-[#8A2E2B]">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm outline-none"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  disabled={carregando}
                  required
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  className="min-h-11 px-4 text-sm font-semibold text-[#8A2E2B]"
                  disabled={carregando}
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>

            <div className="flex justify-end">
              <Link
                href="/recuperar-senha"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[#8A2E2B] hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="min-h-11 w-full rounded-2xl bg-[#2F2A24] px-5 py-4 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#5F564C]">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-[#8A2E2B]">
              Criar conta
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}