import { NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

/**
 * GET /api/metrics
 * Returns performance metrics for monitoring
 */
export async function GET() {
  try {
    const summary = metrics.getSummary();

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Metrics] Failed to get metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/metrics
 * Reset all metrics (admin only)
 */
export async function DELETE() {
  try {
    // TODO: Add authentication check for admin
    metrics.reset();

    return NextResponse.json({ message: 'Metrics reset successfully' });
  } catch (error) {
    console.error('[Metrics] Failed to reset metrics:', error);
    return NextResponse.json(
      { error: 'Failed to reset metrics' },
      { status: 500 }
    );
  }
}
