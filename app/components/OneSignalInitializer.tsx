"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

const ONESIGNAL_APP_ID = "04ff0276-7dd9-4a01-9b40-c93feaccbfb0";

export default function OneSignalInitializer() {
  const iniciou = useRef(false);
  const [suportado, setSuportado] = useState(false);
  const [permitido, setPermitido] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;

    if (typeof window === "undefined") return;

    const temSuporte =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSuportado(temSuporte);

    if (!temSuporte) return;

    setPermitido(Notification.permission === "granted");

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    const scriptExistente = document.getElementById("onesignal-sdk");

    if (!scriptExistente) {
      const script = document.createElement("script");
      script.id = "onesignal-sdk";
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
    }

    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerParam: {
          scope: "/",
        },
        serviceWorkerPath: "OneSignalSDKWorker.js",
        notifyButton: {
          enable: false,
        },
        allowLocalhostAsSecureOrigin: true,
      });

      setPermitido(Notification.permission === "granted");
    });
  }, []);

  async function ativarNotificacoes() {
    setMensagem("");

    if (!suportado) {
      setMensagem("Este navegador não oferece suporte a notificações push.");
      return;
    }

    setCarregando(true);

    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];

      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.Notifications.requestPermission();

        const permissaoAtual = Notification.permission === "granted";

        setPermitido(permissaoAtual);

        if (permissaoAtual) {
          setMensagem("Notificações ativadas com sucesso.");
          return;
        }

        setMensagem("As notificações não foram permitidas neste navegador.");
      });
    } catch {
      setMensagem("Não foi possível ativar as notificações agora.");
    } finally {
      setCarregando(false);
    }
  }

  if (!suportado || permitido) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-3xl border border-[#D8C7B1] bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-[#2F2A24]">
        Ativar notificações
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5F564C]">
        Receba avisos importantes sobre vínculos, registros e encaminhamentos no
        VPP — Meu Padrão.
      </p>

      {mensagem && (
        <p className="mt-3 text-sm leading-6 text-[#8A2E2B]">{mensagem}</p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={ativarNotificacoes}
          disabled={carregando}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#2F2A24] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando ? "Ativando..." : "Ativar notificações"}
        </button>

        <button
          type="button"
          onClick={() => setSuportado(false)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#5F564C] shadow-sm transition hover:bg-[#FFF8EE]"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}