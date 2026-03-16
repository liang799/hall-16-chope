'use server'

import { createClient } from '@supabase/supabase-js'

type SetupResult = {
  success: boolean
  error: string | null
}

export async function verifySetupKeyAndCreateAdmin(
  setupKey: string,
  email: string,
  password: string,
  displayName: string
): Promise<SetupResult> {
  // Verify setup key from environment variable
  const validSetupKey = process.env.ADMIN_SETUP_KEY
  
  if (!validSetupKey) {
    return {
      success: false,
      error: 'Admin setup is not configured. Please contact the system administrator.',
    }
  }

  if (setupKey !== validSetupKey) {
    return {
      success: false,
      error: 'Invalid setup key. Please contact the system administrator.',
    }
  }

  // Create Supabase admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      success: false,
      error: 'Supabase is not configured properly.',
    }
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Check if there are any existing admins
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing admins:', checkError)
      return {
        success: false,
        error: 'Failed to check existing admins.',
      }
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return {
        success: false,
        error: 'An admin account already exists. Please contact the existing admin to grant you access.',
      }
    }

    // Create the user using admin API
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        display_name: displayName,
      },
    })

    if (signUpError) {
      console.error('Error creating user:', signUpError)
      return {
        success: false,
        error: signUpError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account.',
      }
    }

    // Create or update the profile with admin flag
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        display_name: displayName,
        is_admin: true,
      })

    if (profileError) {
      console.error('Error creating admin profile:', profileError)
      return {
        success: false,
        error: 'User created but failed to set admin permissions. Please contact support.',
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error in admin setup:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }
}
