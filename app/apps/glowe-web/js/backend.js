// GloWe backend adapter.
// Uses Supabase when configured, while preserving the local MVP fallback.
(function () {
    const config = window.GLOWE_BACKEND_CONFIG || {};
    let clientPromise = null;

    // GloWe shares the Karma Community Supabase project. To avoid colliding with
    // KC's native tables (e.g. public.posts, public.users), all GloWe-owned
    // tables are namespaced with this prefix. See migration 0204_glowe_schema.sql.
    const TABLE_PREFIX = 'glowe_';
    const tbl = (name) => `${TABLE_PREFIX}${name}`;

    function configured() {
        return Boolean(config.supabaseUrl && config.supabaseAnonKey);
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                if (window.supabase) resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Could not load Supabase client.'));
            document.head.appendChild(script);
        });
    }

    async function getClient() {
        if (!configured()) return null;
        if (!clientPromise) {
            clientPromise = (async () => {
                if (!window.supabase) await loadScript(config.supabaseCdn);
                return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true,
                        // Separate GloWe's session from the KC app's session.
                        // Both use the same Supabase project; without a distinct key
                        // they share sb-<ref>-auth-token in localStorage, so signing
                        // out of one would also sign out the other.
                        storageKey: 'glowe-auth-v1'
                    }
                });
            })();
        }
        return clientPromise;
    }

    function profilePayload(profile = {}, user = null) {
        return {
            id: user ? user.id : profile.id,
            display_name: profile.name || profile.display_name || '',
            email: profile.email || (user ? user.email : ''),
            profile_type: profile.type || profile.profileTypeLabel || profile.profile_type || '',
            country: profile.country || '',
            public_link: profile.publicLink || profile.public_link || '',
            focus: profile.focus || '',
            about: profile.about || profile.story || '',
            needs: profile.needs || profile.publicActions || '',
            location: profile.location || '',
            languages: profile.languages || [],
            availability: profile.availability || profile.size || '',
            skills: profile.skills || profile.interests || [],
            avatar_url: profile.avatarUrl || profile.avatar_url || '',
            profile_status: profile.profileStatus || profile.profile_status || 'Draft',
            raw_profile: profile
        };
    }

    function fromProfileRow(row) {
        if (!row) return null;
        return {
            ...(row.raw_profile || {}),
            id: row.id,
            name: row.display_name,
            email: row.email,
            type: row.profile_type,
            focus: row.focus,
            about: row.about,
            needs: row.needs,
            location: row.location,
            languages: row.languages || [],
            availability: row.availability,
            skills: row.skills || [],
            avatarUrl: row.avatar_url,
            profileStatus: row.profile_status,
            // Onboarding & account type (migration 0205).
            accountType: row.account_type || null,
            onboardingComplete: row.onboarding_complete === true,
            approvalStatus: row.approval_status || 'not_required',
            country: row.country || '',
            orgName: row.org_name || '',
            orgWebsite: row.org_website || '',
            orgRegistrationNumber: row.org_registration_number || '',
            orgCountry: row.org_country || '',
            orgField: row.org_field || '',
            orgDescription: row.org_description || '',
            orgContactName: row.org_contact_name || '',
            orgContactEmail: row.org_contact_email || '',
            orgContactPhone: row.org_contact_phone || '',
            orgSize: row.org_size || '',
            orgSubmittedAt: row.org_submitted_at || null,
            orgReviewNote: row.org_review_note || ''
        };
    }

    function toProjectRow(payload = {}) {
        return {
            title: payload.title || '',
            status: payload.status || 'Draft',
            description: payload.description || ''
        };
    }

    function toOpportunityRow(payload = {}) {
        return {
            title: payload.title || '',
            organization: payload.organization || '',
            org_icon: payload.orgIcon || payload.org_icon || '',
            location: payload.location || '',
            commitment: payload.commitment || '',
            duration: payload.duration || '',
            field: payload.field || '',
            description: payload.description || '',
            skills: Array.isArray(payload.skills) ? payload.skills : [],
            requirements: payload.requirements || '',
            responsibilities: payload.responsibilities || '',
            featured: Boolean(payload.featured)
        };
    }

    function toPostRow(payload = {}) {
        return {
            title: payload.title || '',
            category: payload.category || '',
            text: payload.text || payload.content || '',
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            audience: payload.audience || '',
            language: payload.language || '',
            link: payload.link || '',
            author_name: payload.authorName || payload.author_name || ''
        };
    }

    function prepareTablePayload(table, payload = {}) {
        if (table === 'projects') return toProjectRow(payload);
        if (table === 'opportunities') return toOpportunityRow(payload);
        if (table === 'posts') return toPostRow(payload);
        return payload;
    }

    async function currentUser() {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data } = await supabaseClient.auth.getUser();
        return data && data.user ? data.user : null;
    }

    async function signUp({ email, password, profile }) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: profile.name,
                    profile_type: profile.profileTypeLabel || profile.type
                }
            }
        });
        if (error) throw error;
        const user = data.user || await currentUser();
        if (user) await upsertProfile({ ...profile, id: user.id, email: user.email }, user);
        return data;
    }

    async function signIn(email, password) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signInWithGoogle() {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        // scope:'local' clears only GloWe's own session (stored under
        // 'glowe-auth-v1') without revoking the server-side refresh token.
        // This keeps any active KC session untouched.
        const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
        if (error) throw error;
        return true;
    }

    async function fetchProfile() {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user) return null;
        const { data, error } = await supabaseClient
            .from(tbl('profiles'))
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
        if (error) throw error;
        return fromProfileRow(data);
    }

    async function upsertProfile(profile, explicitUser = null) {
        const supabaseClient = await getClient();
        const user = explicitUser || await currentUser();
        if (!supabaseClient || !user) return null;
        const payload = profilePayload({ ...profile, id: user.id, email: user.email }, user);
        const { data, error } = await supabaseClient
            .from(tbl('profiles'))
            .upsert(payload)
            .select()
            .single();
        if (error) throw error;
        return fromProfileRow(data);
    }

    // Post-sign-in onboarding (FR-GLOWE-002). Writes only the onboarding-related
    // columns via upsert so a partial pre-existing profile row is preserved.
    // Individuals are approved implicitly ('not_required'); organizations are
    // submitted for KC admin review ('pending') and stay view-only until then.
    async function completeOnboarding(details = {}) {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user) return null;
        const isOrg = details.accountType === 'organization';
        const org = details.org || {};
        const payload = {
            id: user.id,
            email: user.email,
            display_name: details.displayName || '',
            about: details.about || '',
            country: details.country || '',
            account_type: isOrg ? 'organization' : 'individual',
            onboarding_complete: true,
            approval_status: isOrg ? 'pending' : 'not_required',
            profile_type: isOrg ? 'Organization' : 'Individual',
            org_name: isOrg ? (org.name || '') : null,
            org_website: isOrg ? (org.website || '') : null,
            org_registration_number: isOrg ? (org.registrationNumber || '') : null,
            org_country: isOrg ? (org.country || details.country || '') : null,
            org_field: isOrg ? (org.field || '') : null,
            org_description: isOrg ? (org.description || '') : null,
            org_contact_name: isOrg ? (org.contactName || '') : null,
            org_contact_email: isOrg ? (org.contactEmail || user.email || '') : null,
            org_contact_phone: isOrg ? (org.contactPhone || '') : null,
            org_size: isOrg ? (org.size || '') : null,
            org_submitted_at: isOrg ? new Date().toISOString() : null
        };
        const { data, error } = await supabaseClient
            .from(tbl('profiles'))
            .upsert(payload)
            .select()
            .single();
        if (error) throw error;
        return fromProfileRow(data);
    }

    // Org review queue (FR-GLOWE-003). Both RPCs are reviewer-gated server-side
    // (super_admin/moderator); a non-reviewer caller gets a PostgREST error
    // surfaced from the 42501 the function raises — the Admin page treats that
    // as "not authorized" and shows a locked state rather than a crash.
    async function listPendingOrgs() {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.rpc('glowe_list_pending_orgs');
        if (error) throw error;
        return (data || []).map(fromProfileRow);
    }

    async function setOrgApproval(profileId, decision, note = '') {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.rpc('glowe_set_org_approval', {
            p_profile_id: profileId,
            p_decision: decision,
            p_note: note ? String(note) : null
        });
        if (error) throw error;
        return fromProfileRow(data);
    }

    async function listOwned(table) {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user) return null;
        const { data, error } = await supabaseClient
            .from(tbl(table))
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    async function insertOwned(table, payload) {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user) return null;
        const row = prepareTablePayload(table, payload);
        const { data, error } = await supabaseClient
            .from(tbl(table))
            .insert({ ...row, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async function removeOwned(table, filters) {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user) return null;
        let query = supabaseClient.from(tbl(table)).delete().eq('user_id', user.id);
        Object.entries(filters || {}).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        const { error } = await query;
        if (error) throw error;
        return true;
    }

    async function apiRequest(path, options = {}) {
        if (!configured()) return null;
        const method = (options.method || 'GET').toUpperCase();
        const body = options.body ? JSON.parse(options.body) : {};
        if (path === '/api/profile' && method === 'GET') return fetchProfile();
        if (path === '/api/profile' && method === 'PUT') return upsertProfile(body);
        if (path === '/api/projects' && method === 'GET') return listOwned('projects');
        if (path === '/api/projects' && method === 'POST') return insertOwned('projects', body);
        if (path === '/api/opportunities' && method === 'GET') return listOwned('opportunities');
        if (path === '/api/opportunities' && method === 'POST') return insertOwned('opportunities', body);
        if (path === '/api/posts' && method === 'GET') return listOwned('posts');
        if (path === '/api/posts' && method === 'POST') return insertOwned('posts', body);
        return null;
    }

    window.gloweBackend = {
        configured,
        getClient,
        currentUser,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        fetchProfile,
        upsertProfile,
        completeOnboarding,
        listPendingOrgs,
        setOrgApproval,
        listOwned,
        insertOwned,
        removeOwned,
        apiRequest
    };
})();
