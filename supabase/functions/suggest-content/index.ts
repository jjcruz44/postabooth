import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  brand_style: string | null;
  services: string[] | null;
  events: string[] | null;
  city: string | null;
}

interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'reels' | 'carrossel' | 'stories';
  eventType: string;
  objective: string;
}

async function getUserProfile(supabaseUrl: string, supabaseServiceKey: string, userId: string): Promise<UserProfile | null> {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('brand_style, services, events, city')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data as UserProfile | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userProfile = await getUserProfile(supabaseUrl, supabaseServiceKey, user.id);
    
    const brandStyle = userProfile?.brand_style || 'profissional e acessível';
    const userServices = userProfile?.services?.join(', ') || 'cabines fotográficas, espelho mágico, totens';
    const userEvents = userProfile?.events?.join(', ') || 'casamentos, corporativo, 15 anos';
    const userCity = userProfile?.city || '';

    console.log('Generating suggestions for user:', user.id, { brandStyle, userServices, userEvents });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um assistente criativo especializado em marketing para profissionais de cabines fotográficas, espelho mágico e totens para eventos.

Seu trabalho é sugerir ideias de conteúdo relevantes e criativas baseadas no perfil do usuário.`;

    const userPrompt = `Gere 4 sugestões de posts para redes sociais baseadas neste perfil:

PERFIL DO USUÁRIO:
- Estilo da marca: ${brandStyle}
- Serviços oferecidos: ${userServices}
- Tipos de eventos: ${userEvents}
${userCity ? `- Cidade: ${userCity}` : ''}

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

Retorne APENAS o JSON array, sem markdown ou explicações.`;

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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro ao gerar sugestões." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    let suggestions: ContentSuggestion[];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse suggestions");
    }

    console.log("Suggestions generated:", suggestions.length);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in suggest-content function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
