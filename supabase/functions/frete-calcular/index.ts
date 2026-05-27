import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ erro: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const { cep, carrinho_itens } = await req.json();

    if (!cep || !carrinho_itens || carrinho_itens.length === 0) {
      return new Response(
        JSON.stringify({
          erro: "CEP e carrinho são obrigatórios",
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

    const { data: meConfig, error: meConfigError } = await supabase
      .from("integracoes")
      .select("config")
      .eq("chave", "melhorenvio")
      .single();

    if (meConfigError) {
      return new Response(
        JSON.stringify({
          erro: "Erro ao buscar configuração do Melhor Envio",
          detalhes: meConfigError.message,
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

    const melhorEnvioToken = meConfig?.config?.access_token;

    if (!melhorEnvioToken) {
      return new Response(
        JSON.stringify({
          erro: "Token Melhor Envio não encontrado no banco",
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

    const originCep =
      meConfig?.config?.cep_origem ||
      Deno.env.get("ORIGIN_CEP") ||
      "01310-100";

    const produto_ids = carrinho_itens.map((item: any) => item.id);

    const { data: produtos, error: produtoError } = await supabase
      .from("produtos")
      .select("*")
      .in("id", produto_ids);

    if (produtoError) {
      return new Response(
        JSON.stringify({
          erro: "Erro ao buscar produtos",
          detalhes: produtoError.message,
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

    let peso_total = 0;
    let altura_max = 0;
    let largura_max = 0;
    let comprimento_max = 0;

    for (const item of carrinho_itens) {
      const produto = produtos?.find((p: any) => p.id === item.id);

      if (produto) {
        const peso = produto.peso || produto.detalhes?.peso || 0.3;
        const altura = produto.altura || produto.detalhes?.altura || 4;
        const largura = produto.largura || produto.detalhes?.largura || 12;
        const comprimento =
          produto.comprimento || produto.detalhes?.comprimento || 17;

        peso_total += peso * (item.quantidade || 1);
        altura_max = Math.max(altura_max, altura);
        largura_max = Math.max(largura_max, largura);
        comprimento_max = Math.max(comprimento_max, comprimento);
      }
    }

    const payload = {
      from: {
        postal_code: String(originCep).replace(/\D/g, ""),
      },
      to: {
        postal_code: String(cep).replace(/\D/g, ""),
      },
      products: [
        {
          id: "prod-1",
          width: largura_max || 12,
          height: altura_max || 4,
          length: comprimento_max || 17,
          weight: peso_total || 0.3,
          quantity: 1,
        },
      ],
    };

    console.log("TOKEN EXISTS:", !!melhorEnvioToken);
    console.log("ORIGIN CEP:", originCep);
    console.log("PAYLOAD:", JSON.stringify(payload, null, 2));

    const melhorEnvioResponse = await fetch(
      "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${melhorEnvioToken}`,
          "Content-Type": "application/json",
          "User-Agent": "Loja Lumini",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await melhorEnvioResponse.text();

    console.log("ME RESPONSE STATUS:", melhorEnvioResponse.status);
    console.log("ME RESPONSE TEXT:", responseText);

    if (!melhorEnvioResponse.ok) {
      return new Response(
        JSON.stringify({
          erro: "Erro ao calcular frete no Melhor Envio",
          status_me: melhorEnvioResponse.status,
          debug: responseText,
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

    const fretesData = JSON.parse(responseText);

    const options = Array.isArray(fretesData)
      ? fretesData
      : fretesData.shipping || [];

    const opcoes = options
      .filter((frete: any) => !frete.error)
      .map((frete: any, index: number) => ({
        id: frete.id || index,
        nome: frete.name || frete.company?.name || "Entrega",
        preco: parseFloat(frete.price || frete.custom_price || 0),
        dias: frete.delivery_time || frete.custom_delivery_time || 0,
      }));

    return new Response(
      JSON.stringify({
        sucesso: true,
        opcoes,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Erro geral:", error);

    return new Response(
      JSON.stringify({
        erro: "Erro interno: " + error.message,
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
