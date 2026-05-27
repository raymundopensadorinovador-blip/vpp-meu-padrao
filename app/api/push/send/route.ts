import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const oneSignalAppId = process.env.ONESIGNAL_APP_ID;
const oneSignalRestApiKey = process.env.ONESIGNAL_REST_API_KEY;

const APP_URL = "https://vpp-meu-padrao.vercel.app";

type PushBody = {
  userId?: string;
  title?: string;
  message?: string;
  url?: string;
};

function montarUrlDestino(url: string) {
  if (!url) return APP_URL;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${APP_URL}${url}`;
  }

  return `${APP_URL}/${url}`;
}

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

    const authorization = request.headers.get("authorization") || "";
    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    const { data: usuarioAutenticado, error: erroUsuario } =
      await supabaseAdmin.auth.getUser(token);

    if (erroUsuario || !usuarioAutenticado.user) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as PushBody;

    const userId = String(body.userId || "").trim();
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    const url = montarUrlDestino(String(body.url || "/").trim());

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes." },
        { status: 400 }
      );
    }

    const { data: inscricoes, error: erroInscricoes } = await supabaseAdmin
      .from("user_push_subscriptions")
      .select("subscription_id")
      .eq("user_id", userId)
      .eq("permission", "granted");

    if (erroInscricoes) {
      console.error("ERRO AO BUSCAR INSCRIÇÕES PUSH:", erroInscricoes);

      return NextResponse.json(
        { error: "Erro ao buscar inscrições push." },
        { status: 500 }
      );
    }

    const subscriptionIds = Array.from(
      new Set(
        (inscricoes || [])
          .map((item) => item.subscription_id)
          .filter(Boolean)
      )
    );

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

    const respostaJson = await respostaOneSignal.json().catch(() => null);

    if (!respostaOneSignal.ok) {
      console.error("ERRO DO ONESIGNAL:", respostaJson);

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
      subscriptionIds,
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