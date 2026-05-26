import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const oneSignalAppId = process.env.ONESIGNAL_APP_ID;
const oneSignalRestApiKey = process.env.ONESIGNAL_REST_API_KEY;

type PushBody = {
  userId?: string;
  title?: string;
  message?: string;
  url?: string;
};

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase ausente." },
        { status: 500 }
      );
    }

    if (!oneSignalAppId || !oneSignalRestApiKey) {
      return NextResponse.json(
        { error: "Configuração do OneSignal ausente." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as PushBody;

    const userId = String(body.userId || "").trim();
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    const url = String(body.url || "/").trim();

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    const { data: inscricoes, error: erroInscricoes } = await supabaseAdmin
      .from("user_push_subscriptions")
      .select("subscription_id")
      .eq("user_id", userId)
      .eq("permission", "granted");

    if (erroInscricoes) {
      return NextResponse.json(
        { error: "Erro ao buscar inscrições push." },
        { status: 500 }
      );
    }

    const subscriptionIds = (inscricoes || [])
      .map((item) => item.subscription_id)
      .filter(Boolean);

    if (subscriptionIds.length === 0) {
      return NextResponse.json(
        { ok: true, sent: false, reason: "Usuário sem inscrição push ativa." },
        { status: 200 }
      );
    }

    const respostaOneSignal = await fetch(
      "https://api.onesignal.com/notifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${oneSignalRestApiKey}`,
        },
        body: JSON.stringify({
          app_id: oneSignalAppId,
          include_subscription_ids: subscriptionIds,
          headings: {
            pt: title,
            en: title,
          },
          contents: {
            pt: message,
            en: message,
          },
          url,
        }),
      }
    );

    const respostaJson = await respostaOneSignal.json();

    if (!respostaOneSignal.ok) {
      return NextResponse.json(
        {
          error: "Erro ao enviar push pelo OneSignal.",
          details: respostaJson,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sent: true,
      subscriptions: subscriptionIds.length,
      oneSignal: respostaJson,
    });
  } catch (error) {
    console.error("ERRO NA ROTA DE PUSH:", error);

    return NextResponse.json(
      { error: "Erro interno ao enviar notificação." },
      { status: 500 }
    );
  }
}