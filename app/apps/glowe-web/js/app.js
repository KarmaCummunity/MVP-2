// Main application logic

// Modal handling
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = document.querySelector('.modal.active') ? 'hidden' : '';
    }
}

function switchModal(fromModalId, toModalId) {
    closeModal(fromModalId);
    setTimeout(() => openModal(toModalId), 100);
}

function showSuccessModal(title, message) {
    ensureGlobalUI();
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-message').textContent = message;
    openModal('success-modal');
}

// ── View-only write gating (FR-GLOWE-003) ───────────────────────────────────
// Browsing is open to everyone, but creating content (a need, post, event, or
// discussion) requires a registered account that is allowed to publish. Two
// gates: (1) unregistered "peek" visitors cannot write; (2) an organization is
// view-only until a KC reviewer approves it (approval_status === 'approved').
// Individuals never need approval. Returns { allowed, reason }.
function gloweWriteGate() {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        return { allowed: false, reason: 'anon' };
    }
    const profile = (typeof getPersonalProfile === 'function') ? getPersonalProfile() : {};
    const isOrg = profile.accountType === 'organization' || profile.type === 'organization';
    if (isOrg && profile.approvalStatus && profile.approvalStatus !== 'approved') {
        return { allowed: false, reason: 'org-unverified' };
    }
    return { allowed: true, reason: 'ok' };
}

// Guard for content-create handlers: returns true when the caller may publish,
// otherwise shows the appropriate view-only notice and returns false.
function canCreateContent() {
    const gate = gloweWriteGate();
    if (gate.allowed) return true;
    if (gate.reason === 'anon') {
        showSuccessModal(
            'Sign in to contribute',
            'Browsing GloWe is open to everyone. To publish a need, post, event, or discussion, please sign in or create a free account first.'
        );
    } else {
        showSuccessModal(
            'Awaiting verification',
            'Your organization is under review. Until it is approved you can explore everything, but publishing needs, posts, and events is paused — we only publish verified organizations.'
        );
    }
    return false;
}

// ── Post-sign-in onboarding (FR-GLOWE-002) ──────────────────────────────────
const GLOWE_ONBOARDING_DISMISSED_KEY = 'glowe-onboarding-dismissed';

function toggleOnboardingOrgFields() {
    const orgFields = document.getElementById('onboarding-org-fields');
    if (!orgFields) return;
    const checked = document.querySelector('input[name="onboarding-account-type"]:checked');
    orgFields.hidden = !(checked && checked.value === 'organization');
}

function openGloweOnboarding(profile) {
    ensureGlobalUI();
    if (!document.getElementById('glowe-onboarding-modal')) return;
    const user = (typeof getCurrentUser === 'function' && getCurrentUser()) || {};
    const setVal = (id, value) => { const el = document.getElementById(id); if (el) el.value = value || ''; };
    setVal('onboarding-display-name', (profile && profile.name) || user.name || '');
    setVal('onboarding-country', (profile && profile.country) || '');
    setVal('onboarding-about', (profile && profile.about) || '');
    setVal('onboarding-org-contact-email', user.email || '');
    toggleOnboardingOrgFields();
    openModal('glowe-onboarding-modal');
}

function dismissGloweOnboarding() {
    sessionStorage.setItem(GLOWE_ONBOARDING_DISMISSED_KEY, '1');
    closeModal('glowe-onboarding-modal');
}

// Auto-invite an incomplete user once per browser session.
function maybeShowGloweOnboarding(profile) {
    if (profile && profile.onboardingComplete) return;
    if (sessionStorage.getItem(GLOWE_ONBOARDING_DISMISSED_KEY) === '1') return;
    sessionStorage.setItem(GLOWE_ONBOARDING_DISMISSED_KEY, '1');
    openGloweOnboarding(profile);
}

async function handleGloweOnboarding(event) {
    event.preventDefault();
    if (!(window.gloweBackend && window.gloweBackend.configured()
          && typeof window.gloweBackend.completeOnboarding === 'function')) {
        dismissGloweOnboarding();
        return;
    }
    const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const checked = document.querySelector('input[name="onboarding-account-type"]:checked');
    const accountType = checked ? checked.value : 'individual';
    const isOrg = accountType === 'organization';

    if (isOrg) {
        const missing = [];
        if (!val('onboarding-org-name')) missing.push('organization name');
        if (!val('onboarding-org-description')) missing.push('about the organization');
        if (!val('onboarding-org-contact-name')) missing.push('contact person');
        if (!val('onboarding-org-contact-email')) missing.push('contact email');
        if (missing.length) {
            alert('To submit your organization for review, please add: ' + missing.join(', ') + '.');
            return;
        }
    }

    const submitBtn = document.getElementById('onboarding-submit');
    if (submitBtn) submitBtn.disabled = true;

    const details = {
        displayName: val('onboarding-display-name'),
        country: val('onboarding-country'),
        about: val('onboarding-about'),
        accountType,
        org: isOrg ? {
            name: val('onboarding-org-name'),
            registrationNumber: val('onboarding-org-registration'),
            website: val('onboarding-org-website'),
            country: val('onboarding-org-country'),
            field: val('onboarding-org-field'),
            size: val('onboarding-org-size'),
            description: val('onboarding-org-description'),
            contactName: val('onboarding-org-contact-name'),
            contactEmail: val('onboarding-org-contact-email'),
            contactPhone: val('onboarding-org-contact-phone')
        } : null
    };

    try {
        const profile = await window.gloweBackend.completeOnboarding(details);
        if (profile) {
            localStorage.setItem(PERSONAL_PROFILE_KEY, JSON.stringify(profile));
            // Keep the lightweight `gloweUser` name in sync with the chosen name.
            if (typeof getCurrentUser === 'function') {
                const current = getCurrentUser() || {};
                localStorage.setItem('gloweUser', JSON.stringify({
                    ...current,
                    name: profile.name || current.name,
                    type: profile.type || current.type
                }));
            }
        }
        closeModal('glowe-onboarding-modal');
        if (typeof updateAuthUI === 'function') updateAuthUI();
        if (typeof window.renderPersonalArea === 'function') window.renderPersonalArea();
        showSuccessModal(
            isOrg ? 'Application submitted' : "You're all set!",
            isOrg
                ? "Thanks! The GloWe team will review your organization. Until then you can explore everything — publishing unlocks once you're approved."
                : 'Welcome to GloWe. Your profile is ready and you have full access.'
        );
    } catch (error) {
        alert((error && error.message) || 'Could not save your details. Please try again.');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

let activeWishForSupport = null;
// Re-fetches the live opportunities board after a publish (FR-GLOWE-007 AC3).
// Assigned in initOpportunitiesPage; null on other pages.
let reloadOpportunities = null;
const PERSONAL_PROFILE_KEY = 'glowePersonalProfile';
const PERSONAL_PROJECTS_KEY = 'glowePersonalProjects';
const SAVED_ITEMS_KEY = 'gloweSavedItems';
const POST_COMMENTS_KEY = 'glowePostComments';
const APPLICATIONS_STORAGE_KEY = 'gloweApplications';
const LEGACY_APPLICATIONS_STORAGE_KEY = 'revolutionaryApplications';
const MODERATION_REPORTS_KEY = 'gloweModerationReports';
const MODERATION_HIDDEN_KEY = 'gloweModerationHidden';
const LOCAL_USERS_KEY = 'gloweUsers';

let activeReportTarget = {
    type: 'general',
    id: 'site',
    title: 'General concern'
};

const registrationInterests = [
    'Planet & Nature',
    'Justice & Rights',
    'Knowledge & Learning',
    'Health & Wellbeing',
    'Livelihoods & Innovation',
    'Communities & Culture',
    'Crisis & Safety',
    'Civic Power & Participation'
];

const registrationSdgs = [
    'No Poverty',
    'Zero Hunger',
    'Good Health',
    'Quality Education',
    'Gender Equality',
    'Clean Water',
    'Clean Energy',
    'Decent Work',
    'Reduced Inequalities',
    'Climate Action',
    'Peace & Justice',
    'Partnerships'
];

const discussionGroups = [
    {
        id: 'education',
        title: 'Education & Knowledge',
        members: 0,
        posts: 0,
        description: 'A focused group for learning spaces, youth programs, multilingual knowledge sharing, and practical education tools.',
        tags: ['Education', 'Knowledge Sharing', 'Youth'],
        threads: []
    },
    {
        id: 'environment',
        title: 'Environment & Climate Action',
        members: 0,
        posts: 0,
        description: 'For climate, food systems, waste, restoration, repair, and local environmental action.',
        tags: ['Climate', 'Food Security', 'Repair'],
        threads: []
    },
    {
        id: 'health',
        title: 'Health & Community Care',
        members: 0,
        posts: 0,
        description: 'A moderated space for wellbeing, preventive health, emergency response, and community care methods.',
        tags: ['Health', 'Wellbeing', 'Crisis Response'],
        threads: []
    },
    {
        id: 'rights',
        title: 'Rights, Safety & Civic Power',
        members: 0,
        posts: 0,
        description: 'For rights-based action, civic participation, safe moderation, and community trust.',
        tags: ['Justice', 'Safety', 'Civic Action'],
        threads: []
    }
];

const registrationProfileFields = {
    ngo: {
        label: 'NGO / Nonprofit',
        cardDescription: 'For registered nonprofits, community organizations, associations, and civil society groups.',
        storyLabel: 'Organization mission',
        storyPlaceholder: 'What is the mission, who do you serve, and what change are you working toward?',
        valuesLabel: 'Values and goals',
        valuesPlaceholder: 'Share your core values, goals, leadership, and the principles that guide your work.',
        communityLabel: 'Community you serve',
        communityPlaceholder: 'Who do you serve or work with? Include geography, population, or lived reality when relevant.',
        problemLabel: 'Problem you address',
        problemPlaceholder: 'What need, gap, or injustice is your organization responding to?',
        solutionLabel: 'Solution or method',
        solutionPlaceholder: 'Describe the work in practice: field action, education, advocacy, community work, research, or technology.',
        methodsPlaceholder: 'Policy, education, field work, technology, community organizing, research, advocacy...',
        publicPrompt: 'Open to volunteers, donations, or partnerships?',
        publicPlaceholder: 'Example: open to professional volunteers, donors, local partners, events, or knowledge exchange.',
        sizeLabel: 'Organization size',
        sizeOptions: ['1-5 people', '6-20 people', '20+ people', 'National network', 'International network'],
        fundingLabel: 'Funding / support sources',
        guidanceTitle: 'For an NGO profile, we collect',
        guidanceItems: [
            'Mission, values, goals, and the community you serve',
            'Main field, sub-field, SDGs, problem, solution, and working methods',
            'Projects, impact, how you measure success, and what you learned',
            'Public links, media, volunteer openness, and review status'
        ]
    },
    business: {
        label: 'Company / Impact Business',
        cardDescription: 'For companies, heart-led businesses, social businesses, cooperatives, and CSR/ESG teams.',
        storyLabel: 'Business purpose',
        storyPlaceholder: 'What stands at the heart of your business and what do you want to change?',
        valuesLabel: 'Business values',
        valuesPlaceholder: 'What values guide your daily work, your team culture, and your decisions?',
        communityLabel: 'Customers / community',
        communityPlaceholder: 'Who do you serve as customers, and is there a community you already work alongside?',
        problemLabel: 'Social or environmental problem',
        problemPlaceholder: 'What social, environmental, or local challenge does your business respond to?',
        solutionLabel: 'Product, service, or impact model',
        solutionPlaceholder: 'How do your products, services, logistics, space, or expertise create value in practice?',
        methodsPlaceholder: 'Products, services, discounted support, employee volunteering, logistics, space, CSR, ESG...',
        publicPrompt: 'Open to collaborations, products, services, or CSR partnerships?',
        publicPlaceholder: 'Example: open to local collaborations, discounted services, employee volunteering, CSR partnerships.',
        sizeLabel: 'Team / company size',
        sizeOptions: ['1 person', '2-5 people', '6-20 people', '20+ people', 'Corporate / multi-site'],
        fundingLabel: 'Business model / support sources',
        guidanceTitle: 'For a company profile, we collect',
        guidanceItems: [
            'Business identity, values, products or services, and customer/community focus',
            'Where you want to create social or environmental value',
            'How you can contribute: service, product, space, logistics, team time, or partnerships',
            'Public presence, logo, collaboration openness, and profile review status'
        ]
    },
    initiative: {
        label: 'Social Initiative / Project',
        cardDescription: 'For early-stage initiatives, community projects, informal teams, and field-based ideas.',
        storyLabel: 'Initiative story',
        storyPlaceholder: 'Who started it, what do you do in practice, and who is it for?',
        valuesLabel: 'Values and people behind it',
        valuesPlaceholder: 'Who is behind the initiative, what values guide you, and what kind of team or community is involved?',
        communityLabel: 'Community / audience',
        communityPlaceholder: 'Which people, place, or community is this initiative connected to?',
        problemLabel: 'Problem or need',
        problemPlaceholder: 'What need or problem did you notice that made this initiative necessary?',
        solutionLabel: 'What you do in practice',
        solutionPlaceholder: 'Describe the action itself, the model, early wins, and what you are learning as you go.',
        methodsPlaceholder: 'Community action, pilot, storytelling, mutual aid, education, local service, mentorship...',
        publicPrompt: 'Looking for volunteers, mentors, partners, or visibility?',
        publicPlaceholder: 'Example: looking for mentors, professional volunteers, partners, visibility, or a place to pilot.',
        sizeLabel: 'People involved',
        sizeOptions: ['1 founder', '2-5 people', '6-20 people', 'Community-led network', 'Growing team'],
        fundingLabel: 'Current support / resources',
        guidanceTitle: 'For a social initiative profile, we collect',
        guidanceItems: [
            'Who is behind the initiative and what you do in practice',
            'Problem, solution, values, community, team size, and SDG connection',
            'Small wins, what you learned, and how you measure progress',
            'Media, public links, and whether you are open to mentors, volunteers, or partners'
        ]
    },
    volunteer: {
        label: 'Volunteer',
        cardDescription: 'For people who want to give time, care, field support, translation, mentoring, or practical help.',
        storyLabel: 'Volunteer introduction',
        storyPlaceholder: 'Who are you, what kind of causes matter to you, and how would you like to help?',
        valuesLabel: 'How you like to volunteer',
        valuesPlaceholder: 'Do you prefer field support, translation, events, mentoring, community care, or practical tasks?',
        communityLabel: 'Preferred causes / communities',
        communityPlaceholder: 'Which causes, communities, or types of organizations are closest to your heart?',
        problemLabel: 'Causes close to your heart',
        problemPlaceholder: 'What issues do you want to help with, and why do they matter to you?',
        solutionLabel: 'Support you can offer',
        solutionPlaceholder: 'Share your availability, languages, lived experience, and the types of help you can offer.',
        methodsPlaceholder: 'Field work, translation, events, mentoring, community support, logistics, research...',
        publicPrompt: 'Can people contact you directly through GloWe?',
        publicPlaceholder: 'Example: yes, for local volunteering twice a month, remote translation, or event support.',
        sizeLabel: 'Monthly availability',
        sizeOptions: ['Up to 2 hours / month', '3-5 hours / month', '6-10 hours / month', '10+ hours / month', 'Project-based'],
        fundingLabel: 'Preferred communication',
        budgetLabel: 'Support needs / accessibility notes',
        guidanceTitle: 'For a volunteer profile, we collect',
        guidanceItems: [
            'Causes, lived experience, languages, and practical support you can offer',
            'Preferred causes, volunteering style, availability, and geography',
            'Whether you can support one project over time or short focused requests',
            'Profile image, public link if relevant, short intro, and contact preference'
        ]
    },
    professional: {
        label: 'Professional / Service Provider',
        cardDescription: 'For experts who can volunteer, offer professional services, lead forums, and ask the community for support.',
        storyLabel: 'Professional background',
        storyPlaceholder: 'What is your professional field, experience, and the kind of impact work you understand?',
        valuesLabel: 'Professional values',
        valuesPlaceholder: 'How do you want to work with communities, organizations, and local knowledge holders?',
        communityLabel: 'Who you can support',
        communityPlaceholder: 'Which organizations, initiatives, or causes can benefit from your knowledge or services?',
        problemLabel: 'Challenges you can help solve',
        problemPlaceholder: 'What types of questions, bottlenecks, or organizational needs can you help with?',
        solutionLabel: 'Services, volunteering, or forum leadership',
        solutionPlaceholder: 'Share what you can offer: consulting, legal, design, strategy, fundraising, tech, facilitation, or forum leadership.',
        methodsPlaceholder: 'Consulting, design, legal, finance, fundraising, facilitation, technology, research, moderation...',
        publicPrompt: 'Open to volunteering, paid services, forum leadership, or community support?',
        publicPlaceholder: 'Example: volunteer 3 hours/month, paid strategy sessions, can lead a fundraising forum, open to peer advice.',
        sizeLabel: 'Availability / service model',
        sizeOptions: ['Volunteer only', 'Volunteer + paid services', 'Paid services', 'Mentoring / office hours', 'Forum leadership'],
        fundingLabel: 'Preferred engagement',
        budgetLabel: 'Rates / pro-bono policy',
        guidanceTitle: 'For a professional profile, we collect',
        guidanceItems: [
            'Professional title, field, services, and what you can offer',
            'Whether you volunteer, offer paid services, lead forums, or ask for peer support',
            'Availability, service model, causes, SDGs, and geography',
            'Public links, profile image, contact preference, and review status'
        ]
    }
};

window.registrationProfileFields = registrationProfileFields;

// Opportunities are read live from glowe_opportunities (FR-GLOWE-007 AC1);
// created ones appear after a server reload, so display is the live store.
function getAllOpportunitiesForDisplay() {
    return [...opportunities];
}

function readJsonStore(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (error) {
        return fallback;
    }
}

function writeJsonStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getModerationReports() {
    return readJsonStore(MODERATION_REPORTS_KEY, []);
}

function saveModerationReports(reports) {
    writeJsonStore(MODERATION_REPORTS_KEY, reports);
}

function getHiddenModerationItems() {
    return readJsonStore(MODERATION_HIDDEN_KEY, []);
}

function saveHiddenModerationItems(items) {
    writeJsonStore(MODERATION_HIDDEN_KEY, items);
}

function moderationKey(type, id) {
    return `${type}:${id}`;
}

function isModerationHidden(type, id) {
    return getHiddenModerationItems().includes(moderationKey(type, id));
}

function addHiddenModerationItem(type, id) {
    const hidden = getHiddenModerationItems();
    const key = moderationKey(type, id);
    if (!hidden.includes(key)) saveHiddenModerationItems([key, ...hidden]);
}

function removeHiddenModerationItem(type, id) {
    saveHiddenModerationItems(getHiddenModerationItems().filter(key => key !== moderationKey(type, id)));
}

function getLocalUsers() {
    return readJsonStore(LOCAL_USERS_KEY, []);
}

function saveLocalUsers(users) {
    writeJsonStore(LOCAL_USERS_KEY, users);
}

function filterOpportunityCatalog(opportunityList, filters) {
    return opportunityList.filter(opp => {
        const haystack = `${opp.title} ${opp.description} ${opp.organization} ${(opp.skills || []).join(' ')}`.toLowerCase();
        if (filters.location && filters.location !== 'all' && !opp.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
        if (filters.field && filters.field !== 'all' && opp.field !== filters.field) return false;
        if (filters.commitment && filters.commitment !== 'all' && opp.commitment.toLowerCase() !== filters.commitment.toLowerCase()) return false;
        if (filters.search && !haystack.includes(filters.search.toLowerCase())) return false;
        return true;
    });
}

function commaList(value) {
    return value.split(',').map(item => item.trim()).filter(Boolean);
}

function getPersonalProfile() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const registeredProfile = typeof buildPersonalProfileFromRegistration === 'function'
        ? buildPersonalProfileFromRegistration(user || {})
        : {};
    const fallback = {
        id: 'demo-personal-profile',
        name: user ? user.name : 'GloWe Member',
        email: user ? user.email : 'member@glowe.community',
        type: user ? (user.profileTypeLabel || (user.type === 'organization' ? 'Organization Representative' : 'Volunteer / Professional')) : 'Volunteer / Professional',
        focus: 'Community collaboration',
        about: 'Using the GloWe space to connect knowledge, skills, projects, and practical opportunities for social impact.',
        needs: 'Looking for relevant collaborations, volunteers, knowledge sharing, and clear next steps.',
        location: 'Remote / Israel',
        languages: ['English', 'Hebrew'],
        availability: 'Flexible',
        skills: ['Community building', 'Project coordination', 'Knowledge sharing']
    };

    try {
        return { ...fallback, ...registeredProfile, ...JSON.parse(localStorage.getItem(PERSONAL_PROFILE_KEY) || '{}') };
    } catch (error) {
        return { ...fallback, ...registeredProfile };
    }
}

function savePersonalProfile(profile) {
    localStorage.setItem(PERSONAL_PROFILE_KEY, JSON.stringify({ ...getPersonalProfile(), ...profile }));
}

function getPersonalProjects() {
    const defaults = [
        {
            id: 'demo-project-1',
            title: 'Community Resource Map',
            status: 'Draft',
            description: 'A practical map of local organizations, volunteers, and available support channels.'
        }
    ];

    try {
        const saved = JSON.parse(localStorage.getItem(PERSONAL_PROJECTS_KEY) || '[]');
        return saved.length ? saved : defaults;
    } catch (error) {
        return defaults;
    }
}

function savePersonalProject(project) {
    const projects = getPersonalProjects().filter(item => item.id !== project.id);
    localStorage.setItem(PERSONAL_PROJECTS_KEY, JSON.stringify([{ id: `project-${Date.now()}`, ...project }, ...projects]));
}

function canUseBackend() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

async function apiRequest(path, options = {}) {
    if (!canUseBackend()) return null;
    if (window.gloweBackend && window.gloweBackend.configured()) {
        try {
            const supabaseResult = await window.gloweBackend.apiRequest(path, options);
            if (supabaseResult !== null && supabaseResult !== undefined) return supabaseResult;
        } catch (error) {
            console.warn('Supabase request failed; using local fallback when possible.', error);
        }
    }
    try {
        const response = await fetch(path, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

async function syncPersonalDataFromBackend() {
    const [profile, projects, savedItems] = await Promise.all([
        apiRequest('/api/profile'),
        apiRequest('/api/projects'),
        window.gloweBackend && window.gloweBackend.configured()
            ? window.gloweBackend.listOwned('saved_items').catch(() => null)
            : Promise.resolve(null)
    ]);
    if (profile) localStorage.setItem(PERSONAL_PROFILE_KEY, JSON.stringify(profile));
    if (Array.isArray(projects) && projects.length) localStorage.setItem(PERSONAL_PROJECTS_KEY, JSON.stringify(projects));
    if (Array.isArray(savedItems) && savedItems.length) {
        localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(savedItems.map(item => ({
            type: item.item_type,
            id: item.item_id,
            title: item.title,
            meta: item.meta,
            href: item.href,
            savedAt: item.created_at
        }))));
    }
    return Boolean(profile || projects || savedItems);
}

async function persistPersonalProfile(profile) {
    savePersonalProfile(profile);
    await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...getPersonalProfile(), ...profile })
    });
}

async function persistPersonalProject(project) {
    savePersonalProject(project);
    await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project)
    });
}

async function uploadProfileImageToCloudinary(file) {
    const signature = await apiRequest('/api/cloudinary/signature', { method: 'POST', body: JSON.stringify({}) });
    if (!signature || !signature.configured) {
        throw new Error(signature && signature.message ? signature.message : 'Cloudinary is not configured yet.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp);
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) throw new Error('Cloudinary upload failed.');
    const payload = await response.json();
    return payload.secure_url;
}

function renderPersonalAvatar(profile, className = 'profile-avatar') {
    if (profile.avatarUrl) {
        return `<img class="${className} profile-avatar-img" src="${profile.avatarUrl}" alt="${profile.name}">`;
    }
    return renderEntityMark(profile.name, className);
}

function renderProfileValue(value, emptyText = 'Not added yet') {
    if (Array.isArray(value)) return value.length ? value.map(escapeHtml).join(', ') : emptyText;
    return value ? escapeHtml(value) : emptyText;
}

function renderProfileLinkList(value) {
    const links = String(value || '')
        .split(/\n|,/)
        .map(link => link.trim())
        .filter(Boolean);
    if (!links.length) return '<span>Not added yet</span>';
    return links.map(link => {
        const href = /^https?:\/\//i.test(link) ? link : `https://${link}`;
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(link)}</a>`;
    }).join('<br>');
}

function renderQuestionnaireProfile(profile) {
    const typeConfig = registrationProfileFields[profile.profileType] || Object.values(registrationProfileFields).find(config => config.label === profile.type) || registrationProfileFields.ngo;
    const publicLink = profile.publicLink
        ? `<a href="${escapeHtml(/^https?:\/\//i.test(profile.publicLink) ? profile.publicLink : `https://${profile.publicLink}`)}" target="_blank" rel="noopener">${escapeHtml(profile.publicLink)}</a>`
        : 'Not added yet';
    const rows = [
        { label: 'Full name', value: profile.name },
        { label: 'Title / role', value: profile.title },
        { label: 'Organization name', value: profile.organizationName },
        { label: 'Profile type', value: profile.type },
        { label: 'Email verified', value: profile.emailVerified ? 'Yes' : 'Pending' },
        { label: 'Country / region', value: profile.country },
        { label: 'Public link', value: publicLink, raw: true },
        { label: typeConfig.sizeLabel || 'Size / team', value: profile.availability },
        { label: typeConfig.storyLabel || 'Mission / story', value: profile.story || profile.about },
        { label: typeConfig.valuesLabel || 'Values and goals', value: profile.values },
        { label: typeConfig.communityLabel || 'Community / audience', value: profile.community },
        { label: typeConfig.problemLabel || 'Problem addressed', value: profile.problem },
        { label: typeConfig.solutionLabel || 'Solution or method', value: profile.solution },
        { label: 'Interest areas', value: profile.interests || profile.skills },
        { label: 'SDGs', value: profile.sdgs },
        { label: 'Methods / approaches', value: profile.methods },
        { label: 'Public line', value: profile.shortLine },
        { label: 'Geographic activity', value: profile.location },
        { label: typeConfig.publicPrompt || 'Open actions', value: profile.publicActions || profile.needs },
        { label: typeConfig.fundingLabel || 'Funding / support sources', value: profile.funding },
        { label: typeConfig.budgetLabel || 'Annual budget / support context', value: profile.annualBudget },
        { label: 'Profile status', value: profile.profileStatus }
    ];

    return rows.map(({ label, value, raw }) => `
        <p>
            <strong>${escapeHtml(label)}</strong>
            <span>${raw ? value : renderProfileValue(value)}</span>
        </p>
    `).join('');
}

function getProfileTypeConfig(profile = {}) {
    const normalizedType = String(profile.profileType || profile.type || '').toLowerCase();
    if (normalizedType.includes('business') || normalizedType.includes('company')) return registrationProfileFields.business;
    if (normalizedType.includes('professional') || normalizedType.includes('service')) return registrationProfileFields.professional;
    if (normalizedType.includes('initiative') || normalizedType.includes('project')) return registrationProfileFields.initiative;
    if (normalizedType.includes('volunteer') || normalizedType.includes('activist')) return registrationProfileFields.volunteer;
    if (normalizedType.includes('ngo') || normalizedType.includes('nonprofit') || normalizedType.includes('organization')) return registrationProfileFields.ngo;
    return registrationProfileFields[profile.profileType]
        || Object.values(registrationProfileFields).find(config => config.label === profile.type)
        || registrationProfileFields.ngo;
}

function checkboxGroup(name, options, className = 'choice-grid') {
    return `
        <div class="${className}">
            ${options.map(option => `
                <label class="choice-card">
                    <input type="checkbox" name="${name}" value="${option}">
                    <span>${option}</span>
                </label>
            `).join('')}
        </div>
    `;
}

function renderRegistrationWizard() {
    // Google-only auth: email/password registration is intentionally hidden.
    // The multi-step profile wizard is deferred — profile details are completed
    // after the user signs in with Google. See FR-GLOWE-001 / DECISIONS D-61.
    return `
        <span class="close-modal" onclick="closeModal('register-modal')">&times;</span>
        <div class="auth-google-only">
            <div class="wizard-heading">
                <span class="profile-type">Join GloWe</span>
                <h2>Join the GloWe Community</h2>
                <p>Sign in with your Google account to get started. You can complete your profile after signing in.</p>
            </div>
            <button class="btn btn-primary btn-block google-auth-btn" type="button" onclick="handleGoogleSignIn()">
                <span aria-hidden="true">G</span>
                Continue with Google
            </button>
            <p class="modal-footer-text">Already have an account? <a href="#" onclick="switchModal('register-modal', 'login-modal')">Log in</a></p>
        </div>
    `;
}

function renderRegistrationWizardLegacy() {
    const profileOptions = Object.entries(registrationProfileFields).map(([value, config]) => `
        <label class="profile-type-card">
            <input type="radio" name="type" value="${value}" ${value === 'ngo' ? 'required' : ''}>
            <span>
                <strong>${config.label}</strong>
                <small>${config.cardDescription}</small>
            </span>
        </label>
    `).join('');

    return `
        <span class="close-modal" onclick="closeModal('register-modal')">&times;</span>
        <div class="registration-wizard">
            <div class="wizard-heading">
                <span class="profile-type">Profile onboarding</span>
                <h2>Join the GloWe Community</h2>
                <p>Build a useful profile step by step. You can save a draft now and complete more details later.</p>
            </div>
            <button class="btn btn-outline google-auth-btn" type="button" onclick="handleGoogleSignIn()">
                <span aria-hidden="true">G</span>
                Continue with Google
            </button>
            <div class="wizard-progress" aria-label="Registration progress">
                <span class="active" data-step-dot="1">Account</span>
                <span data-step-dot="2">Profile</span>
                <span data-step-dot="3">Story</span>
                <span data-step-dot="4">Impact</span>
                <span data-step-dot="5">Public</span>
                <span data-step-dot="6">Trust</span>
            </div>
            <form id="register-form" class="wizard-form" onsubmit="handleRegister(event)">
                <section class="wizard-step active" data-register-step="1">
                    <h3>Basic account</h3>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="register-first-name">First name *</label>
                            <input id="register-first-name" name="firstName" required placeholder="Your first name">
                        </div>
                        <div class="form-group">
                            <label for="register-last-name">Last name *</label>
                            <input id="register-last-name" name="lastName" required placeholder="Your last name">
                        </div>
                        <div class="form-group">
                            <label for="register-title">Title / role *</label>
                            <input id="register-title" name="title" required placeholder="Founder, volunteer, project lead, designer...">
                        </div>
                        <div class="form-group">
                            <label for="register-organization-name">Organization name</label>
                            <input id="register-organization-name" name="organizationName" placeholder="If you are joining on behalf of one">
                        </div>
                        <div class="form-group">
                            <label for="register-country">Country *</label>
                            <input id="register-country" name="country" required placeholder="Country / region">
                        </div>
                        <div class="form-group">
                            <label for="register-email">Email *</label>
                            <input id="register-email" name="email" type="email" required placeholder="hello@example.org">
                        </div>
                        <div class="form-group">
                            <label for="register-password">Password *</label>
                            <input id="register-password" name="password" type="password" required minlength="8" placeholder="Minimum 8 characters">
                        </div>
                        <div class="form-group">
                            <label for="register-password-confirm">Confirm password *</label>
                            <input id="register-password-confirm" name="passwordConfirm" type="password" required minlength="8" placeholder="Repeat your password">
                        </div>
                        <div class="form-group email-code-group">
                            <label for="register-email-code">Email verification code *</label>
                            <div class="inline-field-action">
                                <input id="register-email-code" name="emailCode" required inputmode="numeric" placeholder="6-digit code">
                                <button class="btn btn-outline btn-small" type="button" onclick="sendRegistrationEmailCode()">Send code</button>
                            </div>
                            <small id="register-email-code-help">For this MVP, the code is shown on screen and stored locally.</small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="register-public-link">Website / LinkedIn / Facebook</label>
                        <input id="register-public-link" name="publicLink" placeholder="A public link that helps us understand who you are">
                    </div>
                </section>

                <section class="wizard-step" data-register-step="2">
                    <h3>Profile type</h3>
                    <p class="modal-intro">Choose the profile that best describes you. This changes the questions and future profile layout.</p>
                    <div class="profile-type-grid">${profileOptions}</div>
                    <div class="profile-type-guidance" id="register-profile-guidance" aria-live="polite"></div>
                    <div class="form-group">
                        <label for="register-size" id="register-size-label">Size / team</label>
                        <select id="register-size" name="size">
                            <option value="">Choose if relevant</option>
                            <option>1 person</option>
                            <option>2-5 people</option>
                            <option>6-20 people</option>
                            <option>20+ people</option>
                        </select>
                    </div>
                </section>

                <section class="wizard-step" data-register-step="3">
                    <h3>Story and purpose</h3>
                    <div class="form-group">
                        <label for="register-story" id="register-story-label">Organization mission *</label>
                        <textarea id="register-story" name="story" rows="4" required placeholder="What do you do, who do you serve, and why?"></textarea>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="register-values" id="register-values-label">Values and goals *</label>
                            <textarea id="register-values" name="values" rows="4" required placeholder="Values, goals, leadership, or principles"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="register-community" id="register-community-label">Community / audience *</label>
                            <textarea id="register-community" name="community" rows="4" required placeholder="Who do you serve, support, work with, or hope to reach?"></textarea>
                        </div>
                    </div>
                </section>

                <section class="wizard-step" data-register-step="4">
                    <h3>Impact, interests and methods</h3>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="register-problem" id="register-problem-label">Problem you address *</label>
                            <textarea id="register-problem" name="problem" rows="4" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="register-solution" id="register-solution-label">Solution or method *</label>
                            <textarea id="register-solution" name="solution" rows="4" required></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Main interest areas *</label>
                        ${checkboxGroup('interests', registrationInterests)}
                    </div>
                    <div class="form-group">
                        <label>Relevant SDGs</label>
                        ${checkboxGroup('sdgs', registrationSdgs, 'choice-grid compact-choice-grid')}
                    </div>
                    <div class="form-group">
                        <label for="register-methods">Methods / approaches</label>
                        <input id="register-methods" name="methods" placeholder="Advocacy, education, field work, tech, research, community organizing...">
                    </div>
                </section>

                <section class="wizard-step" data-register-step="5">
                    <h3>Public profile and media</h3>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="register-short-line">Short public line *</label>
                            <input id="register-short-line" name="shortLine" required placeholder="Example: UX designer supporting education and community tech">
                        </div>
                        <div class="form-group">
                            <label for="register-location">Geographic activity *</label>
                            <input id="register-location" name="location" required placeholder="Local / regional / global / remote">
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="register-socials">Social links</label>
                            <textarea id="register-socials" name="socials" rows="3" placeholder="Facebook, LinkedIn, Instagram, YouTube..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="register-media">Articles / videos / reports</label>
                            <textarea id="register-media" name="media" rows="3" placeholder="Up to 3 useful public links"></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="register-logo">Logo or profile image</label>
                        <input id="register-logo" name="logo" type="file" accept="image/*">
                    </div>
                </section>

                <section class="wizard-step" data-register-step="6">
                    <h3>Trust, contact and review</h3>
                    <div class="form-group">
                        <label for="register-public-actions" id="register-public-actions-label">Public actions</label>
                        <textarea id="register-public-actions" name="publicActions" rows="3" placeholder="Open to volunteers, contact, donations, partnerships, products, events..."></textarea>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="register-funding" id="register-funding-label">Funding / support sources</label>
                            <input id="register-funding" name="funding" placeholder="Optional, internal classification">
                        </div>
                        <div class="form-group">
                            <label for="register-annual-budget" id="register-annual-budget-label">Annual budget</label>
                            <input id="register-annual-budget" name="annualBudget" placeholder="Optional. Helps match relevant support.">
                        </div>
                        <div class="form-group">
                            <label for="register-review-status">Profile status</label>
                            <select id="register-review-status" name="reviewStatus">
                                <option>Save as draft</option>
                                <option>Submit for review</option>
                            </select>
                        </div>
                    </div>
                    <label class="option-row">
                        <input id="register-community-guidelines" type="checkbox" required>
                        I agree to keep GloWe professional, respectful, transparent, and aligned with human rights.
                    </label>
                </section>

                <div class="wizard-actions">
                    <button class="btn btn-outline" type="button" data-register-prev>Back</button>
                    <button class="btn btn-primary" type="button" data-register-next>Next</button>
                    <button class="btn btn-primary" type="submit" data-register-submit>Create Account</button>
                </div>
            </form>
            <p class="modal-footer-text">Already have an account? <a href="#" onclick="switchModal('register-modal', 'login-modal')">Log in</a></p>
        </div>
    `;
}

function normalizeMainNavigation() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    const inPages = window.location.pathname.includes('/pages/');
    const prefix = inPages ? '' : 'pages/';
    const homeHref = inPages ? '../index.html' : 'index.html';
    const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
    // Once signed in, Home gives way to the Personal Area as the primary tab —
    // the logged-in user's landing context is their own dashboard, not the
    // marketing home page.
    const links = loggedIn
        ? [{ label: 'Personal Area', href: `${prefix}my-applications.html`, match: 'my-applications' }]
        : [{ label: 'Home', href: homeHref, match: 'index' }];
    links.push(
        { label: 'Wishing Well', href: `${prefix}wishing-well.html`, match: 'wishing-well' },
        { label: 'Organizations', href: `${prefix}organizations.html`, match: 'organizations' },
        { label: 'Community', href: `${prefix}community.html`, match: 'community' },
        { label: 'About', href: `${prefix}about.html`, match: 'about' }
    );
    const page = resolveGlowePage(window.location.pathname);
    nav.innerHTML = links.map(link => {
        const active = page === link.match
            || (link.match === 'about' && page === 'whats-next')
            || (link.match === 'community' && (page === 'forums' || page === 'discussion-group'))
            || (link.match === 'wishing-well' && (page === 'volunteer-network' || page === 'opportunities' || page === 'opportunity'));
        return `<a href="${link.href}" class="nav-link${active ? ' active' : ''}">${link.label}</a>`;
    }).join('');
}

function normalizeHeaderUserMenu() {
    const headerContainer = document.querySelector('.main-header .container');
    if (!headerContainer) return;

    const inPages = window.location.pathname.includes('/pages/');
    const prefix = inPages ? '' : 'pages/';
    let userMenu = headerContainer.querySelector('.user-menu');
    if (!userMenu) {
        userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        headerContainer.appendChild(userMenu);
    }
    userMenu.style.display = 'none';
    // "Personal Area" already appears once as the primary nav tab when signed in
    // (see normalizeMainNavigation), so the greeting block keeps only the
    // identity link + the Messages and Settings actions. Log Out lives inside
    // the Settings screen (see initSettingsPage). Settings collapses to its gear
    // icon on phone widths; Messages is icon-only everywhere.
    const chatIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';
    const gearIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    userMenu.innerHTML = `
        <a class="user-greeting" href="${prefix}my-applications.html">Hi, <span id="user-name">there</span></a>
        <a class="header-icon-btn" href="${prefix}messages.html" aria-label="Messages" title="Messages">${chatIcon}</a>
        <a class="btn btn-primary btn-small header-settings-btn" href="${prefix}settings.html" aria-label="Settings" title="Settings"><span class="header-settings-icon">${gearIcon}</span><span class="header-settings-label">Settings</span></a>
    `;
}

async function applyAdminLink() {
    const backend = window.gloweBackend;
    if (!backend || !backend.configured() || typeof backend.isGloweAdmin !== 'function') return;
    const isAdmin = await backend.isGloweAdmin();
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;
    const existing = userMenu.querySelector('.glowe-admin-link');
    if (existing) existing.remove();
    if (!isAdmin) return;
    const inPages = window.location.pathname.includes('/pages/');
    const prefix = inPages ? '' : 'pages/';
    const shieldSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';
    const link = document.createElement('a');
    link.className = 'btn btn-outline btn-small glowe-admin-link';
    link.href = `${prefix}admin.html`;
    link.title = 'Admin review';
    link.setAttribute('aria-label', 'Admin review');
    link.innerHTML = `<span class="glowe-admin-icon">${shieldSvg}</span><span class="glowe-admin-label">Admin review</span>`;
    userMenu.appendChild(link);
}
window.applyAdminLink = applyAdminLink;

function normalizeHeaderAuthButtons() {
    const headerContainer = document.querySelector('.main-header .container');
    if (!headerContainer) return;
    let authButtons = headerContainer.querySelector('.auth-buttons');
    if (!authButtons) {
        authButtons = document.createElement('div');
        authButtons.className = 'auth-buttons';
        headerContainer.appendChild(authButtons);
    }
    // Auth is Google-only, so signing in and joining are the same action.
    // A single combined button avoids the false "Log In vs Join" distinction.
    authButtons.innerHTML = `
        <button class="btn btn-primary btn-small" type="button" onclick="openModal('login-modal')">Sign up / Sign in</button>
    `;
}

function ensureGlobalFooter() {
    const inPages = window.location.pathname.includes('/pages/');
    const prefix = inPages ? '' : 'pages/';
    const homeHref = inPages ? '../index.html' : 'index.html';
    const currentYear = new Date().getFullYear();
    const footerHtml = `
        <div class="container">
            <div class="footer-grid">
                <div class="footer-section">
                    <h4>GloWe</h4>
                    <p>Bridging local solutions to global challenges through shared knowledge, solidarity, and practical action.</p>
                </div>
                <div class="footer-section">
                    <h4>Explore</h4>
                    <a href="${homeHref}">Home</a>
                    <a href="${prefix}wishing-well.html">Wishing Well</a>
                    <a href="${prefix}organizations.html">Organizations</a>
                    <a href="${prefix}community.html">Community</a>
                    <a href="${prefix}forums.html">Forums</a>
                    <a href="${prefix}about.html">About</a>
                </div>
                <div class="footer-section">
                    <h4>Participate</h4>
                    <a href="${prefix}my-applications.html">Personal Area</a>
                    <a href="${prefix}community.html#community-composer">Write a post</a>
                    <a href="${prefix}volunteer-network.html">Volunteer Network</a>
                    <a href="${prefix}whats-next.html">What's next</a>
                </div>
                <div class="footer-section">
                    <h4>Built With Care</h4>
                    <p>An MVP by the GloWe community, with product and implementation support by Topaz.</p>
                    <a href="${prefix}terms.html">Terms & Community Charter</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>${currentYear} GloWe. Built for shared knowledge, mutual support, and action that lasts.</p>
            </div>
        </div>
    `;

    let footer = document.querySelector('.main-footer');
    if (!footer) {
        footer = document.createElement('footer');
        footer.className = 'main-footer';
        document.body.appendChild(footer);
    }
    footer.innerHTML = footerHtml;
}

function ensureBottomNavigation() {
    if (document.querySelector('.mobile-bottom-nav')) return;
    
    const inPages = window.location.pathname.includes('/pages/');
    const prefix = inPages ? '' : 'pages/';
    const homeHref = inPages ? '../index.html' : 'index.html';
    const page = resolveGlowePage(window.location.pathname);

    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';

    const links = [
        {
            label: 'Home',
            href: homeHref,
            match: 'index',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
        },
        { 
            label: 'Wishes',
            href: `${prefix}wishing-well.html`,
            match: 'wishing-well',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
        },
        { 
            label: 'Community',
            href: `${prefix}community.html`,
            match: 'community',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
        },
        { 
            label: 'Profile',
            href: `${prefix}my-applications.html`,
            match: 'my-applications',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
        }
    ];

    nav.innerHTML = links.map(link => {
        const active = page === link.match
            || (link.match === 'community' && (page === 'forums' || page === 'discussion-group' || page === 'organizations'))
            || (link.match === 'wishing-well' && (page === 'volunteer-network' || page === 'opportunities' || page === 'opportunity'));

        return `
            <a href="${link.href}" class="bottom-nav-link${active ? ' active' : ''}">
                <span class="nav-icon">${link.icon}</span>
                <span class="nav-label">${link.label}</span>
            </a>
        `;
    }).join('');

    document.body.appendChild(nav);
}

function ensureGlobalUI() {
    normalizeHeaderAuthButtons();
    normalizeHeaderUserMenu();
    ensureGlobalFooter();
    ensureBottomNavigation();

    if (!document.getElementById('login-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="login-modal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closeModal('login-modal')">&times;</span>
                    <h2>Welcome Back</h2>
                    <p class="modal-intro">Sign in with your Google account to continue.</p>
                    <button type="button" class="btn btn-primary btn-block google-auth-btn" onclick="handleGoogleSignIn()">
                        <span aria-hidden="true">G</span>
                        Continue with Google
                    </button>
                    <p class="modal-footer-text">Don't have an account? <a href="#" onclick="switchModal('login-modal', 'register-modal')">Join our community</a></p>
                </div>
            </div>
        `);
    }
    upgradeLoginModal();

    if (!document.getElementById('register-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="register-modal" class="modal">
                <div class="modal-content">
                    ${renderRegistrationWizard()}
                </div>
            </div>
        `);
    }
    upgradeRegistrationModal();

    if (!document.getElementById('success-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="success-modal" class="modal">
                <div class="modal-content modal-success">
                    <span class="success-icon">GloWe</span>
                    <h2 id="success-title">Success</h2>
                    <p id="success-message">Your action was completed successfully.</p>
                    <button class="btn btn-primary" onclick="closeModal('success-modal')">Continue</button>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('wish-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="wish-modal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closeModal('wish-modal')">&times;</span>
                    <h2>Share a Wish</h2>
                    <p class="modal-intro">A good wish is specific enough for the right helper to say yes.</p>
                    <form onsubmit="handleWishSubmit(event)">
                        <div class="form-group">
                            <label for="wish-title">What do you need?</label>
                            <input type="text" id="wish-title" required placeholder="Mentors, space, visibility...">
                        </div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="wish-type">Wish type</label>
                                <select id="wish-type" required>
                                    <option value="">Select a type</option>
                                    <option>Volunteers Needed</option>
                                    <option>Partnership Opportunity</option>
                                    <option>Looking for Mentors</option>
                                    <option>Funding Support</option>
                                    <option>Equipment / Space</option>
                                    <option>Visibility / Media</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="wish-impact-area">Impact area</label>
                                <select id="wish-impact-area" required>
                                    <option value="">Select an area</option>
                                    <option>Education</option>
                                    <option>Climate</option>
                                    <option>Social Justice</option>
                                    <option>Tech for Good</option>
                                    <option>Community Building</option>
                                    <option>Health</option>
                                    <option>Food Security</option>
                                    <option>Knowledge Sharing</option>
                                    <option>Civic Innovation</option>
                                    <option>Business-Social Collaboration</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="wish-location-input">Location (optional)</label>
                            <input type="text" id="wish-location-input" placeholder="City, region, remote, or hybrid">
                        </div>
                        <div class="form-group">
                            <label for="wish-details">Short description</label>
                            <textarea id="wish-details" rows="4" required placeholder="Tell the community what would help."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="wish-success">What would success look like?</label>
                            <textarea id="wish-success" rows="3" required placeholder="Example: 3 mentors matched, one grant draft completed, 50 families reached..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Publish Wish</button>
                    </form>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('connect-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="connect-modal" class="modal">
                <div class="modal-content modal-wide">
                    <span class="close-modal" onclick="closeModal('connect-modal')">&times;</span>
                    <h2>Offer Support</h2>
                    <p class="modal-intro" id="connect-context">Send a clear, trusted offer so the organization can decide quickly.</p>
                    <form onsubmit="handleConnectSubmit(event)">
                        <div class="support-summary" id="support-summary"></div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="support-type">What can you offer?</label>
                                <select id="support-type" required>
                                    <option value="">Choose support type</option>
                                    <option>Professional volunteering</option>
                                    <option>Mentoring</option>
                                    <option>Funding or grant help</option>
                                    <option>Space or equipment</option>
                                    <option>Business partnership</option>
                                    <option>Media or distribution</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="support-availability">Availability</label>
                                <select id="support-availability" required>
                                    <option value="">Choose availability</option>
                                    <option>This week</option>
                                    <option>Within 2 weeks</option>
                                    <option>This month</option>
                                    <option>Flexible</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="connect-message">Message</label>
                            <textarea id="connect-message" rows="4" required placeholder="Briefly explain your relevant experience, what you can offer, and what you need to know next."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="connect-contact">Preferred contact</label>
                            <select id="connect-contact">
                                <option>In-app message</option>
                                <option>Email</option>
                                <option>Phone</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Send Offer</button>
                            <button type="button" class="btn btn-outline" onclick="handleQuickConnect()">Save Draft</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('onboarding-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="onboarding-modal" class="modal">
                <div class="modal-content modal-wide">
                    <span class="close-modal" onclick="closeModal('onboarding-modal')">&times;</span>
                    <h2>Find your GloWe path</h2>
                    <p class="modal-intro">Choose the path that matches what you want to do first.</p>
                    <div class="path-grid">
                        <button type="button" onclick="choosePath('organization')">
                            <strong>I represent an organization</strong>
                            <span>Create a profile, post a need, and receive structured offers.</span>
                        </button>
                        <button type="button" onclick="choosePath('volunteer')">
                            <strong>I can help</strong>
                            <span>Find wishes that match your skills, language, location, and time.</span>
                        </button>
                        <button type="button" onclick="choosePath('business')">
                            <strong>I am a business partner</strong>
                            <span>Match CSR teams, logistics, funding, or services with verified needs.</span>
                        </button>
                    </div>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('connection-workspace-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="connection-workspace-modal" class="modal">
                <div class="modal-content modal-wide" id="connection-workspace-content"></div>
            </div>
        `);
    }

    if (!document.getElementById('edit-profile-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="edit-profile-modal" class="modal">
                <div class="modal-content modal-wide">
                    <span class="close-modal" onclick="closeModal('edit-profile-modal')">&times;</span>
                    <h2>Edit profile</h2>
                    <p class="modal-intro">Update the public information that helps others understand who you are and how to collaborate.</p>
                    <form onsubmit="handleProfileEdit(event)">
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="edit-profile-name">Display name</label>
                                <input id="edit-profile-name" type="text" required placeholder="Organization or person name">
                            </div>
                            <div class="form-group">
                                <label for="edit-profile-type">Profile type</label>
                                <input id="edit-profile-type" type="text" placeholder="NGO, business, volunteer, initiative...">
                            </div>
                        </div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="edit-profile-country">Country / region</label>
                                <input id="edit-profile-country" type="text" placeholder="Country / region">
                            </div>
                            <div class="form-group">
                                <label for="edit-profile-public-link">Website / public link</label>
                                <input id="edit-profile-public-link" type="url" placeholder="https://...">
                            </div>
                        </div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="edit-profile-focus">Interest areas</label>
                                <input id="edit-profile-focus" type="text" required placeholder="Education, health, climate...">
                            </div>
                            <div class="form-group">
                                <label for="edit-profile-sdgs">SDGs</label>
                                <input id="edit-profile-sdgs" type="text" placeholder="Quality Education, Climate Action...">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="edit-profile-short-line">Short public line</label>
                            <input id="edit-profile-short-line" type="text" placeholder="One clear sentence people can understand quickly">
                        </div>
                        <div class="form-group">
                            <label for="edit-profile-about" id="edit-profile-about-label">Mission / story</label>
                            <textarea id="edit-profile-about" rows="4" required placeholder="Mission, current work, or what you offer."></textarea>
                        </div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="edit-profile-values" id="edit-profile-values-label">Values and goals</label>
                                <textarea id="edit-profile-values" rows="4" placeholder="Values, goals, leadership, or principles"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="edit-profile-community" id="edit-profile-community-label">Community / audience</label>
                                <textarea id="edit-profile-community" rows="4" placeholder="Who do you serve, support, work with, or hope to reach?"></textarea>
                            </div>
                        </div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="edit-profile-problem" id="edit-profile-problem-label">Problem addressed</label>
                                <textarea id="edit-profile-problem" rows="4" placeholder="What problem or need are you working on?"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="edit-profile-solution" id="edit-profile-solution-label">Solution / method</label>
                                <textarea id="edit-profile-solution" rows="4" placeholder="What do you do in practice?"></textarea>
                            </div>
                        </div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="edit-profile-methods">Methods / approaches</label>
                                <input id="edit-profile-methods" type="text" placeholder="Advocacy, education, field work, research...">
                            </div>
                            <div class="form-group">
                                <label for="edit-profile-location">Geographic activity</label>
                                <input id="edit-profile-location" type="text" placeholder="Local / regional / global / remote">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="edit-profile-needs" id="edit-profile-needs-label">Open actions / looking for</label>
                            <textarea id="edit-profile-needs" rows="3" placeholder="Partners, volunteers, funding, knowledge, visibility..."></textarea>
                        </div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="edit-profile-socials">Social links</label>
                                <textarea id="edit-profile-socials" rows="3" placeholder="Facebook, LinkedIn, Instagram, YouTube..."></textarea>
                            </div>
                            <div class="form-group">
                                <label for="edit-profile-media">Articles / videos / reports</label>
                                <textarea id="edit-profile-media" rows="3" placeholder="Useful public links"></textarea>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="edit-profile-avatar">Profile image</label>
                            <input id="edit-profile-avatar" type="file" accept="image/*">
                            <small id="edit-profile-upload-status">Optional. When Cloudinary keys are configured, this uploads to Cloudinary.</small>
                        </div>
                        <button class="btn btn-primary btn-block" type="submit">Save Profile Draft</button>
                    </form>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('glowe-onboarding-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="glowe-onboarding-modal" class="modal">
                <div class="modal-content modal-wide">
                    <span class="close-modal" onclick="dismissGloweOnboarding()">&times;</span>
                    <h2>Welcome to GloWe 👋</h2>
                    <p class="modal-intro">Tell us a little about you so the community knows who they're collaborating with. It only takes a minute.</p>
                    <form id="glowe-onboarding-form" onsubmit="handleGloweOnboarding(event)">
                        <div class="form-group">
                            <label for="onboarding-display-name">Your name</label>
                            <input id="onboarding-display-name" type="text" required placeholder="Full name">
                        </div>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="onboarding-country">Country / region</label>
                                <input id="onboarding-country" type="text" placeholder="Country / region">
                            </div>
                            <div class="form-group">
                                <label for="onboarding-about">A short line about you</label>
                                <input id="onboarding-about" type="text" placeholder="One sentence people grasp quickly">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>I'm joining as</label>
                            <div class="onboarding-type-choice">
                                <label class="onboarding-type-card">
                                    <input type="radio" name="onboarding-account-type" value="individual" checked onchange="toggleOnboardingOrgFields()">
                                    <span class="onboarding-type-title">Private individual</span>
                                    <span class="onboarding-type-desc">Volunteer, donor, or community member. Full access right away.</span>
                                </label>
                                <label class="onboarding-type-card">
                                    <input type="radio" name="onboarding-account-type" value="organization" onchange="toggleOnboardingOrgFields()">
                                    <span class="onboarding-type-title">Organization</span>
                                    <span class="onboarding-type-desc">NGO, nonprofit, or initiative. Reviewed before you can publish — only serious applications are accepted.</span>
                                </label>
                            </div>
                        </div>
                        <div id="onboarding-org-fields" hidden>
                            <p class="onboarding-review-note">Organizations are reviewed by the GloWe team. Until you're approved you can browse everything, but posting opportunities, events, and needs stays locked. Please give us enough to take your application seriously.</p>
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label for="onboarding-org-name">Organization name *</label>
                                    <input id="onboarding-org-name" type="text" placeholder="Registered / public name">
                                </div>
                                <div class="form-group">
                                    <label for="onboarding-org-registration">Registration / NGO number</label>
                                    <input id="onboarding-org-registration" type="text" placeholder="Legal registration number">
                                </div>
                            </div>
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label for="onboarding-org-website">Website / public link</label>
                                    <input id="onboarding-org-website" type="url" placeholder="https://...">
                                </div>
                                <div class="form-group">
                                    <label for="onboarding-org-country">Country of operation</label>
                                    <input id="onboarding-org-country" type="text" placeholder="Where you operate">
                                </div>
                            </div>
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label for="onboarding-org-field">Cause / field</label>
                                    <input id="onboarding-org-field" type="text" placeholder="Education, health, climate...">
                                </div>
                                <div class="form-group">
                                    <label for="onboarding-org-size">Organization size</label>
                                    <input id="onboarding-org-size" type="text" placeholder="Volunteers / staff, approx.">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="onboarding-org-description">About the organization *</label>
                                <textarea id="onboarding-org-description" rows="4" placeholder="Mission, who you serve, and what you'd do on GloWe."></textarea>
                            </div>
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label for="onboarding-org-contact-name">Contact person *</label>
                                    <input id="onboarding-org-contact-name" type="text" placeholder="Who we should talk to">
                                </div>
                                <div class="form-group">
                                    <label for="onboarding-org-contact-email">Contact email *</label>
                                    <input id="onboarding-org-contact-email" type="email" placeholder="name@org.org">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="onboarding-org-contact-phone">Contact phone</label>
                                <input id="onboarding-org-contact-phone" type="tel" placeholder="Optional">
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-primary" type="submit" id="onboarding-submit">Save and continue</button>
                            <button class="btn btn-outline" type="button" onclick="dismissGloweOnboarding()">Maybe later</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('add-project-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="add-project-modal" class="modal">
                <div class="modal-content modal-wide">
                    <span class="close-modal" onclick="closeModal('add-project-modal')">&times;</span>
                    <h2>Add project</h2>
                    <p class="modal-intro">Add a project that can appear in your personal area and help others understand what you are building.</p>
                    <form onsubmit="handlePersonalProjectSubmit(event)">
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="personal-project-title">Project title</label>
                                <input id="personal-project-title" required placeholder="Community resource map">
                            </div>
                            <div class="form-group">
                                <label for="personal-project-status">Status</label>
                                <select id="personal-project-status" required>
                                    <option>Draft</option>
                                    <option>Active</option>
                                    <option>Recruiting partners</option>
                                    <option>Needs volunteers</option>
                                    <option>Ready to share</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="personal-project-description">Description</label>
                            <textarea id="personal-project-description" rows="4" required placeholder="What is the project, who does it support, and what kind of help would move it forward?"></textarea>
                        </div>
                        <button class="btn btn-primary btn-block" type="submit">Save Project</button>
                    </form>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('wish-detail-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="wish-detail-modal" class="modal">
                <div class="modal-content modal-wide" id="wish-detail-content"></div>
            </div>
        `);
    }

    if (!document.getElementById('report-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="report-modal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closeModal('report-modal')">&times;</span>
                    <h2>Report a concern</h2>
                    <p class="modal-intro">We review every report carefully and confidentially to keep GloWe safe and professional.</p>
                    <form onsubmit="handleReportSubmit(event)">
                        <input id="report-target-type" type="hidden" value="general">
                        <input id="report-target-id" type="hidden" value="site">
                        <input id="report-target-title" type="hidden" value="General concern">
                        <div class="report-target-box">
                            <span>Reporting</span>
                            <strong id="report-target-label">General concern</strong>
                        </div>
                        <div class="form-group">
                            <label for="report-reason">What should we look at?</label>
                            <select id="report-reason" required>
                                <option value="">Choose a reason</option>
                                <option>Inaccurate information</option>
                                <option>Disrespectful or discriminatory content</option>
                                <option>Misleading promotion</option>
                                <option>Human rights concern</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="report-details">Details</label>
                            <textarea id="report-details" rows="4" placeholder="Add context that can help our review."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Submit Report</button>
                    </form>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('notification-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="notification-modal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closeModal('notification-modal')">&times;</span>
                    <h2>Notification Preferences</h2>
                    <p class="modal-intro">Choose a rhythm that keeps GloWe useful without creating digital fatigue.</p>
                    <form onsubmit="handleNotificationPrefs(event)">
                        <label class="option-row"><input type="checkbox" checked> Opportunity of the week</label>
                        <label class="option-row"><input type="checkbox" checked> High-match connection proposals</label>
                        <label class="option-row"><input type="checkbox"> Deadline reminders</label>
                        <label class="option-row"><input type="checkbox" checked> Crisis-response playbooks for my region</label>
                        <div class="form-group">
                            <label for="cadence">Preferred cadence</label>
                            <select id="cadence">
                                <option>Weekly digest</option>
                                <option>Only urgent actions</option>
                                <option>Daily 5-minute brief</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Save Preferences</button>
                    </form>
                </div>
            </div>
        `);
    }

    document.querySelectorAll('.auth-buttons button').forEach(button => {
        const label = button.textContent.trim().toLowerCase();
        if (!button.getAttribute('onclick') && label.includes('log')) {
            button.setAttribute('onclick', "openModal('login-modal')");
        }
        if (!button.getAttribute('onclick') && (label.includes('join') || label.includes('sign'))) {
            button.setAttribute('onclick', "openModal('register-modal')");
        }
    });

    if (!document.body.dataset.globalClickHandler) {
        document.body.dataset.globalClickHandler = 'true';
        document.body.addEventListener('click', function(event) {
            const link = event.target.closest('a[href="#"]');
            if (!link) return;
            const text = link.textContent.trim().toLowerCase();
            if (text.includes('register') || text.includes('join')) {
                event.preventDefault();
                openModal('register-modal');
            } else if (text.includes('post') || text.includes('opportunity')) {
                event.preventDefault();
                openWishModal();
            } else if (text.includes('log')) {
                event.preventDefault();
                openModal('login-modal');
            }
        });
    }

    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
}

function upgradeRegistrationModal() {
    const modal = document.getElementById('register-modal');
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    if (!content || content.dataset.registrationWizard === 'true') return;
    content.classList.add('modal-wide', 'registration-modal-content');
    content.innerHTML = renderRegistrationWizard();
    content.dataset.registrationWizard = 'true';
    initRegistrationWizard(content);
}

// Google-only auth: overwrite any static email/password login modal (present in
// the original GloWe page templates) with a single "Continue with Google" CTA,
// so every page shows the same Google-only flow. See FR-GLOWE-001 / D-61.
function upgradeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    if (!content || content.dataset.googleOnly === 'true') return;
    content.innerHTML = `
        <span class="close-modal" onclick="closeModal('login-modal')">&times;</span>
        <h2>Welcome Back!</h2>
        <p class="modal-intro">Sign in with your Google account to continue.</p>
        <button type="button" class="btn btn-primary btn-block google-auth-btn" onclick="handleGoogleSignIn()">
            <span aria-hidden="true">G</span>
            Continue with Google
        </button>
        <p class="modal-footer-text">Don't have an account? <a href="#" onclick="switchModal('login-modal', 'register-modal')">Join our community</a></p>
    `;
    content.dataset.googleOnly = 'true';
}

function initRegistrationWizard(root = document) {
    const form = root.querySelector('#register-form');
    if (!form || form.dataset.wizardReady === 'true') return;
    form.dataset.wizardReady = 'true';
    let step = 1;
    const totalSteps = form.querySelectorAll('[data-register-step]').length;
    const next = form.querySelector('[data-register-next]');
    const prev = form.querySelector('[data-register-prev]');
    const typeInputs = form.querySelectorAll('input[name="type"]');

    function showStep(nextStep) {
        step = Math.max(1, Math.min(totalSteps, nextStep));
        form.querySelectorAll('[data-register-step]').forEach(section => {
            section.classList.toggle('active', Number(section.dataset.registerStep) === step);
        });
        root.querySelectorAll('[data-step-dot]').forEach(dot => {
            dot.classList.toggle('active', Number(dot.dataset.stepDot) <= step);
        });
        prev.style.display = step === 1 ? 'none' : 'inline-flex';
        next.style.display = step === totalSteps ? 'none' : 'inline-flex';
        form.querySelector('[data-register-submit]').style.display = step === totalSteps ? 'inline-flex' : 'none';
    }

    function validateCurrentStep() {
        const active = form.querySelector(`[data-register-step="${step}"]`);
        const fields = [...active.querySelectorAll('input, select, textarea')];
        const validFields = fields.every(field => field.reportValidity());
        if (!validFields) return false;
        if (step === 4 && !form.querySelector('input[name="interests"]:checked')) {
            alert('Please choose at least one main interest area.');
            return false;
        }
        return true;
    }

    function applyProfileType() {
        const selected = form.querySelector('input[name="type"]:checked');
        const config = selected ? registrationProfileFields[selected.value] : registrationProfileFields.ngo;
        if (!config) return;
        const guidance = form.querySelector('#register-profile-guidance');
        if (guidance) {
            guidance.innerHTML = `
                <strong>${config.guidanceTitle}</strong>
                <ul>${(config.guidanceItems || []).map(item => `<li>${item}</li>`).join('')}</ul>
            `;
        }
        form.querySelector('#register-story-label').textContent = `${config.storyLabel} *`;
        form.querySelector('#register-story').placeholder = config.storyPlaceholder;
        form.querySelector('#register-values-label').textContent = `${config.valuesLabel} *`;
        form.querySelector('#register-values').placeholder = config.valuesPlaceholder;
        form.querySelector('#register-community-label').textContent = `${config.communityLabel} *`;
        form.querySelector('#register-community').placeholder = config.communityPlaceholder;
        form.querySelector('#register-problem-label').textContent = `${config.problemLabel} *`;
        form.querySelector('#register-problem').placeholder = config.problemPlaceholder;
        form.querySelector('#register-solution-label').textContent = `${config.solutionLabel} *`;
        form.querySelector('#register-solution').placeholder = config.solutionPlaceholder;
        form.querySelector('#register-methods').placeholder = config.methodsPlaceholder;
        form.querySelector('#register-public-actions-label').textContent = config.publicPrompt;
        form.querySelector('#register-public-actions').placeholder = config.publicPlaceholder;
        form.querySelector('#register-size-label').textContent = config.sizeLabel;
        const sizeSelect = form.querySelector('#register-size');
        if (sizeSelect && Array.isArray(config.sizeOptions)) {
            const currentValue = sizeSelect.value;
            sizeSelect.innerHTML = `<option value="">Choose if relevant</option>${config.sizeOptions.map(option => `<option>${option}</option>`).join('')}`;
            if (config.sizeOptions.includes(currentValue)) {
                sizeSelect.value = currentValue;
            }
        }
        form.querySelector('#register-funding-label').textContent = config.fundingLabel;
        const annualBudgetLabel = form.querySelector('#register-annual-budget-label');
        const annualBudgetInput = form.querySelector('#register-annual-budget');
        if (annualBudgetLabel && annualBudgetInput) {
            annualBudgetLabel.textContent = config.budgetLabel || (selected && selected.value === 'ngo' ? 'Annual budget' : 'Budget / support context');
            annualBudgetInput.placeholder = selected && selected.value === 'ngo'
                ? 'Example: under $50k, $50k-$250k, $250k+, or prefer not to say'
                : 'Optional. Share only what helps the community understand your context.';
        }
    }

    next.addEventListener('click', () => {
        if (validateCurrentStep()) showStep(step + 1);
    });
    prev.addEventListener('click', () => showStep(step - 1));
    typeInputs.forEach(input => input.addEventListener('change', applyProfileType));
    applyProfileType();
    showStep(1);
}

function collectChecked(form, name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function openWishModal() {
    ensureGlobalUI();
    openModal('wish-modal');
}

function openOnboardingModal() {
    ensureGlobalUI();
    openModal('onboarding-modal');
}

function openEditProfile(profileName = '') {
    ensureGlobalUI();
    const profile = getPersonalProfile();
    const typeConfig = getProfileTypeConfig(profile);
    document.getElementById('edit-profile-name').value = profileName || profile.name;
    document.getElementById('edit-profile-type').value = profile.type || '';
    document.getElementById('edit-profile-country').value = profile.country || '';
    document.getElementById('edit-profile-public-link').value = profile.publicLink || '';
    document.getElementById('edit-profile-focus').value = profile.focus || '';
    document.getElementById('edit-profile-sdgs').value = (profile.sdgs || []).join(', ');
    document.getElementById('edit-profile-short-line').value = profile.shortLine || '';
    document.getElementById('edit-profile-about').value = profile.about || '';
    document.getElementById('edit-profile-values').value = profile.values || '';
    document.getElementById('edit-profile-community').value = profile.community || '';
    document.getElementById('edit-profile-problem').value = profile.problem || '';
    document.getElementById('edit-profile-solution').value = profile.solution || '';
    document.getElementById('edit-profile-methods').value = profile.methods || '';
    document.getElementById('edit-profile-location').value = profile.location || '';
    document.getElementById('edit-profile-needs').value = profile.needs || '';
    document.getElementById('edit-profile-socials').value = profile.socials || '';
    document.getElementById('edit-profile-media').value = profile.media || '';
    document.getElementById('edit-profile-about-label').textContent = typeConfig.storyLabel || 'Mission / story';
    document.getElementById('edit-profile-about').placeholder = typeConfig.storyPlaceholder || 'Mission, current work, or what you offer.';
    document.getElementById('edit-profile-values-label').textContent = typeConfig.valuesLabel || 'Values and goals';
    document.getElementById('edit-profile-values').placeholder = typeConfig.valuesPlaceholder || 'Values, goals, leadership, or principles';
    document.getElementById('edit-profile-community-label').textContent = typeConfig.communityLabel || 'Community / audience';
    document.getElementById('edit-profile-community').placeholder = typeConfig.communityPlaceholder || 'Who do you serve, support, work with, or hope to reach?';
    document.getElementById('edit-profile-problem-label').textContent = typeConfig.problemLabel || 'Problem addressed';
    document.getElementById('edit-profile-problem').placeholder = typeConfig.problemPlaceholder || 'What problem or need are you working on?';
    document.getElementById('edit-profile-solution-label').textContent = typeConfig.solutionLabel || 'Solution / method';
    document.getElementById('edit-profile-solution').placeholder = typeConfig.solutionPlaceholder || 'What do you do in practice?';
    document.getElementById('edit-profile-methods').placeholder = typeConfig.methodsPlaceholder || 'Advocacy, education, field work, research...';
    document.getElementById('edit-profile-needs-label').textContent = typeConfig.publicPrompt || 'Open actions / looking for';
    document.getElementById('edit-profile-needs').placeholder = typeConfig.publicPlaceholder || 'Partners, volunteers, funding, knowledge, visibility...';
    openModal('edit-profile-modal');
}

async function handleProfileEdit(event) {
    event.preventDefault();
    const status = document.getElementById('edit-profile-upload-status');
    const avatarInput = document.getElementById('edit-profile-avatar');
    let uploadWarning = '';
    const profileDraft = {
        name: document.getElementById('edit-profile-name').value,
        type: document.getElementById('edit-profile-type').value,
        country: document.getElementById('edit-profile-country').value,
        publicLink: document.getElementById('edit-profile-public-link').value,
        focus: document.getElementById('edit-profile-focus').value,
        interests: commaList(document.getElementById('edit-profile-focus').value),
        skills: commaList(document.getElementById('edit-profile-focus').value),
        sdgs: commaList(document.getElementById('edit-profile-sdgs').value),
        shortLine: document.getElementById('edit-profile-short-line').value,
        about: document.getElementById('edit-profile-about').value,
        story: document.getElementById('edit-profile-about').value,
        values: document.getElementById('edit-profile-values').value,
        community: document.getElementById('edit-profile-community').value,
        problem: document.getElementById('edit-profile-problem').value,
        solution: document.getElementById('edit-profile-solution').value,
        methods: document.getElementById('edit-profile-methods').value,
        location: document.getElementById('edit-profile-location').value,
        needs: document.getElementById('edit-profile-needs').value,
        publicActions: document.getElementById('edit-profile-needs').value,
        socials: document.getElementById('edit-profile-socials').value,
        media: document.getElementById('edit-profile-media').value
    };

    if (avatarInput && avatarInput.files && avatarInput.files[0]) {
        try {
            if (status) status.textContent = 'Uploading image...';
            profileDraft.avatarUrl = await uploadProfileImageToCloudinary(avatarInput.files[0]);
        } catch (error) {
            if (status) status.textContent = error.message;
            uploadWarning = ' Image upload needs Cloudinary keys configured on the backend.';
        }
    }

    await persistPersonalProfile(profileDraft);
    closeModal('edit-profile-modal');
    if (typeof window.renderPersonalArea === 'function') {
        window.renderPersonalArea();
    }
    showSuccessModal('Profile saved', `Your personal profile was saved through the backend when available.${uploadWarning}`);
}

function openPersonalProjectModal() {
    ensureGlobalUI();
    document.getElementById('personal-project-title').value = '';
    document.getElementById('personal-project-status').value = 'Draft';
    document.getElementById('personal-project-description').value = '';
    openModal('add-project-modal');
}

async function handlePersonalProjectSubmit(event) {
    event.preventDefault();
    if (!canCreateContent()) return;
    await persistPersonalProject({
        title: document.getElementById('personal-project-title').value,
        status: document.getElementById('personal-project-status').value,
        description: document.getElementById('personal-project-description').value
    });
    closeModal('add-project-modal');
    if (typeof window.renderPersonalArea === 'function') {
        window.renderPersonalArea();
    }
    showSuccessModal('Project added', 'The project now appears in your personal area.');
}

function choosePath(path) {
    closeModal('onboarding-modal');
    if (path === 'organization') {
        openWishModal();
        return;
    }
    if (path === 'volunteer') {
        window.location.href = window.location.pathname.includes('/pages/')
            ? 'volunteer-network.html'
            : 'pages/volunteer-network.html';
        return;
    }
    window.location.href = window.location.pathname.includes('/pages/')
        ? 'organizations.html'
        : 'pages/organizations.html';
}

// Open the "Post a Need" composer, gated by the write-permission check.
function openWishComposer() {
    ensureGlobalUI();
    if (!canCreateContent()) return;
    openModal('wish-modal');
}

async function handleWishSubmit(event) {
    event.preventDefault();
    if (!canCreateContent()) return;
    const helpers = (typeof GloweWishes !== 'undefined') ? GloweWishes : null;
    const draft = {
        title: (document.getElementById('wish-title').value || '').trim(),
        wish_type: document.getElementById('wish-type').value,
        impact_area: document.getElementById('wish-impact-area').value,
        details: document.getElementById('wish-details').value,
        success: document.getElementById('wish-success').value,
        location: document.getElementById('wish-location-input').value
    };
    const check = helpers ? helpers.validateWishDraft(draft)
        : { valid: Boolean(draft.title && draft.wish_type && draft.impact_area) };
    if (!check.valid) { showSuccessModal('Missing details', check.error || 'Please fill in the required fields.'); return; }
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) return;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Publishing...'; }
    try {
        const profile = typeof getPersonalProfile === 'function' ? getPersonalProfile() : null;
        await backend.insertOwned('posts', {
            post_type: 'wish', status: 'open',
            title: draft.title, wish_type: draft.wish_type, impact_area: draft.impact_area,
            text: helpers ? helpers.buildWishText(draft) : (draft.details || ''),
            authorName: (profile && profile.name) || 'GloWe Member'
        });
        closeModal('wish-modal');
        event.target.reset();
        showSuccessModal('Wish published', 'Your need is now live on the Wishing Well.');
        if (reloadWishBoard) await reloadWishBoard();
    } catch (_e) {
        showSuccessModal('Could not publish', 'Something went wrong publishing your wish. Please try again.');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Publish Wish'; }
    }
}

function showSupportModal(wishId = null) {
    ensureGlobalUI();
    activeWishForSupport = wishId ? wishes.find(item => String(item.id) === String(wishId)) : null;
    const context = document.getElementById('connect-context');
    const summary = document.getElementById('support-summary');
    const message = document.getElementById('connect-message');
    if (activeWishForSupport) {
        context.textContent = `You are offering support for: ${activeWishForSupport.title}`;
        summary.innerHTML = `
            <strong>${activeWishForSupport.author}</strong>
            <span>${activeWishForSupport.type} | ${activeWishForSupport.location}</span>
            <p>${activeWishForSupport.description}</p>
        `;
        if (message) {
            message.value = `Hi ${activeWishForSupport.author}, I can help with ${activeWishForSupport.title}. `;
        }
    } else {
        context.textContent = 'Send a clear, trusted offer so the organization can decide quickly.';
        summary.innerHTML = '';
        if (message) message.value = '';
    }
    openModal('connect-modal');
}

async function handleConnectSubmit(event) {
    event.preventDefault();
    if (!isLoggedIn()) {
        showSuccessModal('Sign in to offer support', 'Please sign in or create a free account to send an offer to this need.');
        return;
    }
    const helpers = (typeof GloweWishes !== 'undefined') ? GloweWishes : null;
    const draft = {
        support_type: document.getElementById('support-type').value,
        availability: document.getElementById('support-availability').value,
        message: document.getElementById('connect-message').value,
        contact_preference: (document.getElementById('connect-contact') || {}).value || 'In-app message'
    };
    draft.offer_text = helpers ? helpers.buildOfferText(draft) : (draft.message || '');
    const check = helpers ? helpers.validateOfferDraft(draft)
        : { valid: Boolean(draft.offer_text && draft.availability) };
    if (!check.valid) { showSuccessModal('Missing details', check.error || 'Please complete the offer.'); return; }
    const backend = window.gloweBackend;
    if (!backend || !backend.configured() || !activeWishForSupport) return;
    try {
        await backend.insertOwned('offers', {
            post_id: activeWishForSupport.id,
            offer_text: draft.offer_text,
            availability: draft.availability,
            contact_preference: draft.contact_preference
        });
        closeModal('connect-modal');
        event.target.reset();
        showSuccessModal('Offer sent', 'Your offer of support has been recorded. The organizer can follow up with you.');
    } catch (_e) {
        showSuccessModal('Could not send offer', 'Something went wrong sending your offer. Please try again.');
    }
}

function handleQuickConnect() {
    closeModal('connect-modal');
    showSuccessModal('Draft saved', 'Your offer draft is saved in this workspace so you can return to it later.');
}

function openConnectionWorkspace() {
    ensureGlobalUI();
    const wish = activeWishForSupport;
    const content = document.getElementById('connection-workspace-content');
    const title = wish ? wish.title : 'New collaboration';
    const author = wish ? wish.author : 'GloWe member';
    content.innerHTML = `
        <span class="close-modal" onclick="closeModal('connection-workspace-modal')">&times;</span>
        <div class="workspace-header">
            <span class="hero-kicker">Connection workspace</span>
            <h2>${escapeHtml(title)}</h2>
            <p>Your offer was sent to ${escapeHtml(author)}. This shared workspace shows the next steps that make the connection real.</p>
        </div>
        <div class="workspace-steps">
            <article class="done"><strong>Offer sent</strong><span>Structured support offer submitted.</span></article>
            <article><strong>Organization review</strong><span>${escapeHtml(author)} reviews fit, timing, and safety details.</span></article>
            <article><strong>First coordination call</strong><span>Both sides confirm scope, timeline, and ownership.</span></article>
            <article><strong>Impact update</strong><span>A short outcome note documents what changed.</span></article>
        </div>
        <div class="impact-update-box">
            <h3>Draft impact update</h3>
            <p>When work is complete, this becomes a short public note: what was needed, who helped, what happened, and what is still needed.</p>
            <button class="btn btn-primary" type="button" onclick="showSuccessModal('Impact update drafted', 'This closes the loop from need to documented outcome.')">Draft Update</button>
        </div>
    `;
    openModal('connection-workspace-modal');
}

function openReportModal(type = 'general', id = 'site', title = 'General concern') {
    ensureGlobalUI();
    activeReportTarget = { type, id: String(id), title };
    const targetType = document.getElementById('report-target-type');
    const targetId = document.getElementById('report-target-id');
    const targetTitle = document.getElementById('report-target-title');
    const targetLabel = document.getElementById('report-target-label');
    if (targetType) targetType.value = activeReportTarget.type;
    if (targetId) targetId.value = activeReportTarget.id;
    if (targetTitle) targetTitle.value = activeReportTarget.title;
    if (targetLabel) targetLabel.textContent = activeReportTarget.title;
    openModal('report-modal');
}

function openNotificationPrefs() {
    ensureGlobalUI();
    openModal('notification-modal');
}

function handleNotificationPrefs(event) {
    event.preventDefault();
    closeModal('notification-modal');
    showSuccessModal('Preferences saved', 'GloWe will focus on action-oriented updates and avoid unnecessary noise.');
}

function openFundingBrief() {
    showSuccessModal('Funding preparation', 'For the MVP, this is a planning prompt. Future versions may include structured grant briefs and budget checklists.');
}

function openCrowdfundingModal() {
    showSuccessModal('Future community support flow', 'For the MVP, urgent funding appears as wishes, posts, and direct collaboration requests rather than a separate funding pool.');
}

function openPrivateMessage(name = 'this member') {
    ensureGlobalUI();
    const modal = document.getElementById('message-modal');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="message-modal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closeModal('message-modal')">&times;</span>
                    <h2>Write a message</h2>
                    <p class="modal-intro" id="message-context"></p>
                    <form onsubmit="handleMessageSubmit(event)">
                        <div class="form-group">
                            <label for="message-body">Message</label>
                            <textarea id="message-body" rows="5" required placeholder="Write a short, respectful message with clear next steps."></textarea>
                        </div>
                        <button class="btn btn-primary btn-block" type="submit">Send Message</button>
                    </form>
                </div>
            </div>
        `);
    }
    document.getElementById('message-context').textContent = `To: ${name}`;
    document.getElementById('message-body').value = `Hi ${name}, I saw your profile on GloWe and would like to connect. `;
    openModal('message-modal');
}

function handleMessageSubmit(event) {
    event.preventDefault();
    closeModal('message-modal');
    showSuccessModal('Message saved', 'This opens a private conversation thread in the GloWe workspace.');
}

function addProjectFeedback() {
    showSuccessModal('Feedback saved', 'This recommendation can appear on the project after community moderation.');
}

function rateOrganization(name = 'this organization') {
    showSuccessModal('Rating recorded', `Your trust signal for ${name} will help rank active organizations by involvement and documented impact.`);
}

function toggleLowDataMode() {
    const enabled = !document.body.classList.contains('low-data-mode');
    document.body.classList.toggle('low-data-mode', enabled);
    localStorage.setItem('gloweLowDataMode', enabled ? 'true' : 'false');
    showSuccessModal(
        enabled ? 'Low-data mode on' : 'Low-data mode off',
        enabled ? 'Images and heavy visual layers are reduced for faster, lighter use.' : 'Full visual experience restored.'
    );
}

function getInitials(name = '') {
    return name
        .replace(/&/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase() || 'GW';
}

function renderEntityMark(name, className = 'entity-mark') {
    return `<span class="${className}">${getInitials(name)}</span>`;
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function jsString(value = '') {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getSavedItems() {
    try {
        return JSON.parse(localStorage.getItem(SAVED_ITEMS_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

function getApplications() {
    try {
        const current = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
        if (current) return JSON.parse(current);
        const legacy = localStorage.getItem(LEGACY_APPLICATIONS_STORAGE_KEY);
        if (legacy) {
            localStorage.setItem(APPLICATIONS_STORAGE_KEY, legacy);
            return JSON.parse(legacy);
        }
        return [];
    } catch (error) {
        return [];
    }
}

function saveApplications(applications) {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
}

function setSavedItems(items) {
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
}

function saveItem(type, id, title, meta = '', href = '') {
    const items = getSavedItems();
    const itemId = String(id);
    const exists = items.some(item => item.type === type && String(item.id) === itemId);
    if (!exists) {
        const savedItem = { type, id: itemId, title, meta, href, savedAt: new Date().toISOString() };
        setSavedItems([savedItem, ...items]);
        if (window.gloweBackend && window.gloweBackend.configured()) {
            window.gloweBackend.insertOwned('saved_items', {
                item_type: type,
                item_id: itemId,
                title,
                meta,
                href
            }).catch(() => {});
        }
    }
    showSuccessModal('Saved', `${title} was added to your saved area.`);
}

function removeSavedItem(type, id) {
    setSavedItems(getSavedItems().filter(item => !(item.type === type && String(item.id) === String(id))));
    if (window.gloweBackend && window.gloweBackend.configured()) {
        window.gloweBackend.removeOwned('saved_items', {
            item_type: type,
            item_id: String(id)
        }).catch(() => {});
    }
    if (typeof window.renderSavedItemsPage === 'function') window.renderSavedItemsPage();
    if (typeof window.renderPersonalArea === 'function') window.renderPersonalArea();
}

function getPostComments() {
    try {
        return JSON.parse(localStorage.getItem(POST_COMMENTS_KEY) || '{}');
    } catch (error) {
        return {};
    }
}

// Backend comment cache (FR-GLOWE-008 AC4). Null until loaded / when the
// backend is not configured, in which case cards fall back to localStorage.
let backendPostComments = null;

// Fetch all glowe_comments and group them by post_id for the feed render.
async function loadPostComments() {
    backendPostComments = null;
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) return;
    let rows = [];
    try { rows = await backend.listAll('comments'); } catch (_e) { rows = []; }
    backendPostComments = (typeof GlowePosts !== 'undefined')
        ? GlowePosts.groupCommentsByPost(rows || [])
        : {};
}

// Comments to render for a post: backend rows (authoritative) merged with any
// local-only comment just posted; localStorage-only when backend is offline.
function getPostCommentsFor(postId) {
    const local = getPostComments()[postId] || [];
    if (!backendPostComments) return local;
    const backend = backendPostComments[postId] || [];
    return (typeof GlowePosts !== 'undefined')
        ? GlowePosts.mergeCommentLists(backend, local)
        : backend;
}

// Live forum group catalog (glowe_forum_groups). null before the first load
// attempt; an array afterwards (possibly empty when the backend is offline or
// unseeded, in which case the hardcoded discussionGroups is the demo fallback).
// FR-GLOWE-009 AC1.
let backendForumGroups = null;

async function loadForumGroups() {
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) { backendForumGroups = []; return; }
    let rows = [];
    try { rows = await backend.listAll('forum_groups', { orderBy: 'created_at', ascending: true }); } catch (_e) { rows = []; }
    backendForumGroups = (typeof GloweForums !== 'undefined')
        ? GloweForums.mapForumGroups(rows || [])
        : [];
}

// The forum groups to render: live catalog when loaded and non-empty, else the
// hardcoded discussionGroups demo fallback.
function getForumGroups() {
    return (backendForumGroups && backendForumGroups.length) ? backendForumGroups : discussionGroups;
}

// Kick off a one-shot live load then re-render, guarded so it fires at most once
// per page and never loops when the backend returns no rows.
function refreshForumGroups(rerender) {
    if (backendForumGroups !== null) return;
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) { backendForumGroups = []; return; }
    loadForumGroups().then(function () {
        if (backendForumGroups && backendForumGroups.length) rerender();
    });
}

// Live forum threads (glowe_forum_threads). null before the first load attempt;
// an array afterwards (empty when offline / no threads, in which case the
// localStorage 'gloweForumThreads' mirror is the offline fallback). FR-GLOWE-009
// AC2/AC3.
let backendForumThreads = null;

async function loadForumThreads() {
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) { backendForumThreads = []; return; }
    let rows = [];
    try { rows = await backend.listAll('forum_threads'); } catch (_e) { rows = []; }
    backendForumThreads = (typeof GloweForums !== 'undefined')
        ? GloweForums.mapForumThreads(rows || [])
        : [];
}

// localStorage thread mirror normalized to the mapped render shape.
function localForumThreads() {
    const stored = JSON.parse(localStorage.getItem('gloweForumThreads') || '[]');
    return stored.map(function (t) {
        return {
            id: t.id || '',
            groupId: (t.group && t.group.id) || '',
            authorId: '',
            title: t.title || '',
            body: t.text || '',
            createdAt: t.createdAt || '',
            replies: t.replies || 0
        };
    });
}

// Threads to render: live table when loaded and non-empty, else localStorage.
function getForumThreads() {
    return (backendForumThreads && backendForumThreads.length) ? backendForumThreads : localForumThreads();
}

function refreshForumThreads(rerender) {
    if (backendForumThreads !== null) return;
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) { backendForumThreads = []; return; }
    loadForumThreads().then(function () {
        if (backendForumThreads && backendForumThreads.length) rerender();
    });
}

// Persist a new forum thread: optimistic localStorage mirror (offline fallback,
// TD-134) plus a backend insert when configured. `extras` carries mirror-only
// fields (type/fileName) that have no column on glowe_forum_threads.
async function persistForumThread(group, title, body, extras) {
    const local = JSON.parse(localStorage.getItem('gloweForumThreads') || '[]');
    local.unshift(Object.assign({
        title: title,
        text: body,
        replies: 0,
        lastActive: 'Just now',
        createdAt: new Date().toISOString(),
        group: group
    }, extras || {}));
    localStorage.setItem('gloweForumThreads', JSON.stringify(local));
    const backend = window.gloweBackend;
    if (backend && backend.configured()) {
        try { await backend.insertOwned('forum_threads', { group_id: group.id, title: title, body: body }); }
        catch (_e) { /* offline mirror already saved */ }
    }
}

// Force a fresh backend thread reload (after a create).
async function reloadForumThreads() {
    backendForumThreads = null;
    await loadForumThreads();
}

// Human-readable last-activity label for a thread's created_at.
function formatThreadActivity(createdAt) {
    if (!createdAt) return 'Just now';
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? 'Just now' : d.toLocaleDateString();
}

function savePostComment(postId, text) {
    const comments = getPostComments();
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const profile = getPersonalProfile();
    const newComment = {
        id: `comment-${Date.now()}`,
        author: user ? user.name : profile.name,
        text: text.trim(),
        createdAt: new Date().toISOString()
    };
    comments[postId] = [newComment, ...(comments[postId] || [])];
    localStorage.setItem(POST_COMMENTS_KEY, JSON.stringify(comments));
    if (window.gloweBackend && window.gloweBackend.configured()) {
        window.gloweBackend.insertOwned('comments', {
            post_id: postId,
            text: newComment.text,
            author_name: newComment.author
        }).catch(() => {});
    }
    return newComment;
}

function getPostId(post, index = 0) {
    return post.id || `${post.authorId || 'post'}-${String(post.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`;
}

function getOpportunityByAnyId(id) {
    return opportunities.find(opp => String(opp.id) === String(id));
}

function getSavedCommunityPosts() {
    try {
        return JSON.parse(localStorage.getItem('gloweCommunityPosts') || '[]');
    } catch (error) {
        return [];
    }
}

function saveCommunityPost(post) {
    const saved = getSavedCommunityPosts();
    const enrichedPost = {
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        authorId: post.authorId || 'sample-user-6',
        authorName: post.authorName,
        title: post.title,
        category: post.category,
        text: post.text,
        tags: post.tags || [],
        audience: post.audience || 'Everyone',
        language: post.language || 'English',
        link: post.link || ''
    };
    localStorage.setItem('gloweCommunityPosts', JSON.stringify([enrichedPost, ...saved]));
    apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(enrichedPost)
    });
    return enrichedPost;
}

function getAllCommunityPosts() {
    return [...getSavedCommunityPosts(), ...communityPosts].map((post, index) => ({
        ...post,
        id: getPostId(post, index)
    })).filter(post => !isModerationHidden('post', post.id));
}

function buildShareUrl(platform, title, url) {
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`${title} | GloWe`);
    const urls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    };
    return urls[platform] || url;
}

function shareContent(platform, title, path = '') {
    const url = new URL(path || window.location.pathname, window.location.href).href;
    window.open(buildShareUrl(platform, title, url), '_blank', 'noopener,noreferrer');
}

// Copy a community post's canonical URL to the clipboard (FR-GLOWE-008 AC5).
async function copyPostLink(postId) {
    const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : '';
    const url = (typeof GlowePosts !== 'undefined')
        ? GlowePosts.postCanonicalUrl(postId, origin)
        : `${origin}/glowe/pages/community.html?post=${encodeURIComponent(postId)}`;
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
        }
        showSuccessModal('Link copied', 'The post link is on your clipboard — share it anywhere.');
    } catch (error) {
        showSuccessModal('Copy this link', url);
    }
}

function renderShareButtons(title, path = '') {
    const safeTitle = escapeHtml(title);
    const titleArg = jsString(title);
    const pathArg = jsString(path);
    return `
        <div class="share-row" aria-label="Share ${safeTitle}">
            <button type="button" onclick="shareContent('facebook', '${titleArg}', '${pathArg}')">Facebook</button>
            <button type="button" onclick="shareContent('linkedin', '${titleArg}', '${pathArg}')">LinkedIn</button>
            <button type="button" onclick="shareContent('x', '${titleArg}', '${pathArg}')">X</button>
            <button type="button" onclick="shareContent('whatsapp', '${titleArg}', '${pathArg}')">WhatsApp</button>
        </div>
    `;
}

function handleReportSubmit(event) {
    event.preventDefault();
    const report = {
        id: `report-${Date.now()}`,
        targetType: document.getElementById('report-target-type')?.value || activeReportTarget.type,
        targetId: document.getElementById('report-target-id')?.value || activeReportTarget.id,
        targetTitle: document.getElementById('report-target-title')?.value || activeReportTarget.title,
        reason: document.getElementById('report-reason')?.value || 'Other',
        details: document.getElementById('report-details')?.value.trim() || '',
        reporter: typeof getCurrentUser === 'function' && getCurrentUser() ? getCurrentUser().email : 'anonymous',
        status: 'Open',
        createdAt: new Date().toISOString()
    };
    saveModerationReports([report, ...getModerationReports()]);
    event.target.reset();
    closeModal('report-modal');
    showSuccessModal('Report received', 'Thank you. We will review this with care and confidentiality.');
}

function openWishDetail(wishId) {
    ensureGlobalUI();
    const wish = wishes.find(item => String(item.id) === String(wishId));
    if (!wish) return;
    const style = wishTypeStyles[wish.type] || { color: '#E3F5F0' };
    const content = document.getElementById('wish-detail-content');
    content.innerHTML = `
        <button class="close-modal" type="button" aria-label="Close wish details" onclick="closeModal('wish-detail-modal')">&times;</button>
        <div class="wish-detail-scroll">
            <div class="wish-detail-hero" style="--tag-color: ${style.color}">
                <span class="wish-type" style="background:${style.color}">${wish.type}</span>
                <h2>${wish.title}</h2>
                <a class="wish-author" href="profile.html?id=${wish.authorId}">
                    ${renderEntityMark(wish.author)}
                    <span>${wish.author}</span>
                    <small>${wish.time}</small>
                </a>
            </div>
            <p class="wish-detail-description">${wish.description}</p>
            <div class="opportunity-details">
                <span class="opportunity-detail">${wish.location}</span>
                <span class="opportunity-detail">${wish.areas.join(', ')}</span>
            </div>
            <div class="dream-box">
                <h3>The dream</h3>
                <p>To turn a local need into a shared action that others can join, support, or learn from.</p>
                <h3>Looking for</h3>
                <div class="opportunity-skills">
                    ${wish.areas.map(area => `<span class="skill-tag">${area}</span>`).join('')}
                </div>
            </div>
            <div class="card-actions wish-detail-actions">
                <button class="btn btn-primary" type="button" onclick="showSupportModal('${wish.id}')">Offer Support</button>
                <button class="btn btn-outline" type="button" onclick="saveItem('wish', '${wish.id}', '${jsString(wish.title)}', '${jsString(wish.author)}', 'wishing-well.html?wish=${wish.id}')">Save</button>
                <button class="btn btn-outline" type="button" onclick="openReportModal('wish', '${wish.id}', '${jsString(wish.title)}')">Report</button>
                <button class="btn btn-outline" type="button" onclick="closeModal('wish-detail-modal')">Back to wishes</button>
            </div>
        </div>
    `;
    openModal('wish-detail-modal');
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
});

// Render opportunity card
// ── Supabase row → render-format mappers ────────────────────────────────────

function mapOpportunityRow(row) {
    return {
        id: row.id,
        title: row.title || '',
        organization: row.organization || 'GloWe Member',
        orgIcon: row.org_icon || getInitials(row.organization || 'GloWe'),
        location: row.location || '',
        commitment: row.commitment || '',
        duration: row.duration || '',
        field: row.field || '',
        description: row.description || '',
        skills: Array.isArray(row.skills) ? row.skills : [],
        featured: Boolean(row.featured),
        ownerId: row.user_id || null,
        // Event fields (additive model, migration 0211). Null on plain opportunities.
        startAt: row.start_at || null,
        endAt: row.end_at || null,
        eventType: row.event_type || null,
        capacity: typeof row.capacity === 'number' ? row.capacity : null,
        registrationMode: row.registration_mode || 'gated',
        status: row.status || 'active'
    };
}

function mapPostRow(row) {
    if (typeof GlowePosts !== 'undefined') return GlowePosts.mapPostRow(row);
    return {
        id: row.id,
        title: row.title || '',
        category: row.category || '',
        text: row.text || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        authorId: row.user_id || '',
        authorName: row.author_name || 'Community Member',
        createdAt: row.created_at || ''
    };
}

// Load community posts from glowe_posts (post_type='community') into the shared
// `communityPosts` array. Wishes (post_type='wish') are filtered out so they do
// not leak into the community feed (FR-GLOWE-008).
async function loadCommunityPosts() {
    const backend = window.gloweBackend;
    communityPosts.length = 0;
    if (!backend || !backend.configured()) return;
    const helpers = (typeof GlowePosts !== 'undefined') ? GlowePosts : null;
    let rows = [];
    try { rows = await backend.listAll('posts'); } catch (_e) { rows = []; }
    const mapped = helpers
        ? helpers.mapCommunityRows(rows)
        : (rows || []).map(mapPostRow);
    communityPosts.push(...mapped);
}

// Publish a community post to glowe_posts (post_type='community'). Shared by the
// inline composer and the write-post form (FR-GLOWE-008). Returns true on a
// persisted insert, false when gated/invalid/failed (with a user-facing modal).
async function submitCommunityPost(draft) {
    if (!canCreateContent()) return false;
    const helpers = (typeof GlowePosts !== 'undefined') ? GlowePosts : null;
    const check = helpers ? helpers.validatePostDraft(draft) : { valid: Boolean(draft && draft.title) };
    if (!check.valid) {
        showSuccessModal('Missing details', check.error || 'Please complete the post before publishing.');
        return false;
    }
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) {
        showSuccessModal('Backend unavailable', 'Posts need a live connection right now. Please try again shortly.');
        return false;
    }
    const payload = helpers ? helpers.normalizePostDraft(draft) : draft;
    try {
        await backend.insertOwned('posts', payload);
        return true;
    } catch (_e) {
        showSuccessModal('Could not publish', 'Something went wrong publishing your post. Please try again.');
        return false;
    }
}

// Delete a community post the signed-in viewer owns (FR-GLOWE-008 AC7). RLS
// scopes removeOwned to auth.uid(), so a non-owner call is a no-op server-side;
// the CTA is only rendered for owners. Reloads the feed after a successful delete.
async function deleteCommunityPost(postId) {
    if (!postId) return;
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) return;
    if (typeof window.confirm === 'function' && !window.confirm('Delete this post? This cannot be undone.')) return;
    try {
        await backend.removeOwned('posts', { id: postId });
    } catch (_e) {
        showSuccessModal('Could not delete', 'Something went wrong deleting your post. Please try again.');
        return;
    }
    await initCommunityPage();
    showSuccessModal('Post deleted', 'Your post was removed from the community feed.');
}

// Display name for the signed-in author, falling back to their saved profile.
function currentAuthorName() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user && user.name) return user.name;
    const profile = typeof getPersonalProfile === 'function' ? getPersonalProfile() : null;
    return (profile && profile.name) || 'Community Member';
}

function mapProfileToOrg(profile) {
    return {
        id: profile.id,
        name: profile.orgName || profile.name || 'Organization',
        type: profile.orgField || profile.type || 'Organization',
        mission: profile.orgDescription || profile.about || '',
        location: profile.orgCountry || profile.location || '',
        scope: profile.country || '',
        volunteers: 0,
        impactArea: profile.focus || '',
        status: 'Verified',
        size: profile.orgSize || '',
        website: profile.orgWebsite || ''
    };
}

async function fetchAndPopulate(backendFn, targetArray, mapper) {
    try {
        if (typeof gloweBackend === 'undefined' || !gloweBackend.configured()) return;
        const rows = await backendFn();
        if (!rows) return;
        targetArray.splice(0, targetArray.length, ...rows.map(mapper));
    } catch (_e) {
        // leave array empty; page shows empty state
    }
}

function renderOpportunityCard(opportunity, basePath = '') {
    const titleForMessage = jsString(opportunity.title);
    const detailHref = `${basePath}pages/opportunity.html?id=${encodeURIComponent(opportunity.id)}`;
    const skills = Array.isArray(opportunity.skills) ? opportunity.skills : [];
    const events = (typeof GloweEvents !== 'undefined') ? GloweEvents : null;
    const isEvent = events ? events.isEvent(opportunity) : false;
    const badge = isEvent
        ? (events.eventTypeLabel(opportunity.eventType) || 'Event')
        : (opportunity.commitment || '');
    const eventMeta = isEvent
        ? `<span class="opportunity-detail">${escapeHtml(events.formatEventDate(opportunity))}</span>`
        : '';

    return `
        <div class="opportunity-card">
            <details class="post-more-menu card-more-menu">
                <summary aria-label="More opportunity actions">...</summary>
                <div class="post-more-panel">
                    <button type="button" onclick="saveItem('opportunity', '${opportunity.id}', '${titleForMessage}', '${jsString(opportunity.organization)}', '${detailHref}')">Save opportunity</button>
                    <button type="button" onclick="openPrivateMessage('${jsString(opportunity.organization)}')">Message publisher</button>
                    <button type="button" onclick="openReportModal('opportunity', '${opportunity.id}', '${titleForMessage}')">Report</button>
                </div>
            </details>
            <div class="opportunity-header">
                <div class="opportunity-org">
                    ${renderEntityMark(opportunity.organization)}
                    <span>${escapeHtml(opportunity.organization)}</span>
                </div>
                <span class="opportunity-badge">${escapeHtml(badge)}</span>
            </div>
            <h3 class="opportunity-title">${escapeHtml(opportunity.title)}</h3>
            <p class="opportunity-description">${escapeHtml(opportunity.description)}</p>
            <div class="opportunity-details">
                ${eventMeta}
                <span class="opportunity-detail">${escapeHtml(opportunity.location)}</span>
                <span class="opportunity-detail">${escapeHtml(opportunity.duration)}</span>
            </div>
            <div class="opportunity-skills">
                ${skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
            </div>
            <div class="card-actions">
                <a href="${detailHref}" class="btn btn-primary btn-small">View Details</a>
                <button class="btn btn-outline btn-small" type="button" onclick="saveItem('opportunity', '${opportunity.id}', '${titleForMessage}', '${jsString(opportunity.organization)}', '${detailHref}')">Save Opportunity</button>
            </div>
        </div>
    `;
}

// Render organization card
function renderOrganizationCard(organization, basePath = '') {
    const profileHref = `${basePath}pages/profile.html?id=${organization.id}`;
    return `
        <div class="opportunity-card">
            <details class="post-more-menu card-more-menu">
                <summary aria-label="More profile actions">...</summary>
                <div class="post-more-panel">
                    <button type="button" onclick="saveItem('profile', '${organization.id}', '${jsString(organization.name)}', '${jsString(organization.type || 'Organization')}', '${profileHref}')">Save profile</button>
                    <button type="button" onclick="openPrivateMessage('${jsString(organization.name)}')">Message</button>
                    <button type="button" onclick="openReportModal('profile', '${organization.id}', '${jsString(organization.name)}')">Report</button>
                </div>
            </details>
            <div class="opportunity-header">
                <div class="opportunity-org">
                    ${renderEntityMark(organization.name)}
                </div>
                <span class="opportunity-badge">${escapeHtml(organization.status || 'Approved')}</span>
            </div>
            <h3 class="opportunity-title">${escapeHtml(organization.name)}</h3>
            <p class="opportunity-description">${escapeHtml(organization.mission)}</p>
            <div class="opportunity-details">
                <span class="opportunity-detail">${escapeHtml(organization.location)}</span>
                <span class="opportunity-detail">${escapeHtml(organization.scope || 'Global')}</span>
                <span class="opportunity-detail">${escapeHtml(organization.volunteers)} volunteers</span>
            </div>
            <div class="opportunity-skills">
                <span class="skill-tag">${escapeHtml(organization.type || 'Organization')}</span>
                <span class="skill-tag">${escapeHtml(organization.impactArea || 'Impact')}</span>
            </div>
            <div class="card-actions">
                <a href="${profileHref}" class="btn btn-outline btn-small">View Profile</a>
                <button class="btn btn-outline btn-small" type="button" onclick="saveItem('profile', '${organization.id}', '${jsString(organization.name)}', '${jsString(organization.type || 'Organization')}', '${profileHref}')">Save Profile</button>
            </div>
        </div>
    `;
}

function renderWishCard(wish) {
    const style = wishTypeStyles[wish.type] || { color: '#E3F5F0' };
    const areas = Array.isArray(wish.areas) ? wish.areas : [];
    return `
        <article class="wish-card" style="--tag-color: ${style.color}">
            <details class="post-more-menu card-more-menu">
                <summary aria-label="More wish actions">...</summary>
                <div class="post-more-panel">
                    <button type="button" onclick="saveItem('wish', '${wish.id}', '${jsString(wish.title)}', '${jsString(wish.author)}', 'wishing-well.html?wish=${wish.id}')">Save wish</button>
                    <button type="button" onclick="openPrivateMessage('${jsString(wish.author)}')">Message author</button>
                    <button type="button" onclick="openReportModal('wish', '${wish.id}', '${jsString(wish.title)}')">Report</button>
                </div>
            </details>
            <div class="wish-card-top">
                <span class="wish-type" style="background:${style.color}">${escapeHtml(wish.type)}</span>
                <button class="heart-button" type="button" aria-label="Save wish" onclick="saveItem('wish', '${wish.id}', '${jsString(wish.title)}', '${jsString(wish.author)}', 'wishing-well.html?wish=${wish.id}')">Save</button>
            </div>
            <button class="card-open-button" type="button" onclick="openWishDetail('${wish.id}')">
                ${renderEntityMark(wish.author, 'wish-image')}
                <span class="sr-only">Open wish details</span>
            </button>
            <h3><button type="button" onclick="openWishDetail('${wish.id}')">${escapeHtml(wish.title)}</button></h3>
            <a class="wish-author" href="profile.html?id=${wish.authorId}">
                ${renderEntityMark(wish.author)}
                <span>${escapeHtml(wish.author)}</span>
                <small>${escapeHtml(wish.time)}</small>
            </a>
            <p>${escapeHtml(wish.description)}</p>
            <div class="opportunity-details">
                <span class="opportunity-detail">${escapeHtml(wish.location)}</span>
                <span class="opportunity-detail">${escapeHtml(areas.join(', '))}</span>
            </div>
        <div class="card-actions">
            <button class="btn btn-outline btn-small" type="button" onclick="openWishDetail('${wish.id}')">Learn More</button>
            <button class="btn btn-primary btn-small" type="button" onclick="showSupportModal('${wish.id}')">Offer Support</button>
            ${wishOwnerControls(wish)}
        </div>
        ${renderShareButtons(wish.title, `wishing-well.html?wish=${wish.id}`)}
    </article>
    `;
}

function renderProjectCard(project) {
    return `
        <div class="project-card">
            <span class="opportunity-badge">${escapeHtml(project.status)}</span>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description)}</p>
        </div>
    `;
}

function renderPostCard(post) {
    const author = getAuthorById(post.authorId);
    const authorName = post.authorName || (author ? author.name : 'Community Member');
    const profileHref = author ? `profile.html?id=${post.authorId}` : '#';
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const postId = post.id || getPostId(post);
    const engagementSeed = String(postId).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const reactionCount = 12 + (engagementSeed % 48);
    const repostCount = 1 + (engagementSeed % 9);
    const comments = getPostCommentsFor(postId);
    const defaultComments = comments.length ? comments : [
        { author: 'Community Manager', text: 'Useful direction. Who should join the next step?', createdAt: new Date().toISOString() }
    ];
    const viewer = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const ownsPost = (typeof GlowePosts !== 'undefined')
        ? GlowePosts.isPostOwner(post, viewer && viewer.id)
        : Boolean(viewer && viewer.id && String(post.authorId) === String(viewer.id));
    const deleteButton = ownsPost
        ? `<button type="button" class="post-delete-action" onclick="deleteCommunityPost('${postId}')">Delete post</button>`
        : '';
    return `
        <article class="post-card" id="post-${postId}">
            <details class="post-more-menu">
                <summary aria-label="More post actions">...</summary>
                <div class="post-more-panel">
                    <button type="button" onclick="saveItem('post', '${postId}', '${jsString(post.title)}', '${jsString(post.category)}', 'community.html#post-${postId}')">Save post</button>
                    <button type="button" onclick="saveItem('profile', '${post.authorId || authorName}', '${jsString(authorName)}', 'Community profile', '${profileHref}')">Save profile</button>
                    <button type="button" onclick="openPrivateMessage('${jsString(authorName)}')">Message</button>
                    <button type="button" onclick="openReportModal('post', '${postId}', '${jsString(post.title)}')">Report</button>
                    ${deleteButton}
                </div>
            </details>
            <div class="post-author-row">
                <a class="post-author" href="${profileHref}">
                    ${renderEntityMark(authorName, 'avatar')}
                    <span>
                        <strong>${escapeHtml(authorName)}</strong>
                        <small>${post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'now'}</small>
                    </span>
                </a>
                <span class="post-type-tag">Post | ${escapeHtml(post.category)}</span>
            </div>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.text)}</p>
            ${tags.length ? `<div class="post-tag-row">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
            <div class="post-engagement-row">
                <span>${reactionCount} reactions</span>
                <span>${defaultComments.length} comments</span>
                <span>${repostCount} reposts</span>
            </div>
            <div class="post-actions">
                <button type="button" onclick="showSuccessModal('Reaction saved', 'Your reaction was added to this post.')">Like</button>
                <button type="button" onclick="focusCommentBox('${postId}')">Comment</button>
                <button type="button" onclick="showSuccessModal('Repost drafted', 'You can add your own context before sharing this with the community.')">Repost</button>
                <button type="button" onclick="openPrivateMessage('${jsString(authorName)}')">Send</button>
            </div>
            <div class="post-comments" id="comments-${postId}">
                <div class="comment-summary">${defaultComments.length} comment${defaultComments.length === 1 ? '' : 's'}</div>
                ${defaultComments.slice(0, 3).map(comment => `
                    <article class="comment-row">
                        ${renderEntityMark(comment.author, 'comment-avatar')}
                        <div>
                            <strong>${escapeHtml(comment.author)}</strong>
                            <p>${escapeHtml(comment.text)}</p>
                        </div>
                    </article>
                `).join('')}
                <form class="comment-form" onsubmit="handlePostComment(event, '${postId}')">
                    <input id="comment-input-${postId}" placeholder="Write a thoughtful comment..." required>
                    <button type="submit">Post</button>
                </form>
            </div>
            <div class="post-share-row">
                ${renderShareButtons(post.title, `community.html?post=${encodeURIComponent(postId)}`)}
                <button type="button" class="post-copy-link" onclick="copyPostLink('${postId}')">Copy link</button>
            </div>
        </article>
    `;
}

function focusCommentBox(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function handlePostComment(event, postId) {
    event.preventDefault();
    const input = event.target.querySelector('input');
    if (!input || !input.value.trim()) return;
    savePostComment(postId, input.value);
    initCommunityPage();
    setTimeout(() => focusCommentBox(postId), 0);
}

function renderDailyActionCard(action) {
    return `
        <article class="daily-action-card">
            <span>${action.label}</span>
            <h3>${action.title}</h3>
            <p>${action.description}</p>
            <a class="btn btn-primary btn-small" href="${action.href}">${action.cta}</a>
        </article>
    `;
}

function renderSmartMatch(match) {
    return `
        <article class="match-card">
            <div class="match-score">${match.score}%</div>
            <div>
                <span class="wish-type">${match.type}</span>
                <h3>${match.title}</h3>
                <p>${match.reason}</p>
                <button class="btn btn-outline btn-small" type="button" onclick="showSupportModal()">${match.action}</button>
            </div>
        </article>
    `;
}

function renderPlaybook(playbook) {
    return `
        <article class="playbook-card">
            <span>${playbook.area}</span>
            <h3>${playbook.title}</h3>
            <p>${playbook.description}</p>
            <button class="btn btn-outline btn-small" type="button" onclick="showSuccessModal('Playbook opened', 'In the full platform this will open a concise, multilingual action guide.')">Open Playbook</button>
        </article>
    `;
}

function renderDistributionTool(tool) {
    return `
        <article class="capability-card">
            <span class="capability-label">Distribution</span>
            <h3>${tool.title}</h3>
            <p>${tool.description}</p>
        </article>
    `;
}

function renderGrantRecommendation(grant) {
    return `
        <article class="grant-card">
            <div class="match-score">${grant.fit}%</div>
            <div>
                <span class="capability-label">Grant match</span>
                <h3>${grant.fund}</h3>
                <p>${grant.focus}</p>
                <small>Deadline: ${grant.deadline}</small>
                <a class="btn btn-outline btn-small" href="pages/whats-next.html">Learn More</a>
            </div>
        </article>
    `;
}

function renderEngagementTool(tool) {
    return `
        <article class="capability-card">
            <span class="capability-label">Interaction</span>
            <h3>${tool.title}</h3>
            <p>${tool.description}</p>
            <button class="btn btn-outline btn-small" type="button" onclick="addProjectFeedback()">Try Flow</button>
        </article>
    `;
}

function renderRewardLeader(leader, index) {
    return `
        <article class="leader-card">
            <div class="leader-rank">${index + 1}</div>
            <div>
                <span class="capability-label">${leader.badge}</span>
                <h3>${leader.name}</h3>
                <p>${leader.reason}</p>
                <strong>${leader.score.toLocaleString()} points</strong>
                <button class="btn btn-outline btn-small" type="button" onclick="rateOrganization('${leader.name.replace(/'/g, "\\'")}')">Review Impact</button>
            </div>
        </article>
    `;
}

function renderRole(role) {
    return `
        <article class="role-row">
            <strong>${role.role}</strong>
            <p>${role.permissions}</p>
        </article>
    `;
}

function renderBusinessItem(item) {
    return `<article class="business-row">${item}</article>`;
}

function renderRoadmapPhase(phase) {
    return `
        <article class="roadmap-row">
            <span>${phase.phase}</span>
            <h4>${phase.title}</h4>
            <p>${phase.focus}</p>
        </article>
    `;
}

function renderPostTopicButton(topic, index) {
    return `
        <button class="topic-choice ${index === 0 ? 'active' : ''}" type="button" data-post-topic="${topic.id}">
            <strong>${topic.label}</strong>
            <span>${topic.description}</span>
        </button>
    `;
}

function openInlineComposer() {
    const container = document.getElementById('inline-composer');
    if (!container) return;
    container.classList.add('active');
    container.innerHTML = `
        <form id="inline-post-form" class="inline-post-form" onsubmit="handleInlinePostSubmit(event)">
            <div class="section-toolbar compact-toolbar">
                <div>
                    <span class="hero-kicker">New post</span>
                    <h2>Write to the community</h2>
                </div>
                <button class="btn btn-outline btn-small" type="button" onclick="closeInlineComposer()">Close</button>
            </div>
            <div class="form-grid-2">
                <div class="form-group">
                    <label for="inline-post-topic">Topic</label>
                    <select id="inline-post-topic" required>
                        ${postTopics.map(topic => `<option value="${topic.id}">${topic.label}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="inline-post-tags">Tags</label>
                    <input id="inline-post-tags" type="text" placeholder="Education, Climate, Health">
                </div>
            </div>
            <div id="inline-topic-prompt" class="topic-prompt"></div>
            <div class="form-group">
                <label for="inline-post-title">Title</label>
                <input id="inline-post-title" type="text" required placeholder="What do you want the community to notice?">
            </div>
            <div class="form-group">
                <label for="inline-post-body">Post</label>
                <textarea id="inline-post-body" rows="5" required placeholder="Share knowledge, ask for a connection, publish an event, or start a discussion."></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" type="submit">Publish to Feed</button>
                <button class="btn btn-outline" type="button" onclick="showSuccessModal('Draft saved', 'Your post draft is saved in this workspace.')">Save Draft</button>
            </div>
        </form>
    `;
    const topicSelect = document.getElementById('inline-post-topic');
    const prompt = document.getElementById('inline-topic-prompt');
    function updatePrompt() {
        const topic = postTopics.find(item => item.id === topicSelect.value) || postTopics[0];
        prompt.innerHTML = `<strong>${topic.label}</strong><span>${topic.prompt}</span>`;
    }
    topicSelect.addEventListener('change', updatePrompt);
    updatePrompt();
}

function closeInlineComposer() {
    const container = document.getElementById('inline-composer');
    if (container) {
        container.classList.remove('active');
        container.innerHTML = '';
    }
}

async function handleInlinePostSubmit(event) {
    event.preventDefault();
    const topic = postTopics.find(item => item.id === document.getElementById('inline-post-topic').value) || postTopics[0];
    const published = await submitCommunityPost({
        title: document.getElementById('inline-post-title').value,
        category: topic.label,
        text: document.getElementById('inline-post-body').value,
        tags: document.getElementById('inline-post-tags').value,
        audience: 'Everyone',
        author_name: currentAuthorName()
    });
    if (!published) return;
    closeInlineComposer();
    await initCommunityPage();
    showSuccessModal('Post published to feed', 'The new post appears at the top of the community feed.');
}

function initWritePostPage() {
    const topicsContainer = document.getElementById('post-topics');
    const topicSelect = document.getElementById('post-topic');
    const promptBox = document.getElementById('topic-prompt');
    const preview = document.getElementById('post-preview');
    const form = document.getElementById('post-form');
    if (!topicsContainer || !topicSelect || !promptBox || !preview || !form) return;

    topicsContainer.innerHTML = postTopics.map(renderPostTopicButton).join('');
    topicSelect.innerHTML = postTopics.map(topic => `<option value="${topic.id}">${topic.label}</option>`).join('');

    function selectedTopic() {
        return postTopics.find(topic => topic.id === topicSelect.value) || postTopics[0];
    }

    function setTopic(topicId) {
        topicSelect.value = topicId;
        document.querySelectorAll('[data-post-topic]').forEach(button => {
            button.classList.toggle('active', button.dataset.postTopic === topicId);
        });
        updatePreview();
    }

    function updatePreview() {
        const topic = selectedTopic();
        const title = document.getElementById('post-title').value || 'Your post title';
        const audience = document.getElementById('post-audience').value || 'Community members';
        const body = document.getElementById('post-body').value || topic.prompt;
        const tags = document.getElementById('post-tags').value || 'Education, Climate, Health';
        promptBox.innerHTML = `<strong>${topic.label}</strong><span>${topic.prompt}</span>`;
        preview.innerHTML = `
            <article class="post-card">
                <span class="wish-type">${topic.label}</span>
                <h3>${title}</h3>
                <p>${body}</p>
                <div class="opportunity-details">
                    <span class="opportunity-detail">Audience: ${audience}</span>
                    <span class="opportunity-detail">Tags: ${tags}</span>
                </div>
                <div class="post-actions">
                    <button type="button">Like</button>
                    <button type="button">Comment</button>
                    <button type="button">Share</button>
                    <button type="button">Connect</button>
                </div>
            </article>
        `;
    }

    topicsContainer.addEventListener('click', event => {
        const button = event.target.closest('[data-post-topic]');
        if (button) setTopic(button.dataset.postTopic);
    });
    [topicSelect, ...form.querySelectorAll('input, textarea, select')].forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const topic = selectedTopic();
        const published = await submitCommunityPost({
            title: document.getElementById('post-title').value,
            category: topic.label,
            text: document.getElementById('post-body').value,
            tags: document.getElementById('post-tags').value,
            audience: document.getElementById('post-audience').value,
            language: document.getElementById('post-language').value,
            link: document.getElementById('post-link').value,
            author_name: currentAuthorName()
        });
        if (!published) return;
        showSuccessModal('Post connected to feed', 'Your post was saved and will appear at the top of the community feed.');
        setTimeout(() => {
            window.location.href = 'community.html';
        }, 700);
    });
    setTopic(postTopics[0].id);
}

// Render application card
function renderApplicationCard(application) {
    const opportunity = getOpportunityByAnyId(application.opportunityId);
    const statusClass = `status-${application.status.toLowerCase()}`;
    
    return `
        <div class="application-card">
            <div class="application-info">
                <h3>${opportunity ? opportunity.title : 'Unknown Opportunity'}</h3>
                <p>${opportunity ? opportunity.organization : ''} • Applied on ${new Date(application.appliedAt).toLocaleDateString()}</p>
            </div>
            <span class="application-status ${statusClass}">${application.status}</span>
        </div>
    `;
}

// Initialize featured opportunities on home page
async function initFeaturedOpportunities() {
    // FR-GLOWE-016 AC2 — signed-in members get a personalized home in the same
    // page container; guests fall through to the marketing home below untouched.
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        await initMemberHome();
        return;
    }

    const COMING_SOON = '<p class="muted-note">This section will come alive as the community grows.</p>';

    const container = document.getElementById('featured-opportunities');
    if (container) {
        container.innerHTML = '<p class="muted-note">Loading opportunities…</p>';
        await fetchAndPopulate(() => gloweBackend.listAll('opportunities'), opportunities, mapOpportunityRow);
        const featured = getFeaturedOpportunities().slice(0, 3);
        container.innerHTML = featured.length
            ? featured.map(opp => renderOpportunityCard(opp)).join('')
            : '<div class="empty-state"><h3>No opportunities posted yet</h3><p>Be the first to share a volunteer role or collaboration request with the community.</p><a class="btn btn-primary btn-small" href="pages/opportunities.html">Post an opportunity</a></div>';
    }

    const dailyContainer = document.getElementById('daily-actions');
    if (dailyContainer) dailyContainer.innerHTML = dailyActions.length ? dailyActions.map(renderDailyActionCard).join('') : COMING_SOON;

    const matchContainer = document.getElementById('smart-matches');
    if (matchContainer) matchContainer.innerHTML = smartMatches.length ? smartMatches.map(renderSmartMatch).join('') : COMING_SOON;

    const playbookContainer = document.getElementById('applied-playbooks');
    if (playbookContainer) playbookContainer.innerHTML = appliedPlaybooks.length ? appliedPlaybooks.map(renderPlaybook).join('') : COMING_SOON;

    const distributionContainer = document.getElementById('distribution-tools');
    if (distributionContainer) distributionContainer.innerHTML = distributionChannels.length ? distributionChannels.map(renderDistributionTool).join('') : COMING_SOON;

    const grantContainer = document.getElementById('grant-recommendations');
    if (grantContainer) grantContainer.innerHTML = grantRecommendations.length ? grantRecommendations.map(renderGrantRecommendation).join('') : COMING_SOON;

    const engagementContainer = document.getElementById('engagement-tools');
    if (engagementContainer) engagementContainer.innerHTML = engagementTools.length ? engagementTools.map(renderEngagementTool).join('') : COMING_SOON;

    const rewardsContainer = document.getElementById('reward-leaders');
    if (rewardsContainer) rewardsContainer.innerHTML = rewardLeaders.length ? rewardLeaders.map(renderRewardLeader).join('') : COMING_SOON;

    const rolesContainer = document.getElementById('user-roles');
    if (rolesContainer) rolesContainer.innerHTML = userRoleBlueprint.length ? userRoleBlueprint.map(renderRole).join('') : COMING_SOON;

    const businessContainer = document.getElementById('business-model');
    if (businessContainer) businessContainer.innerHTML = businessModelItems.length ? businessModelItems.map(renderBusinessItem).join('') : COMING_SOON;

    const roadmapContainer = document.getElementById('roadmap-phases');
    if (roadmapContainer) roadmapContainer.innerHTML = roadmapPhases.length ? roadmapPhases.map(renderRoadmapPhase).join('') : COMING_SOON;
}

// --- Member home (FR-GLOWE-016 AC2) -----------------------------------------
// Pure selector: the member's own posts, newest first, capped.
function selectMemberActivity(posts, userId, limit = 3) {
    if (!userId) return [];
    return posts
        .filter(post => String(post.authorId) === String(userId))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, limit);
}

// Pure selector: one unified, recency-interleaved glimpse across the catalog.
function selectCommunityHighlights(opportunities, posts, limit = 6) {
    const oppItems = opportunities.map(item => ({ kind: 'opportunity', item }));
    const postItems = posts
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .map(item => ({ kind: 'post', item }));
    const mixed = [];
    const max = Math.max(oppItems.length, postItems.length);
    for (let i = 0; i < max; i++) {
        if (postItems[i]) mixed.push(postItems[i]);
        if (oppItems[i]) mixed.push(oppItems[i]);
    }
    return mixed.slice(0, limit);
}

// Compact card for the member feed. Links resolve from the site root (home page),
// so they point into pages/* unlike the /pages/-local renderPostCard.
function renderMemberFeedPost(post) {
    const postId = post.id || '';
    const href = `pages/community.html#post-${encodeURIComponent(postId)}`;
    const snippet = (post.text || '').slice(0, 140);
    return `
        <a class="member-feed-card" href="${href}">
            <span class="member-feed-type">Post${post.category ? ` · ${escapeHtml(post.category)}` : ''}</span>
            <h3>${escapeHtml(post.title || 'Community post')}</h3>
            <p>${escapeHtml(snippet)}</p>
            <span class="member-feed-author">${escapeHtml(post.authorName || 'Community Member')}</span>
        </a>`;
}

function renderMemberHighlight(entry) {
    return entry.kind === 'opportunity'
        ? renderOpportunityCard(entry.item)
        : renderMemberFeedPost(entry.item);
}

function renderMemberHomeMarkup(firstName, activity, highlights) {
    const activityBody = activity.length
        ? activity.map(renderMemberFeedPost).join('')
        : '<div class="empty-state"><h3>You have not shared anything yet</h3><p>Your posts, opportunities, and requests will gather here.</p><a class="btn btn-primary btn-small" href="pages/community.html">Write your first post</a></div>';
    const highlightsBody = highlights.length
        ? highlights.map(renderMemberHighlight).join('')
        : '<div class="empty-state"><h3>The community is just getting started</h3><p>Be the first to share a post or an opportunity others can join.</p><a class="btn btn-primary btn-small" href="pages/community.html">Start the conversation</a></div>';
    return `
        <div class="container member-home-inner">
            <section class="member-hero">
                <div class="member-hero-copy">
                    <span class="hero-kicker">Your GloWe</span>
                    <h1>Welcome back, <span class="member-hero-name">${escapeHtml(firstName)}</span></h1>
                    <p>What would you like to do today? Share knowledge, post an opportunity, or ask the community for support.</p>
                </div>
                <div class="member-hero-actions">
                    <a class="btn btn-primary btn-large" href="pages/community.html">Share a post</a>
                    <a class="btn btn-outline btn-large" href="pages/opportunities.html">Post an opportunity</a>
                    <button class="btn btn-outline btn-large" type="button" onclick="openWishModal()">Ask for support</button>
                </div>
            </section>
            <section class="member-section">
                <div class="section-toolbar">
                    <div><h2>Your activity</h2></div>
                    <a class="btn btn-outline btn-small" href="pages/my-applications.html">Open Personal Area</a>
                </div>
                <div class="member-feed-grid">${activityBody}</div>
            </section>
            <section class="member-section">
                <div class="section-toolbar">
                    <div><h2>What is happening on GloWe</h2></div>
                    <a class="btn btn-outline btn-small" href="pages/community.html">See all</a>
                </div>
                <div class="member-feed-grid">${highlightsBody}</div>
            </section>
        </div>`;
}

async function initMemberHome() {
    const root = document.getElementById('member-home');
    if (!root) return;
    document.body.classList.add('glowe-member-home');
    root.hidden = false;
    root.innerHTML = '<div class="container"><p class="muted-note">Loading your GloWe home…</p></div>';

    await Promise.all([
        fetchAndPopulate(() => gloweBackend.listAll('opportunities'), opportunities, mapOpportunityRow),
        loadCommunityPosts(),
        loadPostComments()
    ]);

    const profile = getPersonalProfile();
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const firstName = (profile.firstName || (profile.name || '').split(' ')[0] || 'there').trim();
    const allPosts = getAllCommunityPosts();
    const activity = selectMemberActivity(allPosts, user ? user.id : '');
    const highlights = selectCommunityHighlights(getAllOpportunitiesForDisplay(), allPosts);
    root.innerHTML = renderMemberHomeMarkup(firstName, activity, highlights);
}

// Initialize all opportunities page
async function initOpportunitiesPage() {
    const container = document.getElementById('opportunities-list');
    const composer = document.getElementById('opportunity-composer');
    const filters = {
        location: 'all',
        field: 'all',
        commitment: 'all',
        event: 'all',
        search: ''
    };

    function applyEventFilter(list) {
        if (filters.event === 'all' || typeof GloweEvents === 'undefined') return list;
        const eventFilters = filters.event === 'physical' || filters.event === 'digital'
            ? { type: filters.event }
            : { timeframe: filters.event === 'upcoming' ? 'upcoming' : 'all' };
        return GloweEvents.sortByStart(GloweEvents.filterEvents(list, eventFilters));
    }

    function renderOpportunities() {
        const filtered = applyEventFilter(filterOpportunityCatalog(getAllOpportunitiesForDisplay(), filters));
        if (filtered.length === 0) {
            const hasFilters = filters.location !== 'all' || filters.field !== 'all' || filters.commitment !== 'all' || filters.event !== 'all' || filters.search;
            container.innerHTML = hasFilters
                ? '<div class="empty-state"><div class="empty-state-icon">No results</div><h3>No opportunities found</h3><p>Try adjusting your filters or search terms.</p></div>'
                : '<div class="empty-state"><h3>No opportunities posted yet</h3><p>Be the first to share a volunteer role or collaboration request with the GloWe community.</p><button class="btn btn-primary btn-small" type="button" onclick="openOpportunityComposer()">Post an opportunity</button></div>';
        } else {
            container.innerHTML = filtered.map(opp => renderOpportunityCard(opp, '../')).join('');
        }
    }

    window.renderOpportunitiesList = renderOpportunities;

    // Re-fetch the live board after a publish so created opportunities appear
    // with real server ids (working detail links), not a client-side copy.
    reloadOpportunities = async function () {
        await fetchAndPopulate(() => gloweBackend.listAll('opportunities'), opportunities, mapOpportunityRow);
        renderOpportunities();
    };

    // Add filter event listeners
    const locationFilter = document.getElementById('filter-location');
    const fieldFilter = document.getElementById('filter-field');
    const commitmentFilter = document.getElementById('filter-commitment');
    const eventFilter = document.getElementById('filter-event');
    const searchInput = document.getElementById('search-opportunities');

    if (locationFilter) {
        locationFilter.addEventListener('change', function() {
            filters.location = this.value;
            renderOpportunities();
        });
    }

    if (fieldFilter) {
        fieldFilter.addEventListener('change', function() {
            filters.field = this.value;
            renderOpportunities();
        });
    }

    if (commitmentFilter) {
        commitmentFilter.addEventListener('change', function() {
            filters.commitment = this.value;
            renderOpportunities();
        });
    }

    if (eventFilter) {
        eventFilter.addEventListener('change', function() {
            filters.event = this.value;
            renderOpportunities();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filters.search = this.value;
            renderOpportunities();
        });
    }

    // Fetch real data then render
    if (container) {
        container.innerHTML = '<div class="empty-state"><p class="muted-note">Loading opportunities…</p></div>';
        await fetchAndPopulate(() => gloweBackend.listAll('opportunities'), opportunities, mapOpportunityRow);
        renderOpportunities();
    }

    if (composer && !composer.dataset.ready) {
        composer.dataset.ready = 'true';
    }
}

function openOpportunityComposer() {
    const composer = document.getElementById('opportunity-composer');
    if (!composer) return;

    composer.classList.add('active');
    composer.innerHTML = `
        <form class="inline-post-form opportunity-form" onsubmit="handleOpportunitySubmit(event)">
            <div class="form-grid-2">
                <div class="form-group">
                    <label for="opportunity-title">Opportunity title</label>
                    <input id="opportunity-title" required placeholder="Example: Volunteer translator for community guide">
                </div>
                <div class="form-group">
                    <label for="opportunity-organization">Organization or project</label>
                    <input id="opportunity-organization" required placeholder="Organization / initiative name">
                </div>
                <div class="form-group">
                    <label for="opportunity-type">Opportunity type</label>
                    <select id="opportunity-type" required>
                        <option value="Flexible">Volunteer Opportunity</option>
                        <option value="Part-time">Part-time Role</option>
                        <option value="Full-time">Paid Full-time Role</option>
                        <option value="Project-based">Project-based Collaboration</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="opportunity-field">Impact field</label>
                    <select id="opportunity-field" required>
                        <option value="community">Community</option>
                        <option value="education">Education</option>
                        <option value="environment">Environment</option>
                        <option value="advocacy">Advocacy</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="opportunity-location">Location</label>
                    <input id="opportunity-location" required placeholder="Remote / Tel Aviv / Global">
                </div>
                <div class="form-group">
                    <label for="opportunity-duration">Duration</label>
                    <input id="opportunity-duration" required placeholder="One day / 3 months / Ongoing">
                </div>
            </div>
            <div class="form-group">
                <label for="opportunity-description">Short description</label>
                <textarea id="opportunity-description" rows="4" required placeholder="Describe the need, who this helps, and what the person will do."></textarea>
            </div>
            <div class="form-grid-2">
                <div class="form-group">
                    <label for="opportunity-skills">Skills or tags</label>
                    <input id="opportunity-skills" required placeholder="Translation, facilitation, research">
                </div>
                <div class="form-group">
                    <label for="opportunity-requirements">Requirements</label>
                    <input id="opportunity-requirements" placeholder="Languages, experience, availability">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" type="submit">Publish Opportunity</button>
                <button class="btn btn-outline" type="button" onclick="closeOpportunityComposer()">Cancel</button>
            </div>
        </form>
    `;
    document.getElementById('opportunity-title').focus();
}

function closeOpportunityComposer() {
    const composer = document.getElementById('opportunity-composer');
    if (!composer) return;
    composer.classList.remove('active');
    composer.innerHTML = '';
}

async function handleOpportunitySubmit(event) {
    event.preventDefault();
    if (!canCreateContent()) return;
    const helpers = (typeof GloweOpportunities !== 'undefined') ? GloweOpportunities : null;
    const draft = {
        title: document.getElementById('opportunity-title').value,
        organization: document.getElementById('opportunity-organization').value,
        commitment: document.getElementById('opportunity-type').value,
        field: document.getElementById('opportunity-field').value,
        location: document.getElementById('opportunity-location').value,
        duration: document.getElementById('opportunity-duration').value,
        description: document.getElementById('opportunity-description').value,
        skills: document.getElementById('opportunity-skills').value,
        requirements: document.getElementById('opportunity-requirements').value
    };
    const check = helpers ? helpers.validateOpportunityDraft(draft) : { valid: Boolean(draft.title) };
    if (!check.valid) { showSuccessModal('Missing details', check.error || 'Please complete the opportunity.'); return; }
    const payload = helpers ? helpers.normalizeOpportunityDraft(draft) : draft;
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) return;
    try {
        await backend.insertOwned('opportunities', payload);
        closeOpportunityComposer();
        event.target.reset();
        if (reloadOpportunities) await reloadOpportunities();
        showSuccessModal('Opportunity published', `${payload.title} was added to the opportunities board.`);
    } catch (_e) {
        showSuccessModal('Could not publish', 'Something went wrong publishing your opportunity. Please try again.');
    }
}

// Initialize organizations page
async function initOrganizationsPage() {
    const container = document.getElementById('organizations-list');
    if (!container) return;

    const searchInput = document.getElementById('organization-search');
    const regionSelect = document.getElementById('organization-region-filter');
    const typeSelect = document.getElementById('organization-type-filter');
    const clearButton = document.getElementById('organization-clear-filters');
    const countLabel = document.getElementById('organization-results-count');

    function buildVisibleOrgs() {
        return organizations.filter(org => !isModerationHidden('profile', org.id));
    }

    function refreshFilters(visibleOrgs) {
        const regions = [...new Set(visibleOrgs.map(org => org.country || org.scope || org.location).filter(Boolean))].sort();
        const types = [...new Set(visibleOrgs.map(org => org.type || 'Organization').filter(Boolean))].sort();
        if (regionSelect) {
            regionSelect.innerHTML = '<option value="all">All regions</option>' + regions.map(region => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join('');
        }
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="all">All types</option>' + types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
        }
    }

    function renderOrganizations() {
        const visibleOrgs = buildVisibleOrgs();
        const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
        const region = regionSelect ? regionSelect.value : 'all';
        const type = typeSelect ? typeSelect.value : 'all';
        const filtered = visibleOrgs.filter(org => {
            const searchable = [org.name, org.type, org.mission, org.impactArea, org.country, org.location, org.scope, org.size].filter(Boolean).join(' ').toLowerCase();
            const regionMatch = region === 'all' || [org.country, org.scope, org.location].filter(Boolean).some(v => String(v).toLowerCase().includes(region.toLowerCase()));
            const typeMatch = type === 'all' || String(org.type || '').toLowerCase() === type.toLowerCase();
            const queryMatch = !query || searchable.includes(query);
            return regionMatch && typeMatch && queryMatch;
        });

        const hasFilters = query || (regionSelect && regionSelect.value !== 'all') || (typeSelect && typeSelect.value !== 'all');
        container.innerHTML = filtered.length
            ? filtered.map(org => renderOrganizationCard(org, '../')).join('')
            : hasFilters
                ? '<div class="empty-state organizations-empty-state"><h3>No matching profiles</h3><p>Try a broader keyword or clear a filter.</p></div>'
                : '<div class="empty-state organizations-empty-state"><h3>No organizations yet</h3><p>Organizations join GloWe by creating a profile and completing verification. The first approved profiles will appear here.</p></div>';

        if (countLabel) {
            countLabel.textContent = `${filtered.length} of ${visibleOrgs.length} profiles shown`;
        }
    }

    [searchInput, regionSelect, typeSelect].filter(Boolean).forEach(control => {
        control.addEventListener('input', renderOrganizations);
        control.addEventListener('change', renderOrganizations);
    });
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (regionSelect) regionSelect.value = 'all';
            if (typeSelect) typeSelect.value = 'all';
            renderOrganizations();
        });
    }

    container.innerHTML = '<div class="empty-state"><p class="muted-note">Loading organizations…</p></div>';
    await fetchAndPopulate(() => gloweBackend.listApprovedOrgs(), organizations, mapProfileToOrg);
    refreshFilters(buildVisibleOrgs());
    renderOrganizations();
}

// Re-read + re-render the wish board after a create/close. Assigned when the
// Wishing Well page initialises; a no-op elsewhere.
let reloadWishBoard = null;

async function initWishingWellPage() {
    const container = document.getElementById('wishes-list');
    const typeButtons = document.querySelectorAll('[data-wish-type]');
    const areaButtons = document.querySelectorAll('[data-impact-area]');
    const locationInput = document.getElementById('wish-location');
    const clearBtn = document.getElementById('clear-wish-filters');
    const filters = { type: 'all', area: 'all', location: '' };

    function renderWishes() {
        const helpers = (typeof GloweWishes !== 'undefined') ? GloweWishes : null;
        const hasFilters = filters.type !== 'all' || filters.area !== 'all' || filters.location;
        const filtered = helpers ? helpers.filterWishes(wishes, filters) : wishes;
        container.innerHTML = filtered.length
            ? filtered.map(renderWishCard).join('')
            : hasFilters ? emptyWishFilteredHtml() : emptyWishBoardHtml();
    }

    reloadWishBoard = async function () { await loadLiveWishes(); renderWishes(); };

    typeButtons.forEach(button => button.addEventListener('click', function() {
        filters.type = this.dataset.wishType;
        typeButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        renderWishes();
    }));
    areaButtons.forEach(button => button.addEventListener('click', function() {
        filters.area = this.dataset.impactArea;
        areaButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        renderWishes();
    }));
    if (locationInput) locationInput.addEventListener('input', function() {
        filters.location = this.value;
        renderWishes();
    });
    if (clearBtn) clearBtn.addEventListener('click', function() {
        filters.type = 'all';
        filters.area = 'all';
        filters.location = '';
        if (locationInput) locationInput.value = '';
        typeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.wishType === 'all'));
        areaButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.impactArea === 'all'));
        renderWishes();
    });
    if (container) {
        container.innerHTML = '<div class="empty-state"><p class="muted-note">Loading wishes…</p></div>';
        await loadLiveWishes();
        renderWishes();
    }
}

function emptyWishFilteredHtml() {
    return '<div class="empty-state"><div class="empty-state-icon">No results</div><h3>No wishes found</h3><p>Try clearing one of the filters.</p></div>';
}

function emptyWishBoardHtml() {
    return '<div class="empty-state"><h3>No wishes yet</h3><p>The Wishing Well fills up as community members post support requests, calls for volunteers, and collaboration opportunities. Be the first to share what your project needs.</p><button class="btn btn-primary btn-small" type="button" onclick="openWishComposer()">Post a wish</button></div>';
}

// Owner-only "Mark as fulfilled" control on a wish card.
function wishOwnerControls(wish) {
    const helpers = (typeof GloweWishes !== 'undefined') ? GloweWishes : null;
    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const isOwner = helpers ? helpers.isWishOwner(wish, user && user.id) : false;
    if (!isOwner) return '';
    return `<button class="btn btn-outline btn-small" type="button" onclick="markWishFulfilled('${wish.id}')">Mark as fulfilled</button>`;
}

// The wish owner marks their need fulfilled → status='fulfilled' drops it from
// the open board (FR-GLOWE-006 AC5).
async function markWishFulfilled(wishId) {
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) return;
    if (!window.confirm('Mark this wish as fulfilled? It will be removed from the open board.')) return;
    try {
        await backend.updateOwned('posts', wishId, { status: 'fulfilled' });
    } catch (_e) {
        /* reload reflects the server's authoritative state */
    }
    if (reloadWishBoard) await reloadWishBoard();
}

// Load open wishes from glowe_posts (post_type='wish', status='open') into the
// shared `wishes` array, then refresh the hero stats. Falls back to empty on any error.
async function loadLiveWishes() {
    const backend = window.gloweBackend;
    const helpers = (typeof GloweWishes !== 'undefined') ? GloweWishes : null;
    wishes.length = 0;
    if (!backend || !backend.configured() || !helpers) { updateWellSummary(0); return; }
    let rows = [];
    try { rows = await backend.listAll('posts'); } catch (_e) { rows = []; }
    wishes.push(...(rows || []).filter(helpers.isOpenWish).map(helpers.mapWishRow));
    let projectCount = 0;
    try { projectCount = ((await backend.listAll('projects')) || []).length; } catch (_e) { projectCount = 0; }
    updateWellSummary(projectCount);
}

// Render the hero stats strip from the live wish list (FR-GLOWE-006 AC7).
function updateWellSummary(projectCount) {
    const panel = document.getElementById('well-summary-panel');
    if (!panel) return;
    const helpers = (typeof GloweWishes !== 'undefined') ? GloweWishes : null;
    const stats = helpers ? helpers.wishStats(wishes) : { openWishes: wishes.length, impactAreas: 0 };
    panel.innerHTML = `
        <div class="well-summary-stat"><strong>${stats.openWishes}</strong><span>Open wishes</span></div>
        <div class="well-summary-stat"><strong>${stats.impactAreas}</strong><span>Impact areas</span></div>
        <div class="well-summary-stat"><strong>${projectCount || 0}</strong><span>Active projects</span></div>
    `;
}

async function initCommunityPage() {
    const container = document.getElementById('community-feed');
    const peopleContainer = document.getElementById('people-list');
    const groupsContainer = document.getElementById('topic-groups-list');
    const searchInput = document.getElementById('community-feed-search');
    const feedFilterButtons = document.querySelectorAll('[data-feed-filter]');
    const communityProfile = getPersonalProfile();
    const profileName = document.getElementById('community-profile-name');
    const profileLine = document.getElementById('community-profile-line');
    const profileAvatar = document.getElementById('community-profile-avatar');
    if (profileName) profileName.textContent = communityProfile.name || 'GloWe Member';
    if (profileLine) profileLine.textContent = communityProfile.shortLine || communityProfile.about || 'Share knowledge, ask for support, and build practical impact with the community.';
    if (profileAvatar) profileAvatar.textContent = getInitials(communityProfile.name || 'GloWe Member');

    function postMatchesFilter(post, filter) {
        if (filter === 'all') return true;
        const haystack = `${post.title || ''} ${post.category || ''} ${post.text || ''}`.toLowerCase();
        if (filter === 'question') return haystack.includes('question') || haystack.includes('discussion') || haystack.includes('?');
        if (filter === 'need') return haystack.includes('need') || haystack.includes('volunteer') || haystack.includes('open call') || haystack.includes('looking for');
        if (filter === 'knowledge') return haystack.includes('knowledge') || haystack.includes('guide') || haystack.includes('checklist') || haystack.includes('tips') || haystack.includes('best practices');
        if (filter === 'event') return haystack.includes('event') || haystack.includes('webinar') || haystack.includes('workshop');
        return true;
    }

    function renderFeed() {
        if (!container) return;
        const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
        const activeFilter = document.querySelector('[data-feed-filter].active')?.dataset.feedFilter || 'all';
        const posts = getAllCommunityPosts().filter(post => {
            const searchable = `${post.title || ''} ${post.category || ''} ${post.text || ''} ${(post.tags || []).join(' ')}`.toLowerCase();
            return postMatchesFilter(post, activeFilter) && (!query || searchable.includes(query));
        });
        container.innerHTML = posts.length
            ? posts.map(renderPostCard).join('')
            : '<div class="empty-state"><h3>The conversation starts here</h3><p>No posts yet — share knowledge, ask for support, or open a discussion to get things going.</p><button class="btn btn-primary btn-small" type="button" onclick="openInlineComposer()">Write the first post</button></div>';
    }

    if (searchInput) searchInput.addEventListener('input', renderFeed);
    feedFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            feedFilterButtons.forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            renderFeed();
        });
    });

    // Fetch real posts + comments, then render
    if (container) {
        container.innerHTML = '<div class="empty-state"><p class="muted-note">Loading posts…</p></div>';
        await Promise.all([loadCommunityPosts(), loadPostComments()]);
        renderFeed();
    }

    if (peopleContainer) {
        const visiblePeople = people.filter(person => !isModerationHidden('profile', person.id));
        peopleContainer.innerHTML = visiblePeople.length
            ? visiblePeople.map(person => `
                <div class="person-row">
                    <a href="profile.html?id=${person.id}">
                        ${renderEntityMark(person.name, 'avatar')}
                        <span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.location || '')}</small></span>
                    </a>
                    <div class="person-actions">
                        <button type="button" onclick="showSuccessModal('Profile saved', '${person.name.replace(/'/g, "\\'")} was saved to your profile list.')">Save</button>
                        <button type="button" onclick="openPrivateMessage('${person.name.replace(/'/g, "\\'")}')">Message</button>
                    </div>
                </div>
            `).join('')
            : '<p class="muted-note">Members will appear here once they join the community.</p>';
    }

    if (groupsContainer) {
        if (backendForumGroups === null) await loadForumGroups();
        groupsContainer.innerHTML = getForumGroups().map(group => `
            <a class="filter-pill group-link-pill" href="discussion-group.html?group=${group.id}">
                ${escapeHtml(group.title)}${group.members > 0 ? `<span>${group.members}</span>` : ''}
            </a>
        `).join('');
    }
}

function getAdminReviewUsers() {
    return getLocalUsers().filter(user => (user.profileStatus || '').toLowerCase().includes('pending') || (user.reviewStatus || '').toLowerCase().includes('submit'));
}

function updateUserModerationStatus(userId, profileStatus) {
    const users = getLocalUsers();
    const updated = users.map(user => String(user.id) === String(userId) ? {
        ...user,
        profileStatus,
        reviewStatus: profileStatus === 'Approved' ? 'Approved by admin' : 'Needs changes',
        moderatedAt: new Date().toISOString()
    } : user);
    saveLocalUsers(updated);
    initAdminPage();
    showSuccessModal('Profile updated', `The profile was marked as ${profileStatus}.`);
}

function updateReportStatus(reportId, status) {
    saveModerationReports(getModerationReports().map(report => report.id === reportId ? {
        ...report,
        status,
        reviewedAt: new Date().toISOString()
    } : report));
    initAdminPage();
}

function hideReportedItem(type, id, reportId = '') {
    addHiddenModerationItem(type, id);
    if (reportId) updateReportStatus(reportId, 'Action taken');
    initAdminPage();
    showSuccessModal('Content hidden', 'This item is now hidden in the MVP moderation layer.');
}

function restoreModeratedItem(type, id) {
    removeHiddenModerationItem(type, id);
    initAdminPage();
    showSuccessModal('Content restored', 'This item is visible again.');
}

function initAdminPage() {
    const requestsContainer = document.getElementById('admin-join-requests');
    const reportsContainer = document.getElementById('admin-reports');
    const hiddenContainer = document.getElementById('admin-hidden-items');
    const orgContainer = document.getElementById('admin-org-requests');
    const stats = document.querySelectorAll('[data-admin-stat]');
    if (!requestsContainer && !reportsContainer && !hiddenContainer && !orgContainer) return;

    if (orgContainer) loadPendingOrgs();

    const backend = window.gloweBackend;
    if (backend && backend.configured()) {
        backend.fetchAdminCounts().then(({ members, orgs }) => {
            const mStat = document.querySelector('[data-admin-stat="total-members"]');
            const oStat = document.querySelector('[data-admin-stat="total-orgs"]');
            if (mStat) mStat.textContent = members;
            if (oStat) oStat.textContent = orgs;
        }).catch(() => {});
    }

    const requests = getAdminReviewUsers();
    const reports = getModerationReports();
    const hidden = getHiddenModerationItems();

    if (requestsContainer) {
        requestsContainer.innerHTML = requests.length ? requests.map(user => `
            <article class="admin-card">
                <span class="post-type-tag">${escapeHtml(user.profileStatus || 'Pending review')}</span>
                <h3>${escapeHtml(user.name || 'Unnamed profile')}</h3>
                <p>${escapeHtml(user.profileTypeLabel || user.type || 'Community member')} | ${escapeHtml(user.email || '')}</p>
                <p>${escapeHtml(user.shortLine || user.story || 'No public line yet.')}</p>
                <div class="card-actions">
                    <button class="btn btn-primary btn-small" type="button" onclick="updateUserModerationStatus('${user.id}', 'Approved')">Approve</button>
                    <button class="btn btn-outline btn-small" type="button" onclick="updateUserModerationStatus('${user.id}', 'Needs changes')">Needs Changes</button>
                    <button class="btn btn-outline btn-small" type="button" onclick="hideReportedItem('profile', '${user.id}')">Hide Profile</button>
                </div>
            </article>
        `).join('') : '<div class="empty-state"><h3>No pending profiles</h3><p>New submitted profiles will appear here for review.</p></div>';
    }

    if (reportsContainer) {
        reportsContainer.innerHTML = reports.length ? reports.map(report => `
            <article class="admin-card">
                <span class="post-type-tag">${escapeHtml(report.status || 'Open')}</span>
                <h3>${escapeHtml(report.targetTitle || 'Reported item')}</h3>
                <p><strong>${escapeHtml(report.targetType)}</strong> | ${escapeHtml(report.reason)}</p>
                <p>${escapeHtml(report.details || 'No additional details were provided.')}</p>
                <small>Reporter: ${escapeHtml(report.reporter || 'anonymous')} | ${new Date(report.createdAt).toLocaleString()}</small>
                <div class="card-actions">
                    <button class="btn btn-primary btn-small" type="button" onclick="hideReportedItem('${report.targetType}', '${report.targetId}', '${report.id}')">Hide Item</button>
                    <button class="btn btn-outline btn-small" type="button" onclick="updateReportStatus('${report.id}', 'Reviewed')">Mark Reviewed</button>
                    <button class="btn btn-outline btn-small" type="button" onclick="updateReportStatus('${report.id}', 'Dismissed')">Dismiss</button>
                </div>
            </article>
        `).join('') : '<div class="empty-state"><h3>No reports yet</h3><p>Community reports will appear here.</p></div>';
    }

    if (hiddenContainer) {
        hiddenContainer.innerHTML = hidden.length ? hidden.map(key => {
            const [type, id] = key.split(':');
            return `
                <article class="admin-card compact-admin-card">
                    <h3>${escapeHtml(type)} hidden</h3>
                    <p>${escapeHtml(id)}</p>
                    <button class="btn btn-outline btn-small" type="button" onclick="restoreModeratedItem('${type}', '${id}')">Restore</button>
                </article>
            `;
        }).join('') : '<div class="empty-state"><h3>No hidden items</h3><p>Items removed by admin will be listed here.</p></div>';
    }

    stats.forEach(stat => {
        const type = stat.dataset.adminStat;
        if (type === 'requests') stat.textContent = requests.length;
        if (type === 'reports') stat.textContent = reports.filter(report => report.status === 'Open').length;
        if (type === 'hidden') stat.textContent = hidden.length;
    });
}

// FR-GLOWE-003 AC4: live pending-organization review queue, backed by the
// admin-gated glowe_list_pending_orgs RPC. Non-reviewers get a 42501 from the
// RPC, which we surface as a "locked" empty state rather than a crash.
async function loadPendingOrgs() {
    const container = document.getElementById('admin-org-requests');
    if (!container) return;
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) {
        container.innerHTML = '<div class="empty-state"><h3>Backend not configured</h3><p>Organization review is available once the shared backend is connected.</p></div>';
        return;
    }
    container.innerHTML = '<div class="empty-state"><h3>Loading…</h3><p>Fetching organizations awaiting verification.</p></div>';
    let orgs;
    try {
        orgs = await backend.listPendingOrgs();
    } catch (error) {
        const forbidden = error && (error.code === '42501' || /forbidden|permission/i.test(error.message || ''));
        container.innerHTML = forbidden
            ? '<div class="empty-state"><h3>Reviewers only</h3><p>This queue is visible to GloWe reviewers. Ask an administrator for access.</p></div>'
            : '<div class="empty-state"><h3>Could not load queue</h3><p>Please refresh and try again.</p></div>';
        return;
    }
    renderPendingOrgs(orgs || []);
}

function renderPendingOrgs(orgs) {
    const container = document.getElementById('admin-org-requests');
    if (!container) return;
    const orgStat = document.querySelector('[data-admin-stat="orgs"]');
    if (orgStat) orgStat.textContent = orgs.length;
    if (!orgs.length) {
        container.innerHTML = '<div class="empty-state"><h3>No pending organizations</h3><p>Verified organizations will publish freely; new submissions show up here.</p></div>';
        return;
    }
    container.innerHTML = orgs.map(org => {
        const id = escapeHtml(org.id);
        const orgName = escapeHtml(org.orgName || org.name || 'Unnamed organization');
        const submittedDate = org.orgSubmittedAt
            ? new Date(org.orgSubmittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';
        const detail = (label, value) => value
            ? `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>` : '';
        return `
            <details class="admin-org-accordion">
                <summary class="admin-org-summary">
                    <span class="admin-org-summary-name">${orgName}</span>
                    <span class="admin-org-summary-meta">${escapeHtml(org.orgField || '')}${org.orgField && org.orgCountry ? ' · ' : ''}${escapeHtml(org.orgCountry || '')}</span>
                    ${submittedDate ? `<span class="admin-org-summary-date">Submitted ${submittedDate}</span>` : ''}
                    <span class="admin-org-summary-chevron" aria-hidden="true">▾</span>
                </summary>
                <div class="admin-org-detail">
                    <article class="admin-card">
                        <span class="post-type-tag">Pending verification</span>
                        <h3>${orgName}</h3>
                        ${detail('Country', org.orgCountry || org.country)}
                        ${detail('Field', org.orgField)}
                        ${detail('Website', org.orgWebsite)}
                        ${detail('Registration', org.orgRegistrationNumber)}
                        ${detail('Contact', org.orgContactName)}
                        ${detail('Contact email', org.orgContactEmail || org.email)}
                        ${detail('Contact phone', org.orgContactPhone)}
                        ${detail('Size', org.orgSize)}
                        ${org.orgDescription ? `<p>${escapeHtml(org.orgDescription)}</p>` : ''}
                        <label class="admin-note-label">
                            Review note <span class="admin-note-required">(required for rejection)</span>
                            <textarea id="org-note-${id}" rows="2" placeholder="Explain the decision — especially required when rejecting"></textarea>
                        </label>
                        <div class="card-actions">
                            <button class="btn btn-primary btn-small" type="button" onclick="decideGloweOrg('${id}', 'approved')">Approve</button>
                            <button class="btn btn-outline btn-small" type="button" onclick="decideGloweOrg('${id}', 'rejected')">Reject</button>
                        </div>
                    </article>
                </div>
            </details>
        `;
    }).join('');
}

async function decideGloweOrg(profileId, decision) {
    const backend = window.gloweBackend;
    if (!backend || typeof backend.setOrgApproval !== 'function') return;
    const noteInput = document.getElementById(`org-note-${profileId}`);
    const note = noteInput ? noteInput.value.trim() : '';
    if (decision === 'rejected' && !note) {
        showSuccessModal(
            'Rejection reason required',
            'Please explain why this organization is being rejected. The organization will see this note.'
        );
        if (noteInput) noteInput.focus();
        return;
    }
    try {
        await backend.setOrgApproval(profileId, decision, note);
    } catch (error) {
        const forbidden = error && (error.code === '42501' || /forbidden|permission/i.test(error.message || ''));
        showSuccessModal(
            forbidden ? 'Reviewers only' : 'Could not save decision',
            forbidden
                ? 'Only GloWe reviewers can approve or reject organizations.'
                : 'Something went wrong while saving the decision. Please try again.'
        );
        return;
    }
    const verb = decision === 'approved' ? 'approved' : 'rejected';
    showSuccessModal('Decision saved', `The organization has been ${verb}.`);
    loadPendingOrgs();
}

function initForumsPage() {
    const container = document.getElementById('forum-categories');
    const threadsContainer = document.getElementById('forum-thread-list');
    const leadersContainer = document.getElementById('forum-leaders');
    const groupSelect = document.getElementById('forum-question-group');
    const stats = document.querySelectorAll('[data-forum-stat]');
    refreshForumGroups(initForumsPage);
    refreshForumThreads(initForumsPage);
    const forumGroups = getForumGroups();
    const allThreads = getForumThreads().map(thread => ({
        ...thread,
        group: forumGroups.find(g => g.id === thread.groupId) || { id: thread.groupId, title: '' }
    }));
    if (groupSelect) {
        groupSelect.innerHTML = forumGroups.map(group => `<option value="${group.id}">${group.title}</option>`).join('');
    }
    if (leadersContainer) {
        leadersContainer.innerHTML = people.length > 0
            ? people.slice(0, 4).map((person, index) => `
                <article class="forum-leader-card">
                    <a href="profile.html?id=${person.id}" class="forum-leader-main">
                        ${renderEntityMark(person.name, 'avatar')}
                        <span>
                            <strong>${escapeHtml(person.name)}</strong>
                            <small>${(person.skills || []).slice(0, 2).join(', ')}</small>
                        </span>
                    </a>
                    <p>${index % 2 === 0 ? 'Available for peer advice and focused questions.' : 'Can help facilitate a respectful, practical discussion.'}</p>
                    <button class="btn btn-outline btn-small" type="button" onclick="openPrivateMessage('${jsString(person.name)}')">Message</button>
                </article>
            `).join('')
            : '<p class="muted-note">Community members with active contributions will be featured here.</p>';
    }
    if (container) {
        container.innerHTML = forumGroups.map(group => `
            <a class="forum-group-card" href="discussion-group.html?group=${group.id}">
                ${group.members > 0 ? `<span>${group.members} members</span>` : ''}
                <h3>${escapeHtml(group.title)}</h3>
                <p>${escapeHtml(group.description)}</p>
                <div class="post-tag-row">${group.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
            </a>
        `).join('');
    }
    if (threadsContainer) {
        threadsContainer.innerHTML = allThreads.length > 0
            ? allThreads.map(thread => `
                <article class="thread-row">
                    <div>
                        <span class="post-type-tag">${escapeHtml(thread.group.title)}</span>
                        <h3><a href="discussion-group.html?group=${thread.group.id}">${escapeHtml(thread.title)}</a></h3>
                        <p>${thread.replies || 0} replies | Last active ${escapeHtml(formatThreadActivity(thread.createdAt))}</p>
                    </div>
                    <a class="btn btn-outline btn-small" href="discussion-group.html?group=${thread.group.id}">Open</a>
                </article>
            `).join('')
            : '<p class="muted-note">Active threads will appear here once community members start discussions.</p>';
    }
    if (stats.length) {
        const totals = {
            groups: forumGroups.length,
            threads: allThreads.length,
            members: forumGroups.reduce((sum, group) => sum + group.members, 0)
        };
        stats.forEach(stat => {
            stat.textContent = totals[stat.dataset.forumStat] || '0';
        });
    }
}

async function handleForumQuestionSubmit(event) {
    event.preventDefault();
    if (!canCreateContent()) return;
    const form = event.target;
    const groupId = form.querySelector('#forum-question-group').value;
    const forumGroups = getForumGroups();
    const group = forumGroups.find(item => item.id === groupId) || forumGroups[0];
    const fileInput = form.querySelector('#forum-question-file');
    const type = form.querySelector('#forum-question-type').value;
    const title = form.querySelector('#forum-question-title').value.trim();
    const body = form.querySelector('#forum-question-body').value.trim();
    await persistForumThread(group, title, body, {
        type,
        fileName: fileInput && fileInput.files[0] ? fileInput.files[0].name : ''
    });
    saveCommunityPost({
        authorId: 'sample-user-6',
        title,
        category: `${type} | ${group.title}`,
        text: body,
        tags: group.tags,
        audience: group.title
    });
    showSuccessModal('Question published', 'Your forum post is now visible in the forum and community feed.');
    form.reset();
    await reloadForumThreads();
    initForumsPage();
}

function initSavedPage() {
    const container = document.getElementById('saved-items-list');
    const summary = document.getElementById('saved-summary');
    if (!container) return;

    function renderSavedItemsPage() {
        const items = getSavedItems();
        const grouped = {
            opportunity: items.filter(item => item.type === 'opportunity'),
            post: items.filter(item => item.type === 'post'),
            profile: items.filter(item => item.type === 'profile'),
            wish: items.filter(item => item.type === 'wish')
        };
        if (summary) {
            summary.innerHTML = `
                <div><strong>${items.length}</strong><span>Saved items</span></div>
                <div><strong>${grouped.opportunity.length}</strong><span>Opportunities</span></div>
                <div><strong>${grouped.post.length}</strong><span>Posts</span></div>
                <div><strong>${grouped.profile.length}</strong><span>Profiles</span></div>
            `;
        }
        container.innerHTML = items.length ? items.map(item => `
            <article class="saved-item-card">
                <div>
                    <span class="post-type-tag">${item.type}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.meta || 'Saved from the GloWe community')}</p>
                    <small>Saved ${new Date(item.savedAt).toLocaleDateString()}</small>
                </div>
                <div class="saved-card-actions">
                    ${item.href ? `<a class="btn btn-primary btn-small" href="${item.href}">Open</a>` : ''}
                    <button class="btn btn-outline btn-small" type="button" onclick="removeSavedItem('${item.type}', '${item.id}')">Remove</button>
                </div>
            </article>
        `).join('') : `
            <div class="empty-state">
                <h3>No saved items yet</h3>
                <p>Save posts, profiles, and opportunities to return to them from this screen.</p>
                <a class="btn btn-primary btn-small" href="community.html">Explore Community</a>
            </div>
        `;
    }

    window.renderSavedItemsPage = renderSavedItemsPage;
    renderSavedItemsPage();
}

function initDiscussionGroupPage() {
    refreshForumGroups(initDiscussionGroupPage);
    refreshForumThreads(initDiscussionGroupPage);
    const forumGroups = getForumGroups();
    const params = new URLSearchParams(window.location.search);
    const group = forumGroups.find(item => item.id === (params.get('group') || 'education')) || forumGroups[0];
    const groupThreads = (typeof GloweForums !== 'undefined')
        ? GloweForums.threadsForGroup(getForumThreads(), group.id)
        : [];
    const header = document.getElementById('discussion-group-header');
    const members = document.getElementById('discussion-member-list');
    const threads = document.getElementById('discussion-thread-list');
    const composer = document.getElementById('discussion-composer');
    if (!header || !members || !threads || !composer) return;

    header.innerHTML = `
        <span class="hero-kicker">Discussion group</span>
        <h1>${escapeHtml(group.title)}</h1>
        <p>${escapeHtml(group.description)}</p>
        <div class="post-tag-row">${group.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        ${group.members > 0 || group.posts > 0 || groupThreads.length > 0 ? `
        <div class="group-stats-row">
            ${group.members > 0 ? `<span>${group.members} members</span>` : ''}
            ${group.posts > 0 ? `<span>${group.posts} posts</span>` : ''}
            ${groupThreads.length > 0 ? `<span>${groupThreads.length} active threads</span>` : ''}
        </div>` : ''}
    `;
    members.innerHTML = people.length > 0
        ? people.slice(0, 5).map(person => `
            <div class="person-row">
                <a href="profile.html?id=${person.id}">
                    ${renderEntityMark(person.name, 'avatar')}
                    <span><strong>${escapeHtml(person.name)}</strong><small>${(person.skills || []).slice(0, 2).join(', ')}</small></span>
                </a>
                <button type="button" onclick="openPrivateMessage('${jsString(person.name)}')">Message</button>
            </div>
        `).join('')
        : '<p class="muted-note">Members will appear here once they join this group.</p>';
    threads.innerHTML = groupThreads.length > 0
        ? groupThreads.map(thread => `
            <article class="thread-row">
                <div>
                    <span class="post-type-tag">${escapeHtml(formatThreadActivity(thread.createdAt))}</span>
                    <h3>${escapeHtml(thread.title)}</h3>
                    <p>${thread.body ? escapeHtml(thread.body) : `${thread.replies || 0} replies from members of ${escapeHtml(group.title)}.`}</p>
                </div>
                <button class="btn btn-outline btn-small" type="button" onclick="focusGroupReply()">Reply</button>
            </article>
        `).join('')
        : '<div class="empty-state"><h3>No threads yet</h3><p>Start the first conversation in this group.</p></div>';
    composer.innerHTML = `
        <form class="inline-post-form" onsubmit="handleDiscussionSubmit(event, '${group.id}')">
            <div class="form-group">
                <label for="discussion-title">Start a thread</label>
                <input id="discussion-title" required placeholder="Ask a focused question for this group">
            </div>
            <div class="form-group">
                <label for="discussion-body">Context</label>
                <textarea id="discussion-body" rows="4" required placeholder="What do you need input on, and what kind of answers would help?"></textarea>
            </div>
            <button class="btn btn-primary" type="submit">Publish Thread</button>
        </form>
    `;
}

function focusGroupReply() {
    const input = document.getElementById('discussion-title');
    if (input) input.focus();
}

async function handleDiscussionSubmit(event, groupId) {
    event.preventDefault();
    if (!canCreateContent()) return;
    const forumGroups = getForumGroups();
    const group = forumGroups.find(item => item.id === groupId) || forumGroups[0];
    const title = document.getElementById('discussion-title').value.trim();
    const body = document.getElementById('discussion-body').value.trim();
    await persistForumThread(group, title, body);
    saveCommunityPost({
        authorId: 'sample-user-6',
        title,
        category: `Discussion | ${group.title}`,
        text: body,
        tags: group.tags,
        audience: group.title
    });
    showSuccessModal('Thread published', 'Your discussion thread now appears in the community feed and this group.');
    event.target.reset();
    await reloadForumThreads();
    initDiscussionGroupPage();
}

// UUID pattern used to detect real DB profile IDs vs. static sample IDs.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function _profileNotFound(container) {
    container.innerHTML = `
        <div class="empty-state">
            <h3>Profile not found</h3>
            <p>This profile is not available yet, or the link points to an older demo profile.</p>
            <div class="modal-actions">
                <a class="btn btn-primary" href="organizations.html">Browse Organizations</a>
                <a class="btn btn-outline" href="community.html">Back to Community</a>
                <a class="btn btn-outline" href="my-applications.html">Open Personal Area</a>
            </div>
        </div>
    `;
}

// Map a glowe_profiles DB row (fromProfileRow output) to the shape that
// the profile-page rendering code expects (same as static sample profiles).
function _adaptDbProfile(p) {
    const isOrg = p.accountType === 'organization';
    return {
        id: p.id,
        name: isOrg ? (p.orgName || p.name || 'Unnamed organization') : (p.name || 'Anonymous'),
        type: isOrg ? (p.orgField || 'Organization') : 'Community Member',
        email: p.orgContactEmail || p.email || '',
        location: p.location || p.orgCountry || '',
        scope: p.orgCountry || '',
        languages: p.languages || [],
        skills: p.skills || [],
        impactArea: p.orgField || p.focus || '',
        mission: isOrg ? (p.orgDescription || p.about || '') : '',
        bio: p.about || '',
        story: p.about || '',
        focus: p.focus || '',
        website: p.orgWebsite || '',
        volunteers: 0,
        opportunities: 0,
        projects: [],
        status: p.approvalStatus === 'approved' ? 'Verified organization' : 'Pending verification'
    };
}

async function initProfilePage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || 'sample-org-1';
    const container = document.getElementById('profile-content');
    if (!container) return;

    const staticProfile = getProfileById(id);
    if (staticProfile) {
        _renderProfileContent(staticProfile, container);
        return;
    }

    if (!UUID_RE.test(id)) {
        _profileNotFound(container);
        return;
    }

    container.innerHTML = '<div class="empty-state"><h3>Loading profile…</h3><p>Fetching from the community directory.</p></div>';
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) { _profileNotFound(container); return; }
    try {
        const dbProfile = await backend.fetchProfileById(id);
        if (!dbProfile) { _profileNotFound(container); return; }
        _renderProfileContent(_adaptDbProfile(dbProfile), container);
    } catch {
        _profileNotFound(container);
    }
}

function _renderProfileContent(profile, container) {

    const isOrg = Boolean(profile.mission);
    const typeConfig = getProfileTypeConfig(profile);
    const projects = profile.projects || [];
    const languages = profile.languages || [];
    const tags = (profile.skills || [profile.impactArea]).filter(Boolean);
    const relatedWishes = wishes.filter(wish => wish.authorId === profile.id).slice(0, 3);
    const profilePosts = communityPosts.filter(post => post.authorId === profile.id).slice(0, 3);
    const relatedOpportunities = opportunities.filter(opp => {
        const searchable = `${opp.organization} ${opp.title} ${opp.description} ${opp.field} ${(opp.skills || []).join(' ')}`.toLowerCase();
        return searchable.includes(profile.name.toLowerCase()) || tags.some(tag => searchable.includes(String(tag).toLowerCase().split(' ')[0]));
    }).slice(0, 3);
    const safeName = jsString(profile.name);
    const primaryStat = isOrg ? profile.volunteers : profilePosts.length;
    const primaryStatLabel = isOrg ? 'Volunteers' : 'Posts';
    const opportunityCount = isOrg ? profile.opportunities || relatedOpportunities.length : relatedOpportunities.length;
    const missionText = profile.mission || profile.story || profile.bio || 'A GloWe community profile sharing work, knowledge, and opportunities for impact.';
    const valuesText = profile.values || (profile.type && profile.type.toLowerCase().includes('business')
        ? 'Ethical business, practical access, community benefit, and responsible technology.'
        : 'Transparency, dignity, collaboration, and shared learning.');
    const communityText = profile.community || profile.audience || profile.collaboration || 'Organizations, volunteers, partners, and communities looking for useful collaboration.';
    const problemText = profile.problem || `The work responds to needs connected to ${profile.impactArea || 'community impact'} and helps make local knowledge easier to access and act on.`;
    const solutionText = profile.solution || profile.collaboration || missionText;
    const methodsText = profile.methods || profile.scope || 'Community work, partnerships, shared knowledge, and practical field-based action.';
    const publicActionsText = profile.publicActions || profile.needs || profile.collaboration || 'Open to relevant conversations and collaboration through GloWe.';
    const progressText = profile.impact || `${profile.volunteers || primaryStat || 0} people connected through projects, opportunities, or community activity.`;
    const learningText = profile.learning || 'This profile can add more field insights, measurement notes, and lessons learned as the work develops.';
    const mediaLinks = profile.media || profile.website || profile.publicLink || '';
    const trustStatus = profile.status || profile.profileStatus || (isOrg ? 'Approved profile' : 'Community profile');
    const safeContact = profile.email || 'Contact through GloWe messages';

    container.innerHTML = `
        <section class="profile-cover profile-story-cover">
            <div class="profile-cover-band"></div>
            <div class="profile-hero">
                ${renderEntityMark(profile.name, 'profile-avatar')}
                <div class="profile-summary">
                    <span class="profile-type">${escapeHtml(profile.type || 'Community Member')}</span>
                    <h1>${escapeHtml(profile.name)}</h1>
                    <p>${escapeHtml(missionText)}</p>
                    <div class="opportunity-skills">${tags.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}</div>
                </div>
                <div class="profile-actions">
                    <button class="btn btn-outline" type="button" onclick="showSuccessModal('Profile saved', '${safeName} was saved to your profile list.')">Save</button>
                    <button class="btn btn-primary" type="button" onclick="openPrivateMessage('${safeName}')">Message</button>
                    <details class="profile-more-menu">
                        <summary aria-label="More profile actions">...</summary>
                        <div>
                            <button type="button" onclick="openEditProfile('${safeName}')">Edit profile</button>
                            <button type="button" onclick="showSuccessModal('Following ${safeName}', 'You will see updates from this profile in your community feed.')">Follow updates</button>
                            <button type="button" onclick="openReportModal('profile', '${profile.id}', '${safeName}')">Report</button>
                        </div>
                    </details>
                </div>
            </div>
            <div class="profile-stats">
                <div><strong>${primaryStat}</strong><span>${primaryStatLabel}</span></div>
                <div><strong>${projects.length}</strong><span>Projects</span></div>
                <div><strong>${opportunityCount}</strong><span>Opportunities</span></div>
                <div><strong>${relatedWishes.length}</strong><span>Open Needs</span></div>
            </div>
        </section>

        <section class="profile-grid">
            <div class="profile-main-column">
                <article class="profile-section-card profile-story-card">
                    <div class="profile-section-heading">
                        <span>01</span>
                        <h2>${escapeHtml(typeConfig.storyLabel || (isOrg ? 'Organization story' : 'Profile story'))}</h2>
                    </div>
                    <p class="profile-lead-text">${escapeHtml(missionText)}</p>
                    <div class="profile-narrative-grid">
                        <p><strong>${escapeHtml(typeConfig.valuesLabel || 'Values')}</strong><span>${escapeHtml(valuesText)}</span></p>
                        <p><strong>${escapeHtml(typeConfig.communityLabel || 'Community')}</strong><span>${escapeHtml(communityText)}</span></p>
                        <p><strong>${escapeHtml(typeConfig.sizeLabel || 'Size / availability')}</strong><span>${escapeHtml(profile.size || profile.availability || 'Not specified yet')}</span></p>
                        <p><strong>Languages</strong><span>${escapeHtml(languages.join(', ') || 'Not specified yet')}</span></p>
                    </div>
                </article>

                <article class="profile-section-card profile-story-card">
                    <div class="profile-section-heading">
                        <span>02</span>
                        <h2>Impact approach</h2>
                    </div>
                    <div class="profile-impact-story">
                        <div>
                            <strong>${escapeHtml(typeConfig.problemLabel || 'Problem')}</strong>
                            <p>${escapeHtml(problemText)}</p>
                        </div>
                        <div>
                            <strong>${escapeHtml(typeConfig.solutionLabel || 'Solution')}</strong>
                            <p>${escapeHtml(solutionText)}</p>
                        </div>
                        <div>
                            <strong>Methods / approaches</strong>
                            <p>${escapeHtml(methodsText)}</p>
                        </div>
                        <div>
                            <strong>What is open now</strong>
                            <p>${escapeHtml(publicActionsText)}</p>
                        </div>
                    </div>
                </article>

                <article class="profile-section-card profile-story-card">
                    <div class="profile-section-heading">
                        <span>03</span>
                        <h2>Projects</h2>
                    </div>
                    <div class="projects-grid">${projects.map(renderProjectCard).join('') || '<p class="muted-note">No projects listed yet.</p>'}</div>
                </article>

                <article class="profile-section-card profile-story-card">
                    <div class="profile-section-heading">
                        <span>04</span>
                        <h2>Measurement and learning</h2>
                    </div>
                    <div class="profile-learning-panel">
                        <p><strong>Impact so far</strong><span>${escapeHtml(progressText)}</span></p>
                        <p><strong>How success is understood</strong><span>${escapeHtml(profile.measurement || 'Through participation, useful connections, project progress, and community feedback.')}</span></p>
                        <p><strong>What we are learning</strong><span>${escapeHtml(learningText)}</span></p>
                    </div>
                </article>

                <article class="profile-section-card profile-story-card">
                    <div class="profile-section-heading">
                        <span>05</span>
                        <h2>Opportunities & collaboration</h2>
                    </div>
                    <div class="mini-opportunity-list">
                        ${relatedOpportunities.length ? relatedOpportunities.map(opp => `
                            <article>
                                <span class="opportunity-badge">${opp.commitment}</span>
                                <h3>${opp.title}</h3>
                                <p>${opp.description}</p>
                                <div class="opportunity-details">
                                    <span>${opp.location}</span>
                                    <span>${opp.duration}</span>
                                </div>
                                <a class="btn btn-outline btn-small" href="opportunity.html?id=${opp.id}">View Details</a>
                            </article>
                        `).join('') : '<p class="muted-note">No matching opportunities yet. This is where open roles and collaboration requests will appear.</p>'}
                    </div>
                </article>

                ${relatedWishes.length ? `
                    <article class="profile-section-card profile-story-card">
                        <div class="profile-section-heading">
                            <span>06</span>
                            <h2>Open Needs</h2>
                        </div>
                        <div class="mini-need-list">
                            ${relatedWishes.map(wish => `
                                <article>
                                    <span class="wish-type">${wish.type}</span>
                                    <h3>${wish.title}</h3>
                                    <p>${wish.description}</p>
                                    <button class="btn btn-primary btn-small" type="button" onclick="showSupportModal('${wish.id}')">Offer Support</button>
                                </article>
                            `).join('')}
                        </div>
                    </article>
                ` : ''}

                <article class="profile-section-card profile-story-card">
                    <div class="profile-section-heading">
                        <span>${relatedWishes.length ? '07' : '06'}</span>
                        <h2>Community Activity</h2>
                    </div>
                    <div class="profile-post-list">
                        ${profilePosts.length ? profilePosts.map(post => `
                            <article>
                                <span class="post-type-tag">Post | ${post.category}</span>
                                <h3>${post.title}</h3>
                                <p>${post.text}</p>
                            </article>
                        `).join('') : '<p class="muted-note">No community posts yet.</p>'}
                    </div>
                </article>
            </div>

            <aside class="profile-sidebar">
                <article class="org-info-card profile-contact-card">
                    <h4>Contact</h4>
                    <p>${profile.website ? `<a href="${escapeHtml(profile.website)}" target="_blank" rel="noopener">${escapeHtml(profile.website)}</a>` : 'Contact through GloWe messages'}</p>
                    <p>${escapeHtml(safeContact)}</p>
                    <button class="btn btn-primary btn-block" type="button" onclick="openPrivateMessage('${safeName}')">Start Conversation</button>
                </article>

                <article class="org-info-card">
                    <h4>Profile snapshot</h4>
                    <div class="profile-info-list compact">
                        <p><strong>Location</strong><span>${escapeHtml(profile.location || profile.country || 'Not specified')}</span></p>
                        <p><strong>Scope</strong><span>${escapeHtml(profile.scope || profile.availability || 'Open to coordination')}</span></p>
                        <p><strong>Impact area</strong><span>${escapeHtml(profile.impactArea || tags.join(', ') || 'Community impact')}</span></p>
                        <p><strong>Public links</strong><span>${renderProfileLinkList(mediaLinks)}</span></p>
                    </div>
                </article>

                <article class="org-info-card">
                    <h4>Trust & status</h4>
                    <div class="profile-check-list">
                        <span>${escapeHtml(trustStatus)}</span>
                        <span>Usually replies within 3-5 days</span>
                        <span>${isOrg ? `${profile.volunteers} volunteers connected` : `${projects.length} projects listed`}</span>
                    </div>
                </article>

                <article class="org-info-card">
                    <h4>${isOrg ? 'Impact signals' : 'What I offer'}</h4>
                    <p>${escapeHtml(isOrg ? profile.impactArea : tags.join(', '))}</p>
                    <h4>Impact Signals</h4>
                    <div class="impact-signals">
                        ${impactSignals.slice(0, 4).map(signal => `
                            <span title="${signal.metric}">
                                <strong>${signal.tag}</strong>
                                <small>${signal.category}</small>
                            </span>
                        `).join('')}
                    </div>
                </article>

                <article class="org-info-card">
                    <h4>Profile actions</h4>
                    <button class="btn btn-outline btn-block" type="button" onclick="showSuccessModal('Following ${safeName}', 'You will see updates from this profile in your community feed.')">Follow Updates</button>
                    <button class="btn btn-outline btn-block" type="button" onclick="openReportModal('profile', '${profile.id}', '${safeName}')">Report</button>
                </article>
            </aside>
        </section>
    `;
}

// Initialize opportunity detail page
async function initOpportunityDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const opportunityId = urlParams.get('id');

    if (!opportunityId) {
        window.location.href = 'volunteer-network.html';
        return;
    }

    // A full page load starts with an empty in-memory store, so remote
    // opportunities/events aren't present yet — fetch before the lookup.
    if (!getOpportunityByAnyId(opportunityId)
        && typeof gloweBackend !== 'undefined' && gloweBackend.configured()) {
        await fetchAndPopulate(() => gloweBackend.listAll('opportunities'), opportunities, mapOpportunityRow);
    }

    const opportunity = getOpportunityByAnyId(opportunityId);
    if (!opportunity) {
        window.location.href = 'volunteer-network.html';
        return;
    }
    
    // Populate page content
    document.getElementById('opp-title').textContent = opportunity.title;
    document.getElementById('opp-org').innerHTML = `${renderEntityMark(opportunity.organization)} ${escapeHtml(opportunity.organization)}`;
    document.getElementById('opp-location').textContent = opportunity.location;
    document.getElementById('opp-duration').textContent = opportunity.duration;
    document.getElementById('opp-commitment').textContent = opportunity.commitment;
    document.getElementById('opp-description').textContent = opportunity.description;
    
    const requirementsList = document.getElementById('opp-requirements');
    requirementsList.innerHTML = (opportunity.requirements || []).map(req => `<li>${escapeHtml(req)}</li>`).join('');
    
    const responsibilitiesList = document.getElementById('opp-responsibilities');
    responsibilitiesList.innerHTML = (opportunity.responsibilities || []).map(resp => `<li>${escapeHtml(resp)}</li>`).join('');
    
    const skillsContainer = document.getElementById('opp-skills');
    skillsContainer.innerHTML = (opportunity.skills || []).map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('');
    
    // Organization info
    const org = getOrganizationByName(opportunity.organization);
    if (org) {
        document.getElementById('org-name').textContent = org.name;
        document.getElementById('org-mission').textContent = org.mission;
    } else {
        document.getElementById('org-name').textContent = opportunity.organization;
        document.getElementById('org-mission').textContent = 'This local opportunity was published by a GloWe community member and is ready for interested volunteers or collaborators.';
    }

    const trustPanel = document.getElementById('opp-trust-panel');
    if (trustPanel) {
        trustPanel.innerHTML = `
            <h4>What happens next</h4>
            <ol class="clean-step-list">
                <li>Save the opportunity if you want to compare it later.</li>
                <li>Apply with your availability and relevant skills.</li>
                <li>The organization receives your message and can continue in GloWe messages.</li>
            </ol>
            <button class="btn btn-outline btn-block" type="button" onclick="saveItem('opportunity', '${opportunity.id}', '${jsString(opportunity.title)}', '${jsString(opportunity.organization)}', 'opportunity.html?id=${encodeURIComponent(opportunity.id)}')">Save Opportunity</button>
        `;
    }
    
    const events = (typeof GloweEvents !== 'undefined') ? GloweEvents : null;
    const isEvent = events ? events.isEvent(opportunity) : false;

    // Events use the registration panel; plain opportunities keep the apply-modal.
    const applyBtn = document.getElementById('apply-btn');
    if (applyBtn && !isEvent) {
        applyBtn.addEventListener('click', function() {
            if (!isLoggedIn()) {
                sessionStorage.setItem('pendingOpportunityApplication', opportunityId);
                openModal('login-modal');
            } else {
                openModal('apply-modal');
            }
        });
    }

    if (isEvent) setupEventRegistration(opportunity, events);
}

// Replace the apply card with an event summary + registration panel (FR-GLOWE-007-C).
function setupEventRegistration(opportunity, events) {
    const card = document.querySelector('.apply-card');
    if (!card) return;
    const typeLabel = events.eventTypeLabel(opportunity.eventType) || 'Event';
    const modeLabel = opportunity.registrationMode === 'open' ? 'Instant registration' : 'Approval required';
    card.innerHTML = `
        <h3>Event registration</h3>
        <div class="opportunity-details">
            <span class="opportunity-detail"><strong>When:</strong> ${escapeHtml(events.formatEventDate(opportunity))}</span>
            <span class="opportunity-detail"><strong>Type:</strong> ${escapeHtml(typeLabel)}</span>
            <span class="opportunity-detail"><strong>Registration:</strong> ${escapeHtml(modeLabel)}</span>
        </div>
        <div id="event-register-area" aria-live="polite"></div>
    `;
    renderEventRegisterArea(opportunity, events);
}

// Decide what to show in the registration area: ended / closed notice, sign-in
// prompt, current-status panel, or the registration form.
async function renderEventRegisterArea(opportunity, events) {
    const area = document.getElementById('event-register-area');
    if (!area) return;
    // The organizer manages registrations instead of registering for their own event.
    if (isLoggedIn() && isEventOwner(opportunity)) {
        renderOrganizerPanel(area, opportunity, events);
        return;
    }
    if (events.eventTiming(opportunity) === 'past') {
        area.innerHTML = '<p class="muted-note">This event has ended.</p>';
        return;
    }
    if (events.isEventCancelled(opportunity)) {
        area.innerHTML = '<p class="muted-note">This event has been cancelled by the organizer.</p>';
        return;
    }
    if (opportunity.status && opportunity.status !== 'active') {
        area.innerHTML = '<p class="muted-note">This event is no longer open for registration.</p>';
        return;
    }
    if (!isLoggedIn()) {
        area.innerHTML = `<button class="btn btn-primary btn-block" type="button" onclick="openModal('login-modal')">Sign in to register</button>`;
        return;
    }
    const registration = await findMyRegistration(opportunity.id, events);
    if (registration) renderRegisteredState(area, opportunity, events, registration);
    else renderRegisterForm(area, opportunity);
}

async function findMyRegistration(opportunityId, events) {
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) return null;
    try {
        const regs = await backend.listMyRegistrations();
        return events.findRegistration(regs || [], opportunityId);
    } catch (_e) {
        return null;
    }
}

function renderRegisteredState(area, opportunity, events, registration) {
    const label = events.registrationStatusLabel(registration.status);
    const canCancel = events.canCancelRegistration(registration.status);
    area.innerHTML = `
        <p class="event-register-status">Status: <strong>${escapeHtml(label)}</strong></p>
        <div id="event-link-area"></div>
        ${canCancel ? '<button class="btn btn-outline btn-block" type="button" id="event-cancel-btn">Cancel registration</button>' : ''}
    `;
    if (registration.status === 'Accepted') renderEventLink(opportunity, events);
    if (!canCancel) return;
    document.getElementById('event-cancel-btn').addEventListener('click', async function() {
        const backend = window.gloweBackend;
        try { await backend.cancelRegistration(registration.id); } catch (_e) { /* reload reflects truth */ }
        renderEventRegisterArea(opportunity, events);
    });
}

// For a confirmed registrant on a digital event, reveal the join link when the
// server allows it, otherwise show when it will appear.
async function renderEventLink(opportunity, events) {
    if (!events.isDigital(opportunity)) return;
    const holder = document.getElementById('event-link-area');
    if (!holder) return;
    const backend = window.gloweBackend;
    let link = null;
    try { link = backend ? await backend.getEventLink(opportunity.id) : null; } catch (_e) { link = null; }
    if (link) {
        holder.innerHTML = `<p class="event-link-line">Join link: <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link)}</a></p>`;
        return;
    }
    const hint = events.linkRevealHint(opportunity);
    holder.innerHTML = hint ? `<p class="muted-note">${escapeHtml(hint)}</p>` : '';
}

function renderRegisterForm(area, opportunity) {
    const profile = typeof getPersonalProfile === 'function' ? getPersonalProfile() : null;
    const email = (profile && profile.email) || '';
    area.innerHTML = `
        <form id="event-register-form" class="event-register-form">
            <div class="form-group">
                <label for="event-reg-email">Email</label>
                <input type="email" id="event-reg-email" value="${escapeHtml(email)}" placeholder="your@email.com">
            </div>
            <div class="form-group">
                <label for="event-reg-phone">Phone (optional)</label>
                <input type="text" id="event-reg-phone" placeholder="050-0000000">
            </div>
            <div class="form-group">
                <label for="event-reg-comment">Message to the organizer (optional)</label>
                <textarea id="event-reg-comment" rows="2" placeholder="Anything the organizer should know..."></textarea>
            </div>
            <button class="btn btn-primary btn-block" type="submit">Register for event</button>
        </form>
    `;
    document.getElementById('event-register-form')
        .addEventListener('submit', (e) => submitEventRegistration(e, opportunity));
}

async function submitEventRegistration(event, opportunity) {
    event.preventDefault();
    const backend = window.gloweBackend;
    const events = (typeof GloweEvents !== 'undefined') ? GloweEvents : null;
    if (!backend || !backend.configured() || !events) return;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Registering...'; }
    try {
        const row = await backend.registerForEvent(opportunity.id, {
            email: document.getElementById('event-reg-email').value,
            phone: document.getElementById('event-reg-phone').value,
            comment: document.getElementById('event-reg-comment').value
        });
        const accepted = row && row.status === 'Accepted';
        showSuccessModal(
            accepted ? 'You are registered!' : 'Registration submitted',
            accepted
                ? 'Your spot is confirmed. Manage it from your personal area.'
                : 'Your registration is pending review by the organizer.'
        );
        renderEventRegisterArea(opportunity, events);
    } catch (err) {
        const area = document.getElementById('event-register-area');
        if (area) area.insertAdjacentHTML('afterbegin', `<p class="event-register-error">${escapeHtml(registrationErrorMessage(err))}</p>`);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Register for event'; }
    }
}

// Map a Postgres/PostgREST error from glowe_register_for_event to friendly copy.
function registrationErrorMessage(err) {
    const raw = (err && (err.message || err.error_description)) || '';
    if (raw.includes('already have an active registration')) return 'You are already registered for this event.';
    if (raw.includes('not open for registration') || raw.includes('already ended')) return 'This event is no longer open for registration.';
    if (raw.includes('sign in')) return 'Please sign in to register.';
    return 'Could not complete your registration. Please try again.';
}

// ── Organizer portal (FR-GLOWE-007-E) ──────────────────────────────────────
// True when the signed-in user published this event.
function isEventOwner(opportunity) {
    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    return Boolean(user && opportunity && opportunity.ownerId && user.id === opportunity.ownerId);
}

// Render the organizer's registrant list with accept/decline controls.
async function renderOrganizerPanel(area, opportunity, events) {
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) { area.innerHTML = ''; return; }
    area.innerHTML = '<p class="muted-note">Loading registrations…</p>';
    let regs = [];
    try {
        regs = await backend.listEventRegistrations(opportunity.id);
    } catch (_e) {
        area.innerHTML = '<p class="event-register-error">Could not load registrations.</p>';
        return;
    }
    area.innerHTML = organizerPanelHtml(regs, opportunity, events);
    area.querySelectorAll('[data-decide]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            handleOrganizerDecision(btn.getAttribute('data-reg'), btn.getAttribute('data-decide'), opportunity, events);
        });
    });
    const cancelBtn = document.getElementById('event-cancel-event-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', function () { handleCancelEvent(opportunity, events); });
}

function organizerPanelHtml(registrations, opportunity, events) {
    const accepted = events.acceptedCount(registrations);
    const rows = (registrations || []).map(function (r) { return organizerRegistrationRowHtml(r, events); }).join('');
    const cancelled = events.isEventCancelled(opportunity);
    const cancelControl = cancelled
        ? '<p class="event-register-status"><strong>This event is cancelled.</strong></p>'
        : '<button class="btn btn-outline btn-block" type="button" id="event-cancel-event-btn">Cancel event</button>';
    return `
        <div class="organizer-panel">
            <h4>Manage registrations</h4>
            <p class="organizer-capacity">${escapeHtml(events.capacityLabel(opportunity, accepted))}</p>
            <div class="organizer-reg-list">${rows || '<p class="muted-note">No registrations yet.</p>'}</div>
            <div class="organizer-cancel-event">${cancelControl}</div>
        </div>
    `;
}

function organizerRegistrationRowHtml(reg, events) {
    const name = reg.registrant_name || reg.submitted_email || 'Registrant';
    const contact = [reg.submitted_email, reg.submitted_phone].filter(Boolean).join(' · ');
    const statusLabel = events.registrationStatusLabel(reg.status) || reg.status;
    const note = reg.rejection_note ? `<p class="muted-note">Reason: ${escapeHtml(reg.rejection_note)}</p>` : '';
    const actions = events.canDecideRegistration(reg.status)
        ? `<div class="organizer-actions">
               <button class="btn btn-small btn-primary" type="button" data-decide="accept" data-reg="${escapeHtml(reg.id)}">Accept</button>
               <button class="btn btn-small btn-outline" type="button" data-decide="decline" data-reg="${escapeHtml(reg.id)}">Decline</button>
           </div>`
        : '';
    return `
        <article class="organizer-reg-item">
            <div>
                <strong>${escapeHtml(name)}</strong>
                <span class="status-badge status-${reg.status.toLowerCase()}">${escapeHtml(statusLabel)}</span>
                ${contact ? `<p class="muted-note">${escapeHtml(contact)}</p>` : ''}
                ${note}
            </div>
            ${actions}
        </article>
    `;
}

// Accept or decline a registration, then refresh the panel from server truth.
async function handleOrganizerDecision(registrationId, decision, opportunity, events) {
    const backend = window.gloweBackend;
    if (!backend || !registrationId) return;
    let note = '';
    if (decision === 'decline') {
        note = (window.prompt('Reason for declining (required, shown to the registrant):') || '').trim();
        if (!note) return;
    }
    try {
        await backend.decideEventRegistration(registrationId, decision, note.slice(0, 500));
    } catch (_e) {
        /* re-render reflects the server's authoritative state */
    }
    const area = document.getElementById('event-register-area');
    if (area) renderOrganizerPanel(area, opportunity, events);
}

// Organizer cancels the whole event (after confirmation), then refreshes.
async function handleCancelEvent(opportunity, events) {
    const backend = window.gloweBackend;
    if (!backend) return;
    if (!window.confirm('Cancel this event? Registrants will see it as cancelled.')) return;
    try {
        const row = await backend.cancelEvent(opportunity.id);
        if (row && row.status) opportunity.status = row.status;
    } catch (_e) {
        /* re-render reflects the server's authoritative state */
    }
    const area = document.getElementById('event-register-area');
    if (area) renderOrganizerPanel(area, opportunity, events);
}

// Handle application submission
async function handleApplicationSubmit(event) {
    event.preventDefault();
    if (!isLoggedIn()) {
        showSuccessModal('Sign in to apply', 'Please sign in or create a free account to apply to this opportunity.');
        return;
    }
    const opportunityId = new URLSearchParams(window.location.search).get('id');
    const user = getCurrentUser();
    const helpers = (typeof GloweOpportunities !== 'undefined') ? GloweOpportunities : null;
    const backend = window.gloweBackend;

    // Guard against duplicate applications (AC5). Prefer the authoritative
    // server list; fall back to the local cache when the backend is offline.
    let existing = getApplications();
    if (backend && backend.configured()) {
        try { existing = await backend.listOwned('applications') || []; } catch (_e) { existing = getApplications(); }
    }
    if (helpers && helpers.isDuplicateApplication(existing, opportunityId, user && user.id)) {
        closeModal('apply-modal');
        showSuccessModal('Already applied', 'You have already applied to this opportunity. Track its status in your personal area.');
        return;
    }

    const availability = document.getElementById('apply-availability').value;
    const skills = document.getElementById('apply-skills').value;
    const motivation = document.getElementById('apply-motivation').value;

    if (backend && backend.configured()) {
        try {
            await backend.insertOwned('applications', {
                opportunity_id: String(opportunityId),
                availability,
                skills,
                motivation,
                status: 'Pending'
            });
        } catch (_e) {
            showSuccessModal('Could not apply', 'Something went wrong submitting your application. Please try again.');
            return;
        }
    }

    // Local cache keeps the Personal Area "Applications" list responsive until
    // it is migrated to a live Supabase read (GLOWE.B6).
    const applications = getApplications();
    applications.push({
        id: Date.now(),
        opportunityId,
        userId: user.id,
        availability,
        skills,
        motivation,
        status: 'Pending',
        appliedAt: new Date().toISOString()
    });
    saveApplications(applications);

    closeModal('apply-modal');
    showSuccessModal(
        'Application Submitted!',
        'Your application has been submitted successfully. You can track its status in your personal area.'
    );
}

// Initialize my applications page
function initMyApplicationsPage() {
    const container = document.getElementById('personal-area-content');
    if (!container) return;
    if (typeof requireGloweMember === 'function' && !requireGloweMember()) return;

    function renderPersonalArea() {
        const profile = getPersonalProfile();
        const projects = getPersonalProjects();
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const applications = getApplications();
        const userApplications = user ? applications.filter(app => app.userId === user.id) : [];
        const savedPosts = getSavedCommunityPosts().slice(0, 3);
        const savedItems = getSavedItems();
        const savedPreview = savedItems.slice(0, 6);

        container.innerHTML = `
            <div class="personal-shell">
                <aside class="personal-sidebar">
                    <div class="personal-profile-card">
                        <div class="personal-avatar-wrap">
                            ${renderPersonalAvatar(profile, 'profile-avatar')}
                            <button type="button" onclick="openEditProfile()">Change</button>
                        </div>
                        <h2>${profile.name}</h2>
                        <p>${profile.type}</p>
                        <span class="profile-status-pill">${profile.profileStatus || 'Community profile'}</span>
                        <div class="opportunity-skills">
                            ${(profile.interests || profile.skills || []).slice(0, 4).map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
                        </div>
                        <button class="btn btn-primary btn-block" type="button" onclick="openEditProfile()">Edit Profile</button>
                    </div>
                    <nav class="personal-nav" aria-label="Personal area sections">
                        <a href="#personal-profile">Overview</a>
                        <a href="#personal-projects">Projects</a>
                        <a href="#personal-opportunities">Opportunities</a>
                        <a href="#personal-events">My Events</a>
                        <a href="#personal-saved">Saved</a>
                        <a href="#personal-activity">Activity</a>
                    </nav>
                </aside>

                <div class="personal-main">
                    <section class="social-profile-hero" id="personal-profile">
                        <div class="social-cover"></div>
                        <div class="social-profile-row">
                            ${renderPersonalAvatar(profile, 'profile-avatar social-avatar')}
                            <div class="social-profile-copy">
                                <span class="profile-type">${escapeHtml(profile.type || 'Personal workspace')}</span>
                                <h2>${profile.name}</h2>
                                <p>${escapeHtml(profile.shortLine || profile.about || profile.story || 'Your GloWe profile is ready to be completed.')}</p>
                                <div class="profile-meta-row">
                                    <span>${escapeHtml(profile.focus || 'Focus not added yet')}</span>
                                    <span>${escapeHtml(profile.location || profile.country || 'Location not added yet')}</span>
                                    <span>${escapeHtml(profile.availability || 'Team size not added yet')}</span>
                                </div>
                            </div>
                            <div class="personal-actions">
                                <button class="btn btn-primary" type="button" onclick="openEditProfile()">Edit Profile</button>
                                <button class="btn btn-outline" type="button" onclick="openPersonalProjectModal()">Add Project</button>
                                <a class="btn btn-outline" href="community.html">Write Post</a>
                                <a class="btn btn-outline" href="settings.html">Settings</a>
                            </div>
                        </div>
                    </section>

                    <section class="personal-stats-grid">
                        <div><strong>${projects.length}</strong><span>Projects</span></div>
                        <div><strong>${userApplications.length}</strong><span>Applications</span></div>
                        <div><strong>${savedItems.length}</strong><span>Saved</span></div>
                        <div><strong>${savedPosts.length}</strong><span>Posts</span></div>
                    </section>

                    <section class="personal-grid">
                        <article class="profile-section-card">
                            <div class="profile-section-heading">
                                <span>01</span>
                                <h2>Profile From Questionnaire</h2>
                            </div>
                            <div class="profile-info-list">
                                ${renderQuestionnaireProfile(profile)}
                                <p><strong>Social links</strong><span>${renderProfileLinkList(profile.socials)}</span></p>
                                <p><strong>Articles / media</strong><span>${renderProfileLinkList(profile.media)}</span></p>
                            </div>
                        </article>

                        <article class="profile-section-card" id="personal-projects">
                            <div class="personal-card-header">
                                <div class="profile-section-heading">
                                    <span>02</span>
                                    <h2>Projects</h2>
                                </div>
                                <button class="btn btn-outline btn-small" type="button" onclick="openPersonalProjectModal()">Add Project</button>
                            </div>
                            <div class="projects-grid">${projects.map(renderProjectCard).join('')}</div>
                        </article>

                        <article class="profile-section-card" id="personal-opportunities">
                            <div class="profile-section-heading">
                                <span>03</span>
                                <h2>Opportunities & Applications</h2>
                            </div>
                            <div class="personal-list">
                                ${userApplications.length ? userApplications.map(renderApplicationCard).join('') : `
                                    <div class="empty-state compact-empty">
                                        <h3>No applications yet</h3>
                                        <p>Apply to opportunities or publish your own request for volunteers and collaborators.</p>
                                        <a href="volunteer-network.html" class="btn btn-primary btn-small">Open Volunteer Network</a>
                                    </div>
                                `}
                            </div>
                        </article>

                        <article class="profile-section-card" id="personal-events">
                            <div class="profile-section-heading">
                                <span>04</span>
                                <h2>My Events</h2>
                            </div>
                            <div class="personal-list" id="my-events-list" aria-live="polite">
                                <p class="muted-note">Loading your event registrations…</p>
                            </div>
                        </article>

                        <article class="profile-section-card" id="personal-saved">
                            <div class="profile-section-heading">
                                <span>05</span>
                                <h2>Saved</h2>
                            </div>
                            <div class="saved-mini-grid">
                                ${savedPreview.length ? savedPreview.map(item => `
                                    <article class="saved-mini-card">
                                        <span class="post-type-tag">${item.type}</span>
                                        <h3>${escapeHtml(item.title)}</h3>
                                        <p>${escapeHtml(item.meta || 'Saved from the GloWe community')}</p>
                                        <div class="saved-card-actions">
                                            ${item.href ? `<a class="btn btn-primary btn-small" href="${item.href}">Open</a>` : ''}
                                            <button class="btn btn-outline btn-small" type="button" onclick="removeSavedItem('${item.type}', '${item.id}')">Remove</button>
                                        </div>
                                    </article>
                                `).join('') : `
                                    <div class="empty-state compact-empty">
                                        <h3>No saved items yet</h3>
                                        <p>Save posts, profiles, wishes, and opportunities to return to them from here.</p>
                                        <a href="community.html" class="btn btn-primary btn-small">Explore Community</a>
                                    </div>
                                `}
                            </div>
                        </article>

                        <article class="profile-section-card" id="personal-activity">
                            <div class="profile-section-heading">
                                <span>06</span>
                                <h2>Recent Activity</h2>
                            </div>
                            <div class="profile-post-list">
                                ${savedPosts.length ? savedPosts.map(post => `
                                    <article>
                                        <span class="post-type-tag">Post | ${post.category}</span>
                                        <h3>${post.title}</h3>
                                        <p>${post.text}</p>
                                    </article>
                                `).join('') : '<p class="muted-note">Posts you write in the community will appear here.</p>'}
                            </div>
                        </article>
                    </section>
                </div>
            </div>
        `;
    }

    window.renderPersonalArea = renderPersonalArea;
    renderPersonalArea();
    loadMyEvents();
    syncPersonalDataFromBackend().then((updated) => {
        if (updated) renderPersonalArea();
        loadMyEvents();
    });
}

// Populate the personal-area "My Events" list from the user's live event
// registrations (FR-GLOWE-007-F). Renders after the synchronous personal-area
// shell so a slow Supabase round-trip never blocks the page.
async function loadMyEvents() {
    const list = document.getElementById('my-events-list');
    if (!list) return;
    const backend = window.gloweBackend;
    const events = (typeof GloweEvents !== 'undefined') ? GloweEvents : null;
    if (!backend || !backend.configured() || !events) {
        list.innerHTML = emptyMyEventsHtml();
        return;
    }
    try {
        const [regs, opportunities] = await Promise.all([
            backend.listMyRegistrations(),
            backend.listAll('opportunities')
        ]);
        const rows = buildMyEventRows(regs || [], opportunities || [], events);
        list.innerHTML = rows.length
            ? rows.map(row => renderMyEventCard(row, events)).join('')
            : emptyMyEventsHtml();
    } catch (_e) {
        list.innerHTML = emptyMyEventsHtml();
    }
}

// Join registration rows to their event, newest event first, dropping rows
// whose opportunity is missing or is not an event.
function buildMyEventRows(registrations, opportunities, events) {
    const byId = new Map(opportunities.map(o => [o.id, mapOpportunityRow(o)]));
    return registrations
        .map(reg => ({ reg, event: byId.get(reg.opportunity_id || reg.opportunityId) }))
        .filter(row => row.event && events.isEvent(row.event))
        .sort((a, b) => Date.parse(b.event.startAt || 0) - Date.parse(a.event.startAt || 0));
}

function renderMyEventCard(row, events) {
    const { reg, event } = row;
    const cancelled = events.isEventCancelled(event);
    const statusLabel = cancelled ? 'Event cancelled' : events.registrationStatusLabel(reg.status);
    const badgeClass = cancelled ? 'status-cancelled' : `status-${reg.status.toLowerCase()}`;
    const canCancel = !cancelled && events.canCancelRegistration(reg.status);
    const detailHref = `opportunity.html?id=${encodeURIComponent(event.id)}`;
    return `
        <article class="personal-list-item my-event-item">
            <div>
                <a href="${detailHref}"><h3>${escapeHtml(event.title)}</h3></a>
                <p class="muted-note">${escapeHtml(event.organization || '')} · ${escapeHtml(events.formatEventDate(event))}</p>
                <span class="status-badge ${badgeClass}">${escapeHtml(statusLabel)}</span>
            </div>
            ${canCancel ? `<button class="btn btn-outline btn-small" type="button" onclick="cancelMyEvent('${reg.id}')">Cancel</button>` : ''}
        </article>
    `;
}

function emptyMyEventsHtml() {
    return `
        <div class="empty-state compact-empty">
            <h3>No event registrations yet</h3>
            <p>Register for an event from the Volunteer Network and track it here.</p>
            <a href="volunteer-network.html" class="btn btn-primary btn-small">Browse events</a>
        </div>
    `;
}

// Cancel a registration from the My Events list, then reload the list.
async function cancelMyEvent(registrationId) {
    const backend = window.gloweBackend;
    if (!backend || !backend.configured()) return;
    try {
        await backend.cancelRegistration(registrationId);
    } catch (_e) {
        /* leave the list as-is; a reload will reflect server truth */
    }
    loadMyEvents();
}

const GLOWE_LANG_KEY = 'gloweLang';
const GLOWE_RTL_LANGS = ['he'];

function getGloweLanguage() {
    return localStorage.getItem(GLOWE_LANG_KEY) || 'en';
}

// FR-GLOWE-004 — interface i18n. English is the base; only the chrome (nav,
// auth, footer, modals, settings) and the home page are localized for now.
// Untranslated copy intentionally falls back to English. Keys are the exact
// English text nodes / attribute values produced by the page or by app.js.
const GLOWE_TRANSLATIONS = {
    he: {
        // Header / navigation
        'Home': 'בית',
        'Personal Area': 'האזור האישי',
        'Wishing Well': 'באר המשאלות',
        'The Wishing Well': 'באר המשאלות',
        'Wishes': 'משאלות',
        'Organizations': 'ארגונים',
        'Community': 'קהילה',
        'Forums': 'פורומים',
        'About': 'אודות',
        'About Us': 'עלינו',
        'Profile': 'פרופיל',
        'Sign up / Sign in': 'הרשמה / כניסה',
        'Log In': 'כניסה',
        'Log in': 'כניסה',
        'Join GloWe': 'הצטרפו ל-GloWe',
        'Log Out': 'התנתקות',
        'Hi,': 'שלום,',
        'there': 'חבר/ה',
        // Footer
        'Global Learning, Open Knowledge & Wisdom Exchange.': 'למידה גלובלית, ידע פתוח וחילופי חוכמה.',
        'Bridging local solutions to global challenges through shared knowledge, solidarity, and practical action.': 'מחברים פתרונות מקומיים לאתגרים גלובליים דרך ידע משותף, סולידריות ופעולה מעשית.',
        'Quick Links': 'קישורים מהירים',
        'Explore': 'ניווט',
        'Participate': 'להשתתף',
        'Write a post': 'כתיבת פוסט',
        'Volunteer Network': 'רשת המתנדבים',
        "What's next": 'מה הלאה',
        'What Comes Next': 'מה צופן העתיד',
        'Built With Care': 'נבנה באהבה',
        'An MVP by the GloWe community, with product and implementation support by Topaz.': 'גרסת MVP של קהילת GloWe, בליווי מוצר ופיתוח של Topaz.',
        'Admin Review': 'ניהול ובקרה',
        'Terms & Community Charter': 'תנאים ואמנת קהילה',
        'For Organizations': 'לארגונים',
        'Register Your Organization': 'רישום הארגון שלכם',
        'Post an Opportunity': 'פרסום הזדמנות',
        'Connect': 'יצירת קשר',
        // Auth + shared modals
        'Welcome Back': 'ברוכים השבים',
        'Welcome Back!': 'ברוכים השבים!',
        'Sign in with your Google account to continue.': 'התחברו עם חשבון Google כדי להמשיך.',
        'Continue with Google': 'המשך עם Google',
        "Don't have an account?": 'אין לכם חשבון?',
        'Join our community': 'הצטרפו לקהילה',
        'Join the GloWe Community': 'הצטרפו לקהילת GloWe',
        'Sign in with your Google account to get started.': 'התחברו עם חשבון Google כדי להתחיל.',
        'Already have an account?': 'כבר יש לכם חשבון?',
        'Success': 'הצלחה',
        'Your action was completed successfully.': 'הפעולה הושלמה בהצלחה.',
        'Continue': 'המשך',
        // Onboarding
        'Find your GloWe path': 'מצאו את הדרך שלכם ב-GloWe',
        'Choose the path that matches what you want to do first.': 'בחרו את הדרך שמתאימה למה שתרצו לעשות קודם.',
        'I represent an organization': 'אני מייצג/ת ארגון',
        'Create a profile, post a need, and receive structured offers.': 'יצירת פרופיל, פרסום צורך וקבלת הצעות מסודרות.',
        'I can help': 'אני יכול/ה לעזור',
        'Find wishes that match your skills, language, location, and time.': 'איתור משאלות שמתאימות לכישורים, לשפה, למיקום ולזמן שלכם.',
        'I am a business partner': 'אני שותף/ה עסקי/ת',
        'Match CSR teams, logistics, funding, or services with verified needs.': 'התאמת צוותי CSR, לוגיסטיקה, מימון או שירותים לצרכים מאומתים.',
        // Settings
        'Settings': 'הגדרות',
        'Manage your account, language, and session preferences.': 'ניהול החשבון, השפה והעדפות ההתחברות שלכם.',
        'Account': 'חשבון',
        'Name': 'שם',
        'Email': 'דוא"ל',
        'Account type': 'סוג חשבון',
        'Community member': 'חבר/ת קהילה',
        'Open Personal Area': 'מעבר לאזור האישי',
        'Language': 'שפה',
        'Interface language': 'שפת הממשק',
        'Choose the language for the GloWe interface. Hebrew is shown in a right-to-left (RTL) layout.': 'בחרו את שפת הממשק של GloWe. עברית מוצגת בפריסת ימין-לשמאל (RTL).',
        'English': 'אנגלית',
        'Hebrew': 'עברית',
        'Session': 'התנתקות',
        'End your session on this device. You can sign back in any time with Google.': 'סיום ההתחברות במכשיר זה. תוכלו להתחבר מחדש בכל עת באמצעות Google.',
        'Sign in to manage settings': 'התחברו כדי לנהל הגדרות',
        'Your account, language, and session options live here once you are signed in.': 'החשבון, השפה ואפשרויות ההתחברות יופיעו כאן לאחר הכניסה.',
        // Member home (FR-GLOWE-016)
        'Your GloWe': 'ה-GloWe שלכם',
        'Welcome back,': 'ברוכים השבים,',
        'What would you like to do today? Share knowledge, post an opportunity, or ask the community for support.': 'מה תרצו לעשות היום? לשתף ידע, לפרסם הזדמנות, או לבקש תמיכה מהקהילה.',
        'Share a post': 'שיתוף פוסט',
        'Post an opportunity': 'פרסום הזדמנות',
        'Ask for support': 'בקשת תמיכה',
        'Your activity': 'הפעילות שלכם',
        'What is happening on GloWe': 'מה קורה ב-GloWe',
        'See all': 'הצגת הכול',
        'Loading your GloWe home…': 'טוען את ה-GloWe שלכם…',
        'You have not shared anything yet': 'עדיין לא שיתפתם דבר',
        'Your posts, opportunities, and requests will gather here.': 'הפוסטים, ההזדמנויות והבקשות שלכם יופיעו כאן.',
        'Write your first post': 'כתבו את הפוסט הראשון שלכם',
        'The community is just getting started': 'הקהילה רק מתחילה',
        'Be the first to share a post or an opportunity others can join.': 'היו הראשונים לשתף פוסט או הזדמנות שאחרים יוכלו להצטרף אליהם.',
        'Start the conversation': 'פתחו את השיחה',
        'Community post': 'פוסט קהילתי',
        'Community Member': 'חבר/ת קהילה',
        // Home — hero + intro
        'A home for people building impact together': 'בית לאנשים שיוצרים השפעה ביחד',
        'You do not have to carry the work alone.': 'אתם לא צריכים לשאת את העבודה לבד.',
        'GloWe is a warm, professional community for people, organizations, initiatives, volunteers, and partners working around the SDGs. Here you can ask for support, offer what you know, share field wisdom, and meet people who walk beside you in the work.': 'GloWe היא קהילה חמה ומקצועית לאנשים, ארגונים, יוזמות, מתנדבים ושותפים שפועלים סביב יעדי הקיימות (SDGs). כאן אפשר לבקש תמיכה, להציע את הידע שלכם, לחלוק חוכמת שטח ולפגוש אנשים שצועדים לצידכם בעבודה.',
        'Find Your Place': 'מצאו את מקומכם',
        'Meet the Community': 'הכירו את הקהילה',
        'Ask for Support': 'בקשו תמיכה',
        'You have something to give, and something to receive.': 'יש לכם מה לתת, ויש לכם מה לקבל.',
        'You can ask': 'אפשר לבקש',
        'You can offer': 'אפשר להציע',
        'You can learn': 'אפשר ללמוד',
        'You can connect': 'אפשר להתחבר',
        'You can belong': 'אפשר להשתייך',
        // Home — community layers
        'Three communities, one living network': 'שלוש קהילות, רשת חיה אחת',
        'Enter the Community': 'כניסה לקהילה',
        'Local Community': 'קהילה מקומית',
        'People who know the place': 'אנשים שמכירים את המקום',
        'Share a local need': 'שיתוף צורך מקומי',
        'Expert Community': 'קהילת מומחים',
        'People who can strengthen the work': 'אנשים שיכולים לחזק את העבודה',
        'Offer your expertise': 'הציעו את המומחיות שלכם',
        'Global Community': 'קהילה גלובלית',
        'People who help knowledge travel': 'אנשים שעוזרים לידע לנדוד',
        'Join a discussion': 'הצטרפו לדיון',
        'Ask with honesty': 'לבקש בכנות',
        'Offer with care': 'להציע באכפתיות',
        'Build with solidarity': 'לבנות מתוך סולידריות',
        // Home — journey
        'Start where you are': 'התחילו מהמקום שבו אתם נמצאים',
        'Choose the doorway that feels right today': 'בחרו את הדלת שמרגישה נכונה היום',
        'Need support': 'זקוקים לתמיכה',
        'Share what would help': 'שתפו במה שיעזור',
        'Want to contribute': 'רוצים לתרום',
        'Offer your time or expertise': 'הציעו מהזמן או מהמומחיות שלכם',
        'Offer Help': 'הצעת עזרה',
        'Looking for people': 'מחפשים אנשים',
        'Step into the community': 'היכנסו לקהילה',
        'Enter Community': 'כניסה לקהילה',
        // Home — values + sections
        'What you can do in GloWe now': 'מה אפשר לעשות ב-GloWe עכשיו',
        'Create a profile': 'יצירת פרופיל',
        'Share with the community': 'שיתוף עם הקהילה',
        'Use the Wishing Well': 'שימוש בבאר המשאלות',
        'Find ways to help': 'מצאו דרכים לעזור',
        'Values that guide the space': 'הערכים שמנחים את המרחב',
        'Solidarity': 'סולידריות',
        'Shared Knowledge': 'ידע משותף',
        'Practical Action': 'פעולה מעשית',
        'Trust and Respect': 'אמון וכבוד',
        'The GloWe ecosystem': 'המערכת האקולוגית של GloWe',
        // Home — CTA + misc
        'A glimpse into the community': 'הצצה אל הקהילה',
        'Read Community Posts': 'קראו פוסטים מהקהילה',
        'Who is invited?': 'מי מוזמן?',
        'How GloWe is structured': 'איך GloWe בנויה',
        'User Roles': 'תפקידי משתמשים',
        'Business Model': 'מודל עסקי',
        'Development Roadmap': 'מפת דרכים לפיתוח',
        'Trusted by the GloWe Community': 'זוכה לאמון קהילת GloWe',
        'You have a place in this community.': 'יש לכם מקום בקהילה הזו.',
        'Bring what you know. Ask for what you need. Meet people who are working, learning, building, and caring around the SDGs.': 'הביאו את מה שאתם יודעים. בקשו את מה שאתם צריכים. פגשו אנשים שעובדים, לומדים, בונים ואכפת להם, סביב יעדי הקיימות.',
        'Read Community': 'קראו את הקהילה',
        'Open Community': 'פתחו את הקהילה',
        'Read What\'s Next': 'קראו מה הלאה',
        'See How This Could Grow': 'ראו איך זה יכול לצמוח',
        // ===== Inner pages (FR-GLOWE-005 phase 2) =====
        "Activity": "פעילות",
        "Add Project": "הוספת פרויקט",
        "Advocacy": "סנגור",
        "All areas": "כל התחומים",
        "All Fields": "כל התחומים",
        "All Groups": "כל הקבוצות",
        "All Locations": "כל המיקומים",
        "All regions": "כל האזורים",
        "All types": "כל הסוגים",
        "All Types": "כל הסוגים",
        "All wishes": "כל המשאלות",
        "Applications": "מועמדויות",
        "Apply for This Opportunity": "הגשת מועמדות להזדמנות",
        "Apply Now": "להגשת מועמדות",
        "Apply to opportunities or publish your own request for volunteers and collaborators.": "הגישו מועמדות להזדמנויות או פרסמו בקשה משלכם למתנדבים ולשותפים.",
        "Apply with your availability and relevant skills.": "הגישו מועמדות עם הזמינות והכישורים הרלוונטיים שלכם.",
        "Approve": "אישור",
        "Approve profiles that are ready, or send them back for changes.": "אשרו פרופילים שמוכנים, או החזירו אותם לתיקונים.",
        "Arabic": "ערבית",
        "Articles / media": "מאמרים / מדיה",
        "As a member of the GloWe community, you agree not to:": "כחברי קהילת GloWe, אתם מסכימים שלא:",
        "Ask a real question, lead a focused space, share a file, or learn from people working through similar challenges.": "שאלו שאלה אמיתית, הובילו מרחב ממוקד, שתפו קובץ או למדו מאנשים שמתמודדים עם אתגרים דומים.",
        "Ask question": "שאלת שאלה",
        "Ask, advise, lead": "לשאול, לייעץ, להוביל",
        "Attach file": "צירוף קובץ",
        "Back to Community": "חזרה לקהילה",
        "Back to Feed": "חזרה לפיד",
        "Back to Wishing Well": "חזרה לבאר המשאלות",
        "Backend not configured": "הממשק האחורי אינו מוגדר",
        "Based on GloWe content types": "מבוסס על סוגי התוכן של GloWe",
        "Better matching": "התאמה טובה יותר",
        "Both belong here. GloWe is built for mutual support, respectful collaboration, and the quiet relief of finding people who understand the journey.": "לשניהם יש מקום כאן. GloWe בנויה לתמיכה הדדית, לשיתוף פעולה מכבד ולהקלה השקטה שבמציאת אנשים שמבינים את הדרך.",
        "Browse opportunities, save what matters, contact members, and offer your professional skills, time, resources, or lived experience.": "עיינו בהזדמנויות, שמרו את מה שחשוב, צרו קשר עם חברים והציעו את הכישורים המקצועיים, הזמן, המשאבים או הניסיון האישי שלכם.",
        "Browse Organizations": "עיון בארגונים",
        "Build trust through profiles, community review, and clear next steps": "בניית אמון דרך פרופילים, בקרת קהילה וצעדים הבאים ברורים",
        "Business-Social Collaboration": "שיתוף פעולה עסקי-חברתי",
        "Businesses / CSR teams": "עסקים / צוותי CSR",
        "Businesses and partners": "עסקים ושותפים",
        "By using the platform, you agree that:": "בשימוש בפלטפורמה, אתם מסכימים כי:",
        "Cancel": "ביטול",
        "Change": "שינוי",
        "Choose the right topic, add useful context, and publish it into the community feed.": "בחרו את הנושא הנכון, הוסיפו הקשר מועיל ופרסמו את זה בפיד הקהילה.",
        "Civic Innovation": "חדשנות אזרחית",
        "Cleanup days worth repeating": "ימי ניקיון ששווה לחזור עליהם",
        "Clear": "ניקוי",
        "Clear filters": "ניקוי מסננים",
        "Climate": "אקלים",
        "Close": "סגירה",
        "Comment": "תגובה",
        "Commitment:": "מחויבות:",
        "Community Activity": "פעילות הקהילה",
        "Community Building": "בניית קהילה",
        "Community feed": "פיד הקהילה",
        "Community Feed": "פיד הקהילה",
        "Community feed filters": "מסנני פיד הקהילה",
        "Community first, technology second.": "קהילה קודם, טכנולוגיה אחר כך.",
        "Community Forums": "פורומים קהילתיים",
        "Community home": "בית הקהילה",
        "Community integrity": "יושרה קהילתית",
        "Community interactions": "אינטראקציות קהילתיות",
        "Community managers": "מנהלי קהילה",
        "Community reinvestment": "השקעה חוזרת בקהילה",
        "Community reports": "דיווחי קהילה",
        "Community reports will appear here.": "דיווחי הקהילה יופיעו כאן.",
        "Community review": "בקרת קהילה",
        "Community support board": "לוח התמיכה הקהילתי",
        "Community wishes": "משאלות הקהילה",
        "Connect with social and environmental work through responsible collaboration, CSR, ESG, and shared value.": "התחברו לעבודה חברתית וסביבתית דרך שיתוף פעולה אחראי, CSR, ESG וערך משותף.",
        "Connection suggestions": "הצעות לחיבור",
        "connections": "חיבורים",
        "Consultation request": "בקשת ייעוץ",
        "Contact": "יצירת קשר",
        "Content": "תוכן",
        "Context": "הקשר",
        "Could not load queue": "טעינת התור נכשלה",
        "Create a password": "יצירת סיסמה",
        "Create a password (min 8 characters)": "יצירת סיסמה (לפחות 8 תווים)",
        "Create Account": "יצירת חשבון",
        "Create Your Profile": "יצירת הפרופיל שלכם",
        "Daily workspace": "מרחב עבודה יומי",
        "Describe your relevant skills and experience...": "תארו את הכישורים והניסיון הרלוונטיים שלכם...",
        "Direct conversations with volunteers, organizations, and partners live here once you are signed in.": "שיחות ישירות עם מתנדבים, ארגונים ושותפים יופיעו כאן לאחר הכניסה.",
        "Direct conversations with volunteers, organizations, and partners.": "שיחות ישירות עם מתנדבים, ארגונים ושותפים.",
        "Direct messaging is coming soon": "הודעות ישירות יגיעו בקרוב",
        "Discover organizations, initiatives, and partners sharing field knowledge and practical needs.": "גלו ארגונים, יוזמות ושותפים שחולקים ידע מהשטח וצרכים מעשיים.",
        "Discover People": "גלו אנשים",
        "Discussion group": "קבוצת דיון",
        "Discussion Groups": "קבוצות דיון",
        "Dismiss": "סגירה",
        "Distribution": "הפצה",
        "Diverse people speaking around a round table at an impact community conference": "אנשים מגוונים משוחחים סביב שולחן עגול בכנס קהילת השפעה",
        "Document what happened after someone helped: what changed, what was learned, and what support is still needed.": "תעדו מה קרה אחרי שמישהו עזר: מה השתנה, מה נלמד ואיזו תמיכה עדיין נדרשת.",
        "Duration": "משך",
        "Duration:": "משך:",
        "Each community starts from its own reality: language, culture, needs, skills, and local leadership.": "כל קהילה מתחילה מהמציאות שלה: שפה, תרבות, צרכים, כישורים ומנהיגות מקומית.",
        "Each part of the system is here to help impact work become more visible, connected, and supported.": "כל חלק במערכת נועד לעזור לעבודת ההשפעה להיות נראית, מחוברת ונתמכת יותר.",
        "Edit profile": "עריכת פרופיל",
        "Edit Profile": "עריכת פרופיל",
        "Edit your profile, add projects, track opportunities, and manage your community activity in one place.": "ערכו את הפרופיל שלכם, הוסיפו פרויקטים, עקבו אחר הזדמנויות ונהלו את פעילות הקהילה שלכם במקום אחד.",
        "Education": "חינוך",
        "Education, Climate, Health, Funding": "חינוך, אקלים, בריאות, מימון",
        "Education, climate, mentors, Jerusalem...": "חינוך, אקלים, מנטורים, ירושלים...",
        "Effective Date: May 30, 2026": "תאריך תחולה: 30 במאי 2026",
        "Environment": "סביבה",
        "Equipment / Space": "ציוד / מרחב",
        "Evenings": "ערבים",
        "Events": "אירועים",
        "Every connection can end with a short outcome update.": "כל חיבור יכול להסתיים בעדכון תוצאה קצר.",
        "Everyone": "כולם",
        "Example: Grant proposal checklist for small NGOs": "לדוגמה: רשימת תיוג להגשת מענק לעמותות קטנות",
        "Explore Community": "גלו את הקהילה",
        "Explore possible collaborations": "גלו שיתופי פעולה אפשריים",
        "Explore possible connections between needs, skills, organizations, and people. Each suggestion is an invitation to read, ask, and decide together.": "גלו חיבורים אפשריים בין צרכים, כישורים, ארגונים ואנשים. כל הצעה היא הזמנה לקרוא, לשאול ולהחליט יחד.",
        "Fetching organizations awaiting verification.": "טוען ארגונים הממתינים לאימות.",
        "Field knowledge becomes easier to find, translate, discuss, and reuse across communities.": "ידע מהשטח נעשה קל יותר למצוא, לתרגם, לדון ולשימוש חוזר בין קהילות.",
        "Field stories, questions, support offers, updates, and open calls": "סיפורים מהשטח, שאלות, הצעות תמיכה, עדכונים וקריאות פתוחות",
        "Field update": "עדכון מהשטח",
        "Field wisdom, professional tools, lived experience, and multilingual learning all have value here.": "חוכמת שטח, כלים מקצועיים, ניסיון אישי ולמידה רב-לשונית — לכל אלה יש ערך כאן.",
        "Field:": "תחום:",
        "Filter by region, profile type, or keywords connected to mission, field, needs, and projects.": "סננו לפי אזור, סוג פרופיל או מילות מפתח הקשורות למשימה, לתחום, לצרכים ולפרויקטים.",
        "Find a Group": "מצאו קבוצה",
        "Find My Path": "מצאו את הדרך שלי",
        "Find or publish practical volunteer, work, and collaboration opportunities for social impact projects.": "מצאו או פרסמו הזדמנויות מעשיות להתנדבות, לעבודה ולשיתוף פעולה בפרויקטים של השפעה חברתית.",
        "Find people who understand your cause, help shape your next step, and make your work visible.": "מצאו אנשים שמבינים את המטרה שלכם, עוזרים לעצב את הצעד הבא ועושים את העבודה שלכם נראית.",
        "Find projects, organizations, volunteers, experts, and practical needs": "מצאו פרויקטים, ארגונים, מתנדבים, מומחים וצרכים מעשיים",
        "Find the right people": "מצאו את האנשים הנכונים",
        "Find the right request": "מצאו את הבקשה הנכונה",
        "Find where your skills can help.": "מצאו היכן הכישורים שלכם יכולים לעזור.",
        "Flexible": "גמיש",
        "Follow the work, ask, offer, and connect.": "עקבו אחר העבודה, שאלו, הציעו והתחברו.",
        "Follow updates": "עקבו אחר עדכונים",
        "Follow Updates": "עקבו אחר עדכונים",
        "Food Security": "ביטחון תזונתי",
        "For questions, support, or concerns, please reach out:": "לשאלות, תמיכה או פניות, אתם מוזמנים לפנות:",
        "For you": "עבורכם",
        "Forum Leaders": "מובילי פורום",
        "Forum leadership offer": "הצעה להובלת פורום",
        "Full Name": "שם מלא",
        "Full-time": "משרה מלאה",
        "Funding preparation": "הכנה לגיוס מימון",
        "Funding Support": "תמיכה במימון",
        "Global": "גלובלי",
        "GloWe - Global Collaboration for Social Impact": "GloWe - שיתוף פעולה גלובלי למען השפעה חברתית",
        "GloWe begins as a simple MVP: profiles, posts, wishes, opportunities, and conversations. From here, we want to grow carefully, with local communities, field knowledge, and technology that serves people.": "GloWe מתחילה כגרסת MVP פשוטה: פרופילים, פוסטים, משאלות, הזדמנויות ושיחות. מכאן נרצה לצמוח בזהירות, יחד עם קהילות מקומיות, ידע מהשטח וטכנולוגיה שמשרתת אנשים.",
        "GloWe community promise": "ההבטחה של קהילת GloWe",
        "GloWe community value system": "מערכת הערכים של קהילת GloWe",
        "GloWe does not guarantee uninterrupted access or availability.": "GloWe אינה מתחייבת לגישה או לזמינות רציפות.",
        "GloWe is built for people who meet, listen, offer, ask, and turn local experience into practical collaboration.": "GloWe בנויה לאנשים שנפגשים, מקשיבים, מציעים, שואלים והופכים ניסיון מקומי לשיתוף פעולה מעשי.",
        "GloWe is not liable for losses resulting from interruptions, errors, or misuse of the platform.": "GloWe אינה אחראית לנזקים הנובעים מהפרעות, משגיאות או משימוש לרעה בפלטפורמה.",
        "GloWe is open to all people and organizations, regardless of age, geography, identity, or legal status.": "GloWe פתוחה לכל האנשים והארגונים, ללא קשר לגיל, למיקום גאוגרפי, לזהות או למעמד משפטי.",
        "GloWe may include links to external platforms or tools. We are not responsible for the content, privacy, or reliability of third-party services. Use them at your discretion.": "GloWe עשויה לכלול קישורים לפלטפורמות או לכלים חיצוניים. איננו אחראים לתוכן, לפרטיות או לאמינות של שירותי צד שלישי. השתמשו בהם על פי שיקול דעתכם.",
        "GloWe may suspend or terminate accounts that violate these Terms or the Community Integrity Charter.": "GloWe רשאית להשעות או לסגור חשבונות המפרים את התנאים האלה או את אמנת היושרה הקהילתית.",
        "GloWe Member": "חבר/ת GloWe",
        "GloWe reserves the right to:": "GloWe שומרת לעצמה את הזכות:",
        "GloWe respects your privacy. Personal data will only be used to improve your experience and build relevant connections.": "GloWe מכבדת את פרטיותכם. בנתונים אישיים ייעשה שימוש רק כדי לשפר את החוויה שלכם וליצור חיבורים רלוונטיים.",
        "GloWe will not sell or license your content to external commercial entities without explicit consent.": "GloWe לא תמכור או תעניק רישיון לתוכן שלכם לגופים מסחריים חיצוניים ללא הסכמה מפורשת.",
        "GloWe works through local roots, professional support, and global exchange.": "GloWe פועלת דרך שורשים מקומיים, תמיכה מקצועית וחילופי ידע גלובליים.",
        "Good intentions become stronger when they are connected to clear needs, real people, and concrete next steps.": "כוונות טובות מתחזקות כשהן מחוברות לצרכים ברורים, לאנשים אמיתיים ולצעדים הבאים מוחשיים.",
        "Grant match": "התאמת מענק",
        "Grey knowledge library": "ספריית ידע אפור",
        "Group Actions": "פעולות קבוצה",
        "Groups": "קבוצות",
        "Groups that want to document their work, find collaborators, and ask for concrete support.": "קבוצות שרוצות לתעד את עבודתן, למצוא שותפים ולבקש תמיכה מוחשית.",
        "Haifa": "חיפה",
        "Health": "בריאות",
        "Healthy moderation rules": "כללי ניהול בריאים",
        "Help communities turn field experience into practical guides, short case studies, templates, and translated resources.": "עזרו לקהילות להפוך ניסיון מהשטח למדריכים מעשיים, מקרי בוחן קצרים, תבניות ומשאבים מתורגמים.",
        "Help shape what comes next.": "עזרו לעצב את מה שיבוא.",
        "Helpers explain what they can provide, availability, and conditions.": "העוזרים מסבירים מה הם יכולים לספק, מהי הזמינות שלהם ומהם התנאים.",
        "Hidden content": "תוכן מוסתר",
        "Hidden items": "פריטים מוסתרים",
        "Hide Item": "הסתרת פריט",
        "Hide Profile": "הסתרת פרופיל",
        "How success is understood": "איך מבינים הצלחה",
        "How the post will feel in the feed": "איך הפוסט ירגיש בפיד",
        "I am a": "אני",
        "I Can Help": "אני יכול/ה לעזור",
        "If you are under the legal age of majority in your country, you are using GloWe under the guidance of a mentor, parent, or educational framework.": "אם טרם הגעתם לגיל הבגרות החוקי במדינתכם, השימוש שלכם ב-GloWe נעשה בליווי מנטור, הורה או מסגרת חינוכית.",
        "If you witness misconduct, misinformation, or harm, report it. Use the Report button on profiles or reach out to us directly. All reports are reviewed with care and confidentiality.": "אם אתם נתקלים בהתנהגות פסולה, במידע מטעה או בפגיעה, דווחו על כך. השתמשו בכפתור הדיווח בפרופילים או פנו אלינו ישירות. כל הדיווחים נבדקים בקפידה ובסודיות.",
        "Impact approach": "גישת ההשפעה",
        "Impact area": "תחום השפעה",
        "Impact areas": "תחומי השפעה",
        "Impact Areas": "תחומי השפעה",
        "Impact field": "תחום השפעה",
        "Impact follow-up": "מעקב השפעה",
        "Impact Signals": "אותות השפעה",
        "Impact so far": "השפעה עד כה",
        "Impact stories": "סיפורי השפעה",
        "In cases of legal violations, authorities may be notified.": "במקרים של הפרות חוק, ניתן ליידע את הרשויות.",
        "Interaction": "אינטראקציה",
        "Israel": "ישראל",
        "Items hidden by admin review can be restored while this MVP uses local storage.": "פריטים שהוסתרו בבקרת מנהל ניתנים לשחזור כל עוד גרסת ה-MVP הזו משתמשת באחסון מקומי.",
        "Items removed by admin will be listed here.": "פריטים שהוסרו על ידי מנהל יופיעו כאן.",
        "Jerusalem": "ירושלים",
        "Join Group": "הצטרפות לקבוצה",
        "Join requests": "בקשות הצטרפות",
        "Join the MVP": "הצטרפו ל-MVP",
        "Join the Volunteer Network and find places where your skills, experience, language, or care can make someone else's work lighter.": "הצטרפו לרשת המתנדבים ומצאו מקומות שבהם הכישורים, הניסיון, השפה או האכפתיות שלכם יכולים להקל על עבודתו של מישהו אחר.",
        "Join with experience, questions, resources, or a willingness to help.": "הצטרפו עם ניסיון, שאלות, משאבים או נכונות לעזור.",
        "Keep the community safe and trustworthy.": "שמרו על הקהילה בטוחה ואמינה.",
        "Knowledge": "ידע",
        "Knowledge Seekers": "מחפשי ידע",
        "Knowledge Sharing": "שיתוף ידע",
        "Languages": "שפות",
        "Learn More": "מידע נוסף",
        "Like": "לייק",
        "Limit access or features in cases of harm, spam, or manipulation.": "להגביל גישה או תכונות במקרים של פגיעה, ספאם או מניפולציה.",
        "Live needs": "צרכים פעילים",
        "Loading...": "טוען...",
        "Loading…": "טוען…",
        "Local community circles": "מעגלי קהילה מקומיים",
        "Local organizations, initiatives, residents, volunteers, and partners bring the real context: what is needed, what already works, who should be involved, and what kind of support would actually help.": "ארגונים מקומיים, יוזמות, תושבים, מתנדבים ושותפים מביאים את ההקשר האמיתי: מה נדרש, מה כבר עובד, מי צריך להיות מעורב ואיזו תמיכה באמת תעזור.",
        "Local roots": "שורשים מקומיים",
        "Location": "מיקום",
        "Location:": "מיקום:",
        "Looking for Mentors": "מחפשים מנטורים",
        "Low-bandwidth friendly": "ידידותי לרוחב פס נמוך",
        "Make it easier to connect a need with the right volunteer, professional skill, organization, donor, or partner.": "להקל על חיבור צורך עם המתנדב, הכישור המקצועי, הארגון, התורם או השותף הנכונים.",
        "Mark Reviewed": "סימון כנבדק",
        "Measurement and learning": "מדידה ולמידה",
        "Members": "חברים",
        "Message": "הודעה",
        "Message author": "שליחת הודעה למחבר/ת",
        "Message publisher": "שליחת הודעה למפרסם/ת",
        "Messages": "הודעות",
        "Methods / approaches": "שיטות / גישות",
        "Moderate discussions in order to keep the space constructive, safe, and impact-driven.": "נהלו דיונים כדי לשמור על מרחב בונה, בטוח ומונע השפעה.",
        "Multilingual": "רב-לשוני",
        "Needs": "צרכים",
        "Needs Changes": "דרושים שינויים",
        "New post": "פוסט חדש",
        "New submitted profiles will appear here for review.": "פרופילים חדשים שנשלחו יופיעו כאן לבדיקה.",
        "No applications yet": "אין עדיין מועמדויות",
        "No community posts yet.": "אין עדיין פוסטים בקהילה.",
        "No hidden items": "אין פריטים מוסתרים",
        "No matching opportunities yet. This is where open roles and collaboration requests will appear.": "אין עדיין הזדמנויות מתאימות. כאן יופיעו תפקידים פתוחים ובקשות לשיתוף פעולה.",
        "No matching profiles yet": "אין עדיין פרופילים מתאימים",
        "No opportunities found": "לא נמצאו הזדמנויות",
        "No pending organizations": "אין ארגונים ממתינים",
        "No pending profiles": "אין פרופילים ממתינים",
        "No posts match this view yet": "אין עדיין פוסטים שמתאימים לתצוגה הזו",
        "No projects listed yet.": "אין עדיין פרויקטים רשומים.",
        "No reports yet": "אין עדיין דיווחים",
        "No results": "אין תוצאות",
        "No saved items yet": "אין עדיין פריטים שמורים",
        "No wishes found": "לא נמצאו משאלות",
        "Notification Preferences": "העדפות התראות",
        "Offer skills, time, translation, mentoring, design, legal help, tech, research, or field knowledge.": "הציעו כישורים, זמן, תרגום, חונכות, עיצוב, סיוע משפטי, טכנולוגיה, מחקר או ידע מהשטח.",
        "Offer Support": "הציעו תמיכה",
        "Open": "פתוח",
        "Open a Question": "פתיחת שאלה",
        "Open Call": "קריאה פתוחה",
        "Open Forums": "פתחו את הפורומים",
        "Open Needs": "צרכים פתוחים",
        "Open Playbook": "פתחו את המדריך",
        "Open reports": "דיווחים פתוחים",
        "Open Volunteer Network": "פתחו את רשת המתנדבים",
        "Open wish details": "פתחו את פרטי המשאלה",
        "Open wishes": "משאלות פתוחות",
        "open wishes are waiting for the right support.": "משאלות פתוחות מחכות לתמיכה הנכונה.",
        "Open wishes, opportunities, posts, and discussions around real work": "משאלות, הזדמנויות, פוסטים ודיונים פתוחים סביב עבודה אמיתית",
        "Opportunities & Applications": "הזדמנויות ומועמדויות",
        "Opportunities & collaboration": "הזדמנויות ושיתופי פעולה",
        "Opportunity title": "כותרת ההזדמנות",
        "Opportunity type": "סוג ההזדמנות",
        "Optional link": "קישור (לא חובה)",
        "Organization filters": "מסנני ארגונים",
        "Organization or project": "ארגון או פרויקט",
        "Organization Representative": "נציג/ת ארגון",
        "Organization review is available once the shared backend is connected.": "בדיקת ארגונים תהיה זמינה לאחר חיבור הממשק האחורי המשותף.",
        "Organizations & Companies": "ארגונים וחברות",
        "Organizations and NGOs": "ארגונים ועמותות",
        "Organizations and partners are reviewed before sensitive actions.": "ארגונים ושותפים נבדקים לפני פעולות רגישות.",
        "Organizations awaiting verification. Approve serious requests; rejected ones stay view-only.": "ארגונים הממתינים לאימות. אשרו בקשות רציניות; בקשות שנדחו נשארות לצפייה בלבד.",
        "Organize possible grants and next steps": "ארגנו מענקים אפשריים וצעדים הבאים",
        "Overview": "סקירה",
        "Paid Full-time Role": "תפקיד בתשלום במשרה מלאה",
        "Part-time": "משרה חלקית",
        "Part-time Role": "תפקיד במשרה חלקית",
        "Participation signals": "אותות השתתפות",
        "Partnership Opportunity": "הזדמנות לשותפות",
        "Password": "סיסמה",
        "Pending organizations": "ארגונים ממתינים",
        "Pending profiles": "פרופילים ממתינים",
        "Pending verification": "ממתין לאימות",
        "People already acting in their communities and looking for allies, knowledge, or visibility.": "אנשים שכבר פועלים בקהילות שלהם ומחפשים בני ברית, ידע או נראות.",
        "People looking for practical examples, field lessons, and ways to learn from what already works.": "אנשים שמחפשים דוגמאות מעשיות, לקחים מהשטח ודרכים ללמוד ממה שכבר עובד.",
        "People who can offer time, translation, design, research, facilitation, mentoring, or professional skills.": "אנשים שיכולים להציע זמן, תרגום, עיצוב, מחקר, הנחיה, חונכות או כישורים מקצועיים.",
        "Please refresh and try again.": "רעננו ונסו שוב.",
        "Possible next steps": "צעדים הבאים אפשריים",
        "Post": "פרסום",
        "Post a clear need in the Wishing Well: volunteers, partners, knowledge, visibility, tools, space, or practical advice.": "פרסמו צורך ברור בבאר המשאלות: מתנדבים, שותפים, ידע, נראות, כלים, מרחב או עצה מעשית.",
        "Post a Need": "פרסום צורך",
        "Post a need. Find a helper. Build impact.": "פרסמו צורך. מצאו עוזר. בנו השפעה.",
        "Post false, misleading, discriminatory, hateful, or violent content.": "לפרסם תוכן שקרי, מטעה, מפלה, שטנתי או אלים.",
        "Post need": "פרסום צורך",
        "Post Opportunity": "פרסום הזדמנות",
        "Post title": "כותרת הפוסט",
        "Post Topics": "נושאי הפוסט",
        "Post type": "סוג הפוסט",
        "posts": "פוסטים",
        "Posts": "פוסטים",
        "Posts you write in the community will appear here.": "פוסטים שתכתבו בקהילה יופיעו כאן.",
        "Posts, profiles, wishes, and opportunities you want to return to later.": "פוסטים, פרופילים, משאלות והזדמנויות שתרצו לחזור אליהם מאוחר יותר.",
        "Practical guides and field lessons": "מדריכים מעשיים ולקחים מהשטח",
        "Prepare a clearer post or campaign draft": "הכינו טיוטת פוסט או קמפיין ברורה יותר",
        "Present your mission, projects, fields of action, SDGs, needs, and the kind of collaborations you are open to.": "הציגו את המשימה, הפרויקטים, תחומי הפעולה, יעדי הקיימות (SDGs), הצרכים וסוגי שיתופי הפעולה שאתם פתוחים אליהם.",
        "Pretend to be someone else.": "להתחזות לאדם אחר.",
        "Preview": "תצוגה מקדימה",
        "Private conversations between volunteers, organizations, and partners are on the way. In the meantime, you can reach an organization from its profile.": "שיחות פרטיות בין מתנדבים, ארגונים ושותפים בדרך. בינתיים, אפשר לפנות לארגון דרך הפרופיל שלו.",
        "Professionals, mentors, facilitators, service providers, and experienced practitioners can offer advice, services, office hours, forum leadership, tools, and practical guidance.": "אנשי מקצוע, מנטורים, מנחים, נותני שירות ובעלי ניסיון יכולים להציע ייעוץ, שירותים, שעות קבלה, הובלת פורומים, כלים והכוונה מעשית.",
        "Profile actions": "פעולות פרופיל",
        "Profile From Questionnaire": "פרופיל מתוך שאלון",
        "Profile not found": "הפרופיל לא נמצא",
        "Profile snapshot": "תמונת מצב של הפרופיל",
        "Profiles": "פרופילים",
        "Profiles, posts, messages, and collaborations should support dignity, transparency, and responsible community care.": "פרופילים, פוסטים, הודעות ושיתופי פעולה צריכים לתמוך בכבוד, בשקיפות ובאכפתיות קהילתית אחראית.",
        "Project-based": "מבוסס פרויקט",
        "Project-based Collaboration": "שיתוף פעולה מבוסס פרויקט",
        "Projects": "פרויקטים",
        "Public links": "קישורים ציבוריים",
        "Publish a volunteer role": "פרסמו תפקיד התנדבות",
        "Publish an opportunity": "פרסמו הזדמנות",
        "Publish Opportunity": "פרסום הזדמנות",
        "Publish Thread": "פרסום שרשור",
        "Publish to Community Feed": "פרסום לפיד הקהילה",
        "Publish to Feed": "פרסום לפיד",
        "Publish to Forum": "פרסום לפורום",
        "Question": "שאלה",
        "Question title": "כותרת השאלה",
        "Questions": "שאלות",
        "Ramat Gan, Israel": "רמת גן, ישראל",
        "Read posts, ask questions, respond with care, and meet others who are also building social and environmental change.": "קראו פוסטים, שאלו שאלות, הגיבו באכפתיות ופגשו אנשים אחרים שגם בונים שינוי חברתי וסביבתי.",
        "Ready to Make an Impact?": "מוכנים ליצור השפעה?",
        "Ready to offer your time, skills, mentoring, translation, design, legal help, or field knowledge? Enter the volunteer space and find the right role.": "מוכנים להציע מהזמן, מהכישורים, מהחונכות, מהתרגום, מהעיצוב, מהסיוע המשפטי או מהידע שלכם מהשטח? היכנסו למרחב המתנדבים ומצאו את התפקיד הנכון.",
        "Recent Activity": "פעילות אחרונה",
        "Recognition in GloWe is about visible contribution, not empty ranking. Signals stay tied to documented activity, trust, and community review.": "ההכרה ב-GloWe עוסקת בתרומה נראית, לא בדירוג ריק. האותות נשארים קשורים לפעילות מתועדת, לאמון ולבקרת קהילה.",
        "Recognize visible contribution": "הכירו בתרומה נראית",
        "Refine": "חידוד",
        "Region": "אזור",
        "Registration, article, drive folder, or resource link": "הרשמה, מאמר, תיקיית דרייב או קישור למשאב",
        "Reject": "דחייה",
        "Relevant Skills & Experience": "כישורים וניסיון רלוונטיים",
        "Remote": "מרחוק",
        "Remote tutors and safety": "מורים פרטיים מרחוק ובטיחות",
        "Remove": "הסרה",
        "Remove content that violates these terms or values.": "להסיר תוכן שמפר את התנאים או הערכים האלה.",
        "Reply": "תגובה",
        "Report": "דיווח",
        "Reports from users who saw something inaccurate, harmful, or inappropriate.": "דיווחים ממשתמשים שראו משהו לא מדויק, מזיק או לא הולם.",
        "Repost": "שיתוף מחדש",
        "Requirements": "דרישות",
        "Resource / file": "משאב / קובץ",
        "Resource Request": "בקשת משאב",
        "Responsibilities": "תחומי אחריות",
        "Responsible tools": "כלים אחראיים",
        "Restore": "שחזור",
        "Review Impact": "בדיקת השפעה",
        "Review new profile submissions, respond to reports, and hide content that does not fit the GloWe community standards.": "בדקו הגשות פרופיל חדשות, הגיבו לדיווחים והסתירו תוכן שאינו תואם את אמות המידה של קהילת GloWe.",
        "Reviewers only": "לבודקים בלבד",
        "Round tables, shared knowledge.": "שולחנות עגולים, ידע משותף.",
        "Save": "שמירה",
        "Save Draft": "שמירת טיוטה",
        "Save opportunity": "שמירת הזדמנות",
        "Save Opportunity": "שמירת הזדמנות",
        "Delete post": "מחיקת פוסט",
        "Post deleted": "הפוסט נמחק",
        "Your post was removed from the community feed.": "הפוסט שלכם הוסר מפיד הקהילה.",
        "Could not delete": "לא ניתן למחוק",
        "Something went wrong deleting your post. Please try again.": "משהו השתבש במחיקת הפוסט. נסו שוב.",
        "Copy link": "העתקת קישור",
        "Link copied": "הקישור הועתק",
        "The post link is on your clipboard — share it anywhere.": "קישור הפוסט נמצא בלוח שלכם — שתפו אותו בכל מקום.",
        "Copy this link": "העתיקו את הקישור",
        "Save post": "שמירת פוסט",
        "Save posts, profiles, and opportunities to return to them from this screen.": "שמרו פוסטים, פרופילים והזדמנויות כדי לחזור אליהם מהמסך הזה.",
        "Save posts, profiles, wishes, and opportunities to return to them from here.": "שמרו פוסטים, פרופילים, משאלות והזדמנויות כדי לחזור אליהם מכאן.",
        "Save profile": "שמירת פרופיל",
        "Save Profile": "שמירת פרופיל",
        "Save the opportunity if you want to compare it later.": "שמרו את ההזדמנות אם תרצו להשוות אותה מאוחר יותר.",
        "Save wish": "שמירת משאלה",
        "Saved": "נשמר",
        "Saved items": "פריטים שמורים",
        "Saved Items": "פריטים שמורים",
        "Scope": "היקף",
        "SDG focus areas": "תחומי מיקוד של יעדי הקיימות",
        "Search": "חיפוש",
        "Search by city or region": "חיפוש לפי עיר או אזור",
        "Search keywords": "חיפוש מילות מפתח",
        "Search opportunities...": "חיפוש הזדמנויות...",
        "Search organizations, companies, and initiatives": "חיפוש ארגונים, חברות ויוזמות",
        "Search posts, topics, people, or needs...": "חיפוש פוסטים, נושאים, אנשים או צרכים...",
        "Search volunteer roles...": "חיפוש תפקידי התנדבות...",
        "See how members participate": "ראו איך חברים משתתפים",
        "See where help is needed": "ראו היכן נדרשת עזרה",
        "Select your availability": "בחרו את הזמינות שלכם",
        "Select your role": "בחרו את התפקיד שלכם",
        "Send": "שליחה",
        "Share": "שיתוף",
        "Share a volunteer role, paid role, mentorship request, or project-based collaboration with the GloWe community.": "שתפו תפקיד התנדבות, תפקיד בתשלום, בקשת חונכות או שיתוף פעולה מבוסס פרויקט עם קהילת GloWe.",
        "Share applied field knowledge in a format others can understand and use": "שתפו ידע יישומי מהשטח בפורמט שאחרים יכולים להבין ולהשתמש בו",
        "Share enough context so others can give useful, respectful advice.": "שתפו מספיק הקשר כדי שאחרים יוכלו לתת עצה מועילה ומכבדת.",
        "Share private or sensitive information without consent.": "לשתף מידע פרטי או רגיש ללא הסכמה.",
        "Share your motivation for applying...": "שתפו את המוטיבציה שלכם להגשת המועמדות...",
        "Shared knowledge": "ידע משותף",
        "Shared learning": "למידה משותפת",
        "Sharing tools": "כלי שיתוף",
        "Short description": "תיאור קצר",
        "Show your mission, projects, needs, opportunities, and the impact areas you work in.": "הציגו את המשימה, הפרויקטים, הצרכים, ההזדמנויות ותחומי ההשפעה שבהם אתם פועלים.",
        "Sign in to see your messages": "התחברו כדי לראות את ההודעות שלכם",
        "Skills Needed": "כישורים נדרשים",
        "Skills or tags": "כישורים או תגיות",
        "Social Activists": "פעילים חברתיים",
        "Social initiatives": "יוזמות חברתיות",
        "Social Justice": "צדק חברתי",
        "Social links": "קישורים חברתיים",
        "Sometimes you give. Sometimes you need help.": "לפעמים נותנים. לפעמים זקוקים לעזרה.",
        "Spam the platform or use it for purely promotional or exploitative purposes.": "להציף את הפלטפורמה בספאם או להשתמש בה למטרות פרסומיות או נצלניות בלבד.",
        "Start a practical consultation": "התחילו ייעוץ מעשי",
        "Start a thread": "פתיחת שרשור",
        "Start Conversation": "התחלת שיחה",
        "Start from one useful action": "התחילו מפעולה מועילה אחת",
        "Start with one useful post, one profile, one wish, or one opportunity.": "התחילו מפוסט מועיל אחד, פרופיל אחד, משאלה אחת או הזדמנות אחת.",
        "Structured offers": "הצעות מסודרות",
        "Submit Application": "שליחת מועמדות",
        "Support groups around a city, village, school, organization, or SDG topic. Each circle can gather needs, resources, events, and trusted members.": "קבוצות תמיכה סביב עיר, כפר, בית ספר, ארגון או נושא של יעדי הקיימות. כל מעגל יכול לאסוף צרכים, משאבים, אירועים וחברים מהימנים.",
        "Support multilingual access so knowledge is not limited to English-speaking spaces": "תמכו בגישה רב-לשונית כדי שהידע לא יוגבל למרחבים דוברי אנגלית",
        "Suspend or block users who repeatedly abuse the platform.": "להשעות או לחסום משתמשים שמנצלים לרעה את הפלטפורמה שוב ושוב.",
        "Tags": "תגיות",
        "Tech for Good": "טכנולוגיה למען הטוב",
        "Technology": "טכנולוגיה",
        "Technology for good": "טכנולוגיה למען הטוב",
        "Technology should reduce friction, not create distance. It should help people act with more clarity, trust, and care.": "טכנולוגיה צריכה להפחית חיכוך, לא ליצור מרחק. היא צריכה לעזור לאנשים לפעול מתוך יותר בהירות, אמון ואכפתיות.",
        "Tel Aviv": "תל אביב",
        "Terms of Use - GloWe": "תנאי שימוש - GloWe",
        "Terms of Use & Community Integrity Charter": "תנאי שימוש ואמנת יושרה קהילתית",
        "The information you provide is accurate and honest.": "המידע שאתם מספקים מדויק וכן.",
        "The MVP is here so we can learn with you: what helps, what is missing, and what should be built with care.": "ה-MVP כאן כדי שנוכל ללמוד יחד אתכם: מה עוזר, מה חסר ומה כדאי לבנות בזהירות.",
        "The next versions of GloWe should support local circles: people who meet around a real place, a real need, and a shared SDG challenge. Each local community can gather stories, tools, resources, and lessons that others may adapt.": "הגרסאות הבאות של GloWe יתמכו במעגלים מקומיים: אנשים שנפגשים סביב מקום אמיתי, צורך אמיתי ואתגר משותף מיעדי הקיימות. כל קהילה מקומית יכולה לאסוף סיפורים, כלים, משאבים ולקחים שאחרים יוכלו להתאים לעצמם.",
        "The organization receives your message and can continue in GloWe messages.": "הארגון מקבל את ההודעה שלכם ויכול להמשיך בהודעות GloWe.",
        "The topic tag will appear next to your name in the feed, and the post is saved into the community stream.": "תגית הנושא תופיע לצד שמכם בפיד, והפוסט יישמר בזרם הקהילה.",
        "The Wishing Well is the action layer of GloWe: verified requests, relevant helpers, and clear next steps after someone offers support.": "באר המשאלות היא שכבת הפעולה של GloWe: בקשות מאומתות, עוזרים רלוונטיים וצעדים הבאים ברורים אחרי שמישהו מציע תמיכה.",
        "These are directions, not promises. We will build them gradually, with community feedback.": "אלה כיוונים, לא הבטחות. נבנה אותם בהדרגה, יחד עם משוב מהקהילה.",
        "These Terms of Use & Community Integrity Charter may be updated occasionally. We will notify users of significant changes via email or platform notifications. Continued use signifies your agreement to the latest version.": "תנאי השימוש ואמנת היושרה הקהילתית האלה עשויים להתעדכן מדי פעם. נודיע למשתמשים על שינויים משמעותיים בדוא\"ל או בהתראות בפלטפורמה. המשך השימוש מהווה הסכמה לגרסה העדכנית ביותר.",
        "This includes use in personalization, recommendation systems, and platform features built to enhance the GloWe user experience only.": "זה כולל שימוש בהתאמה אישית, במערכות המלצה ובתכונות פלטפורמה שנבנו אך ורק כדי לשפר את חוויית המשתמש ב-GloWe.",
        "This is not a marketplace. It is a shared space. Ask for help. Offer help. Celebrate others' work. Seek connection, not extraction.": "זה לא שוק. זה מרחב משותף. בקשו עזרה. הציעו עזרה. חגגו את עבודתם של אחרים. חפשו חיבור, לא ניצול.",
        "This profile is not available yet, or the link points to an older demo profile.": "הפרופיל הזה עדיין לא זמין, או שהקישור מפנה לפרופיל הדגמה ישן.",
        "This queue is visible to GloWe reviewers. Ask an administrator for access.": "התור הזה גלוי לבודקים של GloWe. בקשו גישה ממנהל המערכת.",
        "Threads": "שרשורים",
        "Title": "כותרת",
        "To the fullest extent permitted by law:": "במידה המרבית המותרת על פי חוק:",
        "Tone, humor, and expression vary across regions. Be mindful. Use inclusive language. If you are unsure, ask.": "טון, הומור והבעה משתנים בין אזורים. היו קשובים. השתמשו בשפה מכלילה. אם אינכם בטוחים, שאלו.",
        "Topic": "נושא",
        "Topic group": "קבוצת נושא",
        "Topic Groups": "קבוצות נושא",
        "Treat every member with dignity. Do not post or endorse any form of discrimination, harassment, or exclusion. Listen to diverse voices and experiences.": "התייחסו לכל חבר בכבוד. אל תפרסמו ואל תתמכו בשום צורה של אפליה, הטרדה או הדרה. הקשיבו לקולות ולחוויות מגוונים.",
        "Trending Discussions": "דיונים חמים",
        "Trust & status": "אמון וסטטוס",
        "Try a broader keyword, clear one filter, or search by impact area, location, or support need.": "נסו מילת מפתח רחבה יותר, נקו מסנן אחד, או חפשו לפי תחום השפעה, מיקום או צורך בתמיכה.",
        "Try a different tab, search a broader word, or start the next conversation.": "נסו לשונית אחרת, חפשו מילה רחבה יותר, או פתחו את השיחה הבאה.",
        "Try adjusting your filters or search terms.": "נסו לשנות את המסננים או את מונחי החיפוש.",
        "Try clearing one of the filters.": "נסו לנקות אחד מהמסננים.",
        "Try Flow": "נסו את התהליך",
        "Turn a real need into a clear call for support: volunteers, partners, knowledge, visibility, space, tools, or funding support.": "הפכו צורך אמיתי לקריאה ברורה לתמיכה: מתנדבים, שותפים, ידע, נראות, מרחב, כלים או תמיכה במימון.",
        "Type": "סוג",
        "Updated today": "עודכן היום",
        "Upload copyrighted or third-party content without permission.": "להעלות תוכן המוגן בזכויות יוצרים או תוכן של צד שלישי ללא רשות.",
        "Use digital tools to make knowledge more accessible, reduce language barriers, and support ethical collaboration.": "השתמשו בכלים דיגיטליים כדי להנגיש ידע, להפחית מחסומי שפה ולתמוך בשיתוף פעולה אתי.",
        "Use example grant cards and a funding-brief flow to turn a real need into a clearer request, budget story, and next step.": "השתמשו בכרטיסי מענק לדוגמה ובתהליך תקציר מימון כדי להפוך צורך אמיתי לבקשה ברורה יותר, לסיפור תקציבי ולצעד הבא.",
        "Use the forums for focused questions, peer advice, templates, field lessons, and professional guidance. Professionals can also lead topic spaces and offer office hours.": "השתמשו בפורומים לשאלות ממוקדות, לעצות עמיתים, לתבניות, ללקחים מהשטח ולהכוונה מקצועית. אנשי מקצוע יכולים גם להוביל מרחבי נושא ולהציע שעות קבלה.",
        "Usually replies within 3-5 days": "בדרך כלל משיב/ה תוך 3-5 ימים",
        "Verified organizations will publish freely; new submissions show up here.": "ארגונים מאומתים יפרסמו בחופשיות; הגשות חדשות יופיעו כאן.",
        "Verified profiles": "פרופילים מאומתים",
        "View Details": "צפייה בפרטים",
        "View Personal Area": "מעבר לאזור האישי",
        "View Profile": "צפייה בפרופיל",
        "Visibility / Media": "נראות / מדיה",
        "Volunteer": "התנדבות",
        "Volunteer / Mentor": "מתנדב/ת / מנטור/ית",
        "Volunteer Opportunities": "הזדמנויות התנדבות",
        "Volunteer Opportunity": "הזדמנות התנדבות",
        "Volunteers": "מתנדבים",
        "volunteers joined new projects this week.": "מתנדבים הצטרפו לפרויקטים חדשים השבוע.",
        "Volunteers and professionals": "מתנדבים ואנשי מקצוע",
        "Volunteers Needed": "דרושים מתנדבים",
        "We are not just a platform. We are a community built on trust and shared purpose. By joining GloWe, you commit to these core values:": "אנחנו לא רק פלטפורמה. אנחנו קהילה הבנויה על אמון ומטרה משותפת. בהצטרפות ל-GloWe, אתם מתחייבים לערכי הליבה האלה:",
        "We are not responsible for actions or content posted by users.": "איננו אחראים לפעולות או לתוכן שמפורסמים על ידי משתמשים.",
        "We are starting with a focused community space. Next, we want to grow local community circles, a practical knowledge library, and technology that helps people use knowledge for good.": "אנחנו מתחילים ממרחב קהילתי ממוקד. בהמשך נרצה להצמיח מעגלי קהילה מקומיים, ספריית ידע מעשית וטכנולוגיה שעוזרת לאנשים להשתמש בידע למען הטוב.",
        "We believe impact grows when people stand with each other, listen deeply, and act with care.": "אנחנו מאמינים שהשפעה צומחת כשאנשים עומדים זה לצד זה, מקשיבים לעומק ופועלים באכפתיות.",
        "We do not look down or preach. We stand next to each other, listen, learn, and act together. Sometimes you give; sometimes you need help. Both are part of a healthy community.": "אנחנו לא מתנשאים ולא מטיפים. אנחנו עומדים זה לצד זה, מקשיבים, לומדים ופועלים יחד. לפעמים נותנים; לפעמים זקוקים לעזרה. שני אלה חלק מקהילה בריאה.",
        "We do not sell, rent, or trade your data to advertisers.": "איננו מוכרים, משכירים או סוחרים בנתונים שלכם למפרסמים.",
        "We do not want technology to replace relationships. We want it to help people find each other, document what they already know, and turn care into practical action.": "איננו רוצים שטכנולוגיה תחליף קשרים. אנחנו רוצים שהיא תעזור לאנשים למצוא זה את זה, לתעד את מה שהם כבר יודעים ולהפוך אכפתיות לפעולה מעשית.",
        "We reserve the right to moderate, remove, or report inappropriate content.": "אנו שומרים את הזכות לנהל, להסיר או לדווח על תוכן לא הולם.",
        "Weekdays": "ימי חול",
        "Weekends": "סופי שבוע",
        "Welcome,": "ברוכים הבאים,",
        "What comes after the MVP?": "מה בא אחרי ה-MVP?",
        "What do you need help thinking through?": "במה תרצו עזרה לחשוב?",
        "What do you want to share, ask, or offer today?": "מה תרצו לשתף, לשאול או להציע היום?",
        "What GloWe makes possible": "מה GloWe מאפשרת",
        "What happens next": "מה קורה עכשיו",
        "What is open now": "מה פתוח עכשיו",
        "What we are learning": "מה אנחנו לומדים",
        "What we believe": "במה אנחנו מאמינים",
        "What we want to build next": "מה נרצה לבנות בהמשך",
        "When GloWe grows, one-third of future revenues will return to local communities.": "כש-GloWe תצמח, שליש מההכנסות העתידיות יחזרו לקהילות מקומיות.",
        "When you publish content, such as text, images, links, or project descriptions, on GloWe:": "כאשר אתם מפרסמים תוכן ב-GloWe, כגון טקסט, תמונות, קישורים או תיאורי פרויקטים:",
        "Who is this for?": "למי זה מיועד?",
        "Who We Serve": "את מי אנחנו משרתים",
        "Why do you want to volunteer?": "למה אתם רוצים להתנדב?",
        "Why GloWe exists": "למה GloWe קיימת",
        "Wish Type": "סוג משאלה",
        "Write a Community Post": "כתיבת פוסט קהילתי",
        "Write Post": "כתיבת פוסט",
        "Write posts, ask questions, share field knowledge, publish updates, and join topic-based discussions.": "כתבו פוסטים, שאלו שאלות, שתפו ידע מהשטח, פרסמו עדכונים והצטרפו לדיונים לפי נושא.",
        "Write the story, request, guide, event details, or question you want the community to see.": "כתבו את הסיפור, הבקשה, המדריך, פרטי האירוע או השאלה שתרצו שהקהילה תראה.",
        "Write to the community": "כתבו לקהילה",
        "You are acting in good faith and with respect for others.": "אתם פועלים בתום לב ומתוך כבוד לאחרים.",
        "You are not alone here": "אתם לא לבד כאן",
        "You are part of a community where people can ask, offer, learn, and keep going together.": "אתם חלק מקהילה שבה אנשים יכולים לשאול, להציע, ללמוד ולהמשיך יחד.",
        "You confirm that you have the legal right to publish what you upload and assume full responsibility for it.": "אתם מאשרים שיש לכם הזכות החוקית לפרסם את מה שאתם מעלים, ולוקחים עליו אחריות מלאה.",
        "You grant GloWe a non-exclusive, royalty-free, worldwide, perpetual license to host, translate, display, analyze, and distribute your content within the platform.": "אתם מעניקים ל-GloWe רישיון לא בלעדי, ללא תמלוגים, עולמי וצמית לאחסן, לתרגם, להציג, לנתח ולהפיץ את התוכן שלכם בתוך הפלטפורמה.",
        "You may close your account at any time.": "תוכלו לסגור את החשבון שלכם בכל עת.",
        "You may request deletion of your account or data at any time.": "תוכלו לבקש את מחיקת החשבון או הנתונים שלכם בכל עת.",
        "You retain full ownership of your intellectual property.": "אתם שומרים על בעלות מלאה על הקניין הרוחני שלכם.",
        "You've got something the world needs.": "יש לכם משהו שהעולם זקוק לו.",
        "Your Availability": "הזמינות שלכם",
        "Your Community Home": "בית הקהילה שלכם",
        "Your full name": "השם המלא שלכם",
        "Your password": "הסיסמה שלכם",
        "About - GloWe": "אודות - GloWe",
        "About GloWe": "אודות GloWe",
        "About the Organization": "אודות הארגון",
        "About This Opportunity": "אודות ההזדמנות",
        "Across countries, languages, and fields, members can learn from each other, translate field wisdom, adapt proven solutions, and connect local action to global SDG challenges.": "מעבר למדינות, לשפות ולתחומים, חברים יכולים ללמוד זה מזה, לתרגם חוכמת שטח, להתאים פתרונות מוכחים ולחבר פעולה מקומית לאתגרים גלובליים של יעדי הקיימות.",
        "Act honestly. Share real experiences. Credit others' work where due. Information shared on GloWe should be accurate, current, and shared with intention.": "פעלו ביושר. שתפו ניסיון אמיתי. תנו קרדיט לעבודתם של אחרים במקום הראוי. מידע שמשותף ב-GloWe צריך להיות מדויק, עדכני ומשותף בכוונה.",
        "Active Members": "חברים פעילים",
        "Active projects": "פרויקטים פעילים",
        "Active Threads": "שרשורים פעילים",
        "Admin review": "בקרת מנהל",
        "Admin Review - GloWe": "ניהול ובקרה - GloWe",
        "A digital-human space for shared knowledge, practical connection, and gradual community growth.": "מרחב דיגיטלי-אנושי לידע משותף, לחיבור מעשי ולצמיחה קהילתית הדרגתית.",
        "A living feed for field updates, practical questions, needs, resources, and people building impact together.": "פיד חי לעדכונים מהשטח, לשאלות מעשיות, לצרכים, למשאבים ולאנשים שבונים השפעה יחד.",
        "A practical space for volunteers, mentors, professionals, and organizations to meet around real needs, clear roles, and shared impact.": "מרחב מעשי שבו מתנדבים, מנטורים, אנשי מקצוע וארגונים נפגשים סביב צרכים אמיתיים, תפקידים ברורים והשפעה משותפת.",
        "A full Privacy Policy will be published separately.": "מדיניות פרטיות מלאה תפורסם בנפרד.",
        "Community - GloWe": "קהילה - GloWe",
        "Discussion Group - GloWe": "קבוצת דיון - GloWe",
        "Forums - GloWe": "פורומים - GloWe",
        "Messages - GloWe": "הודעות - GloWe",
        "Opportunity Details - GloWe": "פרטי הזדמנות - GloWe",
        "Organizations - GloWe": "ארגונים - GloWe",
        "Personal Area - GloWe": "האזור האישי - GloWe",
        "Profile - GloWe": "פרופיל - GloWe",
        "Saved - GloWe": "פריטים שמורים - GloWe",
        "Settings - GloWe": "הגדרות - GloWe",
        "Volunteer Network - GloWe": "רשת המתנדבים - GloWe",
        "Volunteer Opportunities - GloWe": "הזדמנויות התנדבות - GloWe",
        "What's Next - GloWe": "מה הלאה - GloWe",
        "Wishing Well - GloWe": "באר המשאלות - GloWe",
        "Write Post - GloWe": "כתיבת פוסט - GloWe",
        "1. About GloWe": "1. אודות GloWe",
        "2. Who Can Use GloWe": "2. מי יכול להשתמש ב-GloWe",
        "3. Acceptable Use & Responsibilities": "3. שימוש מקובל ואחריות",
        "4. Content Rights & Licensing": "4. זכויות תוכן ורישוי",
        "5. Privacy & Data": "5. פרטיות ונתונים",
        "6. Community Integrity Charter": "6. אמנת יושרה קהילתית",
        "6.1 Transparency": "6.1 שקיפות",
        "6.2 Respect & Inclusion": "6.2 כבוד והכלה",
        "6.3 Collaboration Over Competition": "6.3 שיתוף פעולה לפני תחרות",
        "6.4 Cultural Sensitivity": "6.4 רגישות תרבותית",
        "6.5 Community Responsibility": "6.5 אחריות קהילתית",
        "7. Moderation & Enforcement": "7. ניהול ואכיפה",
        "8. External Links & Third-Party Services": "8. קישורים חיצוניים ושירותי צד שלישי",
        "9. Termination": "9. סיום שימוש",
        "10. Liability Disclaimer": "10. הגבלת אחריות",
        "11. Updates to Terms": "11. עדכונים לתנאים",
        "12. Contact Us": "12. יצירת קשר",
        "2026 GloWe. Built for shared knowledge, mutual support, and action that lasts.": "2026 GloWe. נבנתה למען ידע משותף, תמיכה הדדית ופעולה שנשארת.",
        // ===== Inner pages batch 2 (shared modals, onboarding, terms, personal area) =====
        "Local communities already hold practical knowledge about education, health, climate, food, rights, resilience, and care. Too often, that knowledge stays locked inside one place, one language, one report, or one organization. GloWe is being built to help field-based knowledge travel: clearly, respectfully, and in ways other people can adapt.": "קהילות מקומיות כבר מחזיקות בידע מעשי על חינוך, בריאות, אקלים, מזון, זכויות, חוסן ואכפתיות. לעיתים קרובות מדי הידע הזה נשאר נעול במקום אחד, בשפה אחת, בדוח אחד או בארגון אחד. GloWe נבנית כדי לעזור לידע מהשטח לנדוד: בבהירות, בכבוד ובדרכים שאחרים יכולים להתאים לעצמם.",
        "Sign in with your Google account to get started. You can complete your profile after signing in.": "התחברו עם חשבון Google כדי להתחיל. תוכלו להשלים את הפרופיל שלכם לאחר הכניסה.",
        "Share a Wish": "שיתוף משאלה",
        "A good wish is specific enough for the right helper to say yes.": "משאלה טובה ספציפית מספיק כדי שהעוזר הנכון יאמר כן.",
        "What do you need?": "למה אתם זקוקים?",
        "Wish type": "סוג המשאלה",
        "Select a type": "בחרו סוג",
        "Urgency": "דחיפות",
        "Choose urgency": "בחרו דחיפות",
        "This week": "השבוע",
        "This month": "החודש",
        "Flexible timeline": "לוח זמנים גמיש",
        "What would success look like?": "איך תיראה הצלחה?",
        "Publish Wish": "פרסום משאלה",
        "Send a clear, trusted offer so the organization can decide quickly.": "שלחו הצעה ברורה ואמינה כדי שהארגון יוכל להחליט במהירות.",
        "What can you offer?": "מה אתם יכולים להציע?",
        "Choose support type": "בחרו סוג תמיכה",
        "Professional volunteering": "התנדבות מקצועית",
        "Funding or grant help": "סיוע במימון או במענקים",
        "Space or equipment": "מרחב או ציוד",
        "Business partnership": "שותפות עסקית",
        "Media or distribution": "מדיה או הפצה",
        "Availability": "זמינות",
        "Choose availability": "בחרו זמינות",
        "Within 2 weeks": "בתוך שבועיים",
        "Send Offer": "שליחת הצעה",
        "Update the public information that helps others understand who you are and how to collaborate.": "עדכנו את המידע הציבורי שעוזר לאחרים להבין מי אתם ואיך אפשר לשתף פעולה.",
        "Display name": "שם תצוגה",
        "Profile type": "סוג הפרופיל",
        "Country / region": "מדינה / אזור",
        "Website / public link": "אתר / קישור ציבורי",
        "Interest areas": "תחומי עניין",
        "SDGs": "יעדי קיימות",
        "Short public line": "משפט ציבורי קצר",
        "Mission / story": "משימה / סיפור",
        "Values and goals": "ערכים ומטרות",
        "Community / audience": "קהילה / קהל",
        "Problem addressed": "הבעיה שמטופלת",
        "Solution / method": "פתרון / שיטה",
        "Geographic activity": "פעילות גאוגרפית",
        "Open actions / looking for": "פעולות פתוחות / מה מחפשים",
        "Articles / videos / reports": "מאמרים / סרטונים / דוחות",
        "Profile image": "תמונת פרופיל",
        "Optional. When Cloudinary keys are configured, this uploads to Cloudinary.": "לא חובה. כאשר מפתחות Cloudinary מוגדרים, הקובץ יועלה ל-Cloudinary.",
        "Save Profile Draft": "שמירת טיוטת פרופיל",
        "Welcome to GloWe 👋": "ברוכים הבאים ל-GloWe 👋",
        "Tell us a little about you so the community knows who they're collaborating with. It only takes a minute.": "ספרו לנו קצת על עצמכם כדי שהקהילה תדע עם מי היא משתפת פעולה. זה לוקח רק דקה.",
        "Your name": "השם שלכם",
        "A short line about you": "משפט קצר עליכם",
        "I'm joining as": "אני מצטרף/ת בתור",
        "Private individual": "אדם פרטי",
        "Volunteer, donor, or community member. Full access right away.": "מתנדב, תורם או חבר קהילה. גישה מלאה באופן מיידי.",
        "Organization": "ארגון",
        "NGO, nonprofit, or initiative. Reviewed before you can publish — only serious applications are accepted.": "עמותה, מלכ\"ר או יוזמה. נבדק לפני שתוכלו לפרסם — מתקבלות רק בקשות רציניות.",
        "Organizations are reviewed by the GloWe team. Until you're approved you can browse everything, but posting opportunities, events, and needs stays locked. Please give us enough to take your application seriously.": "ארגונים נבדקים על ידי צוות GloWe. עד לאישור תוכלו לעיין בכול, אך פרסום הזדמנויות, אירועים וצרכים יישאר נעול. אנא ספקו מספיק מידע כדי שנוכל להתייחס לבקשתכם ברצינות.",
        "Organization name *": "שם הארגון *",
        "Registration / NGO number": "מספר רישום / עמותה",
        "Country of operation": "מדינת הפעילות",
        "Cause / field": "מטרה / תחום",
        "Organization size": "גודל הארגון",
        "About the organization *": "אודות הארגון *",
        "Contact person *": "איש קשר *",
        "Contact email *": "דוא\"ל ליצירת קשר *",
        "Contact phone": "טלפון ליצירת קשר",
        "Save and continue": "שמירה והמשך",
        "Maybe later": "אולי מאוחר יותר",
        "Add project": "הוספת פרויקט",
        "Add a project that can appear in your personal area and help others understand what you are building.": "הוסיפו פרויקט שיכול להופיע באזור האישי שלכם ולעזור לאחרים להבין מה אתם בונים.",
        "Project title": "כותרת הפרויקט",
        "Status": "סטטוס",
        "Draft": "טיוטה",
        "Recruiting partners": "מגייסים שותפים",
        "Needs volunteers": "דרושים מתנדבים",
        "Ready to share": "מוכן לשיתוף",
        "Description": "תיאור",
        "Save Project": "שמירת פרויקט",
        "Report a concern": "דיווח על בעיה",
        "We review every report carefully and confidentially to keep GloWe safe and professional.": "אנחנו בודקים כל דיווח בקפידה ובסודיות כדי לשמור על GloWe בטוחה ומקצועית.",
        "Reporting": "דיווח",
        "General concern": "בעיה כללית",
        "What should we look at?": "על מה כדאי שנסתכל?",
        "Choose a reason": "בחרו סיבה",
        "Inaccurate information": "מידע לא מדויק",
        "Disrespectful or discriminatory content": "תוכן לא מכבד או מפלה",
        "Misleading promotion": "קידום מטעה",
        "Human rights concern": "חשש לפגיעה בזכויות אדם",
        "Other": "אחר",
        "Details": "פרטים",
        "Submit Report": "שליחת דיווח",
        "Choose a rhythm that keeps GloWe useful without creating digital fatigue.": "בחרו קצב שמשאיר את GloWe מועילה בלי ליצור עומס דיגיטלי.",
        "Opportunity of the week": "הזדמנות השבוע",
        "High-match connection proposals": "הצעות חיבור בהתאמה גבוהה",
        "Deadline reminders": "תזכורות למועדי הגשה",
        "Crisis-response playbooks for my region": "מדריכי תגובה למשבר באזור שלי",
        "Preferred cadence": "תדירות מועדפת",
        "Weekly digest": "תקציר שבועי",
        "Only urgent actions": "רק פעולות דחופות",
        "Daily 5-minute brief": "תקציר יומי של 5 דקות",
        "Save Preferences": "שמירת העדפות",
        "Mentors, space, visibility...": "מנטורים, מרחב, נראות...",
        "City, region, remote, or hybrid": "עיר, אזור, מרחוק או היברידי",
        "Tell the community what would help.": "ספרו לקהילה מה יעזור.",
        "Example: 3 mentors matched, one grant draft completed, 50 families reached...": "לדוגמה: 3 מנטורים הותאמו, טיוטת מענק אחת הושלמה, 50 משפחות נעזרו...",
        "Briefly explain your relevant experience, what you can offer, and what you need to know next.": "הסבירו בקצרה את הניסיון הרלוונטי שלכם, מה אתם יכולים להציע ומה תרצו לדעת בהמשך.",
        "Organization or person name": "שם הארגון או האדם",
        "NGO, business, volunteer, initiative...": "עמותה, עסק, מתנדב, יוזמה...",
        "Education, health, climate...": "חינוך, בריאות, אקלים...",
        "Quality Education, Climate Action...": "חינוך איכותי, פעולה למען האקלים...",
        "One clear sentence people can understand quickly": "משפט ברור אחד שאנשים יכולים להבין במהירות",
        "Mission, current work, or what you offer.": "משימה, עבודה נוכחית או מה שאתם מציעים.",
        "Values, goals, leadership, or principles": "ערכים, מטרות, מנהיגות או עקרונות",
        "Who do you serve, support, work with, or hope to reach?": "את מי אתם משרתים, תומכים, עובדים איתו או מקווים להגיע אליו?",
        "What problem or need are you working on?": "על איזו בעיה או צורך אתם עובדים?",
        "What do you do in practice?": "מה אתם עושים בפועל?",
        "Advocacy, education, field work, research...": "סנגור, חינוך, עבודת שטח, מחקר...",
        "Local / regional / global / remote": "מקומי / אזורי / גלובלי / מרחוק",
        "Partners, volunteers, funding, knowledge, visibility...": "שותפים, מתנדבים, מימון, ידע, נראות...",
        "Useful public links": "קישורים ציבוריים מועילים",
        "Full name": "שם מלא",
        "One sentence people grasp quickly": "משפט אחד שאנשים קולטים במהירות",
        "Registered / public name": "שם רשום / ציבורי",
        "Legal registration number": "מספר רישום משפטי",
        "Where you operate": "היכן אתם פועלים",
        "Volunteers / staff, approx.": "מתנדבים / צוות, בקירוב",
        "Mission, who you serve, and what you'd do on GloWe.": "המשימה, את מי אתם משרתים ומה תעשו ב-GloWe.",
        "Who we should talk to": "עם מי כדאי שנדבר",
        "Optional": "לא חובה",
        "Community resource map": "מפת משאבים קהילתית",
        "What is the project, who does it support, and what kind of help would move it forward?": "מהו הפרויקט, את מי הוא תומך, ואיזו עזרה תקדם אותו?",
        "Add context that can help our review.": "הוסיפו הקשר שיכול לעזור לבדיקה שלנו.",
        "Switch to English": "מעבר לאנגלית",
        "This page outlines the terms, responsibilities, and community standards that guide your use of the GloWe platform. By accessing or interacting with this site, you agree to abide by the Terms of Use and our Community Integrity Charter. GloWe is committed to building a safe, inclusive, and impact-driven space.": "עמוד זה מתאר את התנאים, האחריות ואמות המידה הקהילתיות שמנחים את השימוש שלכם בפלטפורמת GloWe. בגישה לאתר זה או באינטראקציה איתו, אתם מסכימים לפעול לפי תנאי השימוש ואמנת היושרה הקהילתית שלנו. GloWe מחויבת לבניית מרחב בטוח, מכליל ומונע השפעה.",
        "GloWe is a global platform connecting individuals, organizations, and initiatives working to create social and environmental change. We facilitate knowledge-sharing, collaboration, and visibility for solutions that matter across languages, sectors, and geographies.": "GloWe היא פלטפורמה גלובלית שמחברת אנשים, ארגונים ויוזמות שפועלים ליצירת שינוי חברתי וסביבתי. אנחנו מאפשרים שיתוף ידע, שיתוף פעולה ונראות לפתרונות שחשובים, מעבר לשפות, למגזרים ולמיקומים גאוגרפיים.",
        "Share knowledge, ask for support, and build practical impact with the community.": "שתפו ידע, בקשו תמיכה ובנו השפעה מעשית יחד עם הקהילה.",
        "More post actions": "פעולות נוספות לפוסט",
        "More wish actions": "פעולות נוספות למשאלה",
        "More opportunity actions": "פעולות נוספות להזדמנות",
        "More profile actions": "פעולות נוספות לפרופיל",
        "Write a thoughtful comment...": "כתבו תגובה מכובדת...",
        "Ask a focused question for this group": "שאלו שאלה ממוקדת לקבוצה הזו",
        "What do you need input on, and what kind of answers would help?": "על מה תרצו לקבל משוב, ואיזה סוג תשובות יעזור?",
        "Personal workspace": "מרחב עבודה אישי",
        "Your GloWe profile is ready to be completed.": "הפרופיל שלכם ב-GloWe מוכן להשלמה.",
        "Community collaboration": "שיתוף פעולה קהילתי",
        "Location not added yet": "מיקום טרם נוסף",
        "Team size not added yet": "גודל הצוות טרם נוסף",
        "Not added yet": "טרם נוסף",
        "Title / role": "תפקיד",
        "Organization name": "שם הארגון",
        "Email verified": "דוא\"ל מאומת",
        "Pending": "ממתין",
        "Public link": "קישור ציבורי",
        "Public line": "משפט ציבורי",
        "Open to volunteers, donations, or partnerships?": "פתוחים למתנדבים, לתרומות או לשותפויות?",
        "Funding / support sources": "מקורות מימון / תמיכה",
        "Annual budget / support context": "תקציב שנתי / הקשר תמיכה",
        "Profile status": "סטטוס הפרופיל",
        "Personal area sections": "מקטעי האזור האישי"
    }
};

function gloweDict() {
    return GLOWE_TRANSLATIONS[getGloweLanguage()] || null;
}

const GLOWE_I18N_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

function applyGloweTextNode(node, dict) {
    const raw = node.nodeValue;
    if (!raw) return;
    const key = raw.trim();
    const hit = key && dict[key];
    // Replace only the trimmed segment so surrounding whitespace is preserved.
    if (hit) node.nodeValue = raw.replace(key, hit);
}

function applyGloweAttrs(el, dict) {
    if (!el.hasAttribute) return;
    GLOWE_I18N_ATTRS.forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        const raw = el.getAttribute(attr);
        const key = (raw || '').trim();
        const hit = key && dict[key];
        if (hit) el.setAttribute(attr, raw.replace(key, hit));
    });
}

// Translate a freshly-rendered subtree in place. Idempotent: localized text no
// longer matches an English key, so re-running is a no-op.
function translateGloweTree(root) {
    const dict = gloweDict();
    if (!dict || !root) return;
    if (root.nodeType === Node.TEXT_NODE) {
        applyGloweTextNode(root, dict);
        return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE') {
                return NodeFilter.FILTER_REJECT;
            }
            return node.nodeValue && node.nodeValue.trim()
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
        }
    });
    const texts = [];
    let node;
    while ((node = walker.nextNode())) texts.push(node);
    texts.forEach(t => applyGloweTextNode(t, dict));
    applyGloweAttrs(root, dict);
    root.querySelectorAll('*').forEach(el => applyGloweAttrs(el, dict));
}

let gloweI18nObserver = null;
function startGloweI18nObserver() {
    if (gloweI18nObserver || !gloweDict()) return;
    // Catches content injected after first paint (modals, settings, data-driven
    // lists). Only childList is observed, so our own text edits never re-trigger.
    gloweI18nObserver = new MutationObserver(mutations => {
        mutations.forEach(m => m.addedNodes.forEach(n => translateGloweTree(n)));
    });
    gloweI18nObserver.observe(document.body, { childList: true, subtree: true });
}

function applyGloweDirection() {
    const lang = getGloweLanguage();
    const rtl = GLOWE_RTL_LANGS.includes(lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    if (document.body) document.body.classList.toggle('lang-he', lang === 'he');
}

function initGloweI18n() {
    applyGloweDirection();
    if (!gloweDict()) return;
    translateGloweTree(document.body);
    startGloweI18nObserver();
}

function setGloweLanguage(lang) {
    if (lang === getGloweLanguage()) return;
    localStorage.setItem(GLOWE_LANG_KEY, lang);
    // A full reload re-renders every page in the new direction from a clean
    // English baseline, avoiding half-flipped layout state.
    window.location.reload();
}

function toggleGloweLanguage() {
    setGloweLanguage(getGloweLanguage() === 'he' ? 'en' : 'he');
}

// Header language toggle — shown only for anonymous visitors.
// Logged-in users access language via the Settings page.
function injectLanguageToggle() {
    const container = document.querySelector('.main-header .container');
    if (!container || container.querySelector('.lang-toggle')) return;
    const current = getGloweLanguage();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-toggle';
    btn.setAttribute('data-no-i18n', '');
    btn.setAttribute('aria-label', current === 'he' ? 'Switch to English' : 'מעבר לעברית');
    btn.textContent = current === 'he' ? 'EN' : 'עב';
    btn.addEventListener('click', toggleGloweLanguage);
    const authButtons = container.querySelector('.auth-buttons');
    container.insertBefore(btn, authButtons || null);
}

function removeLanguageToggle() {
    const btn = document.querySelector('.main-header .lang-toggle');
    if (btn) btn.remove();
}

// Expose on window so auth.js (loaded separately) can call these after sign-in/out.
window.injectLanguageToggle = injectLanguageToggle;
window.removeLanguageToggle = removeLanguageToggle;

// Set direction as early as app.js evaluates (it loads at end of <body>, so the
// element is present) to minimize the LTR→RTL flash on Hebrew loads.
applyGloweDirection();

// Settings page: account summary, language preference, and session controls.
function initSettingsPage() {
    const container = document.getElementById('settings-content');
    if (!container) return;

    const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
    if (!loggedIn) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Sign in to manage settings</h3>
                <p>Your account, language, and session options live here once you are signed in.</p>
                <button class="btn btn-primary" type="button" onclick="openModal('login-modal')">Sign up / Sign in</button>
            </div>
        `;
        return;
    }

    const profile = getPersonalProfile();
    const lang = getGloweLanguage();
    container.innerHTML = `
        <div class="settings-grid">
            <article class="profile-section-card">
                <div class="profile-section-heading">
                    <span>01</span>
                    <h2>Account</h2>
                </div>
                <div class="profile-info-list">
                    <p><strong>Name</strong><span>${escapeHtml(profile.name || 'GloWe member')}</span></p>
                    <p><strong>Email</strong><span>${escapeHtml(profile.email || 'Not available')}</span></p>
                    <p><strong>Account type</strong><span>${escapeHtml(profile.type || 'Community member')}</span></p>
                </div>
                <a class="btn btn-outline btn-small" href="my-applications.html">Open Personal Area</a>
            </article>

            <article class="profile-section-card">
                <div class="profile-section-heading">
                    <span>02</span>
                    <h2>Language</h2>
                </div>
                <p class="muted-note">Choose the language for the GloWe interface. Hebrew is shown in a right-to-left (RTL) layout.</p>
                <div class="form-group">
                    <label for="settings-language">Interface language</label>
                    <select id="settings-language" onchange="setGloweLanguage(this.value)">
                        <option value="en"${lang === 'en' ? ' selected' : ''}>English</option>
                        <option value="he"${lang === 'he' ? ' selected' : ''}>Hebrew</option>
                    </select>
                </div>
            </article>

            <article class="profile-section-card">
                <div class="profile-section-heading">
                    <span>03</span>
                    <h2>Session</h2>
                </div>
                <p class="muted-note">End your session on this device. You can sign back in any time with Google.</p>
                <button class="btn btn-primary" type="button" onclick="logout()">Log Out</button>
            </article>
        </div>
    `;
}

// Messages page: inbox surface for direct conversations. Real-time chat is on
// the roadmap (shared KC messaging backend); for now this is a signed-in
// placeholder so the header chat icon has a destination.
function initMessagesPage() {
    const container = document.getElementById('messages-content');
    if (!container) return;

    const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
    if (!loggedIn) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Sign in to see your messages</h3>
                <p>Direct conversations with volunteers, organizations, and partners live here once you are signed in.</p>
                <button class="btn btn-primary" type="button" onclick="openModal('login-modal')">Sign up / Sign in</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="empty-state">
            <h3>Direct messaging is coming soon</h3>
            <p>Private conversations between volunteers, organizations, and partners are on the way. In the meantime, you can reach an organization from its profile.</p>
            <div class="modal-actions">
                <a class="btn btn-primary" href="organizations.html">Browse Organizations</a>
                <a class="btn btn-outline" href="community.html">Back to Community</a>
            </div>
        </div>
    `;
}

// Derive the logical page key from a pathname, tolerant of both
// extension-style URLs (local: /pages/settings.html) and clean URLs
// (Cloudflare Pages on dev/prod: /glowe/pages/settings).
function resolveGlowePage(pathname) {
    const clean = (pathname || '/').split(/[?#]/)[0].replace(/\/+$/, '');
    // Every page except the home page lives under /pages/. Anything outside
    // that directory (the app root, with or without a trailing index.html) is
    // the home page — this holds for both local .html URLs and the clean URLs
    // Cloudflare Pages serves on dev/prod (e.g. /glowe, /glowe/pages/settings).
    if (!clean.includes('/pages/')) return 'index';
    const seg = clean.split('/').pop().replace(/\.html$/, '');
    return (!seg || seg === 'index') ? 'index' : seg;
}

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
    applyGloweDirection();
    ensureGlobalUI();
    normalizeMainNavigation();
    if (localStorage.getItem('gloweLowDataMode') === 'true') {
        document.body.classList.add('low-data-mode');
    }
    // Determine which page we're on and initialize accordingly
    const page = resolveGlowePage(window.location.pathname);

    if (page === 'index') {
        initFeaturedOpportunities();
    } else if (page === 'opportunities' || page === 'volunteer-network') {
        initOpportunitiesPage();
    } else if (page === 'organizations') {
        initOrganizationsPage();
    } else if (page === 'wishing-well') {
        initWishingWellPage();
    } else if (page === 'community') {
        initCommunityPage();
    } else if (page === 'write-post') {
        initWritePostPage();
    } else if (page === 'forums') {
        initForumsPage();
    } else if (page === 'saved') {
        initSavedPage();
    } else if (page === 'discussion-group') {
        initDiscussionGroupPage();
    } else if (page === 'profile') {
        initProfilePage();
    } else if (page === 'opportunity') {
        initOpportunityDetailPage();
    } else if (page === 'my-applications') {
        initMyApplicationsPage();
    } else if (page === 'admin') {
        initAdminPage();
    } else if (page === 'settings') {
        initSettingsPage();
    } else if (page === 'messages') {
        initMessagesPage();
    }

    // Translate the now-rendered chrome + page, then watch for later injections.
    initGloweI18n();
});
