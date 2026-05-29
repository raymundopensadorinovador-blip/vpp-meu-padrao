"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

type PerfilUsuario = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
};

export default function PerfilPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [nome, setNome] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      const { data: usuarioAtual, error: erroUsuario } =
        await supabase.auth.getUser();

      if (erroUsuario || !usuarioAtual.user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .eq("id", usuarioAtual.user.id)
        .maybeSingle();

      if (error || !data) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const perfilEncontrado = data as PerfilUsuario;

      setPerfil(perfilEncontrado);
      setNome(perfilEncontrado.name || "");
      setCarregando(false);
    }

    carregarPerfil();
  }, [router]);

  async function handleSalvarPerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!perfil) {
      setErro("Perfil não identificado. Faça login novamente.");
      return;
    }

    if (!nome.trim()) {
      setErro("Informe seu nome.");
      return;
    }

    if (nome.trim().length < 2) {
      setErro("O nome precisa ter pelo menos 2 caracteres.");
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: nome.trim(),
        })
        .eq("id", perfil.id);

      if (error) {
        setErro("Não foi possível atualizar o perfil.");
        return;
      }

      setPerfil({
        ...perfil,
        name: nome.trim(),
      });

      setSucesso("Perfil atualizado com sucesso.");
    } finally {
      setSalvando(false);
    }
  }

  function getDestinoVoltar() {
    if (!perfil) return "/";

    return perfil.role === "terapeuta" ? "/clinico/painel" : "/painel";
  }

  function getTextoVoltar() {
    if (!perfil) return "Voltar";

    return perfil.role === "terapeuta"
      ? "Voltar ao painel clínico"
      : "Voltar ao meu painel";
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando perfil
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando seus dados...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos carregando as informações da sua conta.
          </p>
        </div>
      </main>
    );
  }

  if (!perfil) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Perfil não encontrado
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Não foi possível abrir seu perfil
          </h1>

          <Link
            href="/login"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Voltar ao login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-3xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Meu perfil
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Dados da conta
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F564C]">
  Edite seu nome de exibição no VPP — Meu Padrão. O e-mail e o
  tipo de conta permanecem protegidos nesta etapa por estarem ligados
  ao acesso e às permissões da conta.
</p> 
            </div>

            <Link
              href={getDestinoVoltar()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              {getTextoVoltar()}
            </Link>
          </div>
        </header>

        {erro && (
          <div className="mb-6 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B]">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-6 rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm leading-6 text-[#5F564C] shadow-sm">
            {sucesso}
          </div>
        )}

        <form
          onSubmit={handleSalvarPerfil}
          className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Nome
              </span>

              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Seu nome"
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                autoComplete="name"
                disabled={salvando}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                <p className="text-xs font-medium text-[#8A7A68]">E-mail</p>

                <p className="mt-1 break-words text-sm font-semibold text-[#2F2A24]">
                  {perfil.email || "Não informado"}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#8A7A68]">
                A alteração de e-mail será tratada em uma etapa própria.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
                <p className="text-xs font-medium text-[#8A7A68]">
                  Tipo de conta
                </p>

                <p className="mt-1 text-sm font-semibold capitalize text-[#2F2A24]">
                  {perfil.role}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#8A7A68]">
                Este campo define as permissões da conta e não pode ser alterado aqui.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
          <p className="text-sm leading-6 text-[#5F564C]">
  Use este espaço para corrigir ou atualizar seu nome de exibição. O e-mail
  e o tipo de conta permanecem bloqueados nesta etapa porque estão ligados ao
  login, à segurança e às permissões de acesso.
</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>

            <Link
              href={getDestinoVoltar()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}