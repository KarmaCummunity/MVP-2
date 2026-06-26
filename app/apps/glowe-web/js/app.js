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

let activeWishForSupport = null;
const OPPORTUNITY_STORAGE_KEY = 'gloweOpportunities';
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
        members: 42,
        posts: 18,
        description: 'A focused group for learning spaces, youth programs, multilingual knowledge sharing, and practical education tools.',
        tags: ['Education', 'Knowledge Sharing', 'Youth'],
        threads: [
            { title: 'How do we onboard remote tutors safely?', replies: 8, lastActive: 'Today' },
            { title: 'Templates for multilingual learning kits', replies: 5, lastActive: 'Yesterday' }
        ]
    },
    {
        id: 'environment',
        title: 'Environment & Climate Action',
        members: 37,
        posts: 14,
        description: 'For climate, food systems, waste, restoration, repair, and local environmental action.',
        tags: ['Climate', 'Food Security', 'Repair'],
        threads: [
            { title: 'What makes a cleanup day worth repeating?', replies: 11, lastActive: 'Today' },
            { title: 'Composting workshop equipment list', replies: 6, lastActive: '2 days ago' }
        ]
    },
    {
        id: 'health',
        title: 'Health & Community Care',
        members: 28,
        posts: 11,
        description: 'A moderated space for wellbeing, preventive health, emergency response, and community care methods.',
        tags: ['Health', 'Wellbeing', 'Crisis Response'],
        threads: [
            { title: 'Mobile clinic intake questions that work', replies: 7, lastActive: 'Today' },
            { title: 'Mental health first response training', replies: 4, lastActive: '3 days ago' }
        ]
    },
    {
        id: 'rights',
        title: 'Rights, Safety & Civic Power',
        members: 31,
        posts: 9,
        description: 'For rights-based action, civic participation, safe moderation, and community trust.',
        tags: ['Justice', 'Safety', 'Civic Action'],
        threads: [
            { title: 'Community guidelines for difficult conversations', replies: 9, lastActive: 'Yesterday' },
            { title: 'What should moderators escalate?', replies: 3, lastActive: '4 days ago' }
        ]
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

function getSavedOpportunities() {
    try {
        return JSON.parse(localStorage.getItem(OPPORTUNITY_STORAGE_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

function saveOpportunityDraft(opportunity) {
    const saved = getSavedOpportunities();
    const enriched = {
        id: `local-${Date.now()}`,
        featured: true,
        organization: opportunity.organization || 'GloWe Community Member',
        orgIcon: getInitials(opportunity.organization || 'GloWe'),
        ...opportunity
    };
    localStorage.setItem(OPPORTUNITY_STORAGE_KEY, JSON.stringify([enriched, ...saved]));
    apiRequest('/api/opportunities', {
        method: 'POST',
        body: JSON.stringify(enriched)
    });
    return enriched;
}

function getAllOpportunitiesForDisplay() {
    return [...getSavedOpportunities(), ...opportunities];
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

function getBackendMode() {
    return window.gloweBackend && window.gloweBackend.configured() ? 'supabase' : 'local';
}

function renderBackendModeNotice() {
    if (getBackendMode() === 'supabase') {
        return `
            <div class="backend-mode-notice backend-mode-live">
                <strong>Supabase connected</strong>
                <span>Profile, posts, saved items, applications, and opportunities sync to the backend.</span>
            </div>
        `;
    }
    return `
        <div class="backend-mode-notice">
            <strong>Local demo mode</strong>
            <span>Data is saved in this browser until Supabase URL and anon key are added in backend-config.js.</span>
        </div>
    `;
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
        ? [{ label: 'Personal Area', href: `${prefix}my-applications.html`, match: 'my-applications.html' }]
        : [{ label: 'Home', href: homeHref, match: 'index.html' }];
    links.push(
        { label: 'Wishing Well', href: `${prefix}wishing-well.html`, match: 'wishing-well.html' },
        { label: 'Organizations', href: `${prefix}organizations.html`, match: 'organizations.html' },
        { label: 'Community', href: `${prefix}community.html`, match: 'community.html' },
        { label: 'About', href: `${prefix}about.html`, match: 'about.html' }
    );
    const path = window.location.pathname;
    nav.innerHTML = links.map(link => {
        const active = path.endsWith(link.match)
            || (link.match === 'about.html' && path.includes('whats-next.html'))
            || (link.match === 'community.html' && (path.includes('forums.html') || path.includes('discussion-group.html')))
            || (link.match === 'wishing-well.html' && (path.includes('volunteer-network.html') || path.includes('opportunities.html') || path.includes('opportunity.html')))
            || (link.match === 'index.html' && (path.endsWith('/') || path.endsWith('/app/')));
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
    userMenu.innerHTML = `
        <span class="user-greeting">Hi, <span id="user-name">there</span></span>
        <a class="btn btn-outline btn-small" href="${prefix}my-applications.html">Personal Area</a>
        <button class="btn btn-primary btn-small" type="button" onclick="logout()">Log Out</button>
    `;
}

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
                    <a href="${prefix}admin.html">Admin Review</a>
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
    const path = window.location.pathname;

    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';

    const links = [
        { 
            label: 'Home', 
            href: homeHref, 
            match: 'index.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
        },
        { 
            label: 'Wishes', 
            href: `${prefix}wishing-well.html`, 
            match: 'wishing-well.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
        },
        { 
            label: 'Community', 
            href: `${prefix}community.html`, 
            match: 'community.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
        },
        { 
            label: 'Profile', 
            href: `${prefix}my-applications.html`, 
            match: 'my-applications.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
        }
    ];

    nav.innerHTML = links.map(link => {
        const active = path.endsWith(link.match)
            || (link.match === 'community.html' && (path.includes('forums.html') || path.includes('discussion-group.html') || path.includes('organizations.html')))
            || (link.match === 'wishing-well.html' && (path.includes('volunteer-network.html') || path.includes('opportunities.html') || path.includes('opportunity.html')))
            || (link.match === 'index.html' && (path.endsWith('/') || path.endsWith('/app/')));
        
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
                                <label for="wish-urgency">Urgency</label>
                                <select id="wish-urgency" required>
                                    <option value="">Choose urgency</option>
                                    <option>This week</option>
                                    <option>This month</option>
                                    <option>Flexible timeline</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="wish-location-input">Location</label>
                            <input type="text" id="wish-location-input" required placeholder="City, region, remote, or hybrid">
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

function handleWishSubmit(event) {
    event.preventDefault();
    closeModal('wish-modal');
    showSuccessModal('Need sent for verification', 'A community manager will review the request, confirm safety details, and then publish it to matching helpers.');
}

function showSupportModal(wishId = null) {
    ensureGlobalUI();
    activeWishForSupport = wishId ? wishes.find(item => item.id === parseInt(wishId)) : null;
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

function handleConnectSubmit(event) {
    event.preventDefault();
    closeModal('connect-modal');
    openConnectionWorkspace();
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

function getAllOpportunitiesIncludingLocal() {
    return [...getSavedOpportunities(), ...opportunities];
}

function getOpportunityByAnyId(id) {
    return getAllOpportunitiesIncludingLocal().find(opp => String(opp.id) === String(id));
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
    const wish = wishes.find(item => item.id === parseInt(wishId));
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
                <button class="btn btn-primary" type="button" onclick="showSupportModal(${wish.id})">Offer Support</button>
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
function renderOpportunityCard(opportunity, basePath = '') {
    const titleForMessage = jsString(opportunity.title);
    const detailHref = `${basePath}pages/opportunity.html?id=${encodeURIComponent(opportunity.id)}`;
    const skills = Array.isArray(opportunity.skills) ? opportunity.skills : [];

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
                <span class="opportunity-badge">${escapeHtml(opportunity.commitment)}</span>
            </div>
            <h3 class="opportunity-title">${escapeHtml(opportunity.title)}</h3>
            <p class="opportunity-description">${escapeHtml(opportunity.description)}</p>
            <div class="opportunity-details">
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
            <button class="card-open-button" type="button" onclick="openWishDetail(${wish.id})">
                ${renderEntityMark(wish.author, 'wish-image')}
                <span class="sr-only">Open wish details</span>
            </button>
            <h3><button type="button" onclick="openWishDetail(${wish.id})">${escapeHtml(wish.title)}</button></h3>
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
            <button class="btn btn-outline btn-small" type="button" onclick="openWishDetail(${wish.id})">Learn More</button>
            <button class="btn btn-primary btn-small" type="button" onclick="showSupportModal(${wish.id})">Offer Support</button>
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
    const comments = getPostComments()[postId] || [];
    const defaultComments = comments.length ? comments : [
        { author: 'Community Manager', text: 'Useful direction. Who should join the next step?', createdAt: new Date().toISOString() }
    ];
    return `
        <article class="post-card" id="post-${postId}">
            <details class="post-more-menu">
                <summary aria-label="More post actions">...</summary>
                <div class="post-more-panel">
                    <button type="button" onclick="saveItem('post', '${postId}', '${jsString(post.title)}', '${jsString(post.category)}', 'community.html#post-${postId}')">Save post</button>
                    <button type="button" onclick="saveItem('profile', '${post.authorId || authorName}', '${jsString(authorName)}', 'Community profile', '${profileHref}')">Save profile</button>
                    <button type="button" onclick="openPrivateMessage('${jsString(authorName)}')">Message</button>
                    <button type="button" onclick="openReportModal('post', '${postId}', '${jsString(post.title)}')">Report</button>
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
            ${renderShareButtons(post.title, `community.html?post=${encodeURIComponent(post.title)}`)}
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

function handleInlinePostSubmit(event) {
    event.preventDefault();
    const topic = postTopics.find(item => item.id === document.getElementById('inline-post-topic').value) || postTopics[0];
    saveCommunityPost({
        authorId: 'sample-user-6',
        title: document.getElementById('inline-post-title').value,
        category: topic.label,
        text: document.getElementById('inline-post-body').value,
        tags: document.getElementById('inline-post-tags').value.split(',').map(tag => tag.trim()).filter(Boolean),
        audience: 'Everyone'
    });
    closeInlineComposer();
    initCommunityPage();
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
    form.addEventListener('submit', event => {
        event.preventDefault();
        const topic = selectedTopic();
        saveCommunityPost({
            authorId: 'sample-user-6',
            title: document.getElementById('post-title').value,
            category: topic.label,
            text: document.getElementById('post-body').value,
            tags: document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(Boolean),
            audience: document.getElementById('post-audience').value,
            language: document.getElementById('post-language').value,
            link: document.getElementById('post-link').value
        });
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
function initFeaturedOpportunities() {
    const container = document.getElementById('featured-opportunities');
    if (container) {
        const featured = getFeaturedOpportunities().slice(0, 3);
        container.innerHTML = featured.map(opp => renderOpportunityCard(opp)).join('');
    }

    const dailyContainer = document.getElementById('daily-actions');
    if (dailyContainer) dailyContainer.innerHTML = dailyActions.map(renderDailyActionCard).join('');

    const matchContainer = document.getElementById('smart-matches');
    if (matchContainer) matchContainer.innerHTML = smartMatches.map(renderSmartMatch).join('');

    const playbookContainer = document.getElementById('applied-playbooks');
    if (playbookContainer) playbookContainer.innerHTML = appliedPlaybooks.map(renderPlaybook).join('');

    const distributionContainer = document.getElementById('distribution-tools');
    if (distributionContainer) distributionContainer.innerHTML = distributionChannels.map(renderDistributionTool).join('');

    const grantContainer = document.getElementById('grant-recommendations');
    if (grantContainer) grantContainer.innerHTML = grantRecommendations.map(renderGrantRecommendation).join('');

    const engagementContainer = document.getElementById('engagement-tools');
    if (engagementContainer) engagementContainer.innerHTML = engagementTools.map(renderEngagementTool).join('');

    const rewardsContainer = document.getElementById('reward-leaders');
    if (rewardsContainer) rewardsContainer.innerHTML = rewardLeaders.map(renderRewardLeader).join('');

    const rolesContainer = document.getElementById('user-roles');
    if (rolesContainer) rolesContainer.innerHTML = userRoleBlueprint.map(renderRole).join('');

    const businessContainer = document.getElementById('business-model');
    if (businessContainer) businessContainer.innerHTML = businessModelItems.map(renderBusinessItem).join('');

    const roadmapContainer = document.getElementById('roadmap-phases');
    if (roadmapContainer) roadmapContainer.innerHTML = roadmapPhases.map(renderRoadmapPhase).join('');
}

// Initialize all opportunities page
function initOpportunitiesPage() {
    const container = document.getElementById('opportunities-list');
    const composer = document.getElementById('opportunity-composer');
    const filters = {
        location: 'all',
        field: 'all',
        commitment: 'all',
        search: ''
    };
    
    function renderOpportunities() {
        const filtered = filterOpportunityCatalog(getAllOpportunitiesForDisplay(), filters);
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">No results</div>
                    <h3>No opportunities found</h3>
                    <p>Try adjusting your filters or search terms.</p>
                </div>
            `;
        } else {
            container.innerHTML = filtered.map(opp => renderOpportunityCard(opp, '../')).join('');
        }
    }

    window.renderOpportunitiesList = renderOpportunities;
    
    // Add filter event listeners
    const locationFilter = document.getElementById('filter-location');
    const fieldFilter = document.getElementById('filter-field');
    const commitmentFilter = document.getElementById('filter-commitment');
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
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filters.search = this.value;
            renderOpportunities();
        });
    }
    
    // Initial render
    if (container) {
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

function handleOpportunitySubmit(event) {
    event.preventDefault();
    const title = document.getElementById('opportunity-title').value.trim();
    const organization = document.getElementById('opportunity-organization').value.trim();
    const commitment = document.getElementById('opportunity-type').value;
    const field = document.getElementById('opportunity-field').value;
    const location = document.getElementById('opportunity-location').value.trim();
    const duration = document.getElementById('opportunity-duration').value.trim();
    const description = document.getElementById('opportunity-description').value.trim();
    const skills = commaList(document.getElementById('opportunity-skills').value);
    const requirements = commaList(document.getElementById('opportunity-requirements').value);

    saveOpportunityDraft({
        title,
        organization,
        commitment,
        field,
        location,
        duration,
        description,
        skills: skills.length ? skills : ['Community Support'],
        requirements: requirements.length ? requirements : ['Clear communication'],
        responsibilities: ['Coordinate next steps with interested community members']
    });

    closeOpportunityComposer();
    if (typeof window.renderOpportunitiesList === 'function') {
        window.renderOpportunitiesList();
    }
    showSuccessModal('Opportunity published', `${title} was added to the opportunities board.`);
}

// Initialize organizations page
function initOrganizationsPage() {
    const container = document.getElementById('organizations-list');
    if (!container) return;

    const searchInput = document.getElementById('organization-search');
    const regionSelect = document.getElementById('organization-region-filter');
    const typeSelect = document.getElementById('organization-type-filter');
    const clearButton = document.getElementById('organization-clear-filters');
    const countLabel = document.getElementById('organization-results-count');
    const visibleOrganizations = organizations.filter(org => !isModerationHidden('profile', org.id));
    const regions = [...new Set(visibleOrganizations.map(org => org.country || org.scope || org.location).filter(Boolean))].sort();
    const types = [...new Set(visibleOrganizations.map(org => org.type || 'Organization').filter(Boolean))].sort();

    if (regionSelect) {
        regionSelect.innerHTML = '<option value="all">All regions</option>' + regions.map(region => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join('');
    }
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="all">All types</option>' + types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
    }

    function renderOrganizations() {
        const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
        const region = regionSelect ? regionSelect.value : 'all';
        const type = typeSelect ? typeSelect.value : 'all';
        const filtered = visibleOrganizations.filter(org => {
            const searchable = [
                org.name,
                org.type,
                org.status,
                org.mission,
                org.values,
                org.community,
                org.problem,
                org.solution,
                org.methods,
                org.publicActions,
                org.impactArea,
                org.country,
                org.location,
                org.scope,
                org.size,
                ...(org.languages || []),
                ...(org.projects || []).flatMap(project => [project.title, project.description, project.status])
            ].filter(Boolean).join(' ').toLowerCase();
            const regionMatch = region === 'all' || [org.country, org.scope, org.location].filter(Boolean).some(value => String(value).toLowerCase().includes(region.toLowerCase()));
            const typeMatch = type === 'all' || String(org.type || '').toLowerCase() === type.toLowerCase();
            const queryMatch = !query || searchable.includes(query);
            return regionMatch && typeMatch && queryMatch;
        });

        container.innerHTML = filtered.length
            ? filtered.map(org => renderOrganizationCard(org, '../')).join('')
            : '<div class="empty-state organizations-empty-state"><h3>No matching profiles yet</h3><p>Try a broader keyword, clear one filter, or search by impact area, location, or support need.</p></div>';

        if (countLabel) {
            countLabel.textContent = `${filtered.length} of ${visibleOrganizations.length} profiles shown`;
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

    renderOrganizations();
}

function initWishingWellPage() {
    const container = document.getElementById('wishes-list');
    const typeButtons = document.querySelectorAll('[data-wish-type]');
    const areaButtons = document.querySelectorAll('[data-impact-area]');
    const locationInput = document.getElementById('wish-location');
    const clearBtn = document.getElementById('clear-wish-filters');
    const filters = { type: 'all', area: 'all', location: '' };

    function renderWishes() {
        const filtered = wishes.filter(wish => {
            if (filters.type !== 'all' && wish.type !== filters.type) return false;
            if (filters.area !== 'all' && !wish.areas.includes(filters.area)) return false;
            if (filters.location && !wish.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
            return true;
        });
        container.innerHTML = filtered.length
            ? filtered.map(renderWishCard).join('')
            : '<div class="empty-state"><div class="empty-state-icon">No results</div><h3>No wishes found</h3><p>Try clearing one of the filters.</p></div>';
    }

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
    if (container) renderWishes();
}

function initCommunityPage() {
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
            : '<div class="empty-state"><h3>No posts match this view yet</h3><p>Try a different tab, search a broader word, or start the next conversation.</p><button class="btn btn-primary btn-small" type="button" onclick="openInlineComposer()">Write a post</button></div>';
    }

    if (searchInput) searchInput.addEventListener('input', renderFeed);
    feedFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            feedFilterButtons.forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            renderFeed();
        });
    });
    renderFeed();
    if (peopleContainer) {
        peopleContainer.innerHTML = people.filter(person => !isModerationHidden('profile', person.id)).map(person => `
            <div class="person-row">
                <a href="profile.html?id=${person.id}">
                    ${renderEntityMark(person.name, 'avatar')}
                    <span><strong>${person.name}</strong><small>${person.location}</small></span>
                </a>
                <div class="person-actions">
                    <button type="button" onclick="showSuccessModal('Profile saved', '${person.name.replace(/'/g, "\\'")} was saved to your profile list.')">Save</button>
                    <button type="button" onclick="openPrivateMessage('${person.name.replace(/'/g, "\\'")}')">Message</button>
                </div>
            </div>
        `).join('');
    }
    if (groupsContainer) {
        groupsContainer.innerHTML = discussionGroups.map(group => `
            <a class="filter-pill group-link-pill" href="discussion-group.html?group=${group.id}">
                ${group.title}<span>${group.members}</span>
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
    const stats = document.querySelectorAll('[data-admin-stat]');
    if (!requestsContainer && !reportsContainer && !hiddenContainer) return;

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

function initForumsPage() {
    const container = document.getElementById('forum-categories');
    const threadsContainer = document.getElementById('forum-thread-list');
    const leadersContainer = document.getElementById('forum-leaders');
    const groupSelect = document.getElementById('forum-question-group');
    const stats = document.querySelectorAll('[data-forum-stat]');
    const storedThreads = JSON.parse(localStorage.getItem('gloweForumThreads') || '[]');
    const allThreads = [
        ...storedThreads,
        ...discussionGroups.flatMap(group => group.threads.map(thread => ({ ...thread, group })))
    ];
    if (groupSelect) {
        groupSelect.innerHTML = discussionGroups.map(group => `<option value="${group.id}">${group.title}</option>`).join('');
    }
    if (leadersContainer) {
        leadersContainer.innerHTML = people.slice(0, 4).map((person, index) => `
            <article class="forum-leader-card">
                <a href="profile.html?id=${person.id}" class="forum-leader-main">
                    ${renderEntityMark(person.name, 'avatar')}
                    <span>
                        <strong>${person.name}</strong>
                        <small>${person.skills.slice(0, 2).join(', ')}</small>
                    </span>
                </a>
                <p>${index % 2 === 0 ? 'Available for peer advice and focused questions.' : 'Can help facilitate a respectful, practical discussion.'}</p>
                <button class="btn btn-outline btn-small" type="button" onclick="openPrivateMessage('${jsString(person.name)}')">Message</button>
            </article>
        `).join('');
    }
    if (container) {
        container.innerHTML = discussionGroups.map(group => `
            <a class="forum-group-card" href="discussion-group.html?group=${group.id}">
                <span>${group.members} members</span>
                <h3>${group.title}</h3>
                <p>${group.description}</p>
                <div class="post-tag-row">${group.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
            </a>
        `).join('');
    }
    if (threadsContainer) {
        threadsContainer.innerHTML = allThreads.map(thread => `
            <article class="thread-row">
                <div>
                    <span class="post-type-tag">${escapeHtml(thread.group.title)}</span>
                    <h3><a href="discussion-group.html?group=${thread.group.id}">${escapeHtml(thread.title)}</a></h3>
                    <p>${thread.replies || 0} replies | Last active ${thread.lastActive || 'Just now'}${thread.fileName ? ` | Attachment: ${escapeHtml(thread.fileName)}` : ''}</p>
                </div>
                <a class="btn btn-outline btn-small" href="discussion-group.html?group=${thread.group.id}">Open</a>
            </article>
        `).join('');
    }
    if (stats.length) {
        const totals = {
            groups: discussionGroups.length,
            threads: allThreads.length,
            members: discussionGroups.reduce((sum, group) => sum + group.members, 0)
        };
        stats.forEach(stat => {
            stat.textContent = totals[stat.dataset.forumStat] || '0';
        });
    }
}

function handleForumQuestionSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const groupId = form.querySelector('#forum-question-group').value;
    const group = discussionGroups.find(item => item.id === groupId) || discussionGroups[0];
    const fileInput = form.querySelector('#forum-question-file');
    const thread = {
        title: form.querySelector('#forum-question-title').value.trim(),
        type: form.querySelector('#forum-question-type').value,
        text: form.querySelector('#forum-question-body').value.trim(),
        replies: 0,
        lastActive: 'Just now',
        fileName: fileInput && fileInput.files[0] ? fileInput.files[0].name : '',
        group
    };
    const storedThreads = JSON.parse(localStorage.getItem('gloweForumThreads') || '[]');
    storedThreads.unshift(thread);
    localStorage.setItem('gloweForumThreads', JSON.stringify(storedThreads));
    saveCommunityPost({
        authorId: 'sample-user-6',
        title: thread.title,
        category: `${thread.type} | ${group.title}`,
        text: thread.text,
        tags: group.tags,
        audience: group.title
    });
    showSuccessModal('Question published', 'Your forum post is now visible in the forum and community feed.');
    form.reset();
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
    const params = new URLSearchParams(window.location.search);
    const group = discussionGroups.find(item => item.id === (params.get('group') || 'education')) || discussionGroups[0];
    const header = document.getElementById('discussion-group-header');
    const members = document.getElementById('discussion-member-list');
    const threads = document.getElementById('discussion-thread-list');
    const composer = document.getElementById('discussion-composer');
    if (!header || !members || !threads || !composer) return;

    header.innerHTML = `
        <span class="hero-kicker">Discussion group</span>
        <h1>${group.title}</h1>
        <p>${group.description}</p>
        <div class="post-tag-row">${group.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
        <div class="group-stats-row">
            <span>${group.members} members</span>
            <span>${group.posts} posts</span>
            <span>${group.threads.length} active threads</span>
        </div>
    `;
    members.innerHTML = people.slice(0, 5).map(person => `
        <div class="person-row">
            <a href="profile.html?id=${person.id}">
                ${renderEntityMark(person.name, 'avatar')}
                <span><strong>${person.name}</strong><small>${person.skills.slice(0, 2).join(', ')}</small></span>
            </a>
            <button type="button" onclick="openPrivateMessage('${jsString(person.name)}')">Message</button>
        </div>
    `).join('');
    threads.innerHTML = group.threads.map(thread => `
        <article class="thread-row">
            <div>
                <span class="post-type-tag">${thread.lastActive}</span>
                <h3>${thread.title}</h3>
                <p>${thread.replies} replies from members of ${group.title}.</p>
            </div>
            <button class="btn btn-outline btn-small" type="button" onclick="focusGroupReply()">Reply</button>
        </article>
    `).join('');
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

function handleDiscussionSubmit(event, groupId) {
    event.preventDefault();
    const group = discussionGroups.find(item => item.id === groupId) || discussionGroups[0];
    saveCommunityPost({
        authorId: 'sample-user-6',
        title: document.getElementById('discussion-title').value,
        category: `Discussion | ${group.title}`,
        text: document.getElementById('discussion-body').value,
        tags: group.tags,
        audience: group.title
    });
    showSuccessModal('Thread published', 'Your discussion thread now appears in the community feed and this group.');
    event.target.reset();
}

function initProfilePage() {
    const params = new URLSearchParams(window.location.search);
    const profile = getProfileById(params.get('id') || 'sample-org-1');
    const container = document.getElementById('profile-content');
    if (!container) return;
    if (!profile) {
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
        return;
    }

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
                                    <button class="btn btn-primary btn-small" type="button" onclick="showSupportModal(${wish.id})">Offer Support</button>
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
function initOpportunityDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const opportunityId = urlParams.get('id');
    
    if (!opportunityId) {
        window.location.href = 'volunteer-network.html';
        return;
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
    
    // Apply button
    const applyBtn = document.getElementById('apply-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            if (!isLoggedIn()) {
                sessionStorage.setItem('pendingOpportunityApplication', opportunityId);
                openModal('login-modal');
            } else {
                openModal('apply-modal');
            }
        });
    }
}

// Handle application submission
function handleApplicationSubmit(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const opportunityId = urlParams.get('id');
    
    const availability = document.getElementById('apply-availability').value;
    const skills = document.getElementById('apply-skills').value;
    const motivation = document.getElementById('apply-motivation').value;
    
    // Save application
    const applications = getApplications();
    const user = getCurrentUser();
    
    const newApplication = {
        id: Date.now(),
        opportunityId: opportunityId,
        userId: user.id,
        availability,
        skills,
        motivation,
        status: 'Pending',
        appliedAt: new Date().toISOString()
    };
    
    applications.push(newApplication);
    saveApplications(applications);
    if (window.gloweBackend && window.gloweBackend.configured()) {
        window.gloweBackend.insertOwned('applications', {
            opportunity_id: String(opportunityId),
            availability,
            skills,
            motivation,
            status: 'Pending'
        }).catch(() => {});
    }
    
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
                        <a href="#personal-saved">Saved</a>
                        <a href="#personal-activity">Activity</a>
                    </nav>
                </aside>

                <div class="personal-main">
                    ${renderBackendModeNotice()}
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

                        <article class="profile-section-card" id="personal-saved">
                            <div class="profile-section-heading">
                                <span>04</span>
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
                                <span>05</span>
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
    syncPersonalDataFromBackend().then((updated) => {
        if (updated) renderPersonalArea();
    });
}

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
    ensureGlobalUI();
    normalizeMainNavigation();
    if (localStorage.getItem('gloweLowDataMode') === 'true') {
        document.body.classList.add('low-data-mode');
    }
    // Determine which page we're on and initialize accordingly
    const path = window.location.pathname;
    
    if (path.endsWith('index.html') || path.endsWith('/') || path.endsWith('/app/')) {
        initFeaturedOpportunities();
    } else if (path.includes('opportunities.html') || path.includes('volunteer-network.html')) {
        initOpportunitiesPage();
    } else if (path.includes('organizations.html')) {
        initOrganizationsPage();
    } else if (path.includes('wishing-well.html')) {
        initWishingWellPage();
    } else if (path.includes('community.html')) {
        initCommunityPage();
    } else if (path.includes('write-post.html')) {
        initWritePostPage();
    } else if (path.includes('forums.html')) {
        initForumsPage();
    } else if (path.includes('saved.html')) {
        initSavedPage();
    } else if (path.includes('discussion-group.html')) {
        initDiscussionGroupPage();
    } else if (path.includes('profile.html')) {
        initProfilePage();
    } else if (path.includes('opportunity.html')) {
        initOpportunityDetailPage();
    } else if (path.includes('my-applications.html')) {
        initMyApplicationsPage();
    } else if (path.includes('admin.html')) {
        initAdminPage();
    }
});
