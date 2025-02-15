
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { task } = await req.json()

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(configuration)

    // Generate subtasks using OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": "You are a helpful task breakdown assistant. Break down the given task into 3-5 concrete, actionable subtasks. Return only the subtasks as a numbered list, nothing else."
        },
        {
          "role": "user",
          "content": task
        }
      ],
    })

    const response = completion.data.choices[0].message?.content || ''
    const subtasks = response
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert task
    const { data: taskData, error: taskError } = await supabaseClient
      .from('tasks')
      .insert([{ title: task }])
      .select()
      .single()

    if (taskError) throw taskError

    // Insert subtasks
    const subtasksToInsert = subtasks.map(text => ({
      task_id: taskData.id,
      text: text
    }))

    const { error: subtasksError } = await supabaseClient
      .from('subtasks')
      .insert(subtasksToInsert)

    if (subtasksError) throw subtasksError

    return new Response(
      JSON.stringify({ subtasks }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
