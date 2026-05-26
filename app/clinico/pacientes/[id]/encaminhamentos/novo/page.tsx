"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type PacienteDetalhe = {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  linked_at: string;
};

type PerfilProfissional = {
    professional_name: string | null;
    professional_registry: string | null;
    service_location: string | null;
    stamp_text: string | null;
    signature_text: string | null;
  };

type DestinationType =
  | "medico_clinico"
  | "psiquiatra"
  | "psicologo"
  | "neurologista"
  | "outro";

const destinos = [
  { value: "medico_clinico", label: "Médico clínico" },
  { value: "psiquiatra", label: "Psiquiatra" },
  { value: "psicologo", label: "Psicólogo" },
  { value: "neurologista", label: "Neurologista" },
  { value: "outro", label: "Outro" },
] as const;

export default function NovoEncaminhamentoPage() {
  const router = useRouter();
  const params = useParams();

  const pacienteId = String(params.id || "");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [terapeutaId, setTerapeutaId] = useState("");
  const [nomeTerapeuta, setNomeTerapeuta] = useState("");
  const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null);

  const [destinationType, setDestinationType] =
    useState<DestinationType>("medico_clinico");
  const [destinationName, setDestinationName] = useState("");
  const [destinationContact, setDestinationContact] = useState("");

  const [reason, setReason] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [observations, setObservations] = useState("");

  const [therapistLocation, setTherapistLocation] = useState("");
  const [therapistRegistry, setTherapistRegistry] = useState("");
  const [stampText, setStampText] = useState("");
  const [signatureText, setSignatureText] = useState("");

  const [referralDate, setReferralDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregarDados() {
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

      if (role !== "terapeuta" && role !== "ambos") {
  router.replace("/painel");
  return;
}

      const { data: detalhe, error: erroDetalhe } = await supabase.rpc(
        "get_linked_patient_details",
        {
          p_patient_id: pacienteId,
        }
      );

      if (erroDetalhe) {
        setErro("Não foi possível carregar o paciente vinculado.");
        setPaciente(null);
        setCarregando(false);
        return;
      }

      const pacienteEncontrado = Array.isArray(detalhe)
        ? detalhe[0]
        : detalhe;

      if (!pacienteEncontrado) {
        setErro("Paciente não encontrado ou não vinculado a este terapeuta.");
        setPaciente(null);
        setCarregando(false);
        return;
      }

      setTerapeutaId(usuarioAtual.user.id);

      const { data: perfilProfissional } = await supabase
        .from("therapist_professional_profiles")
        .select(
          "professional_name, professional_registry, service_location, stamp_text, signature_text"
        )
        .eq("therapist_id", usuarioAtual.user.id)
        .maybeSingle();
      
      const dadosProfissionais = perfilProfissional as PerfilProfissional | null;
      
      const nomeProfissional =
        dadosProfissionais?.professional_name || perfil.name || "Terapeuta";
      
      setNomeTerapeuta(nomeProfissional);
      setTherapistRegistry(dadosProfissionais?.professional_registry || "");
      setTherapistLocation(dadosProfissionais?.service_location || "");
      setStampText(dadosProfissionais?.stamp_text || "");
      setSignatureText(dadosProfissionais?.signature_text || nomeProfissional);
      
      setPaciente({
        patient_id: pacienteEncontrado.patient_id,
        patient_name: pacienteEncontrado.patient_name,
        patient_email: pacienteEncontrado.patient_email,
        linked_at: pacienteEncontrado.linked_at,
      });
      
      setCarregando(false); 
    }

    carregarDados();
  }, [router, pacienteId]);

  function getDestinoLabel(tipo: DestinationType) {
    return destinos.find((destino) => destino.value === tipo)?.label || "Outro";
  }

  async function handleSalvarEncaminhamento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!paciente || !terapeutaId) {
      setErro("Paciente ou terapeuta não identificado.");
      return;
    }

    if (!reason.trim() || !clinicalSummary.trim()) {
      setErro("Preencha o motivo do encaminhamento e o resumo clínico.");
      return;
    }

    if (!referralDate) {
      setErro("Informe a data do encaminhamento.");
      return;
    }

    setSalvando(true);

    try {
      const { data, error } = await supabase
        .from("clinical_referrals")
        .insert({
          therapist_id: terapeutaId,
          patient_id: paciente.patient_id,

          destination_type: destinationType,
          destination_name: destinationName.trim() || null,
          destination_contact: destinationContact.trim() || null,

          patient_name_snapshot: paciente.patient_name,
          patient_email_snapshot: paciente.patient_email || null,

          reason: reason.trim(),
          clinical_summary: clinicalSummary.trim(),
          observations: observations.trim() || null,

          therapist_name_snapshot: nomeTerapeuta,
          therapist_location: therapistLocation.trim() || null,
          therapist_registry: therapistRegistry.trim() || null,
          stamp_text: stampText.trim() || null,
          signature_text: signatureText.trim() || nomeTerapeuta,

          referral_date: referralDate,
          status: "rascunho",
        })
        .select("id")
        .single();

      if (error || !data) {
        setErro("Não foi possível salvar o encaminhamento.");
        return;
      }

      setSucesso("Encaminhamento salvo com sucesso.");

      setTimeout(() => {
        router.push(
          `/clinico/pacientes/${paciente.patient_id}/encaminhamentos/${data.id}`
        );
      }, 1000);
    } finally {
      setSalvando(false);
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
            Preparando formulário...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando o vínculo clínico antes de abrir esta página.
          </p>
        </div>
      </main>
    );
  }

  if (!paciente) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Paciente não encontrado
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Não foi possível criar o encaminhamento
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              {erro ||
                "O paciente pode não estar vinculado a você ou o vínculo pode ter sido removido."}
            </p>

            <Link
              href="/clinico/painel"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Voltar ao painel clínico
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Encaminhamento clínico
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Novo encaminhamento
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
  Crie um encaminhamento para {paciente.patient_name}. O documento será
  salvo para consulta, edição, impressão ou salvamento em PDF.
</p>
            </div>

            <Link
              href={`/clinico/pacientes/${paciente.patient_id}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
            >
              Voltar ao paciente
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
          onSubmit={handleSalvarEncaminhamento}
          className="space-y-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7"
        >
          <section className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
            <p className="mb-3 text-sm font-semibold text-[#8A2E2B]">
              Dados do paciente
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-medium text-[#8A7A68]">Paciente</p>
                <p className="mt-1 text-sm font-semibold text-[#2F2A24]">
                  {paciente.patient_name}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-medium text-[#8A7A68]">E-mail</p>
                <p className="mt-1 break-words text-sm font-semibold text-[#2F2A24]">
                  {paciente.patient_email || "Não informado"}
                </p>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-semibold text-[#8A2E2B]">
              Destino do encaminhamento
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Encaminhar para
                </span>

                <select
                  value={destinationType}
                  onChange={(event) =>
                    setDestinationType(event.target.value as DestinationType)
                  }
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                  required
                >
                  {destinos.map((destino) => (
                    <option key={destino.value} value={destino.value}>
                      {destino.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Nome do profissional ou serviço
                </span>

                <input
                  type="text"
                  value={destinationName}
                  onChange={(event) => setDestinationName(event.target.value)}
                  placeholder={`Ex: ${getDestinoLabel(destinationType)} de referência`}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Contato ou endereço do destino
                </span>

                <input
                  type="text"
                  value={destinationContact}
                  onChange={(event) => setDestinationContact(event.target.value)}
                  placeholder="Telefone, e-mail, clínica, UBS, hospital ou endereço"
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                />
              </label>
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-semibold text-[#8A2E2B]">
              Conteúdo clínico do encaminhamento
            </p>

            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Motivo do encaminhamento
                </span>

                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ex: avaliação psiquiátrica, investigação clínica, acompanhamento complementar..."
                  className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Resumo clínico
                </span>

                <textarea
                  value={clinicalSummary}
                  onChange={(event) => setClinicalSummary(event.target.value)}
                  placeholder="Descreva de forma objetiva a demanda apresentada, sinais observados e pontos relevantes para o profissional de destino."
                  className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Observações adicionais
                </span>

                <textarea
                  value={observations}
                  onChange={(event) => setObservations(event.target.value)}
                  placeholder="Campo opcional para observações complementares."
                  className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                />
              </label>
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-semibold text-[#8A2E2B]">
              Dados do terapeuta no documento
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Nome do terapeuta
                </span>

                <input
                  type="text"
                  value={nomeTerapeuta}
                  onChange={(event) => setNomeTerapeuta(event.target.value)}
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
                  value={therapistRegistry}
                  onChange={(event) => setTherapistRegistry(event.target.value)}
                  placeholder="Ex: CRP, registro, formação ou identificação profissional"
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Local de atendimento / consultório
                </span>

                <input
                  type="text"
                  value={therapistLocation}
                  onChange={(event) => setTherapistLocation(event.target.value)}
                  placeholder="Endereço, nome do consultório, cidade ou local de atendimento"
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                />
              </label>

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

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Data do encaminhamento
                </span>

                <input
                  type="date"
                  value={referralDate}
                  onChange={(event) => setReferralDate(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                  required
                />
              </label>
            </div>
          </section>

          <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
          <p className="text-sm leading-6 text-[#5F564C]">
  Revise as informações antes de salvar. O encaminhamento ficará disponível
  na página do paciente para consulta, edição, impressão ou salvamento em PDF.
</p> 
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {salvando ? "Salvando..." : "Salvar encaminhamento"}
            </button>

            <Link
              href={`/clinico/pacientes/${paciente.patient_id}`}
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