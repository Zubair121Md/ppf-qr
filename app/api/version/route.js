import { NextResponse } from 'next/server';

const BUILD_VERSION = 'ppf-v3-admin-crud-audio';

export async function GET() {
  return NextResponse.json({
    app: 'Purple Patch Farms Packing',
    version: BUILD_VERSION,
    deployed: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  });
}
