import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulePostRequest {
  action: 'schedule-post' | 'get-posts';
  postText?: string;
  scheduledFor?: string;
  hashtags?: string[];
  contentId?: string;
  imageUrl?: string;
  platform?: string;
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

    const { action, postText, scheduledFor, hashtags, contentId, imageUrl, platform } = await req.json() as SchedulePostRequest;

    console.log('Buffer API action:', action, 'User:', user.id);

    switch (action) {
      case 'schedule-post': {
        if (!postText || !scheduledFor) {
          return new Response(JSON.stringify({ error: 'Missing required fields: postText and scheduledFor' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get user's Zapier webhook URL from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('zapier_webhook_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return new Response(JSON.stringify({ error: 'Failed to fetch user profile' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!profile?.zapier_webhook_url) {
          return new Response(JSON.stringify({ error: 'Zapier webhook URL not configured. Please add it in Settings.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Prepare full post text with hashtags
        const fullPostText = hashtags?.length ? `${postText}\n\n${hashtags.join(' ')}` : postText;

        // Send to Zapier webhook
        console.log('Sending to Zapier webhook:', profile.zapier_webhook_url);
        
        try {
          const zapierPayload = {
            content: fullPostText,
            scheduled_time: scheduledFor,
            image_url: imageUrl || null,
            platform: platform || 'instagram',
            user_id: user.id,
            content_id: contentId || null,
            triggered_at: new Date().toISOString(),
          };

          console.log('Zapier payload:', JSON.stringify(zapierPayload));

          const zapierResponse = await fetch(profile.zapier_webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(zapierPayload),
          });

          // Zapier webhooks typically return 200 on success
          if (!zapierResponse.ok) {
            const errorText = await zapierResponse.text();
            console.error('Zapier webhook error:', zapierResponse.status, errorText);
            
            // Save failed post to database
            await supabase.from('social_posts').insert({
              user_id: user.id,
              content_id: contentId,
              platform: platform || 'instagram',
              post_text: postText,
              hashtags: hashtags,
              scheduled_for: scheduledFor,
              status: 'failed',
              error_message: `Zapier webhook failed: ${zapierResponse.status}`,
            });

            return new Response(JSON.stringify({ error: 'Failed to send to Zapier' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          console.log('Zapier webhook success');

          // Save successful post to database
          const { data: savedPost, error: saveError } = await supabase.from('social_posts').insert({
            user_id: user.id,
            content_id: contentId,
            platform: platform || 'instagram',
            post_text: postText,
            hashtags: hashtags,
            scheduled_for: scheduledFor,
            status: 'scheduled',
          }).select().single();

          if (saveError) {
            console.error('Error saving post:', saveError);
          }

          return new Response(JSON.stringify({ 
            success: true, 
            post: savedPost,
            message: 'Post sent to Zapier successfully' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        } catch (zapierError) {
          console.error('Zapier fetch error:', zapierError);
          
          // Save failed post to database
          await supabase.from('social_posts').insert({
            user_id: user.id,
            content_id: contentId,
            platform: platform || 'instagram',
            post_text: postText,
            hashtags: hashtags,
            scheduled_for: scheduledFor,
            status: 'failed',
            error_message: zapierError instanceof Error ? zapierError.message : 'Unknown Zapier error',
          });

          return new Response(JSON.stringify({ error: 'Failed to connect to Zapier' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'get-posts': {
        // Get user's scheduled posts from database
        const { data: posts, error: postsError } = await supabase
          .from('social_posts')
          .select('*')
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
