"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type PerfilProfissional = {
  id: string;
  therapist_id: string;
  professional_name: string | null;
  professional_registry: string | null;
  service_location: string | null;
  stamp_text: string | null;
  signature_text: string | null;
};

export default function PerfilProfissionalPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [therapistId, setTherapistId] = useState("");
  const [perfilId, setPerfilId] = useState<string | null>(null);

  const [professionalName, setProfessionalName] = useState("");
  const [professionalRegistry, setProfessionalRegistry] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [stampText, setStampText] = useState("");
  const [signatureText, setSignatureText] = useState("");

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

      const { data: perfilUsuario, error: erroPerfilUsuario } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", usuarioAtual.user.id)
        .maybeSingle();

      if (erroPerfilUsuario || !perfilUsuario) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const role = String(perfilUsuario.role || "").trim() as Role;

      if (role !== "terapeuta" && role !== "ambos") {
  router.replace("/painel");
  return;
}

      setTherapistId(usuarioAtual.user.id);

      const { data: perfilProfissional } = await supabase
        .from("therapist_professional_profiles")
        .select(
          "id, therapist_id, professional_name, professional_registry, service_location, stamp_text, signature_text"
        )
        .eq("therapist_id", usuarioAtual.user.id)
        .maybeSingle();

      if (perfilProfissional) {
        const perfil = perfilProfissional as PerfilProfissional;

        setPerfilId(perfil.id);
        setProfessionalName(perfil.professional_name || "");
        setProfessionalRegistry(perfil.professional_registry || "");
        setServiceLocation(perfil.service_location || "");
        setStampText(perfil.stamp_text || "");
        setSignatureText(perfil.signature_text || "");
      } else {
        setProfessionalName(perfilUsuario.name || "");
        setSignatureText(perfilUsuario.name || "");
      }

      setCarregando(false);
    }

    carregarPerfil();
  }, [router]);

  async function handleSalvarPerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!therapistId) {
      setErro("Terapeuta não identificado. Faça login novamente.");
      return;
    }

    if (!professionalName.trim()) {
      setErro("Informe o nome profissional.");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        therapist_id: therapistId,
        professional_name: professionalName.trim(),
        professional_registry: professionalRegistry.trim() || null,
        service_location: serviceLocation.trim() || null,
        stamp_text: stampText.trim() || null,
        signature_text: signatureText.trim() || professionalName.trim(),
      };

      if (perfilId) {
        const { error } = await supabase
          .from("therapist_professional_profiles")
          .update(payload)
          .eq("id", perfilId)
          .eq("therapist_id", therapistId);

        if (error) {
          setErro("Não foi possível atualizar o perfil profissional.");
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("therapist_professional_profiles")
          .insert(payload)
          .select("id")
          .single();

        if (error || !data) {
          setErro("Não foi possível criar o perfil profissional.");
          return;
        }

        setPerfilId(data.id);
      }

      setSucesso("Perfil profissional salvo com sucesso.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando perfil
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando dados profissionais...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos preparando seus dados para emissão de documentos clínicos.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Perfil profissional
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Dados para documentos clínicos
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
  Preencha os dados que serão usados automaticamente em encaminhamentos
  clínicos, assinatura, local de atendimento e identificação profissional.
</p>
            </div>

            <Link
              href="/clinico/painel"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
            >
              Voltar ao painel clínico
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
                Nome profissional
              </span>

              <input
                type="text"
                value={professionalName}
                onChange={(event) => setProfessionalName(event.target.value)}
                placeholder="Nome que aparecerá nos documentos"
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Registro profissional
              </span>

              <input
                type="text"
                value={professionalRegistry}
                onChange={(event) =>
                  setProfessionalRegistry(event.target.value)
                }
                placeholder="Ex: CRP, formação, registro ou identificação profissional"
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Local de atendimento / consultório
              </span>

              <input
                type="text"
                value={serviceLocation}
                onChange={(event) => setServiceLocation(event.target.value)}
                placeholder="Endereço, cidade, consultório, clínica ou local de atendimento"
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                Informação para carimbo
                </span>

                <input
                  type="text"
                  value={stampText}
                  onChange={(event) => setStampText(event.target.value)}
                  placeholder="Opcional: informação que aparecerá no espaço do carimbo"
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Assinatura
                </span>

                <input
                  type="text"
                  value={signatureText}
                  onChange={(event) => setSignatureText(event.target.value)}
                  placeholder="Nome que aparecerá na assinatura"
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                />
              </label>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
          <p className="text-sm leading-6 text-[#5F564C]">
  Esses dados serão usados como preenchimento automático em novos
  encaminhamentos clínicos. Cada documento ainda poderá ser revisado e
  editado individualmente antes de imprimir, salvar em PDF ou compartilhar.
</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {salvando ? "Salvando..." : "Salvar perfil profissional"}
            </button>

            <Link
              href="/clinico/painel"
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