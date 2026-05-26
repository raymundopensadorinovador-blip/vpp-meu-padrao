"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

type Encaminhamento = {
  id: string;
  destination_type: string;
  destination_name: string | null;
  destination_contact: string | null;
  patient_name_snapshot: string;
  patient_email_snapshot: string | null;
  reason: string;
  clinical_summary: string;
  observations: string | null;
  therapist_name_snapshot: string;
  therapist_location: string | null;
  therapist_registry: string | null;
  stamp_text: string | null;
  signature_text: string | null;
  referral_date: string;
  status: string;
  created_at: string;
};

const destinos: Record<string, string> = {
  medico_clinico: "Médico clínico",
  psiquiatra: "Psiquiatra",
  psicologo: "Psicólogo",
  neurologista: "Neurologista",
  outro: "Outro",
};

export default function DetalheEncaminhamentoPage() {
  const router = useRouter();
  const params = useParams();

  const pacienteId = String(params.id || "");
  const encaminhamentoId = String(params.encaminhamentoId || "");

  const [carregando, setCarregando] = useState(true);
  const [encaminhamento, setEncaminhamento] =
    useState<Encaminhamento | null>(null);
    const [excluindo, setExcluindo] = useState(false);
    const [mensagemCopiada, setMensagemCopiada] = useState("");
    const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarEncaminhamento() {
      const { data: usuarioAtual, error: erroUsuario } =
        await supabase.auth.getUser();

      if (erroUsuario || !usuarioAtual.user) {
        router.replace("/login");
        return;
      }

      const { data: perfil, error: erroPerfil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", usuarioAtual.user.id)
        .maybeSingle();

      if (erroPerfil || !perfil) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const role = String(perfil.role || "").trim() as Role;

      if (role !== "terapeuta") {
        router.replace("/painel");
        return;
      }

      const { data: vinculo } = await supabase
        .from("therapist_patient_links")
        .select("id")
        .eq("therapist_id", usuarioAtual.user.id)
        .eq("patient_id", pacienteId)
        .eq("status", "ativo")
        .maybeSingle();

      if (!vinculo) {
        setErro("Paciente não vinculado a este terapeuta.");
        setEncaminhamento(null);
        setCarregando(false);
        return;
      }

      const { data, error } = await supabase
        .from("clinical_referrals")
        .select(
          "id, destination_type, destination_name, destination_contact, patient_name_snapshot, patient_email_snapshot, reason, clinical_summary, observations, therapist_name_snapshot, therapist_location, therapist_registry, stamp_text, signature_text, referral_date, status, created_at"
        )
        .eq("id", encaminhamentoId)
        .eq("patient_id", pacienteId)
        .eq("therapist_id", usuarioAtual.user.id)
        .maybeSingle();

      if (error || !data) {
        setErro("Encaminhamento não encontrado.");
        setEncaminhamento(null);
        setCarregando(false);
        return;
      }

      setEncaminhamento(data as Encaminhamento);
      setCarregando(false);
    }

    carregarEncaminhamento();
  }, [router, pacienteId, encaminhamentoId]);

  function formatarData(data: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(data));
  }

  function imprimirDocumento() {
    window.print();
  }
  function montarTextoEncaminhamento() {
    if (!encaminhamento) return "";
  
    const destino = destinos[encaminhamento.destination_type] || "Outro";
  
    return [
      "Encaminhamento clínico",
      "",
      `Paciente: ${encaminhamento.patient_name_snapshot}`,
      encaminhamento.patient_email_snapshot
        ? `E-mail do paciente: ${encaminhamento.patient_email_snapshot}`
        : "",
      "",
      `Encaminhado para: ${destino}`,
      encaminhamento.destination_name
        ? `Profissional/serviço: ${encaminhamento.destination_name}`
        : "",
      encaminhamento.destination_contact
        ? `Contato/endereço: ${encaminhamento.destination_contact}`
        : "",
      "",
      "Motivo do encaminhamento:",
      encaminhamento.reason,
      "",
      "Resumo clínico:",
      encaminhamento.clinical_summary,
      "",
      encaminhamento.observations
        ? `Observações adicionais:\n${encaminhamento.observations}`
        : "",
      "",
      `Data: ${formatarData(encaminhamento.referral_date)}`,
      "",
      `Profissional responsável: ${encaminhamento.therapist_name_snapshot}`,
      encaminhamento.therapist_registry
        ? `Registro profissional: ${encaminhamento.therapist_registry}`
        : "",
      encaminhamento.therapist_location
        ? `Local de atendimento: ${encaminhamento.therapist_location}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  
  async function copiarTextoEncaminhamento(tipo: "whatsapp" | "email") {
    const texto = montarTextoEncaminhamento();
  
    if (!texto) {
      setErro("Não foi possível montar o texto do encaminhamento.");
      return;
    }
  
    try {
      await navigator.clipboard.writeText(texto);
  
      setMensagemCopiada(
        tipo === "whatsapp"
          ? "Texto para WhatsApp copiado."
          : "Texto para e-mail copiado."
      );
  
      setTimeout(() => {
        setMensagemCopiada("");
      }, 2500);
    } catch {
      setErro("Não foi possível copiar o texto automaticamente.");
    }
  }
  
  function abrirWhatsApp() {
    const texto = montarTextoEncaminhamento();
  
    if (!texto) {
      setErro("Não foi possível montar o texto para WhatsApp.");
      return;
    }
  
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
  async function handleExcluirEncaminhamento() {
    if (!encaminhamento) return;
  
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este encaminhamento? Essa ação não poderá ser desfeita."
    );
  
    if (!confirmar) return;
  
    setErro("");
    setExcluindo(true);
  
    try {
      const { data: usuarioAtual, error: erroUsuario } =
        await supabase.auth.getUser();
  
      if (erroUsuario || !usuarioAtual.user) {
        router.replace("/login");
        return;
      }
  
      const { error } = await supabase
        .from("clinical_referrals")
        .delete()
        .eq("id", encaminhamento.id)
        .eq("patient_id", pacienteId)
        .eq("therapist_id", usuarioAtual.user.id);
  
      if (error) {
        setErro("Não foi possível excluir este encaminhamento.");
        return;
      }
  
      router.replace(`/clinico/pacientes/${pacienteId}`);
    } finally {
      setExcluindo(false);
    }
  }

  
  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando encaminhamento
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando documento...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando o vínculo clínico antes de abrir o documento.
          </p>
        </div>
      </main>
    );
  }

  if (!encaminhamento) {
    return (
        <>
          <style jsx global>{`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
      
              html,
              body {
                background: white !important;
              }
      
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
      
              .documento-encaminhamento {
                font-size: 12px !important;
                line-height: 1.45 !important;
              }
      
              .documento-encaminhamento h2 {
                font-size: 22px !important;
                line-height: 1.2 !important;
              }
      
              .documento-encaminhamento section {
                margin-top: 18px !important;
              }
      
              .documento-encaminhamento p {
                line-height: 1.45 !important;
              }
      
              .documento-encaminhamento .print-compact {
                padding: 12px !important;
              }
      
              .documento-encaminhamento .print-signature {
                margin-top: 28px !important;
              }
            }
          `}</style>
      
          <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] print:bg-white print:px-0 print:py-0">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Encaminhamento não encontrado
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Não foi possível abrir este documento
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              {erro ||
                "O documento pode ter sido removido ou não pertence ao seu vínculo clínico."}
            </p>

            <Link
              href={`/clinico/pacientes/${pacienteId}`}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Voltar ao paciente
            </Link>
          </div>
        </section>
        </main>
  </>
  );
}

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] print:bg-white print:px-0 print:py-0">
      <section className="mx-auto w-full max-w-5xl print:max-w-none">
      {erro && (
  <div className="mb-6 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#8A2E2B] print:hidden">
    {erro}
  </div>
)}
{mensagemCopiada && (
  <div className="mb-6 rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm leading-6 text-[#5F564C] shadow-sm print:hidden">
    {mensagemCopiada}
  </div>
)}
        <div className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm print:hidden sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Encaminhamento clínico
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Documento de encaminhamento
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
                Revise o documento antes de imprimir ou salvar em PDF pelo
                navegador.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
  <button
    type="button"
    onClick={imprimirDocumento}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
  >
    Imprimir / Salvar PDF
  </button>
  <button
  type="button"
  onClick={abrirWhatsApp}
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-green-200 bg-green-50 px-5 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-100 lg:w-auto"
>
  Abrir WhatsApp
</button>
<button
  type="button"
  onClick={() => copiarTextoEncaminhamento("whatsapp")}
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
>
  Copiar texto
</button>
<button
  type="button"
  onClick={() => copiarTextoEncaminhamento("email")}
  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 lg:w-auto"
>
  Copiar para e-mail
</button>
  <Link
    href={`/clinico/pacientes/${pacienteId}/encaminhamentos/${encaminhamento.id}/editar`}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
  >
    Editar
  </Link>

  <button
    type="button"
    onClick={handleExcluirEncaminhamento}
    disabled={excluindo}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#E8C7C0] bg-white px-5 text-sm font-semibold text-[#9A4A3F] shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
  >
    {excluindo ? "Excluindo..." : "Excluir"}
  </button>

  <Link
    href={`/clinico/pacientes/${pacienteId}`}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
  >
    Voltar ao paciente
  </Link>
</div>
          </div>
        </div>

        <article className="documento-encaminhamento rounded-3xl border border-[#E5DDD2] bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
          <header className="border-b border-[#E5DDD2] pb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
              Encaminhamento clínico
            </p>

            <h2 className="mt-3 text-3xl font-bold text-[#2F2A24]">
              Documento de encaminhamento
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Data: {formatarData(encaminhamento.referral_date)}
            </p>
          </header>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="print-compact rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-5 print:bg-white">
              <p className="text-sm font-semibold text-[#8A2E2B]">
                Paciente
              </p>

              <p className="mt-2 text-lg font-semibold text-[#2F2A24]">
                {encaminhamento.patient_name_snapshot}
              </p>

              {encaminhamento.patient_email_snapshot && (
                <p className="mt-1 break-words text-sm text-[#5F564C]">
                  {encaminhamento.patient_email_snapshot}
                </p>
              )}
            </div>

            <div className="print-compact rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-5 print:bg-white">
              <p className="text-sm font-semibold text-[#8A2E2B]">
                Destino
              </p>

              <p className="mt-2 text-lg font-semibold text-[#2F2A24]">
                {destinos[encaminhamento.destination_type] || "Outro"}
              </p>

              {encaminhamento.destination_name && (
                <p className="mt-1 text-sm text-[#5F564C]">
                  {encaminhamento.destination_name}
                </p>
              )}

              {encaminhamento.destination_contact && (
                <p className="mt-1 text-sm text-[#5F564C]">
                  {encaminhamento.destination_contact}
                </p>
              )}
            </div>
          </section>

          <section className="mt-8 space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-[#8A2E2B]">
                Motivo do encaminhamento
              </p>

              <p className="whitespace-pre-wrap text-sm leading-7 text-[#2F2A24]">
                {encaminhamento.reason}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-[#8A2E2B]">
                Resumo clínico
              </p>

              <p className="whitespace-pre-wrap text-sm leading-7 text-[#2F2A24]">
                {encaminhamento.clinical_summary}
              </p>
            </div>

            {encaminhamento.observations && (
              <div>
                <p className="mb-2 text-sm font-semibold text-[#8A2E2B]">
                  Observações adicionais
                </p>

                <p className="whitespace-pre-wrap text-sm leading-7 text-[#2F2A24]">
                  {encaminhamento.observations}
                </p>
              </div>
            )}
          </section>

          <section className="mt-10 border-t border-[#E5DDD2] pt-8">
            <p className="text-sm font-semibold text-[#8A2E2B]">
              Dados do profissional
            </p>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[#2F2A24]">
                  {encaminhamento.therapist_name_snapshot}
                </p>

                {encaminhamento.therapist_registry && (
                  <p className="mt-1 text-sm text-[#5F564C]">
                    {encaminhamento.therapist_registry}
                  </p>
                )}

                {encaminhamento.therapist_location && (
                  <p className="mt-1 text-sm text-[#5F564C]">
                    {encaminhamento.therapist_location}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-dashed border-[#D8C7B1] p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-[#8A7A68]">
                  Espaço para carimbo
                </p>

                <p className="mt-4 min-h-12 text-sm font-semibold text-[#2F2A24]">
                  {encaminhamento.stamp_text || ""}
                </p>
              </div>
            </div>

            <div className="print-signature mt-12 max-w-sm">
              <div className="border-t border-[#2F2A24] pt-3 text-center">
                <p className="text-sm font-semibold text-[#2F2A24]">
                  {encaminhamento.signature_text ||
                    encaminhamento.therapist_name_snapshot}
                </p>

                <p className="mt-1 text-xs text-[#8A7A68]">
                  Assinatura do profissional
                </p>
              </div>
            </div>
          </section>

          <footer className="mt-10 border-t border-[#E5DDD2] pt-5">
            <p className="text-xs leading-5 text-[#8A7A68]">
              Documento emitido a partir do VPP — Meu Padrão. Este
              encaminhamento não substitui avaliação médica, psicológica ou
              psiquiátrica quando necessária.
            </p>
          </footer>
        </article>
      </section>
    </main>
  );
}