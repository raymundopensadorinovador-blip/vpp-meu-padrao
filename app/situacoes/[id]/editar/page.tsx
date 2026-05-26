"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

type Situacao = {
  id: string;
  situation: string;
  expected: string;
  thought: string;
  action_taken: string;
  outcome: string;
  area: string;
  predominant_response: string;
  emotional_intensity: number;
  pattern_note: string | null;
};

const areas = [
  "Família",
  "Relacionamento",
  "Trabalho",
  "Dinheiro",
  "Espiritualidade",
  "Autoimagem",
  "Amizades",
  "Decisões",
  "Outro",
];

const respostasPredominantes = [
  "Evitei",
  "Ataquei",
  "Me calei",
  "Tentei controlar",
  "Busquei aprovação",
  "Me afastei",
  "Explodi",
  "Racionalizei",
  "Assumi responsabilidade",
  "Consegui me reorganizar",
];

export default function EditarSituacaoPage() {
  const router = useRouter();
  const params = useParams();

  const situacaoId = String(params.id || "");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [userId, setUserId] = useState("");

  const [situacao, setSituacao] = useState<Situacao | null>(null);

  const [situation, setSituation] = useState("");
  const [expected, setExpected] = useState("");
  const [thought, setThought] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [outcome, setOutcome] = useState("");
  const [area, setArea] = useState("");
  const [predominantResponse, setPredominantResponse] = useState("");
  const [emotionalIntensity, setEmotionalIntensity] = useState(5);
  const [patternNote, setPatternNote] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregarSituacao() {
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

      if (role !== "paciente" && role !== "ambos") {
        router.replace("/clinico/painel");
        return;
      }

      const { data: registro, error: erroRegistro } = await supabase
        .from("vpp_situation_records")
        .select(
          "id, situation, expected, thought, action_taken, outcome, area, predominant_response, emotional_intensity, pattern_note"
        )
        .eq("id", situacaoId)
        .eq("user_id", usuarioAtual.user.id)
        .maybeSingle();

      if (erroRegistro || !registro) {
        setSituacao(null);
        setCarregando(false);
        return;
      }

      const situacaoEncontrada = registro as Situacao;

      setUserId(usuarioAtual.user.id);
      setSituacao(situacaoEncontrada);

      setSituation(situacaoEncontrada.situation || "");
      setExpected(situacaoEncontrada.expected || "");
      setThought(situacaoEncontrada.thought || "");
      setActionTaken(situacaoEncontrada.action_taken || "");
      setOutcome(situacaoEncontrada.outcome || "");
      setArea(situacaoEncontrada.area || "");
      setPredominantResponse(situacaoEncontrada.predominant_response || "");
      setEmotionalIntensity(Number(situacaoEncontrada.emotional_intensity || 5));
      setPatternNote(situacaoEncontrada.pattern_note || "");

      setCarregando(false);
    }

    carregarSituacao();
  }, [router, situacaoId]);

  async function handleSalvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!userId || !situacao) {
      setErro("Registro não identificado. Volte para a lista e tente novamente.");
      return;
    }

    if (
      !situation.trim() ||
      !expected.trim() ||
      !thought.trim() ||
      !actionTaken.trim() ||
      !outcome.trim() ||
      !area ||
      !predominantResponse
    ) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase
        .from("vpp_situation_records")
        .update({
          situation: situation.trim(),
          expected: expected.trim(),
          thought: thought.trim(),
          action_taken: actionTaken.trim(),
          outcome: outcome.trim(),
          area,
          predominant_response: predominantResponse,
          emotional_intensity: emotionalIntensity,
          pattern_note: patternNote.trim() || null,
        })
        .eq("id", situacao.id)
        .eq("user_id", userId);

      if (error) {
        setErro("Não foi possível salvar as alterações.");
        return;
      }

      setSucesso("Situação atualizada com sucesso.");

      setTimeout(() => {
        router.push(`/situacoes/${situacao.id}`);
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
            Carregando edição
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Buscando registro...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos preparando a situação para edição.
          </p>
        </div>
      </main>
    );
  }

  if (!situacao) {
    return (
      <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-[#E5DDD2] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#8A2E2B]">
              Registro não encontrado
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Não foi possível editar esta situação
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#5F564C]">
              O registro pode ter sido removido ou não pertence ao seu usuário.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/situacoes"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Voltar para registros
              </Link>

              <Link
                href="/painel"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
              >
                Voltar ao painel
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <header className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#8A2E2B]">
                Editar situação
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Ajustar registro real
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F564C]">
                Edite o registro apenas para deixá-lo mais claro e fiel ao que
                aconteceu. A ideia é preservar a situação real, não criar uma
                versão idealizada.
              </p>
            </div>

            <Link
              href={`/situacoes/${situacao.id}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Cancelar edição
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
          onSubmit={handleSalvarEdicao}
          className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                O que aconteceu?
              </span>

              <textarea
                value={situation}
                onChange={(event) => setSituation(event.target.value)}
                placeholder="Descreva a situação de forma objetiva."
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                O que você esperava?
              </span>

              <textarea
                value={expected}
                onChange={(event) => setExpected(event.target.value)}
                placeholder="Qual era sua expectativa antes ou durante a situação?"
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                O que você pensou?
              </span>

              <textarea
                value={thought}
                onChange={(event) => setThought(event.target.value)}
                placeholder="Qual pensamento apareceu com mais força?"
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                O que você fez?
              </span>

              <textarea
                value={actionTaken}
                onChange={(event) => setActionTaken(event.target.value)}
                placeholder="Descreva sua reação ou comportamento."
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                O que aconteceu depois?
              </span>

              <textarea
                value={outcome}
                onChange={(event) => setOutcome(event.target.value)}
                placeholder="Qual foi a consequência da sua reação?"
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
                required
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Área da vida
                </span>

                <select
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                  required
                >
                  <option value="">Selecione uma área</option>
                  {areas.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#2F2A24]">
                  Resposta predominante
                </span>

                <select
                  value={predominantResponse}
                  onChange={(event) =>
                    setPredominantResponse(event.target.value)
                  }
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 text-sm text-[#2F2A24] outline-none focus:border-[#8A2E2B] focus:bg-white"
                  disabled={salvando}
                  required
                >
                  <option value="">Selecione uma resposta</option>
                  {respostasPredominantes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Intensidade emocional: {emotionalIntensity}/10
              </span>

              <input
                type="range"
                min="1"
                max="10"
                value={emotionalIntensity}
                onChange={(event) =>
                  setEmotionalIntensity(Number(event.target.value))
                }
                className="mt-3 w-full accent-[#2F2A24]"
                disabled={salvando}
              />

              <div className="mt-2 flex justify-between text-xs text-[#8A7A68]">
                <span>Baixa</span>
                <span>Alta</span>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#2F2A24]">
                Observação do padrão
              </span>

              <textarea
                value={patternNote}
                onChange={(event) => setPatternNote(event.target.value)}
                placeholder="Opcional: você percebe alguma repetição nessa situação?"
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#D8C7B1] bg-[#F7F3EC] px-4 py-3 text-sm leading-6 text-[#2F2A24] outline-none placeholder:text-[#8A7A68] focus:border-[#8A2E2B] focus:bg-white"
                disabled={salvando}
              />
            </label>
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
              href={`/situacoes/${situacao.id}`}
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