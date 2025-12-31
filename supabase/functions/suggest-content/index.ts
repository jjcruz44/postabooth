import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'reels' | 'carrossel' | 'stories';
  eventType: string;
  objective: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating AI suggestions (public endpoint)');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um assistente criativo especializado em marketing para profissionais de cabines fotográficas, espelho mágico e totens para eventos.

Seu trabalho é sugerir ideias de conteúdo relevantes e criativas para redes sociais.`;

    const userPrompt = `Gere 4 sugestões de posts para redes sociais para um profissional de cabines fotográficas e espelho mágico para eventos.

Para cada sugestão, retorne um JSON array com esta estrutura:

[
  {
    "id": "suggestion_1",
    "title": "Título curto e atrativo (máx 50 caracteres)",
    "description": "Descrição breve da ideia do conteúdo em 1-2 frases",
    "type": "reels" | "carrossel" | "stories",
    "eventType": "Casamento" | "Corporativo" | "15 Anos" | "Infantil" | "Formatura",
    "objective": "Atração" | "Autoridade" | "Prova Social" | "Venda"
  }
]

REGRAS:
1. As sugestões devem ser variadas em tipo de conteúdo e objetivo
2. Considere sazonalidade e tendências atuais
3. Foque em ideias que gerem engajamento real
4. Seja específico para o nicho de eventos e fotografia
5. Retorne EXATAMENTE 4 sugestões

Retorne APENAS o JSON array, sem markdown ou explicações.`;

    console.log('Calling AI gateway...');

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requisições excedido. Tente novamente em alguns segundos.",
          suggestions: [] 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Créditos de IA insuficientes.",
          suggestions: [] 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "Erro ao gerar sugestões. Tente novamente.",
        suggestions: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response received, parsing...');
    
    if (!content) {
      console.error("No content in AI response");
      return new Response(JSON.stringify({ 
        error: "Resposta vazia da IA.",
        suggestions: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let suggestions: ContentSuggestion[];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanContent);
      
      // Validate structure
      if (!Array.isArray(suggestions)) {
        throw new Error("Response is not an array");
      }
      
      // Ensure each suggestion has required fields
      suggestions = suggestions.map((s, i) => ({
        id: s.id || `suggestion_${i + 1}`,
        title: s.title || "Sugestão de conteúdo",
        description: s.description || "Clique para usar esta ideia",
        type: ['reels', 'carrossel', 'stories'].includes(s.type) ? s.type : 'reels',
        eventType: s.eventType || "Casamento",
        objective: s.objective || "Atração"
      }));
      
    } catch (parseError) {
      console.error("Failed to parse AI response:", content, parseError);
      return new Response(JSON.stringify({ 
        error: "Erro ao processar sugestões.",
        suggestions: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Suggestions generated successfully:", suggestions.length);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in suggest-content function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ 
      error: errorMessage,
      suggestions: [] 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
