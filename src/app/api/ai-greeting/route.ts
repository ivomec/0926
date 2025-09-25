
import { NextResponse } from 'next/server';

export async function POST() {
  return new Response('연결 성공', {
    status: 200,
  });
}
