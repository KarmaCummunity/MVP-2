#!/usr/bin/env node
// Seeds a local Supabase stack with a small fictional GLOWE dataset.
// Local only: this script hard-refuses any URL whose host is not localhost.

import { pathToFileURL } from 'node:url';

import { OPPORTUNITIES, PERSONAS, POSTS } from './seed-glowe-local-data.mjs';

const DEFAULT_LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const PASSWORD = process.env.GLOWE_LOCAL_SEED_PASSWORD || 'GloweLocal!2026';

export function assertLocalSupabaseUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('SUPABASE_URL must be a valid local Supabase URL.');
  }

  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error('Refusing to seed: SUPABASE_URL must be a local Supabase URL.');
  }

  return parsed.origin;
}

const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

function createClient(baseUrl, serviceRoleKey) {
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };

  async function rest(path, { method = 'GET', body, prefer } = {}) {
    const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
      method,
      headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`${method} ${path} -> ${response.status}: ${text.slice(0, 400)}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function upsert(table, rows, onConflict) {
    const suffix = onConflict ? `?on_conflict=${onConflict}` : '';
    return rest(`${table}${suffix}`, {
      method: 'POST',
      body: rows,
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
  }

  return { headers, rest, upsert };
}

async function findUserByEmail(baseUrl, headers, email) {
  const response = await fetch(`${baseUrl}/auth/v1/admin/users?page=1&per_page=200`, { headers });
  if (!response.ok) throw new Error(`admin list users -> ${response.status}`);
  const body = await response.json();
  const users = body.users ?? body;
  return users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureUser(baseUrl, headers, persona) {
  const response = await fetch(`${baseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: persona.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: persona.name, full_name: persona.name },
    }),
  });

  if (response.ok) {
    const body = await response.json();
    return body.id ?? body.user?.id;
  }

  const body = await response.json().catch(() => ({}));
  if (response.status === 422 && /already|exists/i.test(JSON.stringify(body))) {
    const existing = await findUserByEmail(baseUrl, headers, persona.email);
    if (!existing) throw new Error(`Could not find existing user ${persona.email}`);
    await fetch(`${baseUrl}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
    });
    return existing.id;
  }

  throw new Error(`create user ${persona.email} -> ${response.status}: ${JSON.stringify(body).slice(0, 300)}`);
}

function profileRows(ids, type) {
  return PERSONAS.filter((persona) => persona.type === type).map((persona) => {
    const base = {
      id: ids[persona.key],
      display_name: persona.name,
      email: persona.email,
      onboarding_complete: true,
      country: 'Exampleland',
      location: persona.location,
      about: persona.about,
      profile_status: 'Approved',
    };

    if (persona.type === 'organization') {
      return {
        ...base,
        profile_type: 'Organization',
        account_type: 'organization',
        approval_status: persona.approval,
        focus: persona.focus,
        org_name: persona.name,
        org_website: persona.website,
        org_registration_number: persona.registration,
        org_country: 'Exampleland',
        org_field: persona.focus,
        org_description: persona.about,
        org_contact_name: persona.contact,
        org_contact_email: persona.email,
        org_contact_phone: '+1-555-0100',
        org_size: '2-10',
        org_submitted_at: daysAgo(5),
        org_reviewed_at: persona.approval === 'pending' ? null : daysAgo(4),
        org_review_note: null,
      };
    }

    return {
      ...base,
      profile_type: 'Individual',
      account_type: 'individual',
      approval_status: 'not_required',
      skills: persona.skills,
    };
  });
}

async function main() {
  const baseUrl = assertLocalSupabaseUrl(process.env.SUPABASE_URL ?? DEFAULT_LOCAL_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Set SUPABASE_SERVICE_ROLE_KEY from `supabase status -o env`.');
  }

  const client = createClient(baseUrl, serviceRoleKey);
  const ids = {};
  for (const persona of PERSONAS) {
    ids[persona.key] = await ensureUser(baseUrl, client.headers, persona);
    console.log(`user ${persona.email} -> ${ids[persona.key]}`);
  }

  for (const persona of PERSONAS) {
    await client.rest(`users?user_id=eq.${ids[persona.key]}`, {
      method: 'PATCH',
      body: { account_status: 'active', display_name: persona.name },
      prefer: 'return=minimal',
    });
  }

  await client.upsert('glowe_profiles', profileRows(ids, 'organization'), 'id');
  await client.upsert('glowe_profiles', profileRows(ids, 'individual'), 'id');
  await client.upsert('glowe_opportunities', opportunityRows(ids), 'id');
  await client.upsert('glowe_posts', postRows(ids), 'id');

  console.log('Local GLOWE seed complete.');
  console.log(`Persona password: ${PASSWORD}`);
}

function opportunityRows(ids) {
  return OPPORTUNITIES.map((item) => ({
    id: item.id,
    user_id: ids[item.owner],
    title: item.title,
    organization: PERSONAS.find((persona) => persona.key === item.owner)?.name ?? 'GLOWE Local',
    field: item.field,
    commitment: item.commitment,
    location: item.location,
    duration: item.duration,
    description: item.description,
    skills: item.skills,
    requirements: [],
    responsibilities: [],
    featured: true,
    created_at: daysAgo(2),
    start_at: null,
    end_at: null,
    event_type: null,
    registration_mode: 'gated',
    capacity: null,
  }));
}

function postRows(ids) {
  return POSTS.map((post) => ({
    id: post.id,
    user_id: ids[post.owner],
    author_name: PERSONAS.find((persona) => persona.key === post.owner)?.name ?? 'GLOWE Local',
    title: post.title,
    text: post.text,
    category: post.category,
    tags: post.tags ?? [],
    post_type: post.type,
    wish_type: post.wishType ?? null,
    impact_area: post.area ?? null,
    status: 'open',
    created_at: daysAgo(post.created),
  }));
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exit(1);
  });
}
