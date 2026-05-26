"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigoAcesso, setCodigoAcesso] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  }

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const codigoLimpo = codigoAcesso.trim().toUpperCase();

    if (!nomeLimpo) {
      setErro("Informe seu nome.");
      return;
    }

    if (!validarEmail(emailLimpo)) {
      setErro("Informe um e-mail válido.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (!codigoLimpo) {
      setErro("Informe o código de acesso.");
      return;
    }

    setCarregando(true);

    try {
      const { data: codigoEncontrado, error: erroCodigo } = await supabase
        .from("access_codes")
        .select("id, code, role, used")
        .eq("code", codigoLimpo)
        .eq("used", false)
        .maybeSingle();

      if (erroCodigo) {
        setErro("Não foi possível validar o código de acesso.");
        return;
      }

      if (!codigoEncontrado) {
        setErro("Código de acesso inválido ou já utilizado.");
        return;
      }

      const role = codigoEncontrado.role as Role;

      const { data: cadastro, error: erroCadastro } =
        await supabase.auth.signUp({
          email: emailLimpo,
          password: senha,
        });

      if (erroCadastro) {
        setErro(erroCadastro.message || "Não foi possível criar sua conta.");
        return;
      }

      let userId = cadastro.user?.id;

      if (!userId) {
        const { data: usuarioAtual } = await supabase.auth.getUser();
        userId = usuarioAtual.user?.id;
      }

      if (!userId) {
        setErro(
          "A conta foi iniciada, mas não foi possível concluir o cadastro neste momento. Tente novamente com outro e-mail ou entre em contato com o responsável pelo acesso."
        );
        return;
      }

      const { error: erroPerfil } = await supabase.from("profiles").insert({
        id: userId,
        name: nomeLimpo,
        email: emailLimpo,
        role,
        access_code_used: codigoLimpo,
      });

      if (erroPerfil) {
        setErro("A conta foi criada, mas houve erro ao salvar o perfil.");
        return;
      }

      const { error: erroAtualizarCodigo } = await supabase.rpc(
        "consume_access_code",
        {
          p_code: codigoLimpo,
        }
      );

      if (erroAtualizarCodigo) {
        setErro("A conta foi criada, mas houve erro ao finalizar o código de acesso.");
        return;
      }

      setSucesso("Conta criada com sucesso. Redirecionando...");

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
              className="h-20 w-20 rounded-3xl bg-white object-contain p-2 shadow-sm"
            />
          </div>

          <p className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
            Acesso antecipado
          </p>

          <h1 className="mt-3 text-3xl font-bold">Criar conta</h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Crie sua conta para acessar o VPP — Meu Padrão e começar seus
            registros com segurança.
          </p>

          {erro && (
            <div className="mt-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="mt-5 rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#5F564C]">
              {sucesso}
            </div>
          )}

          <form onSubmit={handleCadastro} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-[#5F564C]">
                Nome
              </span>

              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-4 text-sm outline-none focus:border-[#8A2E2B]"
                placeholder="Seu nome"
                autoComplete="name"
                disabled={carregando}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#5F564C]">
                E-mail
              </span>

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
              <span className="text-sm font-medium text-[#5F564C]">
                Senha
              </span>

              <div className="mt-2 flex items-center rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] focus-within:border-[#8A2E2B]">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm outline-none"
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
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

            <label className="block">
              <span className="text-sm font-medium text-[#5F564C]">
                Código de acesso
              </span>

              <input
                type="text"
                value={codigoAcesso}
                onChange={(event) => setCodigoAcesso(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-4 text-sm uppercase outline-none focus:border-[#8A2E2B]"
                placeholder="Ex: VPP-PACIENTE-001"
                autoComplete="off"
                disabled={carregando}
                required
              />
            </label>

            <button
              type="submit"
              disabled={carregando}
              className="min-h-11 w-full rounded-2xl bg-[#2F2A24] px-5 py-4 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#5F564C]">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-[#8A2E2B]">
              Entrar
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}