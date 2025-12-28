import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  contentType: 'reels' | 'carrossel' | 'stories';
  eventType: string;
  objective: string;
  brandStyle?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, eventType, objective, brandStyle } = await req.json() as ContentRequest;
    
    console.log('Generating content:', { contentType, eventType, objective, brandStyle });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um especialista em marketing digital para profissionais de cabines fotográficas, espelho mágico e totens para eventos. Seu trabalho é criar conteúdo estratégico para redes sociais que gere engajamento e conversões.

Você deve criar conteúdo em português brasileiro, com linguagem profissional mas acessível, sem jargões técnicos de marketing.

Regras importantes:
- Seja específico para o nicho de cabines/totens fotográficos
- Adapte o tom de acordo com o tipo de evento
- Foque em conversão, não apenas engajamento
- Use linguagem emocional quando apropriado
- Inclua CTAs claros e diretos`;

    const userPrompt = `Crie um conteúdo completo para ${contentType.toUpperCase()} sobre cabines fotográficas/espelho mágico/totens.

ESPECIFICAÇÕES:
- Tipo de conteúdo: ${contentType}
- Tipo de evento alvo: ${eventType}
- Objetivo do post: ${objective}
${brandStyle ? `- Estilo da marca: ${brandStyle}` : ''}

VOCÊ DEVE RETORNAR UM JSON COM EXATAMENTE ESTA ESTRUTURA:

{
  "titulo": "Título atrativo do post (máximo 60 caracteres)",
  "ideia": "Descrição breve da ideia central do conteúdo (1-2 frases)",
  "roteiro": ${contentType === 'reels' ? '"Roteiro detalhado para o Reels com:\n- Hook inicial (primeiros 3 segundos)\n- Desenvolvimento (pontos principais)\n- CTA final\nIncluir sugestões de transições e textos na tela"' : contentType === 'carrossel' ? '"Array com 5-7 slides, cada um contendo:\n- Número do slide\n- Título do slide\n- Conteúdo/texto do slide\n- Sugestão visual"' : '"Sequência de 3-5 stories com:\n- Conteúdo de cada story\n- Elemento interativo sugerido (enquete, quiz, etc)"'},
  "legenda": "Legenda persuasiva para o post com:\n- Gancho inicial\n- Desenvolvimento\n- CTA\n- Máximo 2200 caracteres",
  "cta": "Chamada para ação principal (ex: 'Garanta sua cabine agora!')",
  "hashtags": ["array", "de", "10", "hashtags", "relevantes"]
}

Retorne APENAS o JSON, sem markdown ou explicações adicionais.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro ao gerar conteúdo. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response received");
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Try to parse the JSON from the response
    let parsedContent;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse generated content");
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-content function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
