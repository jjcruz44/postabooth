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

    // Professional social media copywriter prompt
    const systemPrompt = `Você é um copywriter profissional de redes sociais especializado em pequenos negócios que alugam cabines fotográficas, totens e plataformas 360 para eventos.

Crie um post completo para Instagram baseado nas informações fornecidas.

Requisitos:
1) Escreva uma legenda envolvente para Instagram (curta a média).
2) Escreva um texto complementar sugerido (mais explicativo, opcional).
3) Gere 12-18 hashtags com foco local + nicho (eventos + cidade).
4) Adicione UM CTA claro no final da legenda, alinhado ao objetivo:
   - orçamentos → peça data + cidade no DM/WhatsApp
   - preencher datas vazias → urgência + vagas limitadas
   - aumentar seguidores → comentar/salvar/compartilhar
   - reativar contatos → responda no WhatsApp/DM
5) Evite afirmações genéricas ("melhor", "número um") e evite emojis excessivamente repetitivos.`;

    // Build user prompt with all context
    let userPrompt = `Negócio:
- Tipo: Aluguel de ${userServices}
- Cidade/Região: ${userCity || 'Brasil'}
- Público principal: Noivos, organizadores de eventos corporativos e festas
- Tom: ${brandStyle || 'Profissional e acessível'}

Dia do calendário:
- Tipo de conteúdo: ${contentType.toUpperCase()}
- Categoria do conteúdo: ${eventType}
- Objetivo do post: ${objective}
${mainIdea ? `- Ideia do conteúdo: ${mainIdea}` : ''}

VOCÊ DEVE RETORNAR UM JSON COM EXATAMENTE ESTA ESTRUTURA:

{
  "titulo": "Título atrativo do post (máximo 60 caracteres)",
  "ideia": "Descrição breve da ideia central do conteúdo (1-2 frases)",
  "roteiro": ${contentType === 'reels' ? '"Roteiro detalhado para o Reels com:\\n- Hook inicial (primeiros 3 segundos)\\n- Desenvolvimento (pontos principais)\\n- CTA final\\nIncluir sugestões de transições e textos na tela"' : contentType === 'carrossel' ? '"Array com 5-7 slides, cada um contendo:\\n- Número do slide\\n- Título do slide\\n- Conteúdo/texto do slide\\n- Sugestão visual"' : '"Sequência de 3-5 stories com:\\n- Conteúdo de cada story\\n- Elemento interativo sugerido (enquete, quiz, etc)"'},
  "legenda": "Legenda persuasiva curta a média com gancho inicial, desenvolvimento e CTA alinhado ao objetivo",
  "textoSugerido": "Texto complementar mais explicativo (opcional, para usar em outras plataformas)",
  "cta": "Chamada para ação principal alinhada ao objetivo",
  "hashtags": ["array", "de", "12", "a", "18", "hashtags", "com", "foco", "local", "e", "nicho"]
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
