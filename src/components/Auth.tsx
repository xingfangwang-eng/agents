import React from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { supabase } from '@/lib/supabase';

const Auth = () => {
  return (
    <div className="w-full max-w-md mx-auto p-6 border border-border rounded-lg">
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{
          variables: {
            default: {
              colors: {
                brand: '#000000',
                brandAccent: '#333333',
              },
            },
          },
        }}
        providers={[]}
        redirectTo="/admin"
      />
    </div>
  );
};

export default Auth;