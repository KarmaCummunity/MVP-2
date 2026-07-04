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
            author_name: payload.authorName || payload.author_name || '',
            // Wish discriminator + lifecycle (migration 0215). Defaults keep
            // community posts unchanged.
            post_type: payload.post_type || 'community',
            wish_type: payload.wish_type || null,
            impact_area: payload.impact_area || null,
            status: payload.status || 'open'
        };
    }

    function toOfferRow(payload = {}) {
        return {
            post_id: payload.post_id || payload.postId || '',
            offer_text: payload.offer_text || payload.offerText || '',
            availability: payload.availability || '',
            contact_preference: payload.contact_preference || payload.contactPreference || ''
        };
    }

    function prepareTablePayload(table, payload = {}) {
        if (table === 'projects') return toProjectRow(payload);
        if (table === 'opportunities') return toOpportunityRow(payload);
        if (table === 'posts') return toPostRow(payload);
        if (table === 'offers') return toOfferRow(payload);
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

    // FR-GLOWE-011 AC10 — delete the caller's own glowe_profiles row. The row's
    // primary key IS the auth user id (no separate user_id column), so this
    // deletes by id; RLS ("glowe owner write profiles": auth.uid() = id) enforces
    // that a member can only remove their own profile. auth.users is untouched
    // (removing it requires KC super-admin), so the member can sign up again.
    async function deleteProfile() {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user) return null;
        const { error } = await supabaseClient.from(tbl('profiles')).delete().eq('id', user.id);
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

    // FR-GLOWE-011 AC3 — upload a profile image to the `glowe-avatars` Storage
    // bucket (migration 0219) and return its public URL. The object is written to
    // an owner-scoped folder (`<user_id>/…`) so the bucket's insert/update RLS
    // policy (`storage.foldername(name)[1] = auth.uid()`) permits the write.
    // Returns null when unauthenticated/unconfigured (the caller keeps the
    // Cloudinary fallback). Client-side type/size validation is done before this.
    async function uploadAvatar(file) {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user || !file) return null;
        const extByMime = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
        const ext = extByMime[file.type] || 'jpg';
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error } = await supabaseClient.storage
            .from('glowe-avatars')
            .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true });
        if (error) throw error;
        const { data } = supabaseClient.storage.from('glowe-avatars').getPublicUrl(path);
        return data ? data.publicUrl : null;
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

    // Fetch all public records from a table (no user filter). RLS on the table
    // controls what anonymous vs. authenticated callers can see.
    async function listAll(table, { orderBy = 'created_at', ascending = false } = {}) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient
            .from(tbl(table))
            .select('*')
            .order(orderBy, { ascending });
        if (error) throw error;
        return data || [];
    }

    // Fetch approved organization profiles from glowe_profiles.
    async function listApprovedOrgs() {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient
            .from(tbl('profiles'))
            .select('*')
            .eq('account_type', 'organization')
            .eq('approval_status', 'approved')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(fromProfileRow);
    }

    // Fetch individual profiles (volunteers / members).
    async function listMembers() {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient
            .from(tbl('profiles'))
            .select('*')
            .eq('account_type', 'individual')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(fromProfileRow);
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

    // Patch a row the caller owns (RLS owner-write enforces ownership too).
    async function updateOwned(table, id, patch) {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user) return null;
        const { data, error } = await supabaseClient
            .from(tbl(table))
            .update(patch)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        if (error) throw error;
        return data;
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

    // Register the current user for an event via the SECURITY DEFINER RPC
    // (migration 0212). The server routes open→Accepted / gated→Pending and
    // validates event state; the resolved value is the new glowe_applications row.
    async function registerForEvent(opportunityId, { email = '', phone = '', comment = '' } = {}) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.rpc('glowe_register_for_event', {
            p_opportunity_id: String(opportunityId),
            p_email: email ? String(email) : null,
            p_phone: phone ? String(phone) : null,
            p_comment: comment ? String(comment) : null
        });
        if (error) throw error;
        return data;
    }

    // Cancel the current user's own registration. The 0211 status guard permits a
    // client to move only their own row to 'Cancelled'.
    async function cancelRegistration(registrationId) {
        const supabaseClient = await getClient();
        const user = await currentUser();
        if (!supabaseClient || !user) return null;
        const { data, error } = await supabaseClient
            .from(tbl('applications'))
            .update({ status: 'Cancelled' })
            .eq('id', registrationId)
            .eq('user_id', user.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // All registrations belonging to the current user (owner-only RLS).
    async function listMyRegistrations() {
        return listOwned('applications');
    }

    // Organizer view of an event's registrations (migration 0213). The RPC is
    // owner-scoped and returns rows enriched with the registrant's display name.
    async function listEventRegistrations(opportunityId) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return [];
        const { data, error } = await supabaseClient.rpc('glowe_list_event_registrations', {
            p_opportunity_id: String(opportunityId)
        });
        if (error) throw error;
        return Array.isArray(data) ? data : [];
    }

    // FR-GLOWE-012 AC1 — opportunity owner's applicant inbox (migration 0220). The
    // RPC is owner-scoped and returns each glowe_applications row enriched with the
    // applicant's GloWe display name, avatar and email (for the Connect CTA).
    async function listApplicationsForOpportunity(opportunityId) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return [];
        const { data, error } = await supabaseClient.rpc('glowe_list_applications_for_opportunity', {
            p_opportunity_id: String(opportunityId)
        });
        if (error) throw error;
        return Array.isArray(data) ? data : [];
    }

    // FR-GLOWE-012 AC2 — opportunity owner accepts/declines an application
    // (migration 0221). Owner-scoped SECURITY DEFINER RPC; decision must be
    // 'Accepted' or 'Declined'. Returns the updated glowe_applications row.
    async function updateApplicationStatus(applicationId, decision) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.rpc('glowe_update_application_status', {
            p_application_id: String(applicationId),
            p_decision: String(decision)
        });
        if (error) throw error;
        return data;
    }

    // Organizer accept/decline of a registration (migration 0213). Accept applies
    // capacity routing (→ Waitlisted when full); decline requires a reason.
    async function decideEventRegistration(registrationId, decision, note = '') {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.rpc('glowe_decide_event_registration', {
            p_registration_id: String(registrationId),
            p_decision: String(decision),
            p_note: note ? String(note) : null
        });
        if (error) throw error;
        return data;
    }

    // Reveal a digital event's link to an entitled caller (migration 0214). The
    // server returns null when not accepted / not yet revealed.
    async function getEventLink(opportunityId) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.rpc('glowe_get_event_link', {
            p_opportunity_id: String(opportunityId)
        });
        if (error) throw error;
        return data || null;
    }

    // Organizer cancels their own event (migration 0214).
    async function cancelEvent(opportunityId) {
        const supabaseClient = await getClient();
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient.rpc('glowe_cancel_event', {
            p_opportunity_id: String(opportunityId)
        });
        if (error) throw error;
        return data;
    }

    async function isGloweAdmin() {
        const supabaseClient = await getClient();
        if (!supabaseClient) return false;
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) return false;
        // get_my_admin_roles() returns the caller's active roles via SECURITY DEFINER.
        // Both glowe_admin and super_admin grant GLOWE admin access.
        const { data, error } = await supabaseClient.rpc('get_my_admin_roles');
        if (error || !Array.isArray(data)) return false;
        return data.includes('glowe_admin') || data.includes('super_admin');
    }

    async function fetchAdminCounts() {
        const supabaseClient = await getClient();
        if (!supabaseClient) return { members: 0, orgs: 0 };
        const [membersRes, orgsRes] = await Promise.all([
            supabaseClient.from(tbl('profiles')).select('*', { count: 'exact', head: true })
                .eq('account_type', 'individual'),
            supabaseClient.from(tbl('profiles')).select('*', { count: 'exact', head: true })
                .eq('account_type', 'organization')
        ]);
        return { members: membersRes.count || 0, orgs: orgsRes.count || 0 };
    }

    async function fetchProfileById(id) {
        const supabaseClient = await getClient();
        if (!supabaseClient || !id) return null;
        const { data, error } = await supabaseClient
            .from(tbl('profiles'))
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return fromProfileRow(data);
    }

    window.gloweBackend = {
        configured,
        getClient,
        currentUser,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        deleteProfile,
        fetchProfile,
        fetchProfileById,
        upsertProfile,
        uploadAvatar,
        completeOnboarding,
        listPendingOrgs,
        setOrgApproval,
        fetchAdminCounts,
        isGloweAdmin,
        listAll,
        listApprovedOrgs,
        listMembers,
        listOwned,
        insertOwned,
        removeOwned,
        updateOwned,
        registerForEvent,
        cancelRegistration,
        listMyRegistrations,
        listEventRegistrations,
        listApplicationsForOpportunity,
        updateApplicationStatus,
        decideEventRegistration,
        getEventLink,
        cancelEvent,
        apiRequest
    };
})();
