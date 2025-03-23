import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Remove this unused variable since we're not checking file size anymore
// when receiving just a frame instead of the whole video
// const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const { frame } = await request.json();
    
    if (!frame) {
      return NextResponse.json({ error: 'No frame provided' }, { status: 400 });
    }
    
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    console.log("Sending frame to Anthropic API...");
    
    // Create a Claude message with the frame
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this football match frame. Provide details on: the teams playing, current score if visible, who appears to be winning, player positions, tactics being used, and any other relevant insights about the match situation."
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: frame
              }
            }
          ]
        }
      ]
    });
    
    return NextResponse.json({ 
      analysis: message.content
    });
    
  } catch (error: unknown) {
    console.error('Error analyzing video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze video';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Set a reasonable size limit for large base64 encoded frames
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // Reduced from 15mb since we're only handling frames now
    },
  },
}; 