"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "paciente" | "terapeuta" | "ambos";

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
    description:
    "Você tende a funcionar com uma necessidade forte de demonstrar presença, valor e lealdade. Existe em você uma energia de resposta rápida, coragem e disposição para se posicionar. Muitas vezes, você não quer apenas sentir que está comprometido; você precisa provar isso por meio de atitudes, decisões, enfrentamentos ou sacrifícios. Esse padrão pode fazer com que você entre intensamente nas situações, principalmente quando sente que sua identidade, sua importância ou sua fidelidade estão sendo colocadas em dúvida.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como impulso para agir antes de elaborar, defender antes de escutar tudo, prometer mais do que consegue sustentar ou tentar mostrar força quando, por dentro, existe insegurança. Você pode ter grande capacidade de iniciativa, mas também pode sofrer quando percebe que não conseguiu manter aquilo que declarou com tanta certeza. O conflito costuma surgir entre a imagem de força que você tenta sustentar e os limites reais que aparecem no caminho.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a necessidade de provar valor começa a comandar suas decisões. Nem toda situação exige uma demonstração imediata. Às vezes, maturidade não está em reagir com força, mas em reconhecer o próprio limite antes que ele vire queda, culpa ou arrependimento.",
  
  potential:
    "Seu potencial está na coragem, na prontidão e na capacidade de recomeçar depois de perceber seus próprios excessos. Quando esse vetor fica mais consciente, você deixa de viver tentando provar quem é e começa a sustentar sua identidade com mais estabilidade, humildade e presença real.",
  
  observation_focus:
    "Observe situações em que você sente necessidade de responder rápido, se defender, se afirmar ou mostrar que é forte.",
  
  self_observation_question:
    "Estou agindo porque isso é realmente necessário ou porque sinto que preciso provar meu valor para alguém?", 
  },

  "André — Vetor da Ponte": {
    description:
    "Você tende a funcionar como alguém que percebe caminhos entre pessoas, ideias e situações. Existe em você uma disposição para aproximar, traduzir e criar ligação onde outros enxergam distância. Esse padrão pode fazer com que você assuma, muitas vezes sem perceber, o papel de ponte entre mundos diferentes: entre quem fala e quem não consegue se expressar, entre quem decide e quem precisa ser incluído, entre o que está separado e o que ainda pode ser conectado.",
  
  functioning_reading:
    "Na prática, esse funcionamento costuma aparecer quando você sente necessidade de facilitar relações, explicar intenções, evitar rupturas ou ajudar alguém a encontrar o próprio lugar. Você pode ter facilidade para perceber o que está faltando em uma conversa, em um grupo ou em uma situação. O risco é começar a medir seu valor pela sua capacidade de unir, ajudar ou sustentar vínculos. Quando isso acontece, você pode se envolver demais em problemas que não são seus, carregar tensões de outras pessoas e sentir culpa quando não consegue manter todos próximos ou em paz.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a ponte começa a virar peso. Aproximar pessoas é uma força, mas não significa que você precisa atravessar por elas, decidir por elas ou impedir toda distância. Algumas separações são necessárias, algumas escolhas pertencem ao outro, e nem toda ruptura é sinal de fracasso seu.",
  
  potential:
    "Seu potencial está na capacidade de criar conexão com sensibilidade e presença. Quando esse vetor está mais consciente, você consegue aproximar sem se perder, ajudar sem assumir tudo, traduzir sem manipular e participar das relações sem abandonar seus próprios limites.",
  
  observation_focus:
    "Observe em quais situações você sente que precisa resolver, unir ou explicar algo para que os outros fiquem bem.",
  
  self_observation_question:
    "Estou ajudando a construir uma ponte ou estou tentando carregar sozinho uma travessia que também pertence ao outro?", 
  },

  "Tiago filho de Zebedeu — Vetor da Intensidade": {
    description:
    "Você tende a funcionar com intensidade emocional, senso de urgência e forte envolvimento com aquilo que considera importante. Quando algo toca seu valor, sua justiça, sua família, sua fé, seu projeto ou sua identidade, dificilmente isso passa de forma neutra por dentro. Esse padrão pode fazer com que você viva as experiências com força, profundidade e reação imediata, como se algumas situações pedissem uma resposta à altura do impacto que causaram em você.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como dedicação intensa, fala firme, reações fortes, dificuldade de esperar o tempo das coisas ou incômodo diante de pessoas que parecem frias, lentas ou indiferentes. Você pode carregar uma energia potente para defender, construir e se entregar, mas também pode se desgastar quando transforma toda frustração em urgência e toda diferença em confronto interno. O sofrimento costuma aparecer quando a realidade não acompanha a velocidade ou a força da sua expectativa.",
  
  attention_point:
    "O ponto de atenção está em perceber quando sua intensidade deixa de servir à construção e começa a dominar sua leitura das situações. Sentir muito não é erro. O problema é quando a força do sentimento decide tudo antes que você consiga compreender o que realmente está acontecendo.",
  
  potential:
    "Seu potencial está na paixão direcionada, na coragem de se envolver e na capacidade de colocar energia onde muitos permaneceriam passivos. Quando esse vetor está mais organizado, sua intensidade deixa de ser explosão e se transforma em presença, firmeza, proteção e compromisso maduro.",
  
  observation_focus:
    "Observe situações em que sua reação parece maior do que o fato imediato, principalmente quando há frustração, demora, injustiça ou sensação de desrespeito.",
  
  self_observation_question:
    "Minha intensidade está me ajudando a agir com verdade ou está me fazendo reagir antes de compreender?", 
  },

  "João filho de Zebedeu — Vetor da Profundidade": {
    description:
    "Você tende a funcionar com uma percepção mais profunda das relações, dos sentimentos e dos significados por trás das experiências. Nem sempre você se prende apenas ao que foi dito ou feito; muitas vezes, percebe o clima, a intenção, a ausência, a mudança de tom e aquilo que ficou escondido nas entrelinhas. Esse padrão pode fazer com que você viva os vínculos com muita intensidade interna, buscando sentido, conexão verdadeira e coerência emocional.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como sensibilidade para perceber pessoas, profundidade afetiva, necessidade de vínculos verdadeiros e dificuldade com relações superficiais. Você pode captar detalhes que outros ignoram, mas também pode sofrer por interpretar demais, guardar demais ou esperar que o outro tenha a mesma profundidade com que você sente. O conflito costuma surgir quando sua leitura interna fica mais forte do que os fatos disponíveis, fazendo você sofrer por sinais, silêncios ou distâncias que talvez ainda precisem ser compreendidos com mais calma.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a profundidade vira peso. Sentir profundamente é uma força, mas pode se tornar sofrimento quando tudo precisa ter um significado oculto, quando todo silêncio vira rejeição ou quando toda distância é interpretada como perda de valor.",
  
  potential:
    "Seu potencial está na capacidade de enxergar pessoas e experiências com sensibilidade, presença e profundidade. Quando esse vetor está mais consciente, você consegue transformar percepção em cuidado, escuta e vínculo maduro, sem se perder em interpretações que aumentam sua dor.",
  
  observation_focus:
    "Observe situações em que você percebe sinais pequenos, mudanças de tom, silêncios ou distâncias e começa a construir internamente uma explicação antes de confirmar os fatos.",
  
  self_observation_question:
    "Estou percebendo algo real ou estou preenchendo o silêncio do outro com uma dor que já existia em mim?",
  },

  "Filipe — Vetor da Análise": {
    description:
    "Você tende a funcionar buscando clareza, explicação e organização antes de se entregar totalmente a uma decisão ou experiência. Existe em você uma necessidade de entender como as coisas funcionam, qual é o caminho, quais são os riscos e se aquilo faz sentido de forma concreta. Esse padrão pode trazer prudência, lucidez e capacidade de análise, mas também pode gerar travamento quando a mente exige garantias demais antes de permitir movimento.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como tendência a perguntar, comparar, calcular possibilidades, revisar decisões e procurar uma explicação segura para aquilo que sente ou precisa fazer. Você pode ter boa capacidade de observar detalhes e evitar impulsos, mas também pode sofrer quando transforma toda escolha em um problema que precisa ser resolvido perfeitamente. O conflito costuma surgir quando a necessidade de entender tudo impede você de viver, decidir ou confiar em processos que ainda não estão completamente claros.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a análise deixa de iluminar o caminho e começa a adiar a caminhada. Pensar é importante, mas nem toda decisão terá garantia total. Às vezes, a busca por segurança vira uma forma discreta de medo.",
  
  potential:
    "Seu potencial está na lucidez, na capacidade de organizar ideias e na habilidade de transformar confusão em compreensão. Quando esse vetor está mais consciente, você usa a análise como ferramenta de direção, não como prisão. Você aprende a pensar com profundidade sem perder a capacidade de agir.",
  
  observation_focus:
    "Observe situações em que você sente que precisa entender tudo, prever tudo ou ter certeza absoluta antes de dar um passo.",
  
  self_observation_question:
    "Estou analisando para agir melhor ou estou usando a análise para evitar o risco de decidir?",
  },

  "Natanael/Bartolomeu — Vetor da Inteireza": {
    description:
    "Você tende a funcionar com uma busca forte por verdade, coerência e autenticidade. Existe em você uma necessidade de que as coisas façam sentido por inteiro, sem falsidade, manipulação ou aparência forçada. Esse padrão pode fazer com que você tenha dificuldade em aceitar ambientes, relações ou discursos que parecem contraditórios. Para você, não basta parecer correto; precisa ser verdadeiro por dentro.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como franqueza, observação crítica, incômodo com hipocrisia e desejo de relações mais limpas e diretas. Você pode ter boa capacidade de perceber incoerências, mas também pode se fechar rápido quando sente que alguém não é confiável ou quando uma situação parece artificial. O conflito costuma surgir quando sua busca por inteireza se transforma em rigidez, fazendo com que você descarte pessoas, oportunidades ou processos antes de compreender melhor suas camadas.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a busca por verdade começa a virar defesa. Ser inteiro não significa exigir perfeição absoluta dos outros. Pessoas reais são contraditórias, imaturas em alguns pontos e ainda assim podem estar em processo sincero de mudança.",
  
  potential:
    "Seu potencial está na autenticidade, na honestidade interna e na capacidade de sustentar relações e decisões com coerência. Quando esse vetor está mais consciente, você consegue discernir o que é falso sem se tornar duro, preservar sua verdade sem se isolar e buscar inteireza sem exigir perfeição de tudo.",
  
  observation_focus:
    "Observe situações em que você sente rejeição imediata por perceber incoerência, falsidade, exagero ou contradição em alguém.",
  
  self_observation_question:
    "Estou protegendo minha verdade ou estou usando minha exigência de coerência para me afastar antes de compreender melhor?", 
  },

  "Mateus/Levi — Vetor da Inclusão": {
    description:
    "Você tende a funcionar com uma sensibilidade especial para pertencimento, aceitação e reconstrução de valor pessoal. Existe em você uma percepção forte sobre estar dentro ou fora, ser reconhecido ou rejeitado, ser visto apenas pelo passado ou pelo que ainda pode se tornar. Esse padrão pode fazer com que você valorize muito os espaços onde se sente recebido, mas também pode gerar medo de exclusão, necessidade de compensar erros antigos ou tentativa de provar que merece um novo lugar.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como desejo de recomeçar, busca por aceitação, atenção ao modo como os outros olham para você e esforço para ser útil, confiável ou necessário. Você pode ter grande capacidade de acolher pessoas que também se sentem deslocadas, justamente porque conhece o peso de não se sentir plenamente incluído. O conflito costuma surgir quando sua história, suas falhas ou antigas marcas passam a definir demais sua forma de se enxergar. Nesses momentos, você pode tentar se encaixar a qualquer custo ou se afastar antes que alguém confirme uma rejeição que você já teme.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a necessidade de ser aceito começa a enfraquecer sua liberdade interna. Pertencer é importante, mas não deve exigir que você apague sua história, force uma imagem perfeita ou aceite qualquer lugar só para não se sentir excluído.",
  
  potential:
    "Seu potencial está na capacidade de reconstrução, acolhimento e transformação de história. Quando esse vetor está mais consciente, você deixa de viver tentando provar que merece estar ali e começa a ocupar seu lugar com mais verdade, maturidade e dignidade.",
  
  observation_focus:
    "Observe situações em que você sente medo de ser deixado de fora, julgado pelo passado ou visto como insuficiente.",
  
  self_observation_question:
    "Estou buscando pertencimento com verdade ou estou tentando ser aceito ao custo de esconder partes importantes de mim?",
  },

  "Tomé — Vetor da Evidência": {
    description:
    "Você tende a funcionar buscando confirmação, consistência e sinais concretos antes de confiar plenamente. Existe em você uma necessidade de não se entregar apenas por discurso, promessa ou aparência. Esse padrão pode trazer prudência e honestidade intelectual, porque você não aceita facilmente respostas prontas. Ao mesmo tempo, pode gerar sofrimento quando a necessidade de evidência se transforma em dificuldade de confiar, mesmo diante de vínculos, processos ou experiências que ainda estão se construindo.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como perguntas diretas, necessidade de provas, cautela antes de acreditar e resistência a conclusões apressadas. Você pode ter boa capacidade de perceber inconsistências e evitar ilusões, mas também pode ficar preso na exigência de confirmação total. O conflito costuma surgir quando você até deseja confiar, pertencer ou avançar, mas uma parte sua continua dizendo que ainda falta algo, ainda falta prova, ainda falta segurança. Isso pode fazer você parecer frio ou resistente, quando na verdade muitas vezes está tentando se proteger de uma decepção.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a busca por evidência deixa de ser discernimento e começa a virar defesa contra a vulnerabilidade. Nem tudo que é real aparece completo de imediato. Algumas certezas só amadurecem quando você participa do processo, não quando espera todas as garantias de fora.",
  
  potential:
    "Seu potencial está na honestidade, na clareza e na capacidade de buscar uma confiança mais madura, que não depende de ingenuidade. Quando esse vetor está mais consciente, você aprende a perguntar sem se fechar, verificar sem paralisar e confiar sem abandonar o discernimento.",
  
  observation_focus:
    "Observe situações em que você sente que precisa de mais provas, mais confirmação ou mais garantia antes de se permitir confiar ou avançar.",
  
  self_observation_question:
    "Estou buscando evidência para enxergar melhor ou estou exigindo uma prova impossível para não precisar me envolver?",  
  },

  "Tiago filho de Alfeu — Vetor da Sustentação": {
    description:
    "Você tende a funcionar de forma discreta, constante e sustentadora. Existe em você uma capacidade de permanecer, cumprir, apoiar e manter processos que talvez não recebam tanta visibilidade. Esse padrão pode fazer com que você seja alguém confiável, presente e necessário nos bastidores. Ao mesmo tempo, pode gerar sofrimento quando sua constância é confundida com obrigação, quando sua presença é pouco reconhecida ou quando você se acostuma a sustentar tudo em silêncio.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como responsabilidade, paciência, lealdade e disposição para fazer o que precisa ser feito, mesmo sem aplauso. Você pode ser a pessoa que mantém a rotina, segura detalhes, lembra compromissos e evita que as coisas desmoronem. O conflito costuma surgir quando você começa a acreditar que só tem valor se estiver sustentando algo ou alguém. Nesses momentos, pode engolir cansaço, evitar pedir ajuda e continuar funcionando mesmo quando por dentro já passou do limite.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a sustentação vira invisibilidade. Ser constante é uma força, mas não significa aceitar sobrecarga, ausência de reconhecimento ou relações onde você apenas mantém tudo funcionando enquanto suas necessidades ficam sempre por último.",
  
  potential:
    "Seu potencial está na firmeza silenciosa, na confiabilidade e na capacidade de construir segurança ao longo do tempo. Quando esse vetor está mais consciente, você aprende a sustentar sem se apagar, servir sem se anular e permanecer sem carregar sozinho aquilo que precisa ser compartilhado.",
  
  observation_focus:
    "Observe situações em que você continua sustentando responsabilidades mesmo cansado, calado ou sem se sentir reconhecido.",
  
  self_observation_question:
    "Estou sustentando algo por escolha consciente ou porque aprendi que meu valor depende de continuar aguentando?", 
  },

  "Tadeu — Vetor do Sentido": {
    description:
    "Você tende a funcionar buscando sentido, direção e coerência maior para aquilo que vive. Nem sempre basta cumprir uma tarefa, manter uma rotina ou seguir um caminho porque todos seguem. Algo em você precisa entender por que aquilo importa, para onde aponta e qual valor existe por trás da experiência. Esse padrão pode fazer com que você tenha sensibilidade para perguntas profundas, mas também pode gerar inquietação quando a vida parece repetitiva, vazia ou desconectada de um propósito mais claro.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como necessidade de compreender o significado das situações, das escolhas, das dores e dos vínculos. Você pode se sentir mais vivo quando percebe que está contribuindo para algo que faz sentido, mas pode se desanimar quando tudo parece mecânico, superficial ou sem direção. O conflito costuma surgir quando a busca por sentido se transforma em peso: você começa a exigir que cada fase da vida entregue uma resposta completa, e quando isso não acontece, pode sentir confusão, frustração ou sensação de estar fora do lugar.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a busca por sentido deixa de orientar e começa a paralisar. Nem toda fase revela seu significado de imediato. Às vezes, o sentido não aparece antes da caminhada; ele vai sendo construído enquanto você observa, escolhe, permanece e reorganiza sua própria leitura da vida.",
  
  potential:
    "Seu potencial está na capacidade de formular perguntas importantes, buscar direção e conectar experiências isoladas a uma visão mais ampla. Quando esse vetor está mais consciente, você deixa de depender de respostas prontas e aprende a construir sentido com mais maturidade, sem negar a realidade concreta do presente.",
  
  observation_focus:
    "Observe situações em que você se sente desanimado, confuso ou desconectado porque não consegue enxergar claramente o sentido daquilo que está vivendo.",
  
  self_observation_question:
    "Estou buscando sentido para caminhar melhor ou estou exigindo uma resposta completa antes de dar o próximo passo?",  
  },

  "Simão, o Zelote — Vetor da Causa": {
    description:
    "Você tende a funcionar com forte ligação a causas, princípios, valores e convicções. Existe em você uma energia voltada para defender aquilo que considera justo, verdadeiro ou necessário. Esse padrão pode dar força, coragem e senso de direção, principalmente quando você acredita que algo precisa ser protegido ou transformado. Ao mesmo tempo, pode gerar tensão quando a causa fica tão grande por dentro que começa a ocupar o lugar do diálogo, da escuta e da flexibilidade.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer como posicionamento firme, incômodo diante de injustiças, necessidade de defender ideias e dificuldade de ficar neutro quando algo fere seus valores. Você pode ter grande capacidade de mobilização e compromisso, mas também pode sofrer quando percebe o mundo como campo de ameaça constante. O conflito costuma surgir quando pessoas deixam de ser vistas em sua complexidade e passam a ser lidas apenas como aliadas, opositoras ou indiferentes àquilo que você defende.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a causa começa a endurecer sua escuta. Ter convicção é uma força, mas quando tudo vira combate, até relações importantes podem ser interpretadas como disputa. Nem toda discordância é ameaça, nem toda diferença é traição, e nem toda pausa significa abandono daquilo em que você acredita.",
  
  potential:
    "Seu potencial está na coragem, na fidelidade a valores e na capacidade de se comprometer com algo maior que interesses imediatos. Quando esse vetor está mais consciente, você consegue defender causas sem perder humanidade, sustentar convicções sem destruir vínculos e transformar indignação em ação organizada.",
  
  observation_focus:
    "Observe situações em que você sente necessidade de defender uma ideia, corrigir alguém ou se posicionar com força diante de algo que considera errado.",
  
  self_observation_question:
    "Estou defendendo uma causa com consciência ou estou transformando toda diferença em ameaça?", 
  },

  "Judas Iscariotes — Vetor Interrompido": {
    description:
    "Você tende a funcionar com uma tensão interna entre expectativa, controle e frustração. Pode existir em você uma necessidade forte de que as coisas sigam determinada direção, produzam determinado resultado ou confirmem uma expectativa que parecia muito importante. Quando isso não acontece, o impacto pode ser profundo. Esse padrão não fala de caráter, culpa ou condenação. Fala de um funcionamento em que a frustração pode fechar a escuta, endurecer a percepção e interromper processos que ainda poderiam ser compreendidos, conversados ou reorganizados.",
  
  functioning_reading:
    "Na prática, esse funcionamento pode aparecer quando você investe muito em uma ideia, relação, projeto ou expectativa e, ao perceber que a realidade não corresponde ao que esperava, sente decepção, irritação, perda de sentido ou vontade de se afastar. Em alguns momentos, a dor da expectativa frustrada pode virar controle, silêncio, cálculo, fechamento emocional ou decisão tomada por dentro antes de ser conversada por fora. O conflito costuma surgir quando uma parte sua ainda deseja vínculo, pertencimento ou resultado, mas outra parte já começou a se proteger pela ruptura, pela desconfiança ou pela tentativa de controlar o desfecho.",
  
  attention_point:
    "O ponto de atenção está em perceber quando a frustração começa a decidir por você. Quando uma expectativa muito forte é quebrada, existe o risco de interpretar tudo como perda, engano ou impossibilidade. Nesse estado, decisões podem ser tomadas a partir da dor, não da clareza. O cuidado principal é não transformar uma decepção em sentença definitiva sobre você, sobre o outro ou sobre o caminho inteiro.",
  
  potential:
    "Seu potencial está na possibilidade de transformar fechamento em consciência. Quando esse vetor é observado com honestidade, ele pode revelar expectativas antigas, feridas de controle, medo de perder valor e formas de proteção que já não ajudam. A reorganização começa quando você consegue nomear a frustração antes de agir por ela, abrir conversa antes de romper por dentro e reconhecer que nem toda expectativa frustrada precisa terminar em interrupção.",
  
  observation_focus:
    "Observe situações em que uma expectativa quebrada faz você se fechar, controlar, calcular, desconfiar ou decidir se afastar antes de conversar com clareza.",
  
  self_observation_question:
    "Estou enxergando a realidade com clareza ou estou deixando uma expectativa frustrada decidir o final da história por mim?",
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

  const totalRespondidas = useMemo(() => {
    return Object.keys(respostas).length;
  }, [respostas]);

  const progresso = Math.round((totalRespondidas / perguntas.length) * 100);
  const perguntasFaltantes = perguntas.length - totalRespondidas;
  const testeCompleto = totalRespondidas === perguntas.length;
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
    <main className="min-h-screen bg-[#F6F0E8] px-4 py-6 text-[#2F2A24] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
      <header className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm">
  <div className="border-b border-[#E5DDD2] p-5 sm:p-7">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A7A68]">
          Teste VPP — Vetor Psíquico Primário
        </p>

        <h1 className="break-words text-2xl font-semibold tracking-tight text-[#2F2A24] sm:text-3xl [overflow-wrap:anywhere]">
          36 perguntas para observar seu padrão de funcionamento
        </h1>

        <p className="max-w-3xl text-sm leading-relaxed text-[#6F6257]">
          {nomeUsuario
            ? `${nomeUsuario}, responda pensando na forma como você costuma funcionar na prática, principalmente em situações de pressão, vínculo, escolha, frustração e expectativa.`
            : "Responda pensando na forma como você costuma funcionar na prática, principalmente em situações de pressão, vínculo, escolha, frustração e expectativa."}
        </p>
      </div>

      <Link
        href="/painel"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#F7F3EC] lg:w-auto"
      >
        Voltar ao painel
      </Link>
    </div>
  </div>

  <div className="grid gap-4 bg-[#FFF8EE] p-5 sm:p-7 md:grid-cols-3">
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#2F2A24]">
        Não responda o ideal
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        Marque o que mais se aproxima do seu funcionamento real, não da resposta
        que pareceria mais correta.
      </p>
    </article>

    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#2F2A24]">
        Observe repetições
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        Pense em situações que se repetem na sua vida: relações, escolhas,
        reações, conflitos e formas de se proteger.
      </p>
    </article>

    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#2F2A24]">
        Não é diagnóstico
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        O resultado organiza uma leitura inicial de padrão. A compreensão mais
        profunda deve ser construída no acompanhamento clínico.
      </p>
    </article>
  </div>
</header>

<section className="mb-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-medium text-[#8A7A68]">
        Progresso do teste
      </p>

      <p className="mt-1 text-lg font-semibold text-[#2F2A24]">
        {totalRespondidas} de {perguntas.length} perguntas respondidas
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        {testeCompleto
          ? "Todas as perguntas foram respondidas. Você já pode finalizar o teste."
          : `Ainda faltam ${perguntasFaltantes} pergunta(s). Responda com calma, sem tentar forçar um perfil.`}
      </p>
    </div>

    <div className="flex items-center gap-3">
      <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] px-4 py-3 text-sm font-semibold text-[#8A2E2B]">
        {progresso}%
      </div>
    </div>
  </div>

  <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#F7F3EC]">
    <div
      className="h-full rounded-full bg-[#2F2A24] transition-all"
      style={{ width: `${progresso}%` }}
    />
  </div>

  <div className="mt-5 grid gap-3 sm:grid-cols-5">
    <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-3 text-center">
      <p className="text-sm font-semibold text-[#2F2A24]">1</p>
      <p className="mt-1 text-xs text-[#8A7A68]">Quase nunca</p>
    </div>

    <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-3 text-center">
      <p className="text-sm font-semibold text-[#2F2A24]">2</p>
      <p className="mt-1 text-xs text-[#8A7A68]">Pouco</p>
    </div>

    <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-3 text-center">
      <p className="text-sm font-semibold text-[#2F2A24]">3</p>
      <p className="mt-1 text-xs text-[#8A7A68]">Às vezes</p>
    </div>

    <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-3 text-center">
      <p className="text-sm font-semibold text-[#2F2A24]">4</p>
      <p className="mt-1 text-xs text-[#8A7A68]">Frequentemente</p>
    </div>

    <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] p-3 text-center">
      <p className="text-sm font-semibold text-[#2F2A24]">5</p>
      <p className="mt-1 text-xs text-[#8A7A68]">Muito parecido</p>
    </div>
  </div>
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
  {perguntas.map((pergunta) => {
    const respondida = typeof respostas[pergunta.id] === "number";

    return (
      <article
        key={pergunta.id}
        className={`rounded-3xl border p-5 shadow-sm transition sm:p-6 ${
          respondida
            ? "border-[#D8C7B1] bg-white"
            : "border-[#E5DDD2] bg-white"
        }`}
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="rounded-2xl bg-[#F7F3EC] px-3 py-1 text-xs font-semibold text-[#8A2E2B]">
                Pergunta {pergunta.id}
              </p>

              <span
                className={`rounded-2xl border px-3 py-1 text-xs font-semibold ${
                  respondida
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-[#D8C7B1] bg-white text-[#8A7A68]"
                }`}
              >
                {respondida ? "Respondida" : "Pendente"}
              </span>
            </div>

            <p className="mt-4 break-words text-base leading-7 text-[#2F2A24] [overflow-wrap:anywhere]">
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
                aria-label={`Responder ${valor} na pergunta ${pergunta.id}`}
                className={`min-h-12 rounded-2xl border px-2 text-sm font-semibold transition ${
                  selecionado
                    ? "border-[#2F2A24] bg-[#2F2A24] text-white shadow-sm"
                    : "border-[#D8C7B1] bg-[#F7F3EC] text-[#5F564C] hover:bg-[#FFF8EE]"
                }`}
              >
                {valor}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#8A7A68]">
          <p>Quase nunca</p>
          <p className="text-right">Muito parecido comigo</p>
        </div>
      </article>
    );
  })}

  <section className="sticky bottom-0 -mx-4 border-t border-[#E5DDD2] bg-[#F6F0E8]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
    <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2F2A24]">
            {testeCompleto
              ? "Teste pronto para finalizar"
              : "Ainda há perguntas pendentes"}
          </p>

          <p className="mt-1 text-sm leading-6 text-[#5F564C]">
            {testeCompleto
              ? "Ao finalizar, sua leitura inicial será organizada a partir do perfil predominante."
              : `Responda as ${perguntasFaltantes} pergunta(s) restante(s) antes de finalizar.`}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5DDD2] bg-[#F7F3EC] px-4 py-2 text-sm font-semibold text-[#8A2E2B]">
          {progresso}%
        </div>
      </div>

      <button
        type="submit"
        disabled={salvando}
        className="min-h-11 w-full rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {salvando ? "Salvando resultado..." : "Finalizar teste VPP"}
      </button>
    </div>
  </section>
</form>  
      </section>
    </main>
  );
}