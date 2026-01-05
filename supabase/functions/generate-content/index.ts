import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  contentType: 'reels' | 'carrossel' | 'stories';
  eventType: string;
  objective: string;
  mainIdea?: string;
  brandStyle?: string;
}

interface UserProfile {
  brand_style: string | null;
  services: string[] | null;
  events: string[] | null;
  city: string | null;
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
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

    const { contentType, eventType, objective, mainIdea } = await req.json() as ContentRequest;
    
    // Fetch user's brand style and profile data using service role key
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userProfile = await getUserProfile(supabaseUrl, supabaseServiceKey, user.id);
    const brandStyle = userProfile?.brand_style || '';
    const userServices = userProfile?.services?.join(', ') || 'cabines fotográficas';
    const userCity = userProfile?.city || '';
    
    console.log('Generating content for user:', user.id, { contentType, eventType, objective, mainIdea, brandStyle });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // New standardized prompt for short, actionable content
    const systemPrompt = `Você é um copywriter especializado em criar posts curtos e prontos para usar para profissionais de eventos (cabines fotográficas, totens, espelho mágico).

REGRAS OBRIGATÓRIAS:
1. Todo post deve ter EXATAMENTE 4 blocos, nesta ordem:
   - TÍTULO: Curto, para organização interna (ex: "Prova social – Evento corporativo")
   - IDEIA PRINCIPAL: Uma frase clara explicando o objetivo do post
   - ROTEIRO: UM único roteiro simples e prático, fácil de seguir
   - LEGENDA: Texto PRONTO para postar (máximo 4 linhas curtas, linguagem natural, máximo 1 CTA)

2. NÃO GERAR:
   - Hashtags
   - Textos longos ou parágrafos extensos
   - Múltiplas variações ou ideias
   - Conteúdos genéricos ou abstratos
   - Emojis em excesso

3. O conteúdo deve ser:
   - Fácil de entender
   - Rápido de executar
   - Pronto para copiar e postar sem editar

Tom de voz: ${brandStyle || 'Profissional, direto e acessível'}`;

    // Build user prompt with all context
    let userPrompt = `Crie um post para:
- Tipo de conteúdo: ${contentType}
- Tipo de evento: ${eventType}
- Objetivo: ${objective}
${mainIdea ? `- Ideia base: ${mainIdea}` : ''}
- Negócio: ${userServices}${userCity ? ` em ${userCity}` : ''}

RETORNE UM JSON COM ESTA ESTRUTURA EXATA:

{
  "titulo": "Título curto para organização interna",
  "ideia": "Uma frase clara explicando o objetivo deste post",
  "roteiro": "Roteiro único e simples: passo a passo curto ou orientação direta para executar o post",
  "legenda": "Legenda curta pronta para postar (máx 4 linhas, linguagem natural, pode ter 1 CTA no final)"
}

Retorne APENAS o JSON, sem markdown ou explicações.`;

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
