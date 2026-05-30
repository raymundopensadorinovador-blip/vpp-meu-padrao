"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DreamEntry = {
  id: string;
  patient_id: string;
  dream_date: string;
  title: string;
  dream_report: string;
  main_emotions: string | null;
  recurring_people: string | null;
  recurring_places: string | null;
  symbols_or_images: string | null;
  waking_feeling: string | null;
  possible_context: string | null;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  dream_date: new Date().toISOString().slice(0, 10),
  title: "",
  dream_report: "",
  main_emotions: "",
  recurring_people: "",
  recurring_places: "",
  symbols_or_images: "",
  waking_feeling: "",
  possible_context: "",
};

export default function SonhosPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [sonhos, setSonhos] = useState<DreamEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioUrlRef = useRef<string | null>(null);

  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcrevendoAudio, setTranscrevendoAudio] = useState(false);
  const [gravacaoSuportada, setGravacaoSuportada] = useState(false);

  const sonhosOrdenados = useMemo(() => {
    return [...sonhos].sort((a, b) => {
      const dataA = new Date(a.dream_date).getTime();
      const dataB = new Date(b.dream_date).getTime();
      return dataB - dataA;
    });
  }, [sonhos]);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("patient_dream_entries")
        .select("*")
        .eq("patient_id", user.id)
        .order("dream_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        setErro("Não foi possível carregar seu diário de sonhos.");
        setCarregando(false);
        return;
      }

      setSonhos((data || []) as DreamEntry[]);
      setCarregando(false);
    }

    carregar();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setGravacaoSuportada(
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
        typeof window.MediaRecorder !== "undefined"
    ); 

    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  function limparAvisos() {
    setErro("");
    setSucesso("");
  }

  function atualizarCampo(campo: keyof typeof emptyForm, valor: string) {
    limparAvisos();

    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function limparAudioAtual() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setAudioBlob(null);
    setAudioUrl("");
    audioChunksRef.current = [];
  }

  async function iniciarGravacaoAudio() {
    limparAvisos();

    if (!gravacaoSuportada) {
      setErro(
        "Este navegador não oferece suporte para gravação de áudio. Você ainda pode escrever o sonho manualmente."
      );
      return;
    }

    try {
      limparAudioAtual();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const novoAudioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        const novoAudioUrl = URL.createObjectURL(novoAudioBlob);

        audioUrlRef.current = novoAudioUrl;
        setAudioBlob(novoAudioBlob);
        setAudioUrl(novoAudioUrl);
        setGravandoAudio(false);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setGravandoAudio(true);
    } catch (error) {
      setGravandoAudio(false);

      setErro(
        "Não foi possível acessar o microfone. Verifique a permissão do navegador e tente novamente."
      );
    }
  }

  function pararGravacaoAudio() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setGravandoAudio(false);
  }

  async function transcreverAudio() {
    limparAvisos();

    if (!audioBlob) {
      setErro("Grave um áudio antes de tentar transcrever.");
      return;
    }

    setTranscrevendoAudio(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "sonho.webm");

      const resposta = await fetch("/api/transcrever-audio", {
        method: "POST",
        body: formData,
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(
          resultado?.error ||
            "Não foi possível transcrever o áudio agora. Tente novamente ou escreva o sonho manualmente."
        );
        setTranscrevendoAudio(false);
        return;
      }

      const textoTranscrito = String(resultado?.text || "").trim();

      if (!textoTranscrito) {
        setErro(
          "A transcrição não retornou texto. Tente gravar novamente, falando mais perto do microfone."
        );
        setTranscrevendoAudio(false);
        return;
      }

      setForm((atual) => ({
        ...atual,
        dream_report: atual.dream_report.trim()
          ? `${atual.dream_report.trim()}\n\n${textoTranscrito}`
          : textoTranscrito,
      }));

      setSucesso("Áudio transcrito e adicionado ao relato do sonho.");
      setTranscrevendoAudio(false);
    } catch (error) {
      setErro(
        "A rota de transcrição ainda não está disponível ou houve falha na conexão. O áudio foi gravado, mas a transcrição não foi concluída."
      );
      setTranscrevendoAudio(false);
    }
  }

  function validarFormulario() {
    if (!form.dream_date) {
      return "Informe a data do sonho.";
    }

    if (!form.title.trim()) {
      return "Informe um título simples para o sonho.";
    }

    if (!form.dream_report.trim()) {
      return "Descreva o sonho antes de salvar.";
    }

    if (form.title.trim().length < 3) {
      return "O título precisa ter pelo menos 3 caracteres.";
    }

    if (form.dream_report.trim().length < 10) {
      return "A descrição do sonho precisa ter um pouco mais de informação.";
    }

    return "";
  }

  async function salvarSonho(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setErro("Usuário não encontrado. Faça login novamente.");
      return;
    }

    limparAvisos();

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    const payload = {
      patient_id: userId,
      dream_date: form.dream_date,
      title: form.title.trim(),
      dream_report: form.dream_report.trim(),
      main_emotions: form.main_emotions.trim() || null,
      recurring_people: form.recurring_people.trim() || null,
      recurring_places: form.recurring_places.trim() || null,
      symbols_or_images: form.symbols_or_images.trim() || null,
      waking_feeling: form.waking_feeling.trim() || null,
      possible_context: form.possible_context.trim() || null,
    };

    if (editandoId) {
      const { data, error } = await supabase
        .from("patient_dream_entries")
        .update(payload)
        .eq("id", editandoId)
        .eq("patient_id", userId)
        .select()
        .single();

      if (error) {
        setErro("Não foi possível atualizar este sonho.");
        setSalvando(false);
        return;
      }

      setSonhos((atuais) =>
        atuais.map((sonho) =>
          sonho.id === editandoId ? (data as DreamEntry) : sonho
        )
      );

      setSucesso("Sonho atualizado com sucesso.");
      setEditandoId(null);
      setForm(emptyForm);
      limparAudioAtual();
      setSalvando(false);
      return;
    }

    const { data, error } = await supabase
      .from("patient_dream_entries")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setErro("Não foi possível salvar este sonho.");
      setSalvando(false);
      return;
    }

    setSonhos((atuais) => [data as DreamEntry, ...atuais]);
    setSucesso("Sonho registrado com sucesso.");
    setForm(emptyForm);
    limparAudioAtual();
    setSalvando(false);
  }

  function iniciarEdicao(sonho: DreamEntry) {
    limparAvisos();
    limparAudioAtual();

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setGravandoAudio(false);
    setEditandoId(sonho.id);

    setForm({
      dream_date: sonho.dream_date,
      title: sonho.title || "",
      dream_report: sonho.dream_report || "",
      main_emotions: sonho.main_emotions || "",
      recurring_people: sonho.recurring_people || "",
      recurring_places: sonho.recurring_places || "",
      symbols_or_images: sonho.symbols_or_images || "",
      waking_feeling: sonho.waking_feeling || "",
      possible_context: sonho.possible_context || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    limparAvisos();

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setGravandoAudio(false);
    setEditandoId(null);
    setForm(emptyForm);
    limparAudioAtual();
  }

  async function excluirSonho(id: string) {
    if (!userId) return;

    const confirmar = window.confirm(
      "Deseja excluir este registro de sonho? Essa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    limparAvisos();

    const { error } = await supabase
      .from("patient_dream_entries")
      .delete()
      .eq("id", id)
      .eq("patient_id", userId);

    if (error) {
      setErro("Não foi possível excluir este sonho.");
      return;
    }

    setSonhos((atuais) => atuais.filter((sonho) => sonho.id !== id));
    setSucesso("Sonho excluído com sucesso.");

    if (editandoId === id) {
      cancelarEdicao();
    }
  }

  function formatarData(data: string) {
    if (!data) return "Sem data";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-[#F6F0E8] px-4 py-6 text-[#2F2A24]">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center">
          <p className="text-sm text-[#6F6257]">
            Carregando diário de sonhos...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F0E8] px-4 py-6 text-[#2F2A24]">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A7A68]">
              VPP — Meu Padrão
            </p>

            <div className="space-y-1">
              <h1 className="break-words text-2xl font-semibold text-[#2F2A24] sm:text-3xl">
                Diário de sonhos
              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-[#6F6257]">
                Registre sonhos, emoções, pessoas, lugares e imagens lembradas.
                Este espaço não interpreta sonhos automaticamente e não produz
                diagnóstico. Ele organiza o material para sua percepção pessoal
                e para leitura clínica do terapeuta.
              </p>
            </div>
          </div>

          <Link
            href="/painel"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-4 py-2 text-sm font-medium text-[#5F564C] transition hover:bg-[#F7F3EC] sm:w-auto"
          >
            Voltar ao painel
          </Link>
        </header>

        {(erro || sucesso) && (
          <section className="space-y-2">
            {erro && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {sucesso}
              </div>
            )}
          </section>
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold text-[#2F2A24]">
              {editandoId ? "Editar sonho registrado" : "Registrar novo sonho"}
            </h2>

            <p className="text-sm leading-relaxed text-[#6F6257]">
              Escreva de forma livre, priorizando o que você lembra do sonho.
              Preserve o relato, as emoções e os elementos que chamaram sua
              atenção, mesmo que pareçam incompletos ou sem ordem clara.
            </p>
          </div>

          <form onSubmit={salvarSonho} className="space-y-4">
            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2F2A24]">
                    Registrar por áudio
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#6F6257]">
                    Grave o relato do sonho com calma. Depois você poderá ouvir,
                    descartar ou tentar transcrever o áudio para preencher o
                    campo de relato.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#8A7A68]">
                    A gravação ajuda a preservar o sonho enquanto ele ainda está
                    fresco. Revise o texto antes de salvar o registro.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-2 lg:w-auto">
                  {!gravandoAudio ? (
                    <button
                      type="button"
                      onClick={iniciarGravacaoAudio}
                      disabled={!gravacaoSuportada || salvando || transcrevendoAudio}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                    >
                      🎙️ Gravar áudio
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pararGravacaoAudio}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 lg:w-auto"
                    >
                      Parar gravação
                    </button>
                  )}

                  {!gravacaoSuportada && (
                    <p className="text-xs leading-5 text-[#8A7A68] lg:max-w-[260px]">
                      Este navegador não oferece suporte para gravação de áudio.
                      Use o Chrome ou registre o sonho por texto.
                    </p>
                  )}
                </div>
              </div>

              {gravandoAudio && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-700">
                    Gravação em andamento
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    Fale o sonho com calma. Quando terminar, toque em parar
                    gravação.
                  </p>
                </div>
              )}

              {audioUrl && (
                <div className="mt-4 rounded-2xl border border-[#D8C7B1] bg-white p-4">
                  <p className="text-sm font-semibold text-[#2F2A24]">
                    Áudio gravado
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#6F6257]">
                    Ouça o áudio antes de transcrever. Se não ficou claro,
                    descarte e grave novamente.
                  </p>

                  <audio controls src={audioUrl} className="mt-3 w-full">
                    Seu navegador não conseguiu reproduzir este áudio.
                  </audio>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={transcreverAudio}
                      disabled={transcrevendoAudio || salvando}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {transcrevendoAudio
                        ? "Transcrevendo..."
                        : "Transcrever áudio"}
                    </button>

                    <button
                      type="button"
                      onClick={limparAudioAtual}
                      disabled={transcrevendoAudio || salvando}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-semibold text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      Descartar áudio
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#8A7A68]">
                    A transcrição depende da rota interna de áudio. Se ela ainda
                    não estiver criada, o app manterá o áudio apenas como prévia
                    nesta tela.
                  </p>
                </div>
              )}
            </div>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#5F564C]">
                Relato do sonho
              </span>

              <textarea
                value={form.dream_report}
                onChange={(event) =>
                  atualizarCampo("dream_report", event.target.value)
                }
                placeholder="Descreva o sonho como você lembra, mesmo que as cenas pareçam soltas, confusas ou incompletas."
                rows={7}
                className="w-full resize-y rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-[#2F2A24]"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-[#5F564C]">
                  Emoções principais
                </span>

                <textarea
                  value={form.main_emotions}
                  onChange={(event) =>
                    atualizarCampo("main_emotions", event.target.value)
                  }
                  placeholder="Medo, culpa, alívio, vergonha, saudade..."
                  rows={3}
                  className="w-full resize-y rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F2A24]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-[#5F564C]">
                  Sensação ao acordar
                </span>

                <textarea
                  value={form.waking_feeling}
                  onChange={(event) =>
                    atualizarCampo("waking_feeling", event.target.value)
                  }
                  placeholder="Como você acordou depois desse sonho?"
                  rows={3}
                  className="w-full resize-y rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F2A24]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-[#5F564C]">
                  Pessoas que apareceram
                </span>

                <textarea
                  value={form.recurring_people}
                  onChange={(event) =>
                    atualizarCampo("recurring_people", event.target.value)
                  }
                  placeholder="Pessoas conhecidas, desconhecidas ou figuras recorrentes."
                  rows={3}
                  className="w-full resize-y rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F2A24]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-[#5F564C]">
                  Lugares que apareceram
                </span>

                <textarea
                  value={form.recurring_places}
                  onChange={(event) =>
                    atualizarCampo("recurring_places", event.target.value)
                  }
                  placeholder="Casa antiga, escola, rua, igreja, hospital..."
                  rows={3}
                  className="w-full resize-y rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F2A24]"
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#5F564C]">
                Imagens, símbolos ou cenas marcantes
              </span>

              <textarea
                value={form.symbols_or_images}
                onChange={(event) =>
                  atualizarCampo("symbols_or_images", event.target.value)
                }
                placeholder="Objetos, frases, ambientes, animais, portas, água, escadas, roupas, imagens fortes..."
                rows={3}
                className="w-full resize-y rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F2A24]"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#5F564C]">
                Contexto possível do momento
              </span>

              <textarea
                value={form.possible_context}
                onChange={(event) =>
                  atualizarCampo("possible_context", event.target.value)
                }
                placeholder="Algo que aconteceu nos últimos dias, preocupação atual, conversa marcante, lembrança recente..."
                rows={3}
                className="w-full resize-y rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F2A24]"
              />
            </label>

            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-4">
              <p className="mb-3 text-sm font-semibold text-[#2F2A24]">
                Para finalizar o registro
              </p>

              <p className="mb-4 text-sm leading-6 text-[#6F6257]">
                Depois de escrever o relato e os elementos principais do sonho,
                informe a data e dê um título simples. Essa ordem ajuda a
                preservar primeiro o conteúdo que ainda está mais presente na
                memória.
              </p>

              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-[#5F564C]">
                    Data do sonho
                  </span>

                  <input
                    type="date"
                    value={form.dream_date}
                    onChange={(event) =>
                      atualizarCampo("dream_date", event.target.value)
                    }
                    className="w-full rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F2A24]"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[#5F564C]">
                    Título simples
                  </span>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      atualizarCampo("title", event.target.value)
                    }
                    placeholder="Ex: Sonho com uma casa antiga"
                    className="w-full rounded-2xl border border-[#D8C7B1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F2A24]"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={salvando || gravandoAudio || transcrevendoAudio}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar alterações"
                    : "Registrar sonho"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  disabled={salvando || transcrevendoAudio}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 py-3 text-sm font-medium text-[#5F564C] transition hover:bg-[#F7F3EC] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[#2F2A24]">
                Sonhos registrados
              </h2>

              <p className="text-sm text-[#6F6257]">
                {sonhosOrdenados.length === 0
                  ? "Nenhum sonho registrado ainda."
                  : `${sonhosOrdenados.length} registro(s) encontrado(s).`}
              </p>
            </div>
          </div>

          {sonhosOrdenados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8C7B1] bg-[#F7F3EC] p-5 text-sm leading-relaxed text-[#6F6257]">
              Quando você registrar sonhos, eles aparecerão aqui. O objetivo é
              guardar relatos, emoções e elementos recorrentes para
              acompanhamento pessoal e leitura clínica, sem interpretação
              automática.
            </div>
          ) : (
            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1 sm:max-h-[620px] lg:max-h-[720px]">
              {sonhosOrdenados.map((sonho) => (
                <article
                  key={sonho.id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-[#E5DDD2] bg-[#FAF7F1] p-4"
                >
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8A7A68]">
                        {formatarData(sonho.dream_date)}
                      </p>

                      <h3 className="break-words text-base font-semibold text-[#2F2A24] [overflow-wrap:anywhere]">
                        {sonho.title}
                      </h3>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(sonho)}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-medium text-[#5F564C] transition hover:bg-[#F7F3EC] sm:w-auto"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirSonho(sonho.id)}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 sm:w-auto"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm leading-relaxed text-[#5F564C]">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A7A68]">
                        Relato
                      </p>

                      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {sonho.dream_report}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {sonho.main_emotions && (
                        <InfoBlock
                          titulo="Emoções principais"
                          texto={sonho.main_emotions}
                        />
                      )}

                      {sonho.waking_feeling && (
                        <InfoBlock
                          titulo="Sensação ao acordar"
                          texto={sonho.waking_feeling}
                        />
                      )}

                      {sonho.recurring_people && (
                        <InfoBlock
                          titulo="Pessoas"
                          texto={sonho.recurring_people}
                        />
                      )}

                      {sonho.recurring_places && (
                        <InfoBlock
                          titulo="Lugares"
                          texto={sonho.recurring_places}
                        />
                      )}
                    </div>

                    {sonho.symbols_or_images && (
                      <InfoBlock
                        titulo="Imagens, símbolos ou cenas"
                        texto={sonho.symbols_or_images}
                      />
                    )}

                    {sonho.possible_context && (
                      <InfoBlock
                        titulo="Contexto possível"
                        texto={sonho.possible_context}
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoBlock({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A7A68]">
        {titulo}
      </p>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#5F564C] [overflow-wrap:anywhere]">
        {texto}
      </p>
    </div>
  );
}