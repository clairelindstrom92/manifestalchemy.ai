'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center h-screen bg-black text-white">
      <div className="p-8 bg-white/5 rounded-2xl backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-amber-400 text-center mb-4">Manifest Alchemy AI</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={['google']}
        />
      </div>
    </div>
  );
}

