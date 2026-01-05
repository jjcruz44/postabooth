import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarRequest {
  monthlyGoal: string;
}

interface UserProfile {
  brand_style: string | null;
  services: string[] | null;
  events: string[] | null;
  city: string | null;
}

interface CalendarDay {
  day: number;
  category: string;
  objective: string;
  idea: string;
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

    const { monthlyGoal } = await req.json() as CalendarRequest;
    
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userProfile = await getUserProfile(supabaseUrl, supabaseServiceKey, user.id);
    
    const businessType = userProfile?.services?.join(', ') || 'cabines fotográficas, espelho mágico, totens';
    const city = userProfile?.city || 'Brasil';
    const mainAudience = userProfile?.events?.join(', ') || 'casamentos, festas corporativas, aniversários';
    const brandStyle = userProfile?.brand_style || 'profissional e acessível';
    
    console.log('Generating calendar for user:', user.id, { monthlyGoal, businessType, city });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um estrategista de conteúdo para redes sociais especializado em pequenos negócios de eventos (cabines fotográficas, totens, plataformas 360).

Crie um calendário de 30 dias com ideias CURTAS, CLARAS e EXECUTÁVEIS.

Informações do negócio:
- Tipo: ${businessType}
- Cidade: ${city}
- Público: ${mainAudience}
- Meta do mês: ${monthlyGoal}
- Tom: ${brandStyle}

REGRAS OBRIGATÓRIAS:
1. Crie EXATAMENTE 30 dias de conteúdo
2. Use esta distribuição:
   - 30% prova social (9 dias)
   - 20% educativo (6 dias)
   - 20% oferta (6 dias)
   - 15% bastidores (5 dias)
   - 15% storytelling (4 dias)

3. Cada dia deve ter:
   - Número do dia
   - Categoria do conteúdo
   - Objetivo alinhado à meta mensal (1 frase curta)
   - Ideia principal (1 frase clara e específica)

4. As ideias devem ser:
   - Específicas para o nicho de eventos
   - Curtas e fáceis de entender
   - Executáveis sem explicações adicionais

5. NÃO incluir hashtags em nenhum momento
6. Escreva tudo em português brasileiro

RETORNE um JSON array com EXATAMENTE 30 objetos:
{
  "day": 1,
  "category": "prova social",
  "objective": "Gerar credibilidade",
  "idea": "Postar foto do último casamento com comentário da noiva"
}

Categorias em português:
- "prova social"
- "educativo"
- "oferta"
- "bastidores"
- "storytelling"

Retorne APENAS o JSON array, sem markdown.`;

    const userPrompt = `Gere o calendário de 30 dias agora. Meta do mês: "${monthlyGoal}"`;

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
      
      return new Response(JSON.stringify({ error: "Erro ao gerar calendário. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response received for calendar");
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    let parsedContent: CalendarDay[];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
      
      if (!Array.isArray(parsedContent) || parsedContent.length !== 30) {
        throw new Error("Invalid calendar format");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse generated calendar");
    }

    return new Response(JSON.stringify({ calendar: parsedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-calendar function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
