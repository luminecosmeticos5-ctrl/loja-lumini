import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Apenas POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ erro: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const { cep, carrinho_itens } = await req.json();

    // Validar entrada
    if (!cep || !carrinho_itens || carrinho_itens.length === 0) {
      return new Response(
        JSON.stringify({ erro: "CEP e carrinho são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados dos produtos
    const produto_ids = carrinho_itens.map((item: any) => item.id);
    const { data: produtos, error: produtoError } = await supabase
      .from("produtos")
      .select("*")
      .in("id", produto_ids);

    if (produtoError) {
      console.error("Erro ao buscar produtos:", produtoError);
      return new Response(
        JSON.stringify({ erro: "Erro ao buscar produtos: " + produtoError.message, detalhes: produtoError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular peso e dimensões totais
    let peso_total = 0;
    let altura_max = 0;
    let largura_max = 0;
    let comprimento_max = 0;

    for (const item of carrinho_itens) {
      const produto = produtos.find((p: any) => p.id === item.id);
      if (produto) {
        // Tenta pegar das colunas diretas ou de dentro de detalhes
        const peso = (produto.peso || produto.detalhes?.peso || 0.3);
        const altura = (produto.altura || produto.detalhes?.altura || 4);
        const largura = (produto.largura || produto.detalhes?.largura || 12);
        const comprimento = (produto.comprimento || produto.detalhes?.comprimento || 17);

        peso_total += peso * item.quantidade;
        altura_max = Math.max(altura_max, altura);
        largura_max = Math.max(largura_max, largura);
        comprimento_max = Math.max(comprimento_max, comprimento);
      }
    }

    // Chamar Melhor Envio
    const melhorEnvioToken = Deno.env.get("MELHOR_ENVIO_TOKEN");
    
    if (!melhorEnvioToken) {
      return new Response(
        JSON.stringify({ erro: "Token Melhor Envio não configurado (Env)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar CEP de origem na configuração ou env
    const { data: meConfig } = await supabase.from("integracoes").select("config").eq("chave", "melhorenvio").single();
    const originCep = meConfig?.config?.cep_origem || Deno.env.get("ORIGIN_CEP");

    if (!originCep) {
      return new Response(
        JSON.stringify({ erro: "CEP de origem não configurado. Verifique as configurações de integração ou a variável de ambiente ORIGIN_CEP." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      from: { postal_code: originCep.replace("-", "") }, // CEP de origem dinâmico
      to: { postal_code: cep.replace("-", "") },
      products: [
        {
          id: "prod-1",
          width: largura_max || 10,
          height: altura_max || 10,
          length: comprimento_max || 10,
          weight: peso_total || 0.5, // Peso em kg
          quantity: 1
        }
      ]
    };

    console.log("TOKEN EXISTS:", !!melhorEnvioToken);
    console.log("PAYLOAD:", JSON.stringify(payload, null, 2));

    const melhorEnvioResponse = await fetch(
      "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${melhorEnvioToken}`,
          "Content-Type": "application/json",
          "User-Agent": "ecommerce/1.0"
        },
        body: JSON.stringify(payload)
      }
    );

    console.log("ME RESPONSE STATUS:", melhorEnvioResponse.status);
    const responseText = await melhorEnvioResponse.text();
    console.log("ME RESPONSE TEXT:", responseText);

    if (!melhorEnvioResponse.ok) {
      console.error(
        "Erro Melhor Envio:",
        melhorEnvioResponse.status,
        responseText
      );
      return new Response(
        JSON.stringify({ erro: "Erro ao calcular frete no Melhor Envio", status_me: melhorEnvioResponse.status, debug: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fretesData = JSON.parse(responseText);

    // Formatar resposta
    // Note: Melhor Envio response is usually an array of options
    const options = Array.isArray(fretesData) ? fretesData : (fretesData.shipping || []);
    
    const opcoes = options
      .filter((frete: any) => !frete.error)
      .map((frete: any, index: number) => ({
        id: index,
        nome: frete.name,
        preco: parseFloat(frete.price),
        dias: frete.delivery_time
      }));

    return new Response(JSON.stringify({ sucesso: true, opcoes }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ erro: "Erro interno: " + error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
