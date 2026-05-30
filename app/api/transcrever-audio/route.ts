import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getExtensaoPorTipo(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("m4a")) return "m4a";

  return "webm";
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "A chave OPENAI_API_KEY não foi encontrada no servidor. Configure no .env.local e também na Vercel.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json(
        {
          error: "Nenhum arquivo de áudio foi recebido pela rota.",
        },
        { status: 400 }
      );
    }

    if (audio.size === 0) {
      return NextResponse.json(
        {
          error: "O arquivo de áudio chegou vazio. Grave novamente e tente outra vez.",
        },
        { status: 400 }
      );
    }

    const tamanhoMaximo = 20 * 1024 * 1024;

    if (audio.size > tamanhoMaximo) {
      return NextResponse.json(
        {
          error:
            "O áudio está muito grande. Grave um relato mais curto e tente novamente.",
        },
        { status: 413 }
      );
    }

    const mimeType = audio.type || "audio/webm";
    const extensao = getExtensaoPorTipo(mimeType);

    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    const arquivo = new File([audioBuffer], `sonho.${extensao}`, {
      type: mimeType,
    });

    console.log("ÁUDIO RECEBIDO PARA TRANSCRIÇÃO:", {
      name: arquivo.name,
      type: arquivo.type,
      size: arquivo.size,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: arquivo,
      model: "gpt-4o-mini-transcribe",
      language: "pt",
      response_format: "json",
    });

    const texto = String(transcription.text || "").trim();

    if (!texto) {
      return NextResponse.json(
        {
          error:
            "A transcrição foi concluída, mas não retornou texto. Tente gravar novamente falando mais perto do microfone.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: texto,
    });
  } catch (error) {
    console.error("ERRO DETALHADO AO TRANSCREVER ÁUDIO:", error);

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao transcrever áudio.";

    return NextResponse.json(
      {
        error: `Não foi possível transcrever o áudio agora. Detalhe técnico: ${mensagem}`,
      },
      { status: 500 }
    );
  }
}