'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.push('/');
    });
    return () => authListener.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-[#0a0a0f] text-[#f5f5f7]">
      <div className="bg-[#151520] rounded-2xl p-8 shadow-2xl border border-[#2a2a3a] w-full max-w-md mx-4">
        <h1 className="text-2xl font-semibold text-[#f5f5f7] mb-2 text-center">
          Manifest Alchemy AI
        </h1>
        <p className="text-[#a1a1aa] text-sm text-center mb-6">
          Sign in to start manifesting your dreams
        </p>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              button: {
                backgroundColor: '#6366f1',
                color: '#f5f5f7',
                borderRadius: '0.75rem',
              },
              anchor: {
                color: '#a5b4fc',
              },
              input: {
                backgroundColor: '#1f1f2e',
                borderColor: '#2a2a3a',
                color: '#f5f5f7',
              },
              label: {
                color: '#f5f5f7',
              },
            }
          }}
          theme="dark"
          providers={['google']}
        />
      </div>
    </div>
  );
}
