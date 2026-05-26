"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NovaSenhaPage() {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleNovaSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (senha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);

    try {
      const { data: sessaoAtual } = await supabase.auth.getSession();

      if (!sessaoAtual.session) {
        setErro(
          "Sessão de recuperação não encontrada. Abra esta página pelo link enviado no e-mail de recuperação."
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        setErro("Não foi possível salvar a nova senha. Tente pedir um novo link de recuperação.");
        return;
      }

      setSucesso("Senha alterada com sucesso. Redirecionando para o login...");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
        <div className="mb-6 text-center">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
          >
            Voltar para o login
          </Link>
        </div>

        <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <p className="mb-3 text-sm font-medium text-[#8A2E2B]">
              Nova senha
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
              Crie uma nova senha
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              Escolha uma senha segura para recuperar o acesso ao VPP — Meu
              Padrão.
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

          <form onSubmit={handleNovaSenha} className="space-y-5">
            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-medium text-[#2F2A24]"
              >
                Nova senha
              </label>

              <div className="flex items-center rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] focus-within:border-[#8A2E2B] focus-within:bg-white">
                <input
                  id="senha"
                  name="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Digite sua nova senha"
                  className="min-h-11 min-w-0 flex-1 bg-transparent px-4 text-sm text-[#2F2A24] outline-none placeholder:text-[#8A7A68]"
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
            </div>

            <div>
              <label
                htmlFor="confirmarSenha"
                className="mb-2 block text-sm font-medium text-[#2F2A24]"
              >
                Confirmar nova senha
              </label>

              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type={mostrarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                placeholder="Digite novamente a nova senha"
                className="min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                autoComplete="new-password"
                disabled={carregando}
                required
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="min-h-11 w-full rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Salvando nova senha..." : "Salvar nova senha"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
            <p className="text-sm leading-6 text-[#5F564C]">
              Esta página precisa ser aberta pelo link enviado no e-mail de
              recuperação. Depois de alterar a senha, você voltará para o login.
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-[#5F564C]">
            <p>
              Já conseguiu acessar?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#8A2E2B] underline-offset-4 hover:underline"
              >
                Entrar agora
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#8A7A68]">
          App = consciência. Processo terapêutico = transformação.
        </p>
      </section>
    </main>
  );
}