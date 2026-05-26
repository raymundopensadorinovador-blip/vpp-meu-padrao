"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta";

type Perfil =
  | "André — Vetor da Ponte"
  | "Simão Pedro — Vetor da Prova"
  | "Tiago filho de Zebedeu — Vetor da Intensidade"
  | "João filho de Zebedeu — Vetor da Profundidade"
  | "Filipe — Vetor da Análise"
  | "Natanael/Bartolomeu — Vetor da Inteireza"
  | "Mateus/Levi — Vetor da Inclusão"
  | "Tomé — Vetor da Evidência"
  | "Tiago filho de Alfeu — Vetor da Sustentação"
  | "Tadeu — Vetor do Sentido"
  | "Simão, o Zelote — Vetor da Causa"
  | "Judas Iscariotes — Vetor Interrompido";

type Pergunta = {
  id: number;
  perfil: Perfil;
  texto: string;
};

type Respostas = Record<number, number>;

const perguntas: Pergunta[] = [
  {
    id: 1,
    perfil: "Simão Pedro — Vetor da Prova",
    texto:
      "Quando algo importante acontece, costumo reagir rápido antes de organizar melhor o que estou sentindo.",
  },
  {
    id: 2,
    perfil: "Simão Pedro — Vetor da Prova",
    texto:
      "Tenho facilidade para tomar iniciativa, mas às vezes percebo que fui impulsivo demais.",
  },
  {
    id: 3,
    perfil: "Simão Pedro — Vetor da Prova",
    texto:
      "Quando erro, posso oscilar entre muita coragem e uma sensação forte de culpa ou frustração.",
  },
  {
    id: 4,
    perfil: "André — Vetor da Ponte",
    texto:
      "Tenho tendência a aproximar pessoas, criar pontes e ajudar outros a encontrarem caminhos.",
  },
  {
    id: 5,
    perfil: "André — Vetor da Ponte",
    texto:
      "Muitas vezes percebo necessidades ao meu redor antes que os outros falem claramente sobre elas.",
  },
  {
    id: 6,
    perfil: "André — Vetor da Ponte",
    texto:
      "Posso me colocar como apoio dos outros e deixar minhas próprias necessidades em segundo plano.",
  },
  {
    id: 7,
    perfil: "Tiago filho de Zebedeu — Vetor da Intensidade",
    texto:
      "Quando acredito em algo, tendo a defender minha posição com intensidade.",
  },
  {
    id: 8,
    perfil: "Tiago filho de Zebedeu — Vetor da Intensidade",
    texto:
      "Tenho dificuldade em aceitar situações que parecem injustas, lentas ou fracas demais.",
  },
  {
    id: 9,
    perfil: "Tiago filho de Zebedeu — Vetor da Intensidade",
    texto:
      "Minha força pode me ajudar a sustentar decisões, mas também pode me tornar rígido.",
  },
  {
    id: 10,
    perfil: "João filho de Zebedeu — Vetor da Profundidade",
    texto:
      "Costumo perceber vínculos, afetos e detalhes emocionais que outras pessoas deixam passar.",
  },
  {
    id: 11,
    perfil: "João filho de Zebedeu — Vetor da Profundidade",
    texto:
      "Tenho necessidade de profundidade nos relacionamentos e posso sofrer quando sinto distância emocional.",
  },
  {
    id: 12,
    perfil: "João filho de Zebedeu — Vetor da Profundidade",
    texto:
      "Quando me sinto seguro, consigo demonstrar cuidado, lealdade e presença com intensidade.",
  },
  {
    id: 13,
    perfil: "Filipe — Vetor da Análise",
    texto:
      "Tenho necessidade de entender como as coisas funcionam antes de confiar plenamente no caminho.",
  },
  {
    id: 14,
    perfil: "Filipe — Vetor da Análise",
    texto:
      "Quando algo parece abstrato demais, procuro exemplos concretos, provas ou explicações práticas.",
  },
  {
    id: 15,
    perfil: "Filipe — Vetor da Análise",
    texto:
      "Às vezes demoro a agir porque ainda estou tentando compreender todos os detalhes.",
  },
  {
    id: 16,
    perfil: "Natanael/Bartolomeu — Vetor da Inteireza",
    texto:
      "Valorizo coerência, sinceridade e autenticidade nas relações.",
  },
  {
    id: 17,
    perfil: "Natanael/Bartolomeu — Vetor da Inteireza",
    texto:
      "Tenho dificuldade com ambientes falsos, manipuladores ou cheios de aparência.",
  },
  {
    id: 18,
    perfil: "Natanael/Bartolomeu — Vetor da Inteireza",
    texto:
      "Quando confio em alguém, costumo ser leal, direto e verdadeiro.",
  },
  {
    id: 19,
    perfil: "Tomé — Vetor da Evidência",
    texto:
      "Tenho dificuldade em acreditar sem antes encontrar segurança, evidência ou confirmação.",
  },
  {
    id: 20,
    perfil: "Tomé — Vetor da Evidência",
    texto:
      "Quando estou inseguro, posso parecer frio ou resistente, mesmo estando apenas tentando me proteger.",
  },
  {
    id: 21,
    perfil: "Tomé — Vetor da Evidência",
    texto:
      "Depois que compreendo e confio, consigo me comprometer de forma profunda.",
  },
  {
    id: 22,
    perfil: "Mateus/Levi — Vetor da Inclusão",
    texto:
      "Costumo observar sistemas, trocas, ganhos, perdas e consequências práticas das escolhas.",
  },
  {
    id: 23,
    perfil: "Mateus/Levi — Vetor da Inclusão",
    texto:
      "Tenho facilidade para organizar informações e perceber padrões de funcionamento no cotidiano.",
  },
  {
    id: 24,
    perfil: "Mateus/Levi — Vetor da Inclusão",
    texto:
      "Às vezes posso me proteger demais por meio do controle, da análise ou da distância emocional.",
  },
  {
    id: 25,
    perfil: "Tiago filho de Alfeu — Vetor da Sustentação",
    texto:
      "Costumo atuar de forma discreta, sem precisar aparecer o tempo todo.",
  },
  {
    id: 26,
    perfil: "Tiago filho de Alfeu — Vetor da Sustentação",
    texto:
      "Mesmo quando participo bastante, posso sentir que minha presença é pouco percebida.",
  },
  {
    id: 27,
    perfil: "Tiago filho de Alfeu — Vetor da Sustentação",
    texto:
      "Tenho força de permanência, mas posso esconder minhas necessidades para não incomodar.",
  },
  {
    id: 28,
    perfil: "Tadeu — Vetor do Sentido",
    texto:
      "Tenho necessidade de compreender o sentido das coisas e o motivo por trás das decisões.",
  },
  {
    id: 29,
    perfil: "Tadeu — Vetor do Sentido",
    texto:
      "Quando não entendo o que está acontecendo, posso ficar inquieto ou questionador.",
  },
  {
    id: 30,
    perfil: "Tadeu — Vetor do Sentido",
    texto:
      "Minhas perguntas costumam revelar busca por direção, clareza e pertencimento.",
  },
  {
    id: 31,
    perfil: "Simão, o Zelote — Vetor da Causa",
    texto:
      "Quando acredito em uma causa, posso me envolver com muita energia e senso de missão.",
  },
  {
    id: 32,
    perfil: "Simão, o Zelote — Vetor da Causa",
    texto:
      "Tenho dificuldade em ficar neutro diante de algo que considero errado.",
  },
  {
    id: 33,
    perfil: "Simão, o Zelote — Vetor da Causa",
    texto:
      "Minha intensidade pode gerar movimento, mas também pode me levar a conflitos desnecessários.",
  },
  {
    id: 34,
    perfil: "Judas Iscariotes — Vetor Interrompido",
    texto:
      "Quando me sinto frustrado, posso tentar controlar a situação em vez de expressar claramente o que sinto.",
  },
  {
    id: 35,
    perfil: "Judas Iscariotes — Vetor Interrompido",
    texto:
      "Tenho dificuldade quando minhas expectativas não são atendidas e posso reagir de forma estratégica ou fechada.",
  },
  {
    id: 36,
    perfil: "Judas Iscariotes — Vetor Interrompido",
    texto:
      "Em alguns momentos, posso esconder conflitos internos enquanto tento manter uma imagem de controle.",
  },
];

const leiturasPorPerfil: Record<
  Perfil,
  {
    description: string;
    functioning_reading: string;
    attention_point: string;
    potential: string;
    observation_focus: string;
    self_observation_question: string;
  }
> = {
  "Simão Pedro — Vetor da Prova": {
    description: "Perfil de iniciativa, reação rápida e intensidade emocional.",
    functioning_reading:
      "Seu funcionamento tende a responder rapidamente à realidade, com coragem, presença e impulso. O ponto central é observar se a ação nasce de clareza ou de urgência emocional.",
    attention_point:
      "Cuidado com decisões tomadas no calor da reação, especialmente quando há medo, culpa ou necessidade de provar valor.",
    potential:
      "Força de liderança, coragem para começar e capacidade de se reposicionar depois do erro.",
    observation_focus:
      "Observe situações em que você age antes de compreender o que realmente sentiu.",
    self_observation_question:
      "Eu estou agindo com clareza ou apenas tentando aliviar uma tensão interna?",
  },

  "André — Vetor da Ponte": {
    description: "Perfil de ponte, apoio, aproximação e sensibilidade ao outro.",
    functioning_reading:
      "Seu funcionamento tende a perceber necessidades, conectar pessoas e sustentar vínculos. O ponto central é observar se o cuidado com o outro não está apagando sua própria voz.",
    attention_point:
      "Cuidado para não virar apenas suporte dos outros e deixar suas próprias necessidades invisíveis.",
    potential:
      "Capacidade de acolher, aproximar, facilitar caminhos e fortalecer relações.",
    observation_focus:
      "Observe quando você ajuda para contribuir e quando ajuda para evitar conflito ou rejeição.",
    self_observation_question:
      "Eu estou escolhendo ajudar ou estou tentando garantir meu lugar sendo útil?",
  },

  "Tiago filho de Zebedeu — Vetor da Intensidade": {
    description: "Perfil de força, intensidade, defesa e posicionamento.",
    functioning_reading:
      "Seu funcionamento tende a sustentar posições com firmeza e energia. O ponto central é observar se a força está servindo à direção ou à rigidez.",
    attention_point:
      "Cuidado com reações duras quando a realidade parece lenta, injusta ou desalinhada com o que você esperava.",
    potential:
      "Determinação, coragem para defender valores e resistência diante de pressão.",
    observation_focus:
      "Observe quando sua firmeza se transforma em dureza.",
    self_observation_question:
      "Eu estou defendendo algo importante ou apenas reagindo contra uma frustração?",
  },

  "João filho de Zebedeu — Vetor da Profundidade": {
    description: "Perfil de vínculo, profundidade emocional e lealdade afetiva.",
    functioning_reading:
      "Seu funcionamento tende a buscar profundidade, presença e conexão. O ponto central é observar quando a necessidade de vínculo aumenta sua vulnerabilidade à dor da distância.",
    attention_point:
      "Cuidado com dependência emocional de sinais de presença, aprovação ou proximidade.",
    potential:
      "Afeto profundo, lealdade, sensibilidade e capacidade de sustentar vínculos verdadeiros.",
    observation_focus:
      "Observe quando a ausência do outro começa a definir seu estado interno.",
    self_observation_question:
      "Eu estou buscando conexão real ou tentando confirmar se ainda sou importante?",
  },

  "Filipe — Vetor da Análise": {
    description: "Perfil de compreensão, análise e busca por clareza concreta.",
    functioning_reading:
      "Seu funcionamento tende a buscar explicação, evidência e estrutura antes de confiar. O ponto central é observar se a necessidade de entender está ajudando ou paralisando.",
    attention_point:
      "Cuidado com adiamento constante da ação porque ainda falta uma explicação perfeita.",
    potential:
      "Clareza racional, organização de ideias e capacidade de tornar o abstrato compreensível.",
    observation_focus:
      "Observe quando você usa análise para avançar e quando usa análise para não se expor.",
    self_observation_question:
      "Eu preciso mesmo de mais clareza ou estou usando a dúvida para não agir?",
  },

  "Natanael/Bartolomeu — Vetor da Inteireza": {
    description: "Perfil de autenticidade, coerência e rejeição à falsidade.",
    functioning_reading:
      "Seu funcionamento tende a valorizar verdade, integridade e coerência. O ponto central é observar se a busca por autenticidade não está virando intolerância com ambiguidades humanas.",
    attention_point:
      "Cuidado com julgamentos rápidos quando percebe contradições nos outros.",
    potential:
      "Lealdade, transparência, sinceridade e capacidade de reconhecer o que é verdadeiro.",
    observation_focus:
      "Observe quando sua exigência de verdade aproxima e quando afasta.",
    self_observation_question:
      "Eu estou buscando coerência ou estou usando a verdade como defesa?",
  },

  "Mateus/Levi — Vetor da Inclusão": {
    description: "Perfil de análise prática, organização e leitura de sistemas.",
    functioning_reading:
      "Seu funcionamento tende a perceber estruturas, trocas e consequências. O ponto central é observar se a análise está servindo à consciência ou ao controle.",
    attention_point:
      "Cuidado com distanciamento emocional por excesso de cálculo, controle ou autoproteção.",
    potential:
      "Capacidade de organizar dados, perceber padrões e transformar experiência em leitura prática.",
    observation_focus:
      "Observe quando você entende muito, mas sente pouco ou expressa pouco.",
    self_observation_question:
      "Eu estou analisando para compreender ou para não entrar em contato com o que sinto?",
  },

  "Tomé — Vetor da Evidência": {
    description: "Perfil de cautela, dúvida, verificação e compromisso profundo.",
    functioning_reading:
      "Seu funcionamento tende a buscar segurança antes de se entregar. O ponto central é observar se a dúvida está protegendo sua lucidez ou mantendo você distante da vida.",
    attention_point:
      "Cuidado para não transformar necessidade de confirmação em bloqueio permanente.",
    potential:
      "Profundidade, prudência, compromisso real depois da confiança e busca honesta por verdade.",
    observation_focus:
      "Observe quando sua dúvida é investigação e quando é medo de confiar.",
    self_observation_question:
      "Eu estou buscando verdade ou tentando evitar vulnerabilidade?",
  },

  "Tiago filho de Alfeu — Vetor da Sustentação": {
    description: "Perfil de discrição, permanência e presença silenciosa.",
    functioning_reading:
      "Seu funcionamento tende a permanecer, observar e sustentar sem exigir destaque. O ponto central é observar se a discrição não está escondendo suas necessidades.",
    attention_point:
      "Cuidado com invisibilidade emocional e dificuldade de pedir espaço.",
    potential:
      "Constância, humildade, resistência silenciosa e confiabilidade.",
    observation_focus:
      "Observe quando você se adapta demais para não incomodar.",
    self_observation_question:
      "Eu estou sendo discreto por escolha ou por medo de ocupar espaço?",
  },

  "Tadeu — Vetor do Sentido": {
    description: "Perfil de pergunta, busca de sentido e necessidade de direção.",
    functioning_reading:
      "Seu funcionamento tende a buscar explicação, sentido e direção. O ponto central é observar se a pergunta abre caminho ou vira inquietação repetitiva.",
    attention_point:
      "Cuidado com ansiedade por respostas quando a realidade ainda pede processo.",
    potential:
      "Capacidade de investigar, aprofundar e encontrar sentido em experiências confusas.",
    observation_focus:
      "Observe quando sua pergunta nasce de busca real e quando nasce de insegurança.",
    self_observation_question:
      "Eu quero compreender o caminho ou quero uma resposta para não sentir incerteza?",
  },

  "Simão, o Zelote — Vetor da Causa": {
    description: "Perfil de causa, intensidade, missão e inconformismo.",
    functioning_reading:
      "Seu funcionamento tende a se mover por convicção e senso de missão. O ponto central é observar se a causa está organizada ou se virou descarga de tensão.",
    attention_point:
      "Cuidado com conflitos criados pela necessidade de combater algo o tempo todo.",
    potential:
      "Energia de transformação, coragem, posicionamento e força para mobilizar mudanças.",
    observation_focus:
      "Observe quando sua intensidade constrói e quando apenas confronta.",
    self_observation_question:
      "Eu estou servindo a uma causa ou usando uma causa para dar destino à minha raiva?",
  },

  "Judas Iscariotes — Vetor Interrompido": {
    description:
      "Perfil de controle, expectativa frustrada e conflitos internos escondidos.",
    functioning_reading:
      "Seu funcionamento tende a tentar controlar a realidade quando expectativas profundas são frustradas. O ponto central é observar o que fica escondido por trás da estratégia.",
    attention_point:
      "Cuidado com manipulação, fechamento emocional e tentativas indiretas de resolver frustrações.",
    potential:
      "Quando consciente, pode desenvolver lucidez sobre desejo, intenção, expectativa e consequência.",
    observation_focus:
      "Observe quando você tenta controlar a cena em vez de nomear sua frustração.",
    self_observation_question:
      "O que eu não estou conseguindo dizer diretamente e estou tentando resolver por controle?",
  },
};
export default function TestePage() {
  const router = useRouter();

  const [carregandoAcesso, setCarregandoAcesso] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [userId, setUserId] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

  const [respostas, setRespostas] = useState<Respostas>({});
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

      if (role !== "paciente") {
        router.replace("/clinico/painel");
        return;
      }

      setUserId(usuarioAtual.user.id);
      setNomeUsuario(perfil.name || "");
      setCarregandoAcesso(false);
    }

    verificarAcesso();
  }, [router]);

  const totalRespondidas = useMemo(() => {
    return Object.keys(respostas).length;
  }, [respostas]);

  const progresso = Math.round((totalRespondidas / perguntas.length) * 100);

  function alterarResposta(perguntaId: number, valor: number) {
    setRespostas((estadoAtual) => ({
      ...estadoAtual,
      [perguntaId]: valor,
    }));
  }

  function calcularResultado() {
    const scoreMap: Record<string, number> = {};

    for (const pergunta of perguntas) {
      const valor = respostas[pergunta.id] || 0;
      scoreMap[pergunta.perfil] = (scoreMap[pergunta.perfil] || 0) + valor;
    }

    const perfisOrdenados = Object.entries(scoreMap).sort(
      (a, b) => b[1] - a[1]
    );

    const perfilPredominante = perfisOrdenados[0]?.[0] as Perfil;
    const perfisSecundarios = perfisOrdenados
      .slice(1, 4)
      .filter(([, pontuacao]) => pontuacao > 0)
      .map(([perfil]) => perfil);

    return {
      scoreMap,
      perfilPredominante,
      perfisSecundarios,
    };
  }

  async function handleEnviarTeste(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!userId) {
      setErro("Usuário não identificado. Faça login novamente.");
      return;
    }

    if (totalRespondidas < perguntas.length) {
      setErro("Responda todas as 36 perguntas antes de finalizar o teste.");
      return;
    }

    const { scoreMap, perfilPredominante, perfisSecundarios } =
      calcularResultado();

    const leitura = leiturasPorPerfil[perfilPredominante];

    setSalvando(true);

    try {
      const answers = perguntas.map((pergunta) => ({
        question_id: pergunta.id,
        profile: pergunta.perfil,
        answer: respostas[pergunta.id],
        question: pergunta.texto,
      }));

      const { error } = await supabase.from("vpp_test_results").insert({
        user_id: userId,
        predominant_profile: perfilPredominante,
        secondary_profiles: perfisSecundarios,
        score_map: scoreMap,
        answers,
        description: leitura.description,
        functioning_reading: leitura.functioning_reading,
        attention_point: leitura.attention_point,
        potential: leitura.potential,
        observation_focus: leitura.observation_focus,
        self_observation_question: leitura.self_observation_question,
      });

      if (error) {
        setErro("Não foi possível salvar o resultado do teste.");
        return;
      }

      setSucesso(
        `Teste salvo com sucesso. Sua leitura inicial foi organizada a partir do perfil predominante: ${perfilPredominante}.`
      );

      setTimeout(() => {
        router.push("/resultado");
      }, 1800);
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

          <h1 className="mt-3 text-2xl font-semibold">Carregando teste...</h1>

          <p className="mt-3 text-sm leading-6 text-[#5F564C]">
            Estamos confirmando seu perfil antes de abrir o teste VPP.
          </p>
        </div>
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
                Teste VPP
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl">
                36 perguntas para observar seu padrão
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F564C]">
              {nomeUsuario
  ? `${nomeUsuario}, responda considerando seu funcionamento mais frequente, não a resposta que pareceria ideal.`
  : "Responda considerando seu funcionamento mais frequente, não a resposta que pareceria ideal."}  
              </p>
            </div>

            <Link
              href="/painel"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE] lg:w-auto"
            >
              Voltar ao painel
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#8A7A68]">
                Progresso do teste
              </p>

              <p className="mt-1 text-lg font-semibold text-[#2F2A24]">
                {totalRespondidas} de {perguntas.length} perguntas respondidas
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] px-4 py-3 text-sm font-semibold text-[#8A2E2B]">
              {progresso}%
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#F7F3EC]">
            <div
              className="h-full rounded-full bg-[#2F2A24] transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-[#5F564C]">
  Marque de 1 a 5 o quanto cada frase se aproxima da forma como você costuma
  funcionar na prática.
</p>
        </section>

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

        <form onSubmit={handleEnviarTeste} className="space-y-4">
          {perguntas.map((pergunta) => (
            <article
              key={pergunta.id}
              className="rounded-3xl border border-[#E5DDD2] bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#8A2E2B]">
                    Pergunta {pergunta.id}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#2F2A24]">
                    {pergunta.texto}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((valor) => {
                  const selecionado = respostas[pergunta.id] === valor;

                  return (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => alterarResposta(pergunta.id, valor)}
                      className={`min-h-11 rounded-2xl border px-2 text-sm font-semibold transition ${
                        selecionado
                          ? "border-[#2F2A24] bg-[#2F2A24] text-white"
                          : "border-[#D8C7B1] bg-[#F7F3EC] text-[#5F564C] hover:bg-[#FFF8EE]"
                      }`}
                    >
                      {valor}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#8A7A68]">
                <p>1 = quase nunca</p>
                <p className="text-right">5 = muito parecido comigo</p>
              </div>
            </article>
          ))}

          <section className="sticky bottom-0 -mx-4 border-t border-[#E5DDD2] bg-[#F7F3EC]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <button
              type="submit"
              disabled={salvando}
              className="min-h-11 w-full rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Salvando resultado..." : "Finalizar teste VPP"}
            </button>
          </section>
        </form>
      </section>
    </main>
  );
}