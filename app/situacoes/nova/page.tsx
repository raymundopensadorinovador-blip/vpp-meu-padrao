"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

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

export default function NovaSituacaoPage() {
  const router = useRouter();

  const [carregandoAcesso, setCarregandoAcesso] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [userId, setUserId] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

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

      setUserId(usuarioAtual.user.id);
      setNomeUsuario(perfil.name || "");
      setCarregandoAcesso(false);
    }

    verificarAcesso();
  }, [router]);

  async function handleSalvarSituacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!userId) {
      setErro("Usuário não identificado. Faça login novamente.");
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
      const { error } = await supabase.from("vpp_situation_records").insert({
        user_id: userId,
        situation: situation.trim(),
        expected: expected.trim(),
        thought: thought.trim(),
        action_taken: actionTaken.trim(),
        outcome: outcome.trim(),
        area,
        predominant_response: predominantResponse,
        emotional_intensity: emotionalIntensity,
        pattern_note: patternNote.trim() || null,
      });

      if (error) {
        setErro("Não foi possível salvar o registro da situação.");
        return;
      }

      setSucesso("Situação registrada com sucesso.");

      setTimeout(() => {
        router.push("/painel");
      }, 1200);
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
            Carregando registro...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando seu perfil antes de abrir o formulário.
          </p>
        </div>
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
                Registro de situação real
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                Observar o padrão na vida concreta
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F564C]">
                {nomeUsuario
                  ? `${nomeUsuario}, registre uma situação recente para observar como expectativa, pensamento, emoção e comportamento se conectaram.`
                  : "Registre uma situação recente para observar como expectativa, pensamento, emoção e comportamento se conectaram."}
              </p>
            </div>

            <Link
              href="/painel"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] sm:w-auto"
            >
              Voltar ao painel
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
          onSubmit={handleSalvarSituacao}
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

          <div className="mt-6 rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
            <p className="text-sm leading-6 text-[#5F564C]">
              Este registro não serve para julgar você. Ele ajuda a observar
              como expectativa, pensamento, emoção e reação se conectam em uma
              situação concreta.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {salvando ? "Salvando..." : "Salvar situação"}
            </button>

            <Link
              href="/painel"
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