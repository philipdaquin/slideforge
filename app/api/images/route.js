import { NextResponse } from 'next/server';

// Map slide types to relevant image keywords
const KEYWORD_MAP = {
  hook: 'person overwhelmed phone anxiety',
  tip: 'calm focused person desk minimal',
  feature: 'smartphone productivity clean',
  comparison: 'before after calm stress relief',
  stat: 'focus clarity minimal workspace',
  myth: 'person thinking contemplating',
  cta: 'person happy phone calm'
};

export async function POST(request) {
  try {
    const { slides, pexelsKey } = await request.json();

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Slides array is required' },
        { status: 400 }
      );
    }

    if (!pexelsKey) {
      return NextResponse.json(
        { error: 'Pexels API key is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      slides.map(async (slide) => {
        const keywords = [
          KEYWORD_MAP[slide.type] || 'calm minimal lifestyle',
          'calm lifestyle minimal',
          'peaceful person'
        ];

        for (const query of keywords) {
          try {
            const res = await fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=10`,
              {
                headers: { Authorization: pexelsKey }
              }
            );

            if (res.ok) {
              const data = await res.json();
              if (data.photos && data.photos.length) {
                const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
                return {
                  type: slide.type,
                  url: photo.src.large,
                  credit: photo.photographer,
                  creditLink: photo.photographer_url
                };
              }
            }
          } catch (e) {
            console.warn('Photo fetch failed:', e);
          }
        }
        return { type: slide.type, url: null, credit: null, creditLink: null };
      })
    );

    return NextResponse.json({ images: results });
  } catch (error) {
    console.error('Images API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
