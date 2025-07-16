import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/auth';

export async function POST(req: NextRequest) {
  const { id, role } = await req.json();
  if (!id || !role) {
    return NextResponse.json({ error: 'id와 role이 필요합니다.' }, { status: 400 });
  }
  const { error } = await supabase.from('users').update({ role }).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 