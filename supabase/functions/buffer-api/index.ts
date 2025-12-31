import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulePostRequest {
  action: 'get-profiles' | 'schedule-post' | 'get-posts';
  connectionId?: string;
  postText?: string;
  scheduledFor?: string;
  hashtags?: string[];
  contentId?: string;
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const BUFFER_ACCESS_TOKEN = Deno.env.get('BUFFER_ACCESS_TOKEN');
    if (!BUFFER_ACCESS_TOKEN) {
      console.error('BUFFER_ACCESS_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Buffer integration not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, connectionId, postText, scheduledFor, hashtags, contentId } = await req.json() as SchedulePostRequest;

    console.log('Buffer API action:', action, 'User:', user.id);

    switch (action) {
      case 'get-profiles': {
        // Get Buffer profiles (connected social accounts)
        const response = await fetch('https://api.bufferapp.com/1/profiles.json', {
          headers: {
            'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Buffer profiles error:', response.status, errorText);
          return new Response(JSON.stringify({ error: 'Failed to fetch Buffer profiles' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const profiles = await response.json();
        
        // Return only necessary profile info (no tokens)
        const safeProfiles = profiles.map((p: any) => ({
          id: p.id,
          service: p.service,
          formatted_service: p.formatted_service,
          avatar: p.avatar,
          formatted_username: p.formatted_username,
        }));

        return new Response(JSON.stringify({ profiles: safeProfiles }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'schedule-post': {
        if (!connectionId || !postText || !scheduledFor) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get the connection to verify ownership and get Buffer profile ID
        const { data: connection, error: connError } = await supabase
          .from('social_connections')
          .select('*')
          .eq('id', connectionId)
          .eq('user_id', user.id)
          .single();

        if (connError || !connection) {
          console.error('Connection not found:', connError);
          return new Response(JSON.stringify({ error: 'Connection not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Schedule post via Buffer API
        const scheduledDate = new Date(scheduledFor);
        const formData = new URLSearchParams();
        formData.append('profile_ids[]', connection.profile_id!);
        formData.append('text', hashtags?.length ? `${postText}\n\n${hashtags.join(' ')}` : postText);
        formData.append('scheduled_at', Math.floor(scheduledDate.getTime() / 1000).toString());

        const response = await fetch('https://api.bufferapp.com/1/updates/create.json', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Buffer schedule error:', response.status, errorText);
          
          // Save failed post to database
          await supabase.from('social_posts').insert({
            user_id: user.id,
            connection_id: connectionId,
            content_id: contentId,
            platform: connection.platform,
            post_text: postText,
            hashtags: hashtags,
            scheduled_for: scheduledFor,
            status: 'failed',
            error_message: errorText,
          });

          return new Response(JSON.stringify({ error: 'Failed to schedule post' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const result = await response.json();
        console.log('Buffer post created:', result);

        // Save successful post to database
        const { data: savedPost, error: saveError } = await supabase.from('social_posts').insert({
          user_id: user.id,
          connection_id: connectionId,
          content_id: contentId,
          platform: connection.platform,
          post_text: postText,
          hashtags: hashtags,
          scheduled_for: scheduledFor,
          status: 'scheduled',
          buffer_post_id: result.updates?.[0]?.id,
        }).select().single();

        if (saveError) {
          console.error('Error saving post:', saveError);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          post: savedPost,
          bufferUpdate: result 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-posts': {
        // Get user's scheduled posts from database
        const { data: posts, error: postsError } = await supabase
          .from('social_posts')
          .select('*, social_connections(platform, profile_name, profile_image)')
          .eq('user_id', user.id)
          .order('scheduled_for', { ascending: true });

        if (postsError) {
          console.error('Error fetching posts:', postsError);
          return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ posts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Error in buffer-api function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
