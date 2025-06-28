import { NextRequest, NextResponse } from 'next/server';
import { warmCache, warmCacheForProject } from '@/lib/cache-warming';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, slug } = body as { action: string; slug?: string };

    switch (action) {
      case 'warm':
        if (slug) {
          await warmCacheForProject(slug);
          return NextResponse.json({ 
            success: true, 
            message: `Cache warmed for project: ${slug}` 
          });
        } else {
          await warmCache();
          return NextResponse.json({ 
            success: true, 
            message: 'Cache warming completed' 
          });
        }

      case 'status':
        const redis = await getRedisClient();
        const info = await redis.info('memory');
        return NextResponse.json({ 
          success: true, 
          info: info 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "warm" or "status"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in cache management:', error);
    return NextResponse.json(
      { error: 'Failed to perform cache operation' },
      { status: 500 }
    );
  }
} 