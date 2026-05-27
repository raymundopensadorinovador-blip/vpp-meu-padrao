"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

export default function VincularTerapeutaPage() {
  const router = useRouter();

  const [carregandoAcesso, setCarregandoAcesso] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [emailTerapeuta, setEmailTerapeuta] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

  const [erro, setErro] = useState("");
const [sucesso, setSucesso] = useState("");
const [debugPush, setDebugPush] = useState("");

  useEffect(() => {
    async function verificarAcesso() {
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

      if (role !== "paciente" && role !== "ambos") {
        router.replace("/clinico/painel");
        return;
      } 

      setNomeUsuario(perfil.name || "");
      setCarregandoAcesso(false);
    }

    verificarAcesso();
  }, [router]);

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  }

  async function handleVincularTerapeuta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    const emailLimpo = emailTerapeuta.trim().toLowerCase();

    if (!validarEmail(emailLimpo)) {
      setErro("Informe um e-mail válido do terapeuta.");
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase.rpc("link_patient_to_therapist", {
        p_therapist_email: emailLimpo,
      });

      if (error) {
        console.error("ERRO AO VINCULAR TERAPEUTA:", error);
      
        if (error.message.includes("therapist_not_found")) {
          setErro("Não encontramos um terapeuta cadastrado com esse e-mail.");
          return;
        }
      
        if (error.message.includes("cannot_link_to_self")) {
          setErro("Você não pode vincular sua própria conta como terapeuta.");
          return;
        }
      
        if (error.message.includes("only_patient_can_link")) {
          setErro("Esta conta não tem permissão para vincular terapeuta.");
          return;
        }
      
        setErro(
          `Não foi possível vincular este terapeuta. Erro: ${
            error.message || "erro desconhecido"
          }`
        );
        return;
      }
      console.log("INICIANDO BUSCA DO TERAPEUTA PARA PUSH:", emailLimpo);
      setDebugPush("Buscando terapeuta para enviar push...");
      
      const { data: terapeutaEncontrado, error: erroTerapeuta } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .eq("email", emailLimpo)
        .in("role", ["terapeuta", "ambos"])
        .maybeSingle();
      
      console.log("RESULTADO DA BUSCA DO TERAPEUTA PARA PUSH:", {
        terapeutaEncontrado,
        erroTerapeuta,
      });
      
      if (erroTerapeuta) {
        setDebugPush(
          `Vínculo criado, mas houve erro ao buscar terapeuta para push: ${erroTerapeuta.message}`
        );
      } else if (!terapeutaEncontrado?.id) {
        setDebugPush(
          "Vínculo criado, mas o terapeuta não foi encontrado no profiles para envio do push."
        );
      } else {
        setDebugPush("Terapeuta encontrado. Enviando push...");
      
        const { data: sessaoAtual } = await supabase.auth.getSession();
      
        console.log("TOKEN PARA PUSH EXISTE?", {
          temSessao: !!sessaoAtual.session,
          temToken: !!sessaoAtual.session?.access_token,
        });
      
        const respostaPush = await fetch("/api/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessaoAtual.session?.access_token || ""}`,
          },
          body: JSON.stringify({
            userId: terapeutaEncontrado.id,
            title: "Novo paciente vinculado",
            message: nomeUsuario
              ? `${nomeUsuario} vinculou você como terapeuta no VPP — Meu Padrão.`
              : "Um paciente vinculou você como terapeuta no VPP — Meu Padrão.",
            url: "/clinico/painel",
          }),
        });
      
        const retornoPush = await respostaPush.json().catch(() => null);
      
        console.log("RETORNO DO PUSH:", {
          status: respostaPush.status,
          ok: respostaPush.ok,
          retorno: retornoPush,
        });
      
        setDebugPush(
          `Push: status ${respostaPush.status} | ok: ${
            respostaPush.ok ? "sim" : "não"
          } | retorno: ${JSON.stringify(retornoPush)}`
        );
      } 
      setSucesso("Terapeuta vinculado com sucesso.");
      setEmailTerapeuta("");

      // setTimeout(() => {
//   router.push("/painel");
// }, 1200);
    } finally {
      setSalvando(false);
    }
  }

  if (carregandoAcesso) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Verificando acesso
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Carregando vínculo...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando seu perfil antes de abrir esta página.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
        <div className="mb-6 text-center">
          <Link
            href="/painel"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
          >
            Voltar ao painel
          </Link>
        </div>

        <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <p className="mb-3 text-sm font-medium text-[#8A2E2B]">
              Vínculo terapêutico
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
              Vincular terapeuta
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
            {nomeUsuario
  ? `${nomeUsuario}, informe o e-mail do terapeuta que terá acesso aos seus registros no VPP — Meu Padrão.`
  : "Informe o e-mail do terapeuta que terá acesso aos seus registros no VPP — Meu Padrão."}
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
{debugPush && (
  <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
    {debugPush}
  </div>
)}
          <form onSubmit={handleVincularTerapeuta} className="space-y-5">
            <div>
              <label
                htmlFor="emailTerapeuta"
                className="mb-2 block text-sm font-medium text-[#2F2A24]"
              >
                E-mail do terapeuta
              </label>

              <input
                id="emailTerapeuta"
                name="emailTerapeuta"
                type="email"
                value={emailTerapeuta}
                onChange={(event) => setEmailTerapeuta(event.target.value)}
                placeholder="terapeuta@exemplo.com"
                className="min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                autoComplete="email"
                disabled={salvando}
                required
              />
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="min-h-11 w-full rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Vinculando..." : "Vincular terapeuta"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
          <p className="text-sm leading-6 text-[#5F564C]">
  O terapeuta só poderá acessar seus dados se estiver cadastrado como
  terapeuta na plataforma e se este vínculo estiver ativo. Esse vínculo
  pode ser encerrado quando necessário, preservando o cuidado com suas
  informações.
</p>
          </div>
        </div>
      </section>
    </main>
  );
}