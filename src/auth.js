import { supabase } from './supabaseClient'

// Sign up with email and password
export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })
  if (error) throw error

  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      level: 1,
      streak: 0,
      total_sessions: 0
    })
  }
  return data
}

// Sign in with email and password
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

// Sign in with Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) throw error
  return data
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current session
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Get profile data
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Create profile if it doesn't exist (for Google login users)
export async function ensureProfile(userId, name, email) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!data) {
    await supabase.from('profiles').insert({
      id: userId,
      name: name || email.split('@')[0],
      level: 1,
      streak: 0,
      total_sessions: 0
    })
  }
}