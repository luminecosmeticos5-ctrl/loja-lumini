import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    console.log("BODY:", body);

    const { action } = body;

    // =========================
    // TESTAR TOKEN
    // =========================
    if (action === "test-token") {
      const { data: integracao, error } = await supabase
        .from("integracoes")
        .select("config")
        .eq("chave", "melhorenvio")
        .single();

      if (error) {
        console.log("ERRO BANCO:", error);

        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const token = integracao?.config?.access_token;

      console.log("TOKEN EXISTE:", !!token);

      if (!token) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Token não encontrado",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const response = await fetch(
        "https://www.melhorenvio.com.br/api/v2/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Loja Lumini",
          },
        }
      );

      const text = await response.text();

      console.log("STATUS ME:", response.status);
      console.log("BODY ME:", text);

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            error: text,
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: JSON.parse(text),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // =========================
    // CALLBACK / SUCCESS
    // =========================
    return new Response(
      JSON.stringify({
        success: true,
        message: "Melhor Envio conectado com sucesso",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.log("ERRO GERAL:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
