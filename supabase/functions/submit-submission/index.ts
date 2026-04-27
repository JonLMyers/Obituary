import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, turnstileToken, payload } = await req.json();

    if (!turnstileToken) {
      throw new Error('Turnstile token is required');
    }

    // Verify Turnstile token with Cloudflare
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('Server configuration error: Turnstile secret key not set');
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', turnstileToken);

    const cfResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });

    const cfOutcome = await cfResult.json();
    if (!cfOutcome.success) {
      console.error('Turnstile verification failed:', cfOutcome);
      throw new Error('CAPTCHA verification failed');
    }

    // Initialize Supabase admin client (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;

    // Process submission securely
    if (type === 'story') {
      const { error } = await supabase.from('stories').insert([{
        author_name: payload.name,
        author_email: payload.email,
        content: payload.content,
        attached_photo_path: payload.attached_photo_path,
        status: 'pending'
      }]);
      if (error) throw error;
      result = { success: true, message: 'Story submitted successfully' };
    } 
    else if (type === 'photo') {
      const { error } = await supabase.from('photos').insert([{
        storage_path: payload.storage_path,
        submitted_by: payload.name,
        caption: payload.caption,
        status: 'pending'
      }]);
      if (error) throw error;
      result = { success: true, message: 'Photo submitted successfully' };
    } 
    else {
      throw new Error('Invalid submission type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
