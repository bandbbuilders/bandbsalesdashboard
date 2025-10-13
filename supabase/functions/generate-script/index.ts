import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, baseline } = await req.json();

    console.log('Generating script(s) with baseline:', baseline?.substring(0, 100));
    console.log('User prompt:', prompt);

    // Extract number of scripts requested from prompt
    const numberMatch = prompt.match(/(\d+)\s*scripts?/i);
    const requestedCount = numberMatch ? parseInt(numberMatch[1]) : 1;
    const count = Math.min(requestedCount, 10); // Limit to max 10 scripts

    console.log(`Generating ${count} script(s)`);

    const systemPrompt = baseline 
      ? `You are a professional marketing script writer. Generate scripts based on the following baseline/template:\n\n${baseline}\n\nFollow the style, tone, and structure defined in this baseline while incorporating the user's specific requirements.`
      : 'You are a professional marketing script writer. Generate creative and engaging marketing scripts based on the user\'s requirements.';

    const userPrompt = count > 1
      ? `${prompt}\n\nIMPORTANT: Generate exactly ${count} distinct scripts. Separate each script with "---SCRIPT_SEPARATOR---" marker. Each script should be unique and complete.`
      : prompt;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: count > 1 ? 4000 : 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Split into multiple scripts if separator is present
    let scripts: string[];
    if (count > 1 && generatedContent.includes('---SCRIPT_SEPARATOR---')) {
      scripts = generatedContent
        .split('---SCRIPT_SEPARATOR---')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    } else {
      scripts = [generatedContent];
    }

    console.log(`Successfully generated ${scripts.length} script(s)`);

    return new Response(JSON.stringify({ 
      scripts,
      script: scripts[0] // For backward compatibility
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-script function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
