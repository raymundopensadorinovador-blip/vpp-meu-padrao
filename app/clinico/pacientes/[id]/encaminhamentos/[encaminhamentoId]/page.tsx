"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

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

      if (role !== "terapeuta" && role !== "ambos") {
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
        ? `Profissional ou serviço: ${encaminhamento.destination_name}`
        : "",
      encaminhamento.destination_contact
        ? `Contato ou endereço: ${encaminhamento.destination_contact}`
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
          ? "Texto copiado para envio pelo WhatsApp."
          : "Texto copiado para envio por e-mail."
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
  <>
    <style jsx global>{`
      @media print {
        @page {
          size: A4;
          margin: 8mm;
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
          width: 100% !important;
          max-width: 190mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
          color: #111 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 10.5px !important;
          line-height: 1.32 !important;
        }

        .documento-encaminhamento h2 {
          font-size: 17px !important;
          line-height: 1.15 !important;
          margin: 0 !important;
        }

        .documento-encaminhamento h3 {
          font-size: 11px !important;
          margin: 0 0 3px 0 !important;
        }

        .documento-encaminhamento p {
          margin: 0 !important;
          line-height: 1.32 !important;
        }

        .print-document-section {
          margin-top: 8px !important;
        }

        .print-document-box {
          padding: 6px 8px !important;
          border: 1px solid #ddd !important;
          background: white !important;
        }

        .print-document-text {
          font-size: 10.5px !important;
          line-height: 1.32 !important;
        }

        .print-document-small {
          font-size: 9px !important;
          line-height: 1.25 !important;
        }

        .print-signature {
          margin-top: 18px !important;
        }

        .print-footer {
          margin-top: 10px !important;
          padding-top: 6px !important;
        }

        .print-hidden {
          display: none !important;
        }
      }
    `}</style>

    <main className="min-h-screen bg-[#F6F0E8] px-4 py-6 text-[#2F2A24] print:bg-white print:px-0 print:py-0">
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
        <div className="print-hidden mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm print:hidden sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Encaminhamento clínico
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Documento de encaminhamento
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
  Revise as informações antes de imprimir, salvar em PDF ou compartilhar o
  conteúdo com o paciente ou outro profissional.
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
Copiar para WhatsApp
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
  <header className="border-b border-[#2F2A24] pb-4 print:pb-2">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:flex-row">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A2E2B] print-document-small">
          VPP — Meu Padrão
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#2F2A24]">
          Encaminhamento clínico
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#5F564C] print-document-small">
          Documento para continuidade de cuidado e avaliação complementar.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4 text-sm print-document-box print:w-[52mm]">
        <p className="font-semibold text-[#2F2A24]">Data</p>
        <p className="mt-1 text-[#5F564C]">
          {formatarData(encaminhamento.referral_date)}
        </p>

        <p className="mt-3 font-semibold text-[#2F2A24] print:mt-2">
          Status
        </p>
        <p className="mt-1 capitalize text-[#5F564C]">
          {encaminhamento.status}
        </p>
      </div>
    </div>
  </header>

  <section className="print-document-section mt-6 grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-2">
    <div className="print-document-box rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
        Paciente
      </h3>

      <p className="mt-2 text-base font-semibold text-[#2F2A24] print-document-text">
        {encaminhamento.patient_name_snapshot}
      </p>

      {encaminhamento.patient_email_snapshot && (
        <p className="mt-1 break-words text-sm text-[#5F564C] print-document-small">
          {encaminhamento.patient_email_snapshot}
        </p>
      )}
    </div>

    <div className="print-document-box rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
        Destino
      </h3>

      <p className="mt-2 text-base font-semibold text-[#2F2A24] print-document-text">
        {destinos[encaminhamento.destination_type] || "Outro"}
      </p>

      {encaminhamento.destination_name && (
        <p className="mt-1 text-sm text-[#5F564C] print-document-small">
          {encaminhamento.destination_name}
        </p>
      )}

      {encaminhamento.destination_contact && (
        <p className="mt-1 text-sm text-[#5F564C] print-document-small">
          {encaminhamento.destination_contact}
        </p>
      )}
    </div>
  </section>

  <section className="print-document-section mt-6 rounded-2xl border border-[#E5DDD2] bg-white p-5 print-document-box">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
      Motivo do encaminhamento
    </h3>

    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#2F2A24] print-document-text">
      {encaminhamento.reason}
    </p>
  </section>

  <section className="print-document-section mt-5 rounded-2xl border border-[#E5DDD2] bg-white p-5 print-document-box">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
      Resumo clínico
    </h3>

    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#2F2A24] print-document-text">
      {encaminhamento.clinical_summary}
    </p>
  </section>

  {encaminhamento.observations && (
    <section className="print-document-section mt-5 rounded-2xl border border-[#E5DDD2] bg-white p-5 print-document-box">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
        Observações adicionais
      </h3>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#2F2A24] print-document-text">
        {encaminhamento.observations}
      </p>
    </section>
  )}

  <section className="print-document-section mt-6 border-t border-[#2F2A24] pt-5 print:pt-3">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8A2E2B]">
      Profissional responsável
    </h3>

    <div className="mt-4 grid gap-5 md:grid-cols-[1fr_180px] print:mt-2 print:grid-cols-[1fr_48mm] print:gap-3">
      <div>
        <p className="text-sm font-semibold text-[#2F2A24] print-document-text">
          {encaminhamento.therapist_name_snapshot}
        </p>

        {encaminhamento.therapist_registry && (
          <p className="mt-1 text-sm text-[#5F564C] print-document-small">
            {encaminhamento.therapist_registry}
          </p>
        )}

        {encaminhamento.therapist_location && (
          <p className="mt-1 text-sm text-[#5F564C] print-document-small">
            {encaminhamento.therapist_location}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-[#D8C7B1] p-4 text-center print-document-box">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8A7A68] print-document-small">
          Carimbo
        </p>

        <p className="mt-3 min-h-10 text-sm font-semibold text-[#2F2A24] print:mt-2 print:min-h-8 print-document-small">
          {encaminhamento.stamp_text || ""}
        </p>
      </div>
    </div>

    <div className="print-signature mt-10 max-w-sm print:max-w-[70mm]">
      <div className="border-t border-[#2F2A24] pt-3 text-center print:pt-2">
        <p className="text-sm font-semibold text-[#2F2A24] print-document-text">
          {encaminhamento.signature_text ||
            encaminhamento.therapist_name_snapshot}
        </p>

        <p className="mt-1 text-xs text-[#8A7A68] print-document-small">
          Assinatura do profissional
        </p>
      </div>
    </div>
  </section>

  <footer className="print-footer mt-8 border-t border-[#E5DDD2] pt-4">
    <p className="text-xs leading-5 text-[#8A7A68] print-document-small">
      Documento emitido a partir do VPP — Meu Padrão. Este encaminhamento tem
      finalidade informativa e de continuidade do cuidado, não substituindo
      avaliação médica, psicológica ou psiquiátrica quando indicada.
    </p>
  </footer>
</article> 
      </section>
      </main>
  </>
);
}