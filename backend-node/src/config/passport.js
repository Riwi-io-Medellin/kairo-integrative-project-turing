import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { supabase } from './supabase.js';

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, role, clan, first_login')
      .eq('id', id)
      .single();
    done(null, user || false);
  } catch (e) {
    done(e);
  }
});

const upsertOAuthUser = async (profile, provider) => {
  const email =
    profile.emails?.[0]?.value ||
    `${provider}_${profile.id}@kairo.app`;

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) return existing;

  const { data: newUser } = await supabase
    .from('users')
    .insert({
      email,
      full_name: profile.displayName || profile.username || 'Usuario',
      role: 'coder',
      password: `oauth_${provider}_${profile.id}`,
      otp_verified: true,
      first_login: true,
    })
    .select()
    .single();

  return newUser;
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      },
      async (_at, _rt, profile, done) => {
        try {
          const user = await upsertOAuthUser(profile, 'google');
          done(null, user);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
        scope: ['user:email'],
      },
      async (_at, _rt, profile, done) => {
        try {
          const user = await upsertOAuthUser(profile, 'github');
          done(null, user);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}

export default passport;
