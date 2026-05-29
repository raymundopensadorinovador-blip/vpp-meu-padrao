"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type AnamnesePayload = {
  personal_context: {
    age: string;
    city: string;
    occupation: string;
    living_context: string;
  };
  main_complaint: {
    reason_now: string;
    main_difficulty: string;
    what_hopes_to_understand: string;
  };
  emotional_history: {
    emotional_state: string;
    recurring_feelings: string;
    difficult_periods: string;
    what_usually_triggers: string;
  };
  family_history: {
    family_structure: string;
    important_relationships: string;
    childhood_marks: string;
    family_repetitions: string;
  };
  relationships: {
    current_relationships: string;
    conflicts: string;
    support_network: string;
    repeated_relationship_patterns: string;
  };
  routine_and_body: {
    sleep: string;
    food: string;
    energy: string;
    body_signals: string;
    substances_or_medication: string;
  };
  symptoms_and_risks: {
    anxiety_signs: string;
    sadness_signs: string;
    anger_or_impulses: string;
    self_harm_or_risk: string;
    urgent_observations: string;
  };
  therapeutic_history: {
    previous_therapy: string;
    medical_follow_up: string;
    diagnosis_or_suspicion: string;
    medication_history: string;
  };
  perceived_patterns: {
    repeated_reactions: string;
    situations_that_repeat: string;
    what_wants_to_change: string;
    what_has_already_tried: string;
  };
  trusted_contact: {
    contact_name: string;
    relationship: string;
    phone: string;
    email: string;
    can_be_contacted_in: string;
    authorization_confirmed: boolean;
    notes: string;
  };
  final_notes: {
    free_report: string;
    what_therapist_should_know: string;
  };
};

const payloadInicial: AnamnesePayload = {
  personal_context: {
    age: "",
    city: "",
    occupation: "",
    living_context: "",
  },
  main_complaint: {
    reason_now: "",
    main_difficulty: "",
    what_hopes_to_understand: "",
  },
  emotional_history: {
    emotional_state: "",
    recurring_feelings: "",
    difficult_periods: "",
    what_usually_triggers: "",
  },
  family_history: {
    family_structure: "",
    important_relationships: "",
    childhood_marks: "",
    family_repetitions: "",
  },
  relationships: {
    current_relationships: "",
    conflicts: "",
    support_network: "",
    repeated_relationship_patterns: "",
  },
  routine_and_body: {
    sleep: "",
    food: "",
    energy: "",
    body_signals: "",
    substances_or_medication: "",
  },
  symptoms_and_risks: {
    anxiety_signs: "",
    sadness_signs: "",
    anger_or_impulses: "",
    self_harm_or_risk: "",
    urgent_observations: "",
  },
  therapeutic_history: {
    previous_therapy: "",
    medical_follow_up: "",
    diagnosis_or_suspicion: "",
    medication_history: "",
  },
  perceived_patterns: {
    repeated_reactions: "",
    situations_that_repeat: "",
    what_wants_to_change: "",
    what_has_already_tried: "",
  },
  trusted_contact: {
    contact_name: "",
    relationship: "",
    phone: "",
    email: "",
    can_be_contacted_in: "",
    authorization_confirmed: false,
    notes: "",
  },
  final_notes: {
    free_report: "",
    what_therapist_should_know: "",
  },
};

type AnamneseStatus = "rascunho" | "enviada" | "atualizada" | null;
type TerapeutaVinculado = {
  therapist_id: string;
  therapist_name: string;
  therapist_email: string;
};
function payloadTemConteudo(valor: unknown): boolean {
  if (typeof valor === "string") {
    return valor.trim().length > 0;
  }

  if (typeof valor === "boolean") {
    return valor === true;
  }

  if (Array.isArray(valor)) {
    return valor.some((item) => payloadTemConteudo(item));
  }

  if (valor && typeof valor === "object") {
    return Object.values(valor).some((item) => payloadTemConteudo(item));
  }

  return false;
}
type TextareaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  help?: ReactNode;
  required?: boolean;
  minHeight?: string;
  disabled?: boolean;
};

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  help,
  required,
  minHeight = "min-h-28",
  disabled,
}: TextareaFieldProps) {
  const [mostrarAjuda, setMostrarAjuda] = useState(false);

  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#2F2A24]">
          {label} {required && <span className="text-[#8A2E2B]">*</span>}
        </span>

        {help && (
          <button
            type="button"
            onClick={() => setMostrarAjuda((valor) => !valor)}
            className="shrink-0 rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs font-semibold text-[#5F564C] transition hover:bg-[#FFF8EE]"
          >
            {mostrarAjuda ? "Ocultar ajuda" : "O que responder?"}
          </button>
        )}
      </div>

      {mostrarAjuda && help && (
        <div className="mb-3 rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] px-4 py-3 text-sm leading-6 text-[#5F564C]">
          {help}
        </div>
      )}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`${minHeight} w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70`}
      />
    </label>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  disabled,
}: InputFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#2F2A24]">
        {label} {required && <span className="text-[#8A2E2B]">*</span>}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none transition placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
  );
}

type SectionCardProps = {
  numero: string;
  titulo: string;
  subtitulo: string;
  children: ReactNode;
};

function SectionCard({ numero, titulo, subtitulo, children }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F3EC] text-sm font-bold text-[#8A2E2B]">
          {numero}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#2F2A24]">{titulo}</h2>
          <p className="mt-2 text-sm leading-6 text-[#5F564C]">{subtitulo}</p>
        </div>
      </div>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

export default function AnamnesePage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [payload, setPayload] = useState<AnamnesePayload>(payloadInicial);
  const [status, setStatus] = useState<AnamneseStatus>(null);
const [versaoAtual, setVersaoAtual] = useState(0);
const [modoEdicao, setModoEdicao] = useState(false);
const [rascunhoStatus, setRascunhoStatus] = useState("");

const [erro, setErro] = useState("");
const [sucesso, setSucesso] = useState("");

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

      const { data: anamneseExistente } = await supabase
        .from("patient_anamneses")
        .select("status, current_version, draft_payload")
        .eq("patient_id", usuarioAtual.user.id)
        .maybeSingle();

      if (anamneseExistente?.draft_payload) {
        setPayload({
          ...payloadInicial,
          ...(anamneseExistente.draft_payload as Partial<AnamnesePayload>),
        });
      }

      if (anamneseExistente?.status) {
        setStatus(anamneseExistente.status as AnamneseStatus);
      }

      setVersaoAtual(Number(anamneseExistente?.current_version || 0));
      setCarregando(false);
    }

    carregarAnamnese();
  }, [router]);
  const anamneseConcluida = status === "enviada" || status === "atualizada";
  const camposBloqueados = anamneseConcluida && !modoEdicao;
  
  const temConteudoNoRascunho = useMemo(() => {
    return payloadTemConteudo(payload);
  }, [payload]);
  
  useEffect(() => {
    if (carregando || enviando || camposBloqueados || !temConteudoNoRascunho) {
      return;
    }
  
    setRascunhoStatus("Salvando automaticamente...");
  
    const timer = setTimeout(async () => {
      const { error } = await supabase.rpc("save_patient_anamnesis_draft", {
        p_payload: payload,
      });
  
      if (error) {
        console.error("ERRO AO SALVAR RASCUNHO AUTOMÁTICO:", error);
        setRascunhoStatus("Não foi possível salvar automaticamente agora.");
        return;
      }
  
      setStatus((statusAtual) => statusAtual || "rascunho");
      setRascunhoStatus("Rascunho salvo automaticamente.");
    }, 1200);
  
    return () => clearTimeout(timer);
  }, [
    payload,
    carregando,
    enviando,
    camposBloqueados,
    temConteudoNoRascunho,
  ]);
  const progresso = useMemo(() => {
    const campos = [
      payload.personal_context.living_context,
      payload.main_complaint.reason_now,
      payload.main_complaint.main_difficulty,
      payload.emotional_history.emotional_state,
      payload.family_history.family_structure,
      payload.relationships.current_relationships,
      payload.routine_and_body.sleep,
      payload.symptoms_and_risks.self_harm_or_risk,
      payload.therapeutic_history.previous_therapy,
      payload.perceived_patterns.repeated_reactions,
      payload.trusted_contact.contact_name,
      payload.trusted_contact.relationship,
      payload.trusted_contact.phone,
      payload.trusted_contact.authorization_confirmed ? "sim" : "",
      payload.final_notes.what_therapist_should_know,
    ];

    const preenchidos = campos.filter((campo) => String(campo || "").trim())
      .length;

    return Math.round((preenchidos / campos.length) * 100);
  }, [payload]);

  function atualizarSecao<
    TSection extends keyof AnamnesePayload,
    TField extends keyof AnamnesePayload[TSection],
  >(secao: TSection, campo: TField, valor: AnamnesePayload[TSection][TField]) {
    setPayload((atual) => ({
      ...atual,
      [secao]: {
        ...atual[secao],
        [campo]: valor,
      },
    }));
  }

  function validarAntesDeEnviar() {
    const contato = payload.trusted_contact;
  
    if (!payload.main_complaint.reason_now.trim()) {
      return "Conte o que fez você buscar acompanhamento ou preencher esta anamnese agora.";
    }
  
    if (!payload.main_complaint.main_difficulty.trim()) {
      return "Descreva a principal dificuldade que você está vivendo neste momento.";
    }
  
    if (!payload.emotional_history.emotional_state.trim()) {
      return "Descreva como está seu estado emocional nos últimos meses.";
    }
  
    if (!payload.family_history.family_structure.trim()) {
      return "Conte um pouco sobre sua história familiar ou seu contexto familiar.";
    }
  
    if (!payload.symptoms_and_risks.self_harm_or_risk.trim()) {
      return "Responda o campo sobre pensamentos de se machucar, desistir da vida ou colocar-se em risco. Se não houver, escreva isso claramente.";
    }
  
    if (!payload.perceived_patterns.repeated_reactions.trim()) {
      return "Descreva alguma reação ou padrão que você percebe se repetindo em você.";
    }
  
    if (!payload.final_notes.what_therapist_should_know.trim()) {
      return "Informe o que você gostaria que o terapeuta soubesse antes de conversar com você.";
    }
  
    if (!contato.contact_name.trim()) {
      return "Informe o nome da pessoa de confiança.";
    }
  
    if (!contato.relationship.trim()) {
      return "Informe qual é a relação da pessoa de confiança com você.";
    }
  
    if (!contato.phone.trim()) {
      return "Informe o telefone ou WhatsApp da pessoa de confiança.";
    }
  
    if (!contato.authorization_confirmed) {
      return "Confirme que você tem autorização para indicar essa pessoa como contato de confiança.";
    }
  
    return "";
  }

  async function salvarRascunho() {
    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      const { error } = await supabase.rpc("save_patient_anamnesis_draft", {
        p_payload: payload,
      });

      if (error) {
        console.error("ERRO AO SALVAR RASCUNHO DA ANAMNESE:", error);
        setErro("Não foi possível salvar o rascunho da anamnese.");
        return;
      }

      setStatus((statusAtual) => statusAtual || "rascunho");
      setSucesso("Rascunho salvo com sucesso.");
    } finally {
      setSalvando(false);
    }
  }

  async function enviarAnamnese(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    const erroValidacao = validarAntesDeEnviar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setEnviando(true);

    try {
      const { data, error } = await supabase.rpc("submit_patient_anamnesis", {
        p_payload: payload,
      });

      if (error) {
        console.error("ERRO AO ENVIAR ANAMNESE:", error);

        if (error.message.includes("trusted_contact_name_required")) {
          setErro("Informe o nome da pessoa de confiança.");
          return;
        }

        if (error.message.includes("trusted_contact_relationship_required")) {
          setErro("Informe a relação da pessoa de confiança com você.");
          return;
        }

        if (error.message.includes("trusted_contact_phone_required")) {
          setErro("Informe o telefone da pessoa de confiança.");
          return;
        }

        if (error.message.includes("trusted_contact_authorization_required")) {
          setErro(
            "Confirme que você tem autorização para indicar essa pessoa como contato de confiança."
          );
          return;
        }

        setErro("Não foi possível enviar a anamnese agora.");
        return;
      }

      const resultado = Array.isArray(data) ? data[0] : data;

      const novoStatus = (resultado?.status as AnamneseStatus) || "enviada";
      const novaVersao = Number(resultado?.version_number || versaoAtual + 1);
      
      setStatus(novoStatus);
      setVersaoAtual(novaVersao);
      setModoEdicao(false);
      setRascunhoStatus("");
      setSucesso(
        "Anamnese enviada com sucesso. Esta versão foi salva no histórico."
      );
      
      const { data: terapeutasVinculados, error: erroTerapeutas } =
        await supabase.rpc("get_my_active_therapists_for_anamnesis");
      
      if (erroTerapeutas) {
        console.error(
          "ERRO AO BUSCAR TERAPEUTAS PARA PUSH DA ANAMNESE:",
          erroTerapeutas
        );
      } else if (terapeutasVinculados && terapeutasVinculados.length > 0) {
        const { data: sessaoAtual } = await supabase.auth.getSession();
      
        const terapeutas = terapeutasVinculados as TerapeutaVinculado[];
      
        await Promise.all(
          terapeutas.map((terapeuta) =>
            fetch("/api/push/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessaoAtual.session?.access_token || ""}`,
              },
              body: JSON.stringify({
                userId: terapeuta.therapist_id,
                title:
                  novoStatus === "atualizada"
                    ? "Anamnese atualizada"
                    : "Nova anamnese recebida",
                message:
                  novoStatus === "atualizada"
                    ? `${
                        nomeUsuario || "Um paciente"
                      } atualizou a anamnese no VPP — Meu Padrão.`
                    : `${
                        nomeUsuario || "Um paciente"
                      } enviou a anamnese no VPP — Meu Padrão.`,
                url: "/clinico/painel",
              }),
            })
          )
        );
      }   
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 text-[#2F2A24]">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-[#8A2E2B]">
            Carregando anamnese
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Preparando sua conversa guiada...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos abrindo um espaço para você organizar sua história com calma.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Anamnese guiada
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Uma primeira conversa sobre sua história
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
                {nomeUsuario
                  ? `${nomeUsuario}, responda com calma. Não tente escrever bonito. Escreva como você falaria em uma conversa.`
                  : "Responda com calma. Não tente escrever bonito. Escreva como você falaria em uma conversa."}
              </p>

              <div className="mt-5 rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-4">
                <p className="text-sm font-semibold text-[#2F2A24]">
                  Antes de começar
                </p>

                <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                  Esta anamnese não é uma prova e não precisa estar perfeita. O
                  objetivo é ajudar você e seu terapeuta a enxergarem contexto,
                  repetições, marcas importantes e pontos de cuidado.
                </p>
              </div>
            </div>

            <div className="w-full rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4 lg:w-72">
              <p className="text-sm font-semibold text-[#2F2A24]">
                Progresso aproximado
              </p>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#8A2E2B]"
                  style={{ width: `${progresso}%` }}
                />
              </div>

              <p className="mt-2 text-sm text-[#5F564C]">{progresso}% preenchido</p>

              <p className="mt-3 text-xs leading-5 text-[#8A7A68]">
                Status: {status || "ainda não iniciada"}
                {versaoAtual > 0 ? ` • versão ${versaoAtual}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
  <Link
    href="/painel"
    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
  >
    Voltar ao painel
  </Link>

  {camposBloqueados && (
    <button
      type="button"
      onClick={() => {
        setModoEdicao(true);
        setSucesso("");
        setErro("");
      }}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
    >
      Editar anamnese
    </button>
  )}
</div> 
        </header>
        {camposBloqueados && (
  <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800">
    Esta anamnese já foi enviada e está salva no histórico. Para modificar,
    clique em “Editar anamnese”. Ao enviar novamente, uma nova versão será
    criada sem apagar a anterior.
  </div>
)}

{modoEdicao && anamneseConcluida && (
  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
    Você está editando uma anamnese já enviada. As alterações estão sendo
    preservadas automaticamente como rascunho. Ao enviar, uma nova versão será
    criada.
  </div>
)}

{rascunhoStatus && !camposBloqueados && (
  <div className="mb-6 rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm leading-6 text-[#5F564C] shadow-sm">
    {rascunhoStatus}
  </div>
)}
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

        <form onSubmit={enviarAnamnese} className="space-y-6">
          <SectionCard
            numero="01"
            titulo="Seu contexto atual"
            subtitulo="Comece situando sua vida hoje. Isso ajuda o terapeuta a entender de onde você está falando."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Idade"
                value={payload.personal_context.age}
                onChange={(valor) =>
                  atualizarSecao("personal_context", "age", valor)
                }
                placeholder="Ex: 36 anos"
                disabled={camposBloqueados || enviando}
              />

              <InputField
                label="Cidade"
                value={payload.personal_context.city}
                onChange={(valor) =>
                  atualizarSecao("personal_context", "city", valor)
                }
                placeholder="Ex: Campinas/SP"
                disabled={camposBloqueados || enviando}
              />

              <InputField
                label="Ocupação ou rotina principal"
                value={payload.personal_context.occupation}
                onChange={(valor) =>
                  atualizarSecao("personal_context", "occupation", valor)
                }
                placeholder="Ex: trabalho, estudo, casa, cuidado com família"
                disabled={camposBloqueados || enviando}
              />

              <TextareaField
                label="Com quem você mora ou como é seu contexto de vida?"
                value={payload.personal_context.living_context}
                onChange={(valor) =>
                  atualizarSecao("personal_context", "living_context", valor)
                }
                placeholder="Conte brevemente como é seu contexto atual de moradia, família e rotina."
                disabled={camposBloqueados || enviando}
              />
            </div>
          </SectionCard>

          <SectionCard
            numero="02"
            titulo="O que trouxe você até aqui"
            subtitulo="Aqui não buscamos uma frase bonita. Buscamos o motivo real, do jeito que ele aparece para você."
          >
            <TextareaField
              label="O que fez você buscar ajuda ou preencher esta anamnese agora?"
              value={payload.main_complaint.reason_now}
              onChange={(valor) =>
                atualizarSecao("main_complaint", "reason_now", valor)
              }
              placeholder="Conte o que está pesando mais neste momento."
              required
              disabled={camposBloqueados || enviando}
              help={
                <p>
                  Pode ser uma crise, uma repetição, uma sensação antiga, um
                  conflito, uma perda, uma decisão difícil ou algo que você ainda
                  nem sabe nomear.
                </p>
              }
            />

            <TextareaField
              label="Qual é a principal dificuldade que você percebe hoje?"
              value={payload.main_complaint.main_difficulty}
              onChange={(valor) =>
                atualizarSecao("main_complaint", "main_difficulty", valor)
              }
              placeholder="Descreva a dificuldade principal com suas palavras."
              required
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="O que você espera compreender melhor sobre você?"
              value={payload.main_complaint.what_hopes_to_understand}
              onChange={(valor) =>
                atualizarSecao(
                  "main_complaint",
                  "what_hopes_to_understand",
                  valor
                )
              }
              placeholder="Ex: por que eu reajo assim, por que repito escolhas, por que travo..."
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <SectionCard
            numero="03"
            titulo="Sua vida emocional"
            subtitulo="Esta parte ajuda a observar como suas emoções costumam aparecer, aumentar e se repetir."
          >
            <TextareaField
              label="Como você descreveria seu estado emocional nos últimos meses?"
              value={payload.emotional_history.emotional_state}
              onChange={(valor) =>
                atualizarSecao("emotional_history", "emotional_state", valor)
              }
              placeholder="Fale sobre ansiedade, tristeza, irritação, vazio, medo, culpa, cansaço ou outros estados."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Quais sentimentos mais se repetem em você?"
              value={payload.emotional_history.recurring_feelings}
              onChange={(valor) =>
                atualizarSecao("emotional_history", "recurring_feelings", valor)
              }
              placeholder="Ex: medo de decepcionar, sensação de abandono, culpa, raiva, insegurança..."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Houve fases difíceis que marcaram sua história?"
              value={payload.emotional_history.difficult_periods}
              onChange={(valor) =>
                atualizarSecao("emotional_history", "difficult_periods", valor)
              }
              placeholder="Conte apenas o que se sentir confortável em registrar agora."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="O que costuma disparar suas reações emocionais mais fortes?"
              value={payload.emotional_history.what_usually_triggers}
              onChange={(valor) =>
                atualizarSecao(
                  "emotional_history",
                  "what_usually_triggers",
                  valor
                )
              }
              placeholder="Ex: crítica, silêncio, rejeição, cobrança, conflito, sensação de injustiça..."
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <SectionCard
            numero="04"
            titulo="Família e marcas importantes"
            subtitulo="Não é para culpar ninguém. É para entender onde certas referências emocionais começaram a ganhar forma."
          >
            <TextareaField
              label="Como você descreveria sua família ou sua história familiar?"
              value={payload.family_history.family_structure}
              onChange={(valor) =>
                atualizarSecao("family_history", "family_structure", valor)
              }
              placeholder="Fale sobre criação, convivência, presença, ausência, separações, perdas ou figuras importantes."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Quais relações foram mais importantes na sua formação?"
              value={payload.family_history.important_relationships}
              onChange={(valor) =>
                atualizarSecao("family_history", "important_relationships", valor)
              }
              placeholder="Pode incluir mãe, pai, avós, irmãos, cuidadores, líderes, professores ou outras figuras."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Existe alguma marca da infância ou adolescência que ainda pesa?"
              value={payload.family_history.childhood_marks}
              onChange={(valor) =>
                atualizarSecao("family_history", "childhood_marks", valor)
              }
              placeholder="Responda com liberdade. Não precisa detalhar mais do que deseja agora."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Você percebe repetições familiares em você?"
              value={payload.family_history.family_repetitions}
              onChange={(valor) =>
                atualizarSecao("family_history", "family_repetitions", valor)
              }
              placeholder="Ex: modo de reagir, silenciar, explodir, controlar, agradar, fugir, cuidar demais..."
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <SectionCard
            numero="05"
            titulo="Relações e vínculos"
            subtitulo="Grande parte dos padrões aparece no modo como a pessoa se aproxima, se protege, se afasta ou tenta ser aceita."
          >
            <TextareaField
              label="Como estão suas relações hoje?"
              value={payload.relationships.current_relationships}
              onChange={(valor) =>
                atualizarSecao("relationships", "current_relationships", valor)
              }
              placeholder="Fale sobre família, amizades, relacionamento amoroso, trabalho ou vínculos importantes."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Quais conflitos ou dificuldades relacionais se repetem?"
              value={payload.relationships.conflicts}
              onChange={(valor) =>
                atualizarSecao("relationships", "conflicts", valor)
              }
              placeholder="Ex: discussões parecidas, medo de falar, ciúmes, afastamento, dependência, cobranças..."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Com quem você sente que pode contar?"
              value={payload.relationships.support_network}
              onChange={(valor) =>
                atualizarSecao("relationships", "support_network", valor)
              }
              placeholder="Liste pessoas ou grupos que funcionam como apoio real."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Você percebe algum padrão se repetindo nas suas relações?"
              value={payload.relationships.repeated_relationship_patterns}
              onChange={(valor) =>
                atualizarSecao(
                  "relationships",
                  "repeated_relationship_patterns",
                  valor
                )
              }
              placeholder="Ex: sempre cuidar demais, se sentir deixado de lado, se calar, explodir, se afastar..."
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <SectionCard
  numero="06"
  titulo="Rotina, corpo e sinais físicos"
  subtitulo="O corpo também pode sinalizar tensões, emoções e mudanças que merecem atenção no cuidado clínico."
>
            <div className="grid gap-5 md:grid-cols-2">
              <TextareaField
                label="Como está seu sono?"
                value={payload.routine_and_body.sleep}
                onChange={(valor) =>
                  atualizarSecao("routine_and_body", "sleep", valor)
                }
                placeholder="Fale sobre dificuldade para dormir, acordar, pesadelos, sono excessivo ou cansaço."
                disabled={camposBloqueados || enviando}
              />

              <TextareaField
                label="Como está sua alimentação?"
                value={payload.routine_and_body.food}
                onChange={(valor) =>
                  atualizarSecao("routine_and_body", "food", valor)
                }
                placeholder="Fale sobre apetite, compulsão, falta de fome, rotina alimentar ou mudanças recentes."
                disabled={camposBloqueados || enviando}
              />

              <TextareaField
                label="Como está sua energia no dia a dia?"
                value={payload.routine_and_body.energy}
                onChange={(valor) =>
                  atualizarSecao("routine_and_body", "energy", valor)
                }
                placeholder="Ex: energia baixa, agitação, dificuldade de começar tarefas, exaustão..."
                disabled={camposBloqueados || enviando}
              />

              <TextareaField
                label="Seu corpo costuma dar sinais em momentos emocionais?"
                value={payload.routine_and_body.body_signals}
                onChange={(valor) =>
                  atualizarSecao("routine_and_body", "body_signals", valor)
                }
                placeholder="Ex: aperto no peito, dor de cabeça, nó na garganta, tensão, enjoo, tremor..."
                disabled={camposBloqueados || enviando}
              />
            </div>

            <TextareaField
              label="Uso de medicação, álcool, outras substâncias ou algo relevante para o cuidado"
              value={payload.routine_and_body.substances_or_medication}
              onChange={(valor) =>
                atualizarSecao(
                  "routine_and_body",
                  "substances_or_medication",
                  valor
                )
              }
              placeholder="Informe apenas o que for relevante e confortável neste momento."
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <SectionCard
            numero="07"
            titulo="Sinais de sofrimento e cuidado"
            subtitulo="Algumas respostas ajudam o terapeuta a entender urgência, intensidade e necessidade de atenção especial."
          >
            <TextareaField
              label="Você percebe sinais de ansiedade?"
              value={payload.symptoms_and_risks.anxiety_signs}
              onChange={(valor) =>
                atualizarSecao("symptoms_and_risks", "anxiety_signs", valor)
              }
              placeholder="Ex: preocupação constante, falta de ar, aceleração, medo, antecipação, crise..."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Você percebe sinais de tristeza, desânimo ou vazio?"
              value={payload.symptoms_and_risks.sadness_signs}
              onChange={(valor) =>
                atualizarSecao("symptoms_and_risks", "sadness_signs", valor)
              }
              placeholder="Ex: vontade de sumir, choro, perda de interesse, isolamento, sensação de peso..."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Você tem vivido raiva intensa, impulsos ou perda de controle?"
              value={payload.symptoms_and_risks.anger_or_impulses}
              onChange={(valor) =>
                atualizarSecao("symptoms_and_risks", "anger_or_impulses", valor)
              }
              placeholder="Conte se isso acontece e em quais situações aparece mais."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Já houve pensamentos de se machucar, desistir da vida ou colocar-se em risco?"
              value={payload.symptoms_and_risks.self_harm_or_risk}
              onChange={(valor) =>
                atualizarSecao("symptoms_and_risks", "self_harm_or_risk", valor)
              }
              placeholder="Responda com honestidade. Isso ajuda a definir cuidado e segurança."
              disabled={camposBloqueados || enviando}
              help={
                <p>
                  Se isso estiver acontecendo agora ou se houver risco imediato,
                  procure ajuda presencial urgente, serviço de emergência ou uma
                  pessoa de confiança. O app não substitui atendimento de crise.
                </p>
              }
            />

            <TextareaField
              label="Existe algo urgente que o terapeuta precisa saber?"
              value={payload.symptoms_and_risks.urgent_observations}
              onChange={(valor) =>
                atualizarSecao(
                  "symptoms_and_risks",
                  "urgent_observations",
                  valor
                )
              }
              placeholder="Escreva qualquer informação importante para cuidado imediato ou atenção especial."
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <SectionCard
            numero="08"
            titulo="Histórico terapêutico e médico"
            subtitulo="Esta parte ajuda a entender o que já foi tentado, o que ajudou e o que precisa ser considerado."
          >
            <TextareaField
              label="Você já fez terapia, análise ou acompanhamento psicológico?"
              value={payload.therapeutic_history.previous_therapy}
              onChange={(valor) =>
                atualizarSecao(
                  "therapeutic_history",
                  "previous_therapy",
                  valor
                )
              }
              placeholder="Conte quando fez, por quanto tempo, como foi a experiência e se ajudou."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Você faz ou já fez acompanhamento médico/psiquiátrico?"
              value={payload.therapeutic_history.medical_follow_up}
              onChange={(valor) =>
                atualizarSecao(
                  "therapeutic_history",
                  "medical_follow_up",
                  valor
                )
              }
              placeholder="Informe se há acompanhamento atual ou anterior."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Já recebeu algum diagnóstico, hipótese ou orientação profissional?"
              value={payload.therapeutic_history.diagnosis_or_suspicion}
              onChange={(valor) =>
                atualizarSecao(
                  "therapeutic_history",
                  "diagnosis_or_suspicion",
                  valor
                )
              }
              placeholder="Escreva apenas o que souber ou lembrar."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Já usou ou usa medicação relacionada à saúde emocional?"
              value={payload.therapeutic_history.medication_history}
              onChange={(valor) =>
                atualizarSecao(
                  "therapeutic_history",
                  "medication_history",
                  valor
                )
              }
              placeholder="Se preferir, pode responder de forma geral."
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <SectionCard
            numero="09"
            titulo="Padrões que você já percebe"
            subtitulo="Aqui começa a ponte com o VPP: observar repetições, expectativas, reações e tentativas de mudança."
          >
            <TextareaField
              label="Existe alguma reação sua que se repete, mesmo quando você tenta agir diferente?"
              value={payload.perceived_patterns.repeated_reactions}
              onChange={(valor) =>
                atualizarSecao("perceived_patterns", "repeated_reactions", valor)
              }
              placeholder="Ex: evitar conversa, explodir, se calar, se culpar, controlar, agradar demais, sumir..."
              disabled={camposBloqueados || enviando}
              help={
                <p>
                  Pense em algo que você faz quase automaticamente. Não precisa
                  explicar a origem ainda. Apenas descreva a repetição.
                </p>
              }
            />

            <TextareaField
              label="Em quais situações isso costuma acontecer?"
              value={payload.perceived_patterns.situations_that_repeat}
              onChange={(valor) =>
                atualizarSecao(
                  "perceived_patterns",
                  "situations_that_repeat",
                  valor
                )
              }
              placeholder="Ex: quando sou cobrado, ignorado, contrariado, criticado, comparado ou pressionado."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="O que você mais gostaria de mudar nesse padrão?"
              value={payload.perceived_patterns.what_wants_to_change}
              onChange={(valor) =>
                atualizarSecao("perceived_patterns", "what_wants_to_change", valor)
              }
              placeholder="Fale do que você gostaria que fosse diferente na sua forma de sentir, pensar ou agir."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="O que você já tentou fazer para mudar?"
              value={payload.perceived_patterns.what_has_already_tried}
              onChange={(valor) =>
                atualizarSecao(
                  "perceived_patterns",
                  "what_has_already_tried",
                  valor
                )
              }
              placeholder="Conte tentativas, estratégias, conversas, decisões ou mudanças que já tentou."
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <SectionCard
            numero="10"
            titulo="Pessoa de confiança"
            subtitulo="Este contato é obrigatório. Ele ajuda a pensar cuidado, segurança e rede de apoio."
          >
            <div className="rounded-2xl border border-[#D8C7B1] bg-[#FFF8EE] p-4">
              <p className="text-sm font-semibold text-[#2F2A24]">
                Por que pedimos isso?
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F564C]">
                Em alguns momentos, o cuidado não deve depender só do paciente e
                do terapeuta. Uma pessoa de confiança pode ser importante em
                situações de crise, risco, urgência ou necessidade de apoio.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Nome da pessoa de confiança"
                value={payload.trusted_contact.contact_name}
                onChange={(valor) =>
                  atualizarSecao("trusted_contact", "contact_name", valor)
                }
                placeholder="Nome completo ou nome pelo qual você conhece"
                required
                disabled={camposBloqueados || enviando}
              />

              <InputField
                label="Relação com você"
                value={payload.trusted_contact.relationship}
                onChange={(valor) =>
                  atualizarSecao("trusted_contact", "relationship", valor)
                }
                placeholder="Ex: mãe, irmão, amiga, esposo, líder, colega"
                required
                disabled={camposBloqueados || enviando}
              />

              <InputField
                label="Telefone ou WhatsApp"
                value={payload.trusted_contact.phone}
                onChange={(valor) =>
                  atualizarSecao("trusted_contact", "phone", valor)
                }
                placeholder="Informe um número de contato"
                required
                disabled={camposBloqueados || enviando}
              />

              <InputField
                label="E-mail opcional"
                value={payload.trusted_contact.email}
                onChange={(valor) =>
                  atualizarSecao("trusted_contact", "email", valor)
                }
                placeholder="E-mail, se houver"
                type="email"
                disabled={camposBloqueados || enviando}
              />
            </div>

            <TextareaField
              label="Em quais situações essa pessoa pode ser acionada?"
              value={payload.trusted_contact.can_be_contacted_in}
              onChange={(valor) =>
                atualizarSecao("trusted_contact", "can_be_contacted_in", valor)
              }
              placeholder="Ex: crise emocional, risco, falta de resposta, necessidade de apoio familiar..."
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="Observações sobre esse contato"
              value={payload.trusted_contact.notes}
              onChange={(valor) =>
                atualizarSecao("trusted_contact", "notes", valor)
              }
              placeholder="Ex: melhor horário para contato, vínculo, cuidados, limites..."
              disabled={camposBloqueados || enviando}
            />

            <label className="flex items-start gap-3 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <input
                type="checkbox"
                checked={payload.trusted_contact.authorization_confirmed}
                onChange={(event) =>
                  atualizarSecao(
                    "trusted_contact",
                    "authorization_confirmed",
                    event.target.checked
                  )
                }
                disabled={camposBloqueados || enviando}
                className="mt-1 h-4 w-4 accent-[#8A2E2B]"
              />

              <span className="text-sm leading-6 text-[#5F564C]">
                Confirmo que tenho autorização para indicar esta pessoa como
                contato de confiança e compreendo que ela poderá ser considerada
                em situações de cuidado, segurança ou urgência.
              </span>
            </label>
          </SectionCard>

          <SectionCard
            numero="11"
            titulo="Fechamento"
            subtitulo="Use este espaço final para dizer o que talvez as perguntas não alcançaram."
          >
            <TextareaField
              label="Conte livremente algo que considera importante"
              value={payload.final_notes.free_report}
              onChange={(valor) =>
                atualizarSecao("final_notes", "free_report", valor)
              }
              placeholder="Escreva livremente. Pode ser um resumo, uma preocupação, uma lembrança ou algo difícil de organizar."
              minHeight="min-h-36"
              disabled={camposBloqueados || enviando}
            />

            <TextareaField
              label="O que você gostaria que o terapeuta soubesse antes de conversar com você?"
              value={payload.final_notes.what_therapist_should_know}
              onChange={(valor) =>
                atualizarSecao(
                  "final_notes",
                  "what_therapist_should_know",
                  valor
                )
              }
              placeholder="Ex: tenho dificuldade de falar de tal assunto, me sinto inseguro, preciso de acolhimento, prefiro objetividade..."
              minHeight="min-h-32"
              disabled={camposBloqueados || enviando}
            />
          </SectionCard>

          <section className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-semibold text-[#2F2A24]">
              Enviar anamnese
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#5F564C]">
  Suas respostas parciais são salvas automaticamente enquanto você preenche.
  Ao enviar a anamnese completa, uma versão oficial será preservada no
  histórico. Se você editar e enviar novamente, uma nova versão será criada,
  sem apagar a anterior.
</p>  

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
  {camposBloqueados ? (
    <button
      type="button"
      onClick={() => {
        setModoEdicao(true);
        setSucesso("");
        setErro("");
      }}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
    >
      Editar anamnese
    </button>
  ) : (
    <button
      type="submit"
      disabled={salvando || enviando}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {enviando
        ? "Enviando..."
        : anamneseConcluida
          ? "Salvar nova versão"
          : "Enviar anamnese"}
    </button>
  )}

  {modoEdicao && anamneseConcluida && (
    <button
      type="button"
      onClick={() => {
        setModoEdicao(false);
        setErro("");
        setSucesso("");
      }}
      disabled={enviando}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      Cancelar edição
    </button>
  )}

  <Link
    href="/painel"
    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
  >
    Voltar ao painel
  </Link>
</div> 
          </section>
        </form>
      </section>
    </main>
  );
}