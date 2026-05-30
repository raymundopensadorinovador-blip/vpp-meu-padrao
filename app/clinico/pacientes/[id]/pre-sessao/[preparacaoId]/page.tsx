"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type PacienteDetalhe = {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  linked_at: string;
};

type PreparacaoSessao = {
  id: string;
  therapist_id: string;
  patient_id: string;
  title: string;
  session_date: string | null;
  preparation_note: string | null;
  focus_points: string | null;
  questions_to_explore: string | null;
  risk_points: string | null;
  therapist_private_notes: string | null;
  status: "rascunho" | "preparada" | "realizada" | "arquivada";
  created_at: string;
  updated_at: string;
};

function formatarDataHora(data: string | null) {
  if (!data) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

function formatarData(data: string | null) {
  if (!data) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
}

function normalizarStatus(status: PreparacaoSessao["status"]) {
  const mapa: Record<PreparacaoSessao["status"], string> = {
    rascunho: "Rascunho",
    preparada: "Preparada",
    realizada: "Realizada",
    arquivada: "Arquivada",
  };

  return mapa[status] || status;
}

function CampoLeitura({
  titulo,
  texto,
  destaque = false,
}: {
  titulo: string;
  texto: string | null;
  destaque?: boolean;
}) {
  return (
    <article
      className={`min-w-0 rounded-2xl border p-4 ${
        destaque
          ? "border-[#D8C7B1] bg-[#FFF8EE]"
          : "border-[#E5DDD2] bg-[#F7F3EC]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
        {titulo}
      </p>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#2F2A24] [overflow-wrap:anywhere]">
        {texto?.trim() || "Não informado."}
      </p>
    </article>
  );
}

export default function PreparacaoDetalhePage() {
  const router = useRouter();
  const params = useParams();

  const pacienteId = String(params.id || "");
  const preparacaoId = String(params.preparacaoId || "");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null);
  const [preparacao, setPreparacao] = useState<PreparacaoSessao | null>(null);

  useEffect(() => {
    async function carregarPreparacao() {
      setCarregando(true);
      setErro("");

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

      const { data: detalhe, error: erroDetalhe } = await supabase.rpc(
        "get_linked_patient_details",
        {
          p_patient_id: pacienteId,
        }
      );

      if (erroDetalhe) {
        setErro("Não foi possível confirmar o vínculo com este paciente.");
        setCarregando(false);
        return;
      }

      const pacienteEncontrado = Array.isArray(detalhe)
        ? detalhe[0]
        : detalhe;

      if (!pacienteEncontrado) {
        setErro("Paciente não encontrado ou não vinculado a este terapeuta.");
        setCarregando(false);
        return;
      }

      setPaciente(pacienteEncontrado as PacienteDetalhe);

      const { data: preparacaoEncontrada, error: erroPreparacao } =
        await supabase
          .from("clinical_session_preparations")
          .select(
            "id, therapist_id, patient_id, title, session_date, preparation_note, focus_points, questions_to_explore, risk_points, therapist_private_notes, status, created_at, updated_at"
          )
          .eq("id", preparacaoId)
          .eq("patient_id", pacienteId)
          .eq("therapist_id", usuarioAtual.user.id)
          .maybeSingle();

      if (erroPreparacao || !preparacaoEncontrada) {
        setErro("Não foi possível encontrar esta preparação pré-sessão.");
        setCarregando(false);
        return;
      }

      setPreparacao(preparacaoEncontrada as PreparacaoSessao);
      setCarregando(false);
    }

    carregarPreparacao();
  }, [router, pacienteId, preparacaoId]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Abrindo preparação
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando pré-sessão salva...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos carregando o registro escolhido para leitura clínica.
          </p>
        </div>
      </main>
    );
  }

  if (erro || !paciente || !preparacao) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24]">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Preparação indisponível
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Não foi possível abrir este registro
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              {erro || "Esta preparação não foi encontrada."}
            </p>

            <Link
              href={`/clinico/pacientes/${pacienteId}/pre-sessao`}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Voltar para pré-sessão
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            background: white !important;
            padding: 12px !important;
          }

          .print-card {
            box-shadow: none !important;
            border-color: #ddd !important;
            break-inside: avoid;
          }

          section {
            margin-bottom: 12px !important;
          }
        }
      `}</style>

      <section className="mx-auto w-full max-w-5xl">
        <header className="print-card mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Pré-sessão salva
              </p>

              <h1 className="break-words text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl [overflow-wrap:anywhere]">
                {preparacao.title}
              </h1>

              <p className="mt-2 break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                Paciente: {paciente.patient_name}
              </p>

              <p className="mt-1 break-words text-sm leading-6 text-[#5F564C] [overflow-wrap:anywhere]">
                {paciente.patient_email}
              </p>
            </div>

            <div className="no-print flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 lg:w-auto"
              >
                Imprimir
              </button>

              <Link
                href={`/clinico/pacientes/${paciente.patient_id}/pre-sessao`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
              >
                Voltar para pré-sessão
              </Link>
            </div>
          </div>
        </header>

        <section className="print-card mb-6 rounded-3xl border border-[#D8C7B1] bg-[#FFF8EE] p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            Dados do registro
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Informações da preparação
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Sessão
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#2F2A24]">
                {formatarDataHora(preparacao.session_date)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Status
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#2F2A24]">
                {normalizarStatus(preparacao.status)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Criada em
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#2F2A24]">
                {formatarData(preparacao.created_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8C7B1] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
                Atualizada em
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#2F2A24]">
                {formatarData(preparacao.updated_at)}
              </p>
            </div>
          </div>
        </section>

        <section className="print-card mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
            Conteúdo clínico da pré-sessão
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Registro usado para orientar a condução
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <CampoLeitura
              titulo="Foco clínico da sessão"
              texto={preparacao.focus_points}
              destaque
            />

            <CampoLeitura
              titulo="Perguntas para explorar"
              texto={preparacao.questions_to_explore}
            />

            <CampoLeitura
              titulo="Pontos de risco ou cuidado"
              texto={preparacao.risk_points}
            />

            <CampoLeitura
              titulo="Observação geral da preparação"
              texto={preparacao.preparation_note}
            />
          </div>

          <div className="mt-4">
            <CampoLeitura
              titulo="Notas privadas do terapeuta"
              texto={preparacao.therapist_private_notes}
              destaque
            />
          </div>
        </section>

        <section className="print-card mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-sm font-medium text-[#8A7A68]">
            Uso clínico
          </p>

          <h2 className="text-xl font-semibold text-[#2F2A24]">
            Como usar este registro na continuidade
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                Comparar com a sessão atual
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Observe se os focos anteriores continuam ativos, se perderam
                força ou se deram origem a novos temas clínicos.
              </p>
            </article>

            <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                Retomar perguntas abertas
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Verifique se alguma pergunta preparada anteriormente ainda pode
                orientar a escuta da próxima sessão.
              </p>
            </article>

            <article className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                Acompanhar continuidade
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Use o histórico para perceber avanço, repetição, mudança de
                foco e pontos que precisam de novo cuidado.
              </p>
            </article>
          </div>
        </section>

        <div className="no-print flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/clinico/pacientes/${paciente.patient_id}/pre-sessao`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
          >
            Voltar para pré-sessão
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
          >
            Imprimir este registro
          </button>
        </div>
      </section>
    </main>
  );
}