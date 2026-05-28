"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type AnamneseResumo = {
  id: string;
  patient_id: string;
  status: string;
  current_version: number;
  first_submitted_at: string | null;
  last_submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

type VersaoAnamnese = {
  id: string;
  anamnesis_id: string;
  patient_id: string;
  version_number: number;
  personal_context: Record<string, unknown>;
  main_complaint: Record<string, unknown>;
  emotional_history: Record<string, unknown>;
  family_history: Record<string, unknown>;
  relationships: Record<string, unknown>;
  routine_and_body: Record<string, unknown>;
  symptoms_and_risks: Record<string, unknown>;
  therapeutic_history: Record<string, unknown>;
  perceived_patterns: Record<string, unknown>;
  trusted_contact: Record<string, unknown>;
  final_notes: Record<string, unknown>;
  full_payload: Record<string, unknown>;
  submitted_at: string;
  created_at: string;
};

type PacienteBasico = {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  linked_at: string;
};

function texto(valor: unknown) {
  if (typeof valor !== "string") return "";
  return valor.trim();
}

function simNao(valor: unknown) {
  return valor === true ? "Sim" : "Não";
}

function formatarData(data: string | null) {
  if (!data) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

type CampoLeituraProps = {
  titulo: string;
  valor: unknown;
  destaque?: boolean;
};

function CampoLeitura({ titulo, valor, destaque }: CampoLeituraProps) {
  const conteudo =
    typeof valor === "boolean" ? simNao(valor) : texto(valor) || "Não informado";

  return (
    <div
    className={`min-w-0 rounded-2xl border p-4 ${
      destaque
        ? "border-[#D8C7B1] bg-[#FFF8EE]"
        : "border-[#E5DDD2] bg-[#F7F3EC]"
    }`}
  >
    <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A68]">
      {titulo}
    </p>
  
    <div className="mt-2 max-h-56 overflow-y-auto pr-1">
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#2F2A24] [overflow-wrap:anywhere]">
        {conteudo}
      </p>
    </div>
  </div>   
  );
}

type SecaoLeituraProps = {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
};

function SecaoLeitura({ titulo, subtitulo, children }: SecaoLeituraProps) {
  return (
    <section className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-[#8A2E2B]">{titulo}</p>
        <p className="text-sm leading-6 text-[#5F564C]">{subtitulo}</p>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export default function ClinicoAnamnesePacientePage() {
  const router = useRouter();
  const params = useParams();

  const pacienteId = String(params.id || "");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [paciente, setPaciente] = useState<PacienteBasico | null>(null);
  const [anamnese, setAnamnese] = useState<AnamneseResumo | null>(null);
  const [versoes, setVersoes] = useState<VersaoAnamnese[]>([]);
  const [versaoSelecionada, setVersaoSelecionada] =
    useState<VersaoAnamnese | null>(null);

  useEffect(() => {
    async function carregarAnamnese() {
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

      setPaciente({
        patient_id: pacienteEncontrado.patient_id,
        patient_name: pacienteEncontrado.patient_name,
        patient_email: pacienteEncontrado.patient_email,
        linked_at: pacienteEncontrado.linked_at,
      });

      const { data: anamneseEncontrada, error: erroAnamnese } = await supabase
        .from("patient_anamneses")
        .select(
          "id, patient_id, status, current_version, first_submitted_at, last_submitted_at, created_at, updated_at"
        )
        .eq("patient_id", pacienteId)
        .maybeSingle();

      if (erroAnamnese) {
        setErro("Não foi possível carregar a anamnese deste paciente.");
        setCarregando(false);
        return;
      }

      if (!anamneseEncontrada) {
        setAnamnese(null);
        setVersoes([]);
        setVersaoSelecionada(null);
        setCarregando(false);
        return;
      }

      setAnamnese(anamneseEncontrada as AnamneseResumo);

      const { data: versoesEncontradas, error: erroVersoes } = await supabase
        .from("patient_anamnesis_versions")
        .select(
          "id, anamnesis_id, patient_id, version_number, personal_context, main_complaint, emotional_history, family_history, relationships, routine_and_body, symptoms_and_risks, therapeutic_history, perceived_patterns, trusted_contact, final_notes, full_payload, submitted_at, created_at"
        )
        .eq("patient_id", pacienteId)
        .order("version_number", { ascending: false });

      if (erroVersoes) {
        setErro("Não foi possível carregar as versões da anamnese.");
        setCarregando(false);
        return;
      }

      const listaVersoes = (versoesEncontradas || []) as VersaoAnamnese[];

      setVersoes(listaVersoes);
      setVersaoSelecionada(listaVersoes[0] || null);
      setCarregando(false);
    }

    carregarAnamnese();
  }, [router, pacienteId]);

  const leituraAtual = useMemo(() => {
    if (!versaoSelecionada) return null;

    return {
      personal: versaoSelecionada.personal_context || {},
      queixa: versaoSelecionada.main_complaint || {},
      emocional: versaoSelecionada.emotional_history || {},
      familia: versaoSelecionada.family_history || {},
      relacoes: versaoSelecionada.relationships || {},
      rotina: versaoSelecionada.routine_and_body || {},
      riscos: versaoSelecionada.symptoms_and_risks || {},
      historico: versaoSelecionada.therapeutic_history || {},
      padroes: versaoSelecionada.perceived_patterns || {},
      contato: versaoSelecionada.trusted_contact || {},
      fechamento: versaoSelecionada.final_notes || {},
    };
  }, [versaoSelecionada]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando anamnese
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando história guiada...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando o vínculo clínico antes de abrir os dados.
          </p>
        </div>
      </main>
    );
  }

  if (erro || !paciente) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24]">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Não foi possível abrir a anamnese
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Acesso não disponível
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

  if (!anamnese || !versaoSelecionada || !leituraAtual) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-4xl">
          <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
              Anamnese do paciente
            </p>

            <h1 className="text-2xl font-semibold text-[#2F2A24]">
              {paciente.patient_name}
            </h1>

            <p className="mt-2 break-words text-sm leading-6 text-[#5F564C]">
              {paciente.patient_email}
            </p>
          </header>

          <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-[#2F2A24]">
              O paciente ainda não enviou a anamnese.
            </p>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
              Quando o paciente preencher e enviar a anamnese guiada, ela
              aparecerá aqui em blocos clínicos organizados para leitura.
            </p>

            <Link
              href={`/clinico/pacientes/${paciente.patient_id}`}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Voltar ao paciente
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Anamnese do paciente
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                {paciente.patient_name}
              </h1>

              <p className="mt-2 break-words text-sm leading-6 text-[#5F564C]">
                {paciente.patient_email}
              </p>

              <p className="mt-3 text-sm leading-6 text-[#5F564C]">
                Leitura clínica da anamnese guiada enviada pelo paciente. Use
                como material de contexto, não como diagnóstico automático.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4 lg:w-80">
              <p className="text-sm font-semibold text-[#2F2A24]">
                Status da anamnese
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Status:{" "}
                <span className="font-semibold text-[#8A2E2B]">
                  {anamnese.status}
                </span>
              </p>

              <p className="text-sm leading-6 text-[#5F564C]">
  Versão atual: {anamnese.current_version}
</p>

<p className="text-sm leading-6 text-[#5F564C]">
  Versão aberta:{" "}
  <span className="font-semibold text-[#8A2E2B]">
    {versaoSelecionada.version_number}
  </span>
</p>

<p className="text-sm leading-6 text-[#5F564C]">
  Envio da versão aberta: {formatarData(versaoSelecionada.submitted_at)}
</p>

<p className="text-sm leading-6 text-[#5F564C]">
  Último envio: {formatarData(anamnese.last_submitted_at)}
</p>  
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/clinico/pacientes/${paciente.patient_id}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Voltar ao paciente
            </Link>

            <Link
              href="/clinico/painel"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
            >
              Painel clínico
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="text-sm font-semibold text-[#2F2A24]">
        Histórico de versões
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        Cada envio da anamnese fica preservado. Abra uma versão para comparar
        como o paciente foi atualizando sua história ao longo do tempo.
      </p>
    </div>

    <span className="w-fit rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-3 py-2 text-xs font-semibold text-[#5F564C]">
      {versoes.length} versão{versoes.length === 1 ? "" : "ões"}
    </span>
  </div>

  <div className="max-h-44 overflow-y-auto pr-1">
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {versoes.map((versao) => (
        <button
          key={versao.id}
          type="button"
          onClick={() => setVersaoSelecionada(versao)}
          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition sm:w-auto ${
            versaoSelecionada.id === versao.id
              ? "border-[#8A2E2B] bg-[#8A2E2B] text-white"
              : "border-[#D8C7B1] bg-white text-[#5F564C] hover:bg-[#FFF8EE]"
          }`}
        >
          <span className="block">
            Versão {versao.version_number}
          </span>

          <span
            className={`mt-1 block text-xs ${
              versaoSelecionada.id === versao.id
                ? "text-white/80"
                : "text-[#8A7A68]"
            }`}
          >
            Enviada em {formatarData(versao.submitted_at)}
          </span>
        </button>
      ))}
    </div>
  </div>
</section>  

<div className="space-y-6 overflow-hidden">
          <SecaoLeitura
            titulo="01. Contexto atual"
            subtitulo="Informações básicas sobre momento de vida, rotina e contexto de onde o paciente fala."
          >
            <CampoLeitura titulo="Idade" valor={leituraAtual.personal.age} />
            <CampoLeitura titulo="Cidade" valor={leituraAtual.personal.city} />
            <CampoLeitura
              titulo="Ocupação ou rotina principal"
              valor={leituraAtual.personal.occupation}
            />
            <CampoLeitura
              titulo="Contexto de vida"
              valor={leituraAtual.personal.living_context}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="02. Motivo da busca"
            subtitulo="Ponto de entrada subjetivo: o que fez o paciente procurar cuidado agora."
          >
            <CampoLeitura
              titulo="O que trouxe o paciente agora"
              valor={leituraAtual.queixa.reason_now}
              destaque
            />
            <CampoLeitura
              titulo="Principal dificuldade atual"
              valor={leituraAtual.queixa.main_difficulty}
              destaque
            />
            <CampoLeitura
              titulo="O que espera compreender"
              valor={leituraAtual.queixa.what_hopes_to_understand}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="03. Vida emocional"
            subtitulo="Estados emocionais recorrentes, fases difíceis e possíveis gatilhos."
          >
            <CampoLeitura
              titulo="Estado emocional recente"
              valor={leituraAtual.emocional.emotional_state}
            />
            <CampoLeitura
              titulo="Sentimentos recorrentes"
              valor={leituraAtual.emocional.recurring_feelings}
            />
            <CampoLeitura
              titulo="Fases difíceis"
              valor={leituraAtual.emocional.difficult_periods}
            />
            <CampoLeitura
              titulo="Gatilhos emocionais"
              valor={leituraAtual.emocional.what_usually_triggers}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="04. Família e marcas"
            subtitulo="Referências familiares, vínculos formativos e repetições percebidas."
          >
            <CampoLeitura
              titulo="História familiar"
              valor={leituraAtual.familia.family_structure}
            />
            <CampoLeitura
              titulo="Relações importantes na formação"
              valor={leituraAtual.familia.important_relationships}
            />
            <CampoLeitura
              titulo="Marcas da infância ou adolescência"
              valor={leituraAtual.familia.childhood_marks}
            />
            <CampoLeitura
              titulo="Repetições familiares percebidas"
              valor={leituraAtual.familia.family_repetitions}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="05. Relações e vínculos"
            subtitulo="Como o paciente percebe seus vínculos atuais e repetições relacionais."
          >
            <CampoLeitura
              titulo="Relações atuais"
              valor={leituraAtual.relacoes.current_relationships}
            />
            <CampoLeitura
              titulo="Conflitos recorrentes"
              valor={leituraAtual.relacoes.conflicts}
            />
            <CampoLeitura
              titulo="Rede de apoio"
              valor={leituraAtual.relacoes.support_network}
            />
            <CampoLeitura
              titulo="Padrões nas relações"
              valor={leituraAtual.relacoes.repeated_relationship_patterns}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="06. Rotina, corpo e sinais físicos"
            subtitulo="Sono, alimentação, energia, corpo e fatores relevantes para o cuidado."
          >
            <CampoLeitura titulo="Sono" valor={leituraAtual.rotina.sleep} />
            <CampoLeitura
              titulo="Alimentação"
              valor={leituraAtual.rotina.food}
            />
            <CampoLeitura
              titulo="Energia"
              valor={leituraAtual.rotina.energy}
            />
            <CampoLeitura
              titulo="Sinais físicos em momentos emocionais"
              valor={leituraAtual.rotina.body_signals}
            />
            <CampoLeitura
              titulo="Medicação, substâncias ou algo relevante"
              valor={leituraAtual.rotina.substances_or_medication}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="07. Sofrimento e riscos"
            subtitulo="Sinais que podem indicar intensidade, urgência ou necessidade de atenção especial."
          >
            <CampoLeitura
              titulo="Sinais de ansiedade"
              valor={leituraAtual.riscos.anxiety_signs}
            />
            <CampoLeitura
              titulo="Sinais de tristeza, desânimo ou vazio"
              valor={leituraAtual.riscos.sadness_signs}
            />
            <CampoLeitura
              titulo="Raiva intensa, impulsos ou perda de controle"
              valor={leituraAtual.riscos.anger_or_impulses}
            />
            <CampoLeitura
              titulo="Pensamentos de se machucar, desistir da vida ou risco"
              valor={leituraAtual.riscos.self_harm_or_risk}
              destaque
            />
            <CampoLeitura
              titulo="Algo urgente para o terapeuta saber"
              valor={leituraAtual.riscos.urgent_observations}
              destaque
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="08. Histórico terapêutico e médico"
            subtitulo="Experiências anteriores de cuidado, acompanhamento, hipóteses e medicação."
          >
            <CampoLeitura
              titulo="Terapia ou acompanhamento anterior"
              valor={leituraAtual.historico.previous_therapy}
            />
            <CampoLeitura
              titulo="Acompanhamento médico ou psiquiátrico"
              valor={leituraAtual.historico.medical_follow_up}
            />
            <CampoLeitura
              titulo="Diagnóstico, hipótese ou orientação profissional"
              valor={leituraAtual.historico.diagnosis_or_suspicion}
            />
            <CampoLeitura
              titulo="Histórico de medicação"
              valor={leituraAtual.historico.medication_history}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="09. Padrões percebidos"
            subtitulo="Ponte direta com a leitura do VPP: repetições, situações e tentativas de mudança."
          >
            <CampoLeitura
              titulo="Reações que se repetem"
              valor={leituraAtual.padroes.repeated_reactions}
              destaque
            />
            <CampoLeitura
              titulo="Situações em que isso acontece"
              valor={leituraAtual.padroes.situations_that_repeat}
            />
            <CampoLeitura
              titulo="O que gostaria de mudar"
              valor={leituraAtual.padroes.what_wants_to_change}
            />
            <CampoLeitura
              titulo="O que já tentou fazer"
              valor={leituraAtual.padroes.what_has_already_tried}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="10. Pessoa de confiança"
            subtitulo="Contato indicado pelo paciente para apoio, cuidado ou situações de urgência."
          >
            <CampoLeitura
              titulo="Nome"
              valor={leituraAtual.contato.contact_name}
              destaque
            />
            <CampoLeitura
              titulo="Relação"
              valor={leituraAtual.contato.relationship}
            />
            <CampoLeitura
              titulo="Telefone ou WhatsApp"
              valor={leituraAtual.contato.phone}
              destaque
            />
            <CampoLeitura
              titulo="E-mail"
              valor={leituraAtual.contato.email}
            />
            <CampoLeitura
              titulo="Quando pode ser acionada"
              valor={leituraAtual.contato.can_be_contacted_in}
            />
            <CampoLeitura
              titulo="Autorização confirmada"
              valor={leituraAtual.contato.authorization_confirmed}
            />
            <CampoLeitura
              titulo="Observações"
              valor={leituraAtual.contato.notes}
            />
          </SecaoLeitura>

          <SecaoLeitura
            titulo="11. Fechamento"
            subtitulo="Relato livre e pontos que o paciente deseja que o terapeuta saiba."
          >
            <CampoLeitura
              titulo="Relato livre"
              valor={leituraAtual.fechamento.free_report}
            />
            <CampoLeitura
              titulo="O que o terapeuta deve saber antes de conversar"
              valor={leituraAtual.fechamento.what_therapist_should_know}
              destaque
            />
          </SecaoLeitura>
        </div>
      </section>
    </main>
  );
}