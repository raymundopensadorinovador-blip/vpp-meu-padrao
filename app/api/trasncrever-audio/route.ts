import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "A chave de transcrição ainda não foi configurada no servidor.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json(
        {
          error: "Nenhum áudio foi enviado para transcrição.",
        },
        { status: 400 }
      );
    }

    if (audio.size === 0) {
      return NextResponse.json(
        {
          error: "O áudio enviado está vazio. Grave novamente e tente transcrever.",
        },
        { status: 400 }
      );
    }

    const tamanhoMaximo = 20 * 1024 * 1024;

    if (audio.size > tamanhoMaximo) {
      return NextResponse.json(
        {
          error:
            "O áudio está muito grande. Grave um relato mais curto ou tente novamente.",
        },
        { status: 413 }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "gpt-4o-mini-transcribe",
      language: "pt",
      response_format: "json",
    });

    const texto = String(transcription.text || "").trim();

    if (!texto) {
      return NextResponse.json(
        {
          error:
            "A transcrição não retornou texto. Tente gravar novamente falando mais perto do microfone.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: texto,
    });
  } catch (error) {
    console.error("ERRO AO TRANSCREVER ÁUDIO:", error);

    return NextResponse.json(
      {
        error:
          "Não foi possível transcrever o áudio agora. Tente novamente em instantes ou registre o sonho manualmente.",
      },
      { status: 500 }
    );
  }
}