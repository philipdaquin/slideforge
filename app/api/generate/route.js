import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { 
      topic, 
      appName = 'the app', 
      cta, 
      count = 5, 
      tone = 'relatable',
      slideTypes = ['tip', 'feature', 'comparison']
    } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const toneMap = {
      relatable: 'raw, honest, ADHD-first-person voice — like a TikTok creator speaking directly to their people',
      educational: 'clear, informative, slightly authoritative but approachable',
      hype: 'punchy, bold, uppercase energy — like a hype reel',
      soft: 'gentle, validating, understanding — speaks to ADHD struggles with empathy'
    };

    const ctaText = cta || `Search ${appName}`;
    const typeInstructions = slideTypes.length
      ? `Mix these slide types across the value slides: ${slideTypes.join(', ')}.`
      : 'Use a mix of tips and feature highlights.';

    const prompt = `You are a TikTok content strategist for a mobile app called "${appName}" — an AI call assistant that makes and takes phone calls for you, designed for the ADHD community.

Generate a TikTok carousel with exactly ${count} slides based on this topic/angle: "${topic}"

Tone: ${toneMap[tone]}
${typeInstructions}

STRUCTURE (strictly follow this):
- Slide 1: HOOK — bold, scroll-stopping, speaks directly to ADHD pain around phone calls. No fluff.
- Slides 2 to ${count - 1}: VALUE slides — tips, features, before/after, or relatable moments. Each has a short punchy headline + 1 sentence of supporting text.
- Slide ${count}: SOFT CTA — subtle, not salesy. Something like "${ctaText}". Headline should feel like a natural ending, not an ad.

Return ONLY a JSON array. No markdown, no explanation. Format:
[
  { "type": "hook", "headline": "...", "sub": "..." },
  { "type": "tip"|"feature"|"comparison"|"stat"|"myth", "headline": "...", "sub": "..." },
  ...
  { "type": "cta", "headline": "...", "sub": "${ctaText}" }
]

Rules:
- Headlines: 4–10 words max, punchy
- Sub: 1 sentence, max 15 words
- ADHD-specific language: executive dysfunction, phone anxiety, paralysis, dopamine, overwhelm — use naturally, not forced
- The app is never the main character — the ADHD person is. The app is just the solution hinted at.
- CTA slide sub must be exactly: "${ctaText}"`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json(
        { error: 'Failed to generate content', details: error },
        { status: res.status }
      );
    }

    const data = await res.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const slides = JSON.parse(clean);

    return NextResponse.json({ slides });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
