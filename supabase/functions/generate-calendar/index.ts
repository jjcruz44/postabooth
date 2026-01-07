import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarRequest {
  postingFrequency: number;
  postingDays: string[];
  contentFocus: string;
  monthObjective: string;
}

interface UserProfile {
  brand_style: string | null;
  services: string[] | null;
  events: string[] | null;
  city: string | null;
}

interface CalendarDay {
  day: number;
  weekday: string;
  date: string;
  category: string;
  objective: string;
  idea: string;
  title: string;
  roteiro: string;
  legenda: string;
}

const WEEKDAY_MAP: Record<string, number> = {
  "domingo": 0,
  "segunda": 1,
  "terça": 2,
  "quarta": 3,
  "quinta": 4,
  "sexta": 5,
  "sábado": 6,
};

const WEEKDAY_NAMES: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

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

function getPostingDatesForMonth(postingDays: string[]): { day: number; weekday: string; date: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const selectedWeekdays = postingDays.map(d => WEEKDAY_MAP[d.toLowerCase()]).filter(d => d !== undefined);
  const result: { day: number; weekday: string; date: string }[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    
    if (selectedWeekdays.includes(weekday)) {
      result.push({
        day,
        weekday: WEEKDAY_NAMES[weekday],
        date: date.toISOString().split('T')[0],
      });
    }
  }
  
  return result;
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

    const { postingFrequency, postingDays, contentFocus, monthObjective } = await req.json() as CalendarRequest;
    
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userProfile = await getUserProfile(supabaseUrl, supabaseServiceKey, user.id);
    
    const businessType = userProfile?.services?.join(', ') || 'cabines fotográficas, espelho mágico, totens';
    const city = userProfile?.city || 'Brasil';
    const mainAudience = userProfile?.events?.join(', ') || 'casamentos, festas corporativas, aniversários';
    const brandStyle = userProfile?.brand_style || 'profissional e acessível';
    
    // Calculate posting dates for the current month
    const postingDates = getPostingDatesForMonth(postingDays);
    const totalPosts = postingDates.length;
    
    console.log('Generating calendar for user:', user.id, { 
      monthObjective, 
      contentFocus, 
      postingFrequency, 
      postingDays,
      totalPosts 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const postingDatesInfo = postingDates.map(d => `Dia ${d.day} (${d.weekday})`).join(', ');

    const systemPrompt = `Você é um estrategista de conteúdo para redes sociais especializado em pequenos negócios de eventos (cabines fotográficas, totens, plataformas 360).

Crie um calendário de conteúdo personalizado com base nos filtros do usuário.

Informações do negócio:
- Tipo: ${businessType}
- Cidade: ${city}
- Público: ${mainAudience}
- Tom: ${brandStyle}

Filtros do planejamento:
- OBJETIVO DO MÊS: ${monthObjective}
- Foco de conteúdo: ${contentFocus === 'Aleatório' ? 'Mix de eventos (casamento, corporativo, aniversários)' : contentFocus}
- Total de posts: ${totalPosts}
- Datas para postar: ${postingDatesInfo}

REGRAS OBRIGATÓRIAS:

1. Crie EXATAMENTE ${totalPosts} posts, um para cada data listada acima.

2. Cada post DEVE seguir este formato obrigatório com 4 blocos:
   - title: Título curto e organizacional (máx 10 palavras)
   - idea: Ideia principal em UMA frase clara alinhada ao objetivo do mês
   - roteiro: UM ÚNICO roteiro prático e direto (máx 100 palavras, sem variações ou alternativas)
   - legenda: Legenda curta pronta para postar (MÁXIMO 4 linhas, com no máximo 1 CTA)

3. Todos os posts devem estar alinhados ao OBJETIVO DO MÊS: "${monthObjective}"

4. Use esta distribuição de categorias proporcionalmente:
   - 30% prova social
   - 20% educativo
   - 20% oferta
   - 15% bastidores
   - 15% storytelling

5. NÃO incluir hashtags em nenhum momento
6. NÃO gerar textos longos
7. NÃO criar múltiplas ideias por post
8. Escreva tudo em português brasileiro

RETORNE um JSON array com EXATAMENTE ${totalPosts} objetos neste formato:
[
  {
    "day": 3,
    "weekday": "Segunda",
    "date": "2026-01-03",
    "category": "prova social",
    "objective": "Gerar credibilidade mostrando resultados reais",
    "title": "Depoimento da noiva Marina",
    "idea": "Compartilhar feedback da noiva sobre como a cabine animou os convidados",
    "roteiro": "Abrir com foto do casamento. Mostrar momento da cabine. Inserir áudio ou texto do depoimento. Fechar com call-to-action.",
    "legenda": "A Marina disse que a cabine foi o hit da festa! 📸\\n\\nQuer isso no seu casamento? Me chama no direct!"
  }
]

Os dias e datas devem corresponder EXATAMENTE a: ${JSON.stringify(postingDates)}

Categorias válidas:
- "prova social"
- "educativo"
- "oferta"
- "bastidores"
- "storytelling"

Retorne APENAS o JSON array, sem markdown.`;

    const userPrompt = `Gere o calendário de conteúdo agora para o mês atual.
Objetivo do mês: "${monthObjective}"
Foco: ${contentFocus}
Datas para postar: ${JSON.stringify(postingDates)}`;

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
      
      if (!Array.isArray(parsedContent) || parsedContent.length !== totalPosts) {
        console.warn(`Expected ${totalPosts} posts, got ${parsedContent.length}`);
        // Accept partial results if close enough
        if (!Array.isArray(parsedContent) || parsedContent.length < 1) {
          throw new Error("Invalid calendar format");
        }
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
