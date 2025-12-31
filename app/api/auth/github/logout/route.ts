import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear GitHub auth cookies
  response.cookies.delete('github_access_token');
  response.cookies.delete('github_user_data');

  return response;
}
