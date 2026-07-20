import { supabase } from './supabaseClient'

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { name } }
  })
  if (error) throw error
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id, name, level: 1, streak: 0, total_sessions: 0,
      streak_shields: 0, difficulty_locked: false, last_session_date: ''
    })
  }
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function ensureProfile(userId, name, email) {
  const { data } = await supabase
    .from('profiles').select('id').eq('id', userId).single()
  if (!data) {
    await supabase.from('profiles').insert({
      id: userId,
      name: name || (email ? email.split('@')[0] : 'Reader'),
      level: 1, streak: 0, total_sessions: 0,
      streak_shields: 0, difficulty_locked: false, last_session_date: ''
    })
  }
}
