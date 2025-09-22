export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return new Response(JSON.stringify({ error: 'Server missing HF_TOKEN in environment' }), { status: 500 });
    }

    const hfResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/resnet-50', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json',
      },
      body: Buffer.from(arrayBuffer),
    });

    if (!hfResponse.ok) {
      const text = await hfResponse.text();
      return new Response(JSON.stringify({ error: 'Hugging Face API error', status: hfResponse.status, detail: text }), { status: 502 });
    }

    const result = await hfResponse.json();
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Unexpected server error', detail: (error as Error).message }), { status: 500 });
  }
}


