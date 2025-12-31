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
    const userEvents = userProfile?.events?.join(', ') || eventType;
    const userCity = userProfile?.city || '';
    
    console.log('Generating content for user:', user.id, { contentType, eventType, objective, mainIdea, brandStyle });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Enhanced system prompt with brand personality
    const systemPrompt = `Você é um especialista em marketing digital para profissionais de cabines fotográficas, espelho mágico e totens para eventos. Seu trabalho é criar conteúdo estratégico para redes sociais que gere engajamento e conversões.

IDENTIDADE DA MARCA DO USUÁRIO:
${brandStyle ? `Estilo/Personalidade da Marca: ${brandStyle}` : 'Estilo profissional e acessível'}
Serviços oferecidos: ${userServices}
Tipos de eventos que atende: ${userEvents}
${userCity ? `Localização: ${userCity}` : ''}

REGRAS DE CRIAÇÃO:
1. TODO conteúdo deve refletir a personalidade e tom de voz da marca definidos acima
2. Seja específico para o nicho de cabines/totens fotográficos
3. Adapte o tom de acordo com o tipo de evento e estilo da marca
4. Foque em conversão, não apenas engajamento
5. Use linguagem emocional quando apropriado, mas sempre alinhada à marca
6. Inclua CTAs claros e diretos
7. Escreva sempre em português brasileiro`;

    // Build user prompt with main idea as priority
    let userPrompt = `Crie um conteúdo completo para ${contentType.toUpperCase()} sobre serviços de cabines fotográficas/espelho mágico/totens.

`;

    // Main idea as primary reference if provided
    if (mainIdea && mainIdea.trim()) {
      userPrompt += `🎯 IDEIA PRINCIPAL (USE COMO BASE CENTRAL DO CONTEÚDO):
"${mainIdea}"

O conteúdo DEVE ser construído em torno dessa ideia principal. Ela é o ponto de partida e referência mais importante.

`;
    }

    userPrompt += `ESPECIFICAÇÕES ADICIONAIS:
- Tipo de conteúdo: ${contentType}
- Tipo de evento alvo: ${eventType}
- Objetivo do post: ${objective}

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
