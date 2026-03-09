import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { slides, images, durationPerSlide = 3, transitionDuration = 0.5 } = await request.json();

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Slides array is required' },
        { status: 400 }
      );
    }

    // Calculate total video duration
    const slideDurations = slides.map((_, i) => 
      typeof durationPerSlide === 'number' ? durationPerSlide : 
      (durationPerSlide[i] || 3)
    );
    
    const totalDuration = slideDurations.reduce((a, b) => a + b, 0) + (transitionDuration * slides.length);

    // Prepare video configuration
    const config = {
      slides: slides.map((slide, i) => ({
        type: slide.type,
        headline: slide.headline,
        sub: slide.sub,
        image: images?.[i]?.url || null,
        duration: slideDurations[i],
        transitionDuration
      })),
      settings: {
        width: 1080,
        height: 1920,
        fps: 30,
        durationPerSlide: slideDurations[0],
        transitionDuration,
        totalDuration: Math.ceil(totalDuration)
      }
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Video config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
