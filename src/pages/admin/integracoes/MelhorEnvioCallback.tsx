import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (body.action === "ping") {
      return json({ success: true, message: "Function Online!" });
    }

    if (body.action === "exchange-code") {
      const baseUrl =
        body.ambiente === "sandbox"
          ? "https://sandbox.melhorenvio.com.br"
          : "https://melhorenvio.com.br";

      const response = await fetch(`${baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Loja Lumini",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: body.client_id,
          client_secret: body.client_secret,
          redirect_uri: body.redirect_uri,
          code: body.code,
        }),
      });

      const tokenData = await response.json();

      if (!response.ok) {
        return json({
          success: false,
          message: "Erro ao trocar código por token",
          error: tokenData,
        }, 400);
      }

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const { data: current } = await supabase
        .from("integracoes")
        .select("config")
        .eq("chave", "melhorenvio")
        .single();

      const newConfig = {
        ...(current?.config || {}),
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        connected: true,
        ambiente: body.ambiente,
      };

      const { error } = await supabase
        .from("integracoes")
        .upsert({
          chave: "melhorenvio",
          config: newConfig,
          ativo: true,
        }, { onConflict: "chave" });

      if (error) throw error;

      return json({
        success: true,
        message: "Melhor Envio conectado com sucesso",
      });
    }

    if (body.action === "test-token") {
      const { data } = await supabase
        .from("integracoes")
        .select("config")
        .eq("chave", "melhorenvio")
        .single();

      const config = data?.config || {};
      const token = config.access_token;
      const ambiente = config.ambiente || "production";

      if (!token) {
        return json({
          success: false,
          message: "Access token ausente",
        }, 400);
      }

      const baseUrl =
        ambiente === "sandbox"
          ? "https://sandbox.melhorenvio.com.br"
          : "https://melhorenvio.com.br";

      const response = await fetch(`${baseUrl}/api/v2/me`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "Loja Lumini",
        },
      });

      const text = await response.text();

      if (!response.ok) {
        return json({
          success: false,
          message: "Token inválido",
          status: response.status,
          raw: text,
        }, 400);
      }

      return json({
        success: true,
        message: "Token válido!",
      });
    }

    if (body.action === "test-app") {
      if (!body.client_id || !body.client_secret) {
        return json({
          success: false,
          message: "Client ID e Client Secret são obrigatórios",
        }, 400);
      }

      return json({
        success: true,
        message: "App configurado",
      });
    }

    return json({
      success: false,
      message: "Ação inválida",
    }, 400);

  } catch (error) {
    return json({
      success: false,
      message: error.message || "Erro interno",
    }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
