import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'];
    if (contentType && contentType.startsWith('image/')) {
      return new NextResponse(response.data, {
        headers: {
          'Content-Type': contentType,
        },
      });
    } else {
      return NextResponse.json({ error: 'URL is not an image' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
