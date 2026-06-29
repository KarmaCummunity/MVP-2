// Sample data for the GloWe MVP.
const opportunities = [
    {
        id: 1,
        title: "Environmental Education Volunteer",
        organization: "Green Earth Initiative",
        orgIcon: "GE",
        location: "Tel Aviv & Remote",
        commitment: "Part-time",
        duration: "3 months",
        field: "environment",
        description: "Help create educational content about sustainable living practices and environmental conservation for our community outreach programs.",
        skills: ["Content Writing", "Education", "Research"],
        requirements: ["Passion for environmental conservation", "Strong written communication skills", "Ability to work independently", "4-6 hours per week availability"],
        responsibilities: ["Research and write articles on sustainability topics", "Create educational materials for schools", "Assist with social media content", "Participate in virtual team meetings"],
        featured: true
    },
    {
        id: 2,
        title: "Community Kitchen Assistant",
        organization: "Food For All Jaffa",
        orgIcon: "FA",
        location: "Jaffa, Israel",
        commitment: "Part-time",
        duration: "Ongoing",
        field: "community",
        description: "Join our team to help prepare and distribute meals to those in need in our local community. Make a direct impact on food security.",
        skills: ["Food Preparation", "Teamwork", "Physical Stamina"],
        requirements: ["Must be 18 years or older", "Ability to stand for extended periods", "Weekend availability preferred", "Food handling certification, training provided"],
        responsibilities: ["Assist with meal preparation", "Help with food distribution", "Maintain cleanliness in kitchen", "Engage warmly with community members"],
        featured: true
    },
    {
        id: 3,
        title: "Tech Support Mentor",
        organization: "Tech for Good",
        orgIcon: "TG",
        location: "Haifa & Remote",
        commitment: "Flexible",
        duration: "6 months",
        field: "education",
        description: "Help bridge the digital divide by mentoring seniors and underserved community members in basic technology skills.",
        skills: ["Tech Skills", "Patience", "Communication"],
        requirements: ["Proficiency with computers and smartphones", "Patient and supportive demeanor", "2-4 hours per week commitment", "Background check required"],
        responsibilities: ["Conduct one-on-one virtual mentoring sessions", "Create simple how-to guides", "Track student progress", "Report to program coordinator"],
        featured: true
    },
    {
        id: 4,
        title: "Wildlife Conservation Volunteer",
        organization: "Nature Guardians Galilee",
        orgIcon: "NG",
        location: "Galilee, Israel",
        commitment: "Project-based",
        duration: "2 months",
        field: "environment",
        description: "Join our team for hands-on wildlife conservation work including habitat restoration and species monitoring.",
        skills: ["Outdoor Skills", "Physical Fitness", "Data Collection"],
        requirements: ["Physical fitness for outdoor work", "Camping and hiking experience preferred", "Valid driver's license", "Commitment to full program duration"],
        responsibilities: ["Assist with habitat restoration projects", "Participate in wildlife surveys", "Maintain field equipment", "Document observations and data"],
        featured: false
    },
    {
        id: 5,
        title: "Youth Mentorship Program Volunteer",
        organization: "Future Leaders Initiative",
        orgIcon: "FL",
        location: "Jerusalem, Israel",
        commitment: "Part-time",
        duration: "1 year",
        field: "education",
        description: "Become a mentor to young people from underserved communities, helping them develop life skills and career readiness.",
        skills: ["Mentoring", "Leadership", "Communication"],
        requirements: ["Must be 21 years or older", "Background check required", "4 hours per week commitment", "Reliable transportation"],
        responsibilities: ["Meet with mentee weekly", "Attend monthly group activities", "Complete training program", "Track and report on mentee progress"],
        featured: true
    },
    {
        id: 6,
        title: "Graphic Designer for Social Campaigns",
        organization: "Voices for Change",
        orgIcon: "VC",
        location: "Remote",
        commitment: "Project-based",
        duration: "Varies",
        field: "advocacy",
        description: "Use your creative skills to design impactful graphics for social justice campaigns and awareness initiatives.",
        skills: ["Graphic Design", "Adobe Suite", "Social Media"],
        requirements: ["Portfolio demonstrating design skills", "Proficiency in design software", "Understanding of social issues", "Ability to meet deadlines"],
        responsibilities: ["Create social media graphics", "Design campaign materials", "Collaborate with campaign teams", "Adapt designs based on feedback"],
        featured: false
    }
];

const organizations = [
    {
        id: "sample-org-1",
        name: "Green Earth Initiative",
        icon: "GE",
        type: "NGO",
        status: "Approved",
        mission: "To protect and restore natural ecosystems through community-driven conservation projects and environmental education.",
        values: "Community stewardship, ecological responsibility, open learning, and care for shared natural spaces.",
        community: "Urban residents, youth groups, schools, and local volunteers who want practical ways to restore nearby ecosystems.",
        problem: "Many neighborhoods experience heat, limited green space, low biodiversity, and little access to hands-on environmental education.",
        solution: "Green Earth builds local restoration projects, trains volunteers, and turns environmental education into practical neighborhood action.",
        methods: "Field work, environmental education, community organizing, research partnerships, and nature-based restoration.",
        publicActions: "Open to professional volunteers, environmental educators, donors, schools, municipalities, and research partners.",
        measurement: "Tree survival rates, volunteer participation, school workshops, neighborhood feedback, and restored green areas.",
        learning: "Small recurring actions work better than one-time events when residents can see, maintain, and learn from the results.",
        collaboration: "Looking for volunteers for tree planting events, environmental educators, and research partners.",
        impactArea: "Climate & Environment",
        country: "Israel",
        location: "Tel Aviv, Israel",
        scope: "National",
        size: "21-50 people",
        volunteers: 89,
        opportunities: 8,
        website: "https://greenearth.org",
        email: "contact@greenearth.org",
        languages: ["English", "Hebrew"],
        projects: [
            { title: "Urban Forest Weekend Sprint", status: "Recruiting", description: "Planting 500 native trees in urban heat islands with local residents and youth groups." },
            { title: "Neighborhood Compost Labs", status: "Active", description: "Hands-on composting education with shared bins, signage, and field-tested lesson plans." }
        ]
    },
    {
        id: "sample-org-2",
        name: "Tech for Good",
        icon: "TG",
        type: "Impact Business",
        status: "Approved",
        mission: "Bridging the digital divide by providing technology education and resources to underserved communities.",
        values: "Accessible technology, practical learning, dignity, multilingual support, and ethical business with community value.",
        community: "Young people, unemployed adults, local educators, and community organizations working to expand digital access.",
        problem: "Many communities still lack affordable access to digital skills, mentors, equipment, and pathways into meaningful tech work.",
        solution: "Tech for Good runs bootcamps, scholarship tracks, and mentor-supported learning pathways that connect people to real digital opportunities.",
        methods: "Technology training, mentoring, curriculum design, partnerships, scholarships, and employee volunteering.",
        publicActions: "Open to mentors, curriculum partners, CSR collaborations, scholarship sponsors, and local implementation partners.",
        measurement: "Enrollment, completion, mentor matches, learner portfolios, job readiness, and follow-up participation after programs.",
        learning: "Learners stay engaged when training is connected to real community projects, personal mentoring, and practical next steps.",
        collaboration: "Seeking mentors, curriculum partners, and funders for inclusive digital literacy programs.",
        impactArea: "Technology & Innovation",
        country: "Israel",
        location: "Haifa, Israel",
        scope: "Regional",
        size: "11-20 people",
        volunteers: 52,
        opportunities: 6,
        website: "https://techforgood.example",
        email: "hello@techforgood.example",
        languages: ["English", "Hebrew", "Arabic"],
        projects: [
            { title: "Youth Digital Literacy Bootcamp", status: "Active", description: "A 6-week web app bootcamp for teens building their first community tools." },
            { title: "Code Academy Scholarships", status: "Funding", description: "Scholarships for unemployed youth entering an inclusive coding academy." }
        ]
    },
    {
        id: "sample-org-3",
        name: "Women Empowerment Network",
        icon: "WE",
        type: "Social Initiative",
        status: "Approved",
        mission: "Empowering women through education, economic opportunities, and community support to achieve gender equality.",
        values: "Women-led knowledge, safety, economic dignity, peer support, and practical pathways to independence.",
        community: "Women entrepreneurs, young women, mothers, mentors, and local partners building stronger community support systems.",
        problem: "Many women-led ideas remain under-resourced because access to training, networks, safe spaces, and economic support is uneven.",
        solution: "The initiative creates learning circles, mentorship, shared workspaces, and practical support for women-led microbusinesses.",
        methods: "Peer learning, mentorship, community facilitation, entrepreneurship training, storytelling, and partnership building.",
        publicActions: "Open to mentors, facilitators, business partners, volunteers, and organizations that can host or support local circles.",
        measurement: "Number of women participating, mentor matches, businesses supported, peer sessions completed, and participant feedback.",
        learning: "Trust grows through small consistent groups, and economic support works best when paired with belonging and practical mentoring.",
        collaboration: "Seeking a strategic partner to co-design curriculum for a women entrepreneurs hub.",
        impactArea: "Gender Equality",
        country: "Israel",
        location: "Jerusalem, Israel",
        scope: "National",
        size: "6-10 people",
        volunteers: 44,
        opportunities: 3,
        website: "https://womenempower.example",
        email: "team@womenempower.example",
        languages: ["English", "Hebrew"],
        projects: [
            { title: "Women Entrepreneurs Hub", status: "Planning", description: "A co-working, training, and mentorship space for women-led microbusinesses." }
        ]
    }
];

const people = [
    {
        id: "sample-user-1",
        name: "Sarah Cohen",
        avatar: "SC",
        type: "Professional Volunteer",
        location: "Tel Aviv, Israel",
        availability: "3-5 hours / month",
        bio: "Community organizer focused on climate campaigns, neighborhood action, and storytelling for change.",
        values: "Mentoring, campaign strategy, community listening, and helping local teams tell their story clearly.",
        community: "Climate initiatives, youth groups, neighborhood organizers, and small NGOs that need practical campaign support.",
        problem: "Local initiatives often have powerful field knowledge but limited time to shape it into clear campaigns or public stories.",
        solution: "Sarah can help teams turn field experience into campaign plans, volunteer journeys, and simple storytelling materials.",
        methods: "Mentoring, community organizing, campaign planning, facilitation, storytelling, and social media guidance.",
        publicActions: "Open to remote mentoring, campaign reviews, and short focused support for climate and community projects.",
        measurement: "Clearer campaign goals, reusable content plans, volunteer sign-ups, and feedback from the teams she supports.",
        learning: "The best support starts with listening to what local teams already know before suggesting tools or messages.",
        skills: ["Community Building", "Storytelling", "Campaigns"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Community Climate Campaign", status: "Needs media support", description: "A mini documentary and social campaign about shoreline restoration volunteers." }]
    },
    {
        id: "sample-user-2",
        name: "David Levi",
        avatar: "DL",
        type: "Individual",
        location: "Jerusalem, Israel",
        availability: "Evenings",
        bio: "Wellbeing facilitator building practical workshops around food, mental health, and daily resilience.",
        skills: ["Workshop Design", "Health", "Facilitation"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Healthy Meal Prep Workshop", status: "Active", description: "Affordable weekly meal prep training for families and students." }]
    },
    {
        id: "sample-user-3",
        name: "Maya Goldberg",
        avatar: "MG",
        type: "Individual",
        location: "Haifa, Israel",
        availability: "Flexible",
        bio: "Educator and mentor helping young people access digital skills, books, and safe learning spaces.",
        skills: ["Education", "Mentoring", "Program Design"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Youth Digital Literacy Program", status: "Recruiting mentors", description: "Mentor-supported sessions where teens build their first web apps." }]
    },
    {
        id: "sample-user-4",
        name: "Yaron Shapira",
        avatar: "YS",
        type: "Individual",
        location: "Central Israel",
        availability: "Project-based",
        bio: "Urban mobility advocate working on safer streets, local business support, and civic engagement.",
        skills: ["Advocacy", "Research", "Partnerships"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Bike Lanes Petition", status: "Collecting signatures", description: "Community campaign for safer bike lanes on major city roads." }]
    },
    {
        id: "sample-user-5",
        name: "Dr. Rachel Green",
        avatar: "RG",
        type: "Individual",
        location: "Eilat, Israel",
        availability: "Project-based",
        bio: "Environmental scientist and sustainability consultant. Let's work together for a greener future.",
        skills: ["Research", "Data Analysis", "Environmental Science"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Composting Workshop Network", status: "Needs equipment", description: "Free workshops that teach households to turn food scraps into soil." }]
    }
];

const wishes = [
    { id: 1, type: "Volunteers Needed", icon: "VN", title: "Volunteers for Urban Forest Weekend Sprint", author: "Green Earth Initiative", authorId: "sample-org-1", authorIcon: "GE", time: "6 hours ago", location: "Tel Aviv, Israel", areas: ["Climate", "Community Building"], description: "We are planting 500 native trees in an urban heat island and need hands-on volunteers plus a donation of garden tools." },
    { id: 2, type: "Looking for Mentors", icon: "LM", title: "Mentors for Youth Digital Literacy Program", author: "Maya Goldberg", authorId: "sample-user-3", authorIcon: "MG", time: "1 day ago", location: "Haifa, Israel (Hybrid)", areas: ["Education", "Tech for Good"], description: "Looking for tech mentors to guide teens in creating their first web apps during a 6-week bootcamp." },
    { id: 3, type: "Partnership Opportunity", icon: "PO", title: "Seeking Partner for Women Entrepreneurs Hub", author: "Women Empowerment Network", authorId: "sample-org-3", authorIcon: "WE", time: "2 days ago", location: "Jerusalem, Israel", areas: ["Social Justice", "Economic Inclusion"], description: "We are launching a new co-working and training hub and seeking a strategic partner to co-design the curriculum." },
    { id: 4, type: "Equipment / Space", icon: "ES", title: "Composting Workshop Equipment Needed", author: "Dr. Rachel Green", authorId: "sample-user-5", authorIcon: "RG", time: "3 days ago", location: "Eilat, Israel", areas: ["Climate", "Community Building"], description: "I am teaching free composting workshops and need bins, signage, and a projector to reach more neighborhoods." },
    { id: 5, type: "Funding Support", icon: "FS", title: "Funding Partners for Code Academy Scholarships", author: "Tech for Good", authorId: "sample-org-2", authorIcon: "TG", time: "5 days ago", location: "Haifa & Online", areas: ["Tech for Good", "Education"], description: "Seeking funding partners to sponsor 50 scholarships for our inclusive coding bootcamp for unemployed youth." },
    { id: 6, type: "Visibility / Media", icon: "VM", title: "Storytelling Support for Community Climate Campaign", author: "Sarah Cohen", authorId: "sample-user-1", authorIcon: "SC", time: "5 days ago", location: "Central Israel / Remote", areas: ["Climate", "Community Building"], description: "Looking for a media partner to help craft a mini documentary about our shoreline restoration volunteers." }
];

organizations.push(
    {
        id: "sample-org-4",
        name: "Health Access Collective",
        icon: "HA",
        type: "NGO",
        status: "Approved",
        mission: "Improving access to preventive healthcare, mental health support, and community-based wellness education.",
        collaboration: "Seeking medical volunteers, translators, workshop facilitators, and corporate partners for mobile clinics.",
        impactArea: "Health & Wellbeing",
        country: "Israel",
        location: "Be'er Sheva, Israel",
        scope: "Regional",
        size: "21-50 people",
        volunteers: 73,
        opportunities: 5,
        website: "https://healthaccess.example",
        email: "hello@healthaccess.example",
        languages: ["English", "Hebrew", "Arabic", "Russian"],
        projects: [
            { title: "Mobile Preventive Clinic", status: "Recruiting", description: "Weekly pop-up clinic offering basic checks and health navigation in underserved neighborhoods." },
            { title: "Mental Health First Response", status: "Training", description: "Short practical training for community volunteers supporting people under stress." }
        ]
    },
    {
        id: "sample-org-5",
        name: "Circular Repair Lab",
        icon: "CR",
        type: "Social Enterprise",
        status: "Approved",
        mission: "Turning waste streams into useful products while training young people in repair, design, and circular economy skills.",
        collaboration: "Looking for repair volunteers, product designers, schools, and companies with reusable material streams.",
        impactArea: "Circular Economy",
        country: "Israel",
        location: "Jaffa, Israel",
        scope: "Local",
        size: "11-20 people",
        volunteers: 31,
        opportunities: 4,
        website: "https://circularrepair.example",
        email: "studio@circularrepair.example",
        languages: ["English", "Hebrew", "Arabic"],
        projects: [
            { title: "Repair Cafe Network", status: "Active", description: "Monthly repair events where residents learn to fix appliances, textiles, and bikes." },
            { title: "School Upcycling Kits", status: "Needs sponsors", description: "Hands-on classroom kits built from safe reused materials." }
        ]
    },
    {
        id: "sample-org-6",
        name: "Open Learning Bridge",
        icon: "OL",
        type: "Education NGO",
        status: "Approved",
        mission: "Creating multilingual learning pathways for displaced learners, new immigrants, and young people without stable access to formal education.",
        collaboration: "Seeking translators, tutors, curriculum reviewers, and partners who can host learning hubs.",
        impactArea: "Education",
        country: "Global",
        location: "Remote / Global",
        scope: "Global",
        size: "51-100 people",
        volunteers: 146,
        opportunities: 12,
        website: "https://openlearningbridge.example",
        email: "partners@openlearningbridge.example",
        languages: ["English", "Hebrew", "Arabic", "Spanish", "French"],
        projects: [
            { title: "Learning Hub Starter Pack", status: "Scaling", description: "A practical kit for communities opening small learning spaces with limited internet." },
            { title: "Volunteer Tutor Circle", status: "Recruiting", description: "Remote tutors supporting weekly language and math sessions." }
        ]
    },
    {
        id: "sample-org-7",
        name: "Safe Streets Alliance",
        icon: "SS",
        type: "Civic Initiative",
        status: "Approved",
        mission: "Helping residents, planners, and local businesses co-create safer, greener streets and accessible mobility.",
        collaboration: "Seeking policy researchers, mapping volunteers, local business champions, and media partners.",
        impactArea: "Civic Innovation",
        country: "Israel",
        location: "Central Israel",
        scope: "National",
        size: "6-10 people",
        volunteers: 24,
        opportunities: 3,
        website: "https://safestreets.example",
        email: "team@safestreets.example",
        languages: ["English", "Hebrew"],
        projects: [
            { title: "School Zone Mapping", status: "Active", description: "Mapping unsafe crossings near schools and preparing citizen reports for municipalities." }
        ]
    },
    {
        id: "sample-org-8",
        name: "Impact Retail Partners",
        icon: "IR",
        type: "Business / CSR Partner",
        status: "Approved",
        mission: "Connecting retail teams, logistics capacity, and employee volunteering with urgent community needs.",
        collaboration: "Looking for verified NGOs that need distribution support, employee volunteer days, and donation matching.",
        impactArea: "Business-Social Collaboration",
        country: "Israel",
        location: "Ramat Gan, Israel",
        scope: "National",
        size: "101-500 people",
        volunteers: 210,
        opportunities: 7,
        website: "https://impactretail.example",
        email: "csr@impactretail.example",
        languages: ["English", "Hebrew"],
        projects: [
            { title: "Employee Volunteer Days", status: "Open for partners", description: "CSR teams matched with verified community projects for high-trust field days." },
            { title: "Emergency Distribution Support", status: "Ready", description: "Logistics and warehouse help for urgent donation movement." }
        ]
    },
    {
        id: "sample-org-9",
        name: "Food Resilience Network",
        icon: "FR",
        type: "Coalition",
        status: "Approved",
        mission: "Building local food security through community kitchens, surplus recovery, and neighborhood emergency preparedness.",
        collaboration: "Seeking kitchens, drivers, nutritionists, donor partners, and local coordinators.",
        impactArea: "Food Security",
        country: "Israel",
        location: "Jerusalem, Israel",
        scope: "Regional",
        size: "21-50 people",
        volunteers: 118,
        opportunities: 9,
        website: "https://foodresilience.example",
        email: "ops@foodresilience.example",
        languages: ["English", "Hebrew", "Arabic"],
        projects: [
            { title: "Neighborhood Meal Circles", status: "Recruiting", description: "Volunteer-led meal preparation and delivery for families during difficult weeks." },
            { title: "Surplus Food Map", status: "Pilot", description: "Mapping businesses that can safely donate surplus food." }
        ]
    }
);

people.push(
    {
        id: "sample-user-6",
        name: "Noa Ben Ami",
        avatar: "NB",
        type: "Volunteer",
        location: "Ramat Gan, Israel",
        availability: "Weekdays",
        bio: "Grant writer and nonprofit strategist helping organizations turn field work into fundable proposals.",
        skills: ["Grant Writing", "Budget Planning", "Theory of Change"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Rapid Grant Clinic", status: "Available", description: "Two-hour sessions to shape grant narratives, budgets, and partner letters." }]
    },
    {
        id: "sample-user-7",
        name: "Omar Haddad",
        avatar: "OH",
        type: "Volunteer",
        location: "Nazareth, Israel",
        availability: "Evenings",
        bio: "Arabic-Hebrew-English translator focused on health, education, and emergency information access.",
        skills: ["Translation", "Community Outreach", "Accessibility"],
        languages: ["Arabic", "Hebrew", "English"],
        projects: [{ title: "Multilingual Health Guides", status: "Translating", description: "Plain-language health guides for families and community workers." }]
    },
    {
        id: "sample-user-8",
        name: "Lior Shaked",
        avatar: "LS",
        type: "Volunteer",
        location: "Tel Aviv, Israel",
        availability: "Project-based",
        bio: "Product designer helping social initiatives improve onboarding, service flows, and trust-building pages.",
        skills: ["UX Research", "Product Design", "Accessibility"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Volunteer Onboarding Audit", status: "Open", description: "A lightweight UX review for organizations that lose applicants during signup." }]
    },
    {
        id: "sample-user-9",
        name: "Aisha Rahman",
        avatar: "AR",
        type: "Community Manager",
        location: "Remote / Global",
        availability: "Flexible",
        bio: "Community builder supporting online groups, moderation systems, and safe participation in multilingual spaces.",
        skills: ["Moderation", "Community Design", "Conflict Resolution"],
        languages: ["English", "Arabic", "French"],
        projects: [{ title: "Safe Forum Playbook", status: "Drafting", description: "Guidelines for healthy discussion spaces and moderator escalation paths." }]
    },
    {
        id: "sample-user-10",
        name: "Tomer Azulay",
        avatar: "TA",
        type: "Business Volunteer",
        location: "Herzliya, Israel",
        availability: "Monthly",
        bio: "Operations manager offering logistics planning and employee-volunteer coordination for urgent community needs.",
        skills: ["Operations", "Logistics", "CSR Programs"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "CSR Volunteer Day Template", status: "Ready", description: "A repeatable plan for companies joining one-day community projects." }]
    },
    {
        id: "sample-user-11",
        name: "Elena Moroz",
        avatar: "EM",
        type: "Volunteer",
        location: "Haifa, Israel",
        availability: "Weekends",
        bio: "Data analyst helping NGOs measure impact, clean spreadsheets, and create dashboards for donors.",
        skills: ["Data Analysis", "Dashboards", "Impact Metrics"],
        languages: ["English", "Hebrew", "Russian"],
        projects: [{ title: "Impact Dashboard Sprint", status: "Available", description: "A weekend sprint to define metrics and build a simple reporting dashboard." }]
    },
    {
        id: "sample-user-12",
        name: "Nadav Perry",
        avatar: "NP",
        type: "Volunteer",
        location: "Jerusalem, Israel",
        availability: "Evenings",
        bio: "Law student supporting NGOs with basic policy research, rights information, and plain-language forms.",
        skills: ["Legal Research", "Policy", "Plain Language"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Rights Resource Review", status: "Open", description: "Reviewing community resource pages for clarity and legal sensitivity." }]
    },
    {
        id: "sample-user-13",
        name: "Miriam Katz",
        avatar: "MK",
        type: "Volunteer",
        location: "Netanya, Israel",
        availability: "Flexible",
        bio: "Retired teacher and mentor supporting literacy, tutoring circles, and intergenerational volunteering.",
        skills: ["Tutoring", "Mentoring", "Curriculum Support"],
        languages: ["English", "Hebrew"],
        projects: [{ title: "Reading Buddies", status: "Recruiting", description: "Weekly reading support for children and new immigrant families." }]
    }
);

wishes.push(
    { id: 7, type: "Funding Support", icon: "FS", title: "Grant Writer for Mobile Preventive Clinic", author: "Health Access Collective", authorId: "sample-org-4", authorIcon: "HA", time: "2 hours ago", location: "Be'er Sheva, Israel", areas: ["Health", "Community Building"], description: "We need help preparing a concise grant proposal and budget for a mobile preventive clinic serving low-access neighborhoods." },
    { id: 8, type: "Knowledge Sharing", icon: "KS", title: "Repair Cafe Toolkit Translation", author: "Circular Repair Lab", authorId: "sample-org-5", authorIcon: "CR", time: "8 hours ago", location: "Jaffa / Remote", areas: ["Climate", "Education"], description: "Looking for volunteers to translate and adapt our repair event toolkit into Arabic and English." },
    { id: 9, type: "Volunteers Needed", icon: "VN", title: "Remote Tutors for Learning Hub Starter Pack", author: "Open Learning Bridge", authorId: "sample-org-6", authorIcon: "OL", time: "12 hours ago", location: "Remote / Global", areas: ["Education", "Community Building"], description: "Seeking tutors for weekly language and math sessions with small groups of displaced learners." },
    { id: 10, type: "Partnership Opportunity", icon: "PO", title: "CSR Partner for Employee Volunteer Days", author: "Impact Retail Partners", authorId: "sample-org-8", authorIcon: "IR", time: "1 day ago", location: "Ramat Gan, Israel", areas: ["Business-Social Collaboration", "Community Building"], description: "We are matching employee teams with verified NGOs and need organizations ready to host meaningful one-day field activities." },
    { id: 11, type: "Equipment / Space", icon: "ES", title: "Small Kitchen Space for Neighborhood Meal Circles", author: "Food Resilience Network", authorId: "sample-org-9", authorIcon: "FR", time: "1 day ago", location: "Jerusalem, Israel", areas: ["Food Security", "Community Building"], description: "Looking for a certified kitchen or community space for weekly meal preparation and safe distribution." },
    { id: 12, type: "Visibility / Media", icon: "VM", title: "Media Pack for School Zone Mapping", author: "Safe Streets Alliance", authorId: "sample-org-7", authorIcon: "SS", time: "2 days ago", location: "Central Israel", areas: ["Civic Innovation", "Community Building"], description: "Need help turning resident mapping data into a clear campaign deck, social posts, and press-ready visuals." },
    { id: 13, type: "Looking for Mentors", icon: "LM", title: "Impact Dashboard Mentoring for Small NGOs", author: "Elena Moroz", authorId: "sample-user-11", authorIcon: "EM", time: "3 days ago", location: "Haifa / Remote", areas: ["Tech for Good", "Knowledge Sharing"], description: "Offering a pilot dashboard sprint and looking for two NGOs that want to define simple impact metrics." },
    { id: 14, type: "Open Call", icon: "OC", title: "Community Moderators for Safe Forum Pilot", author: "Aisha Rahman", authorId: "sample-user-9", authorIcon: "AR", time: "3 days ago", location: "Remote / Global", areas: ["Community Building", "Knowledge Sharing"], description: "Looking for experienced facilitators to test moderation guidelines for multilingual topic groups." },
    { id: 15, type: "Resource Request", icon: "RR", title: "Data Cleanup Help for Food Donation Map", author: "Food Resilience Network", authorId: "sample-org-9", authorIcon: "FR", time: "4 days ago", location: "Jerusalem / Remote", areas: ["Food Security", "Tech for Good"], description: "We have spreadsheet data from businesses willing to donate surplus food and need help cleaning it for a public map." },
    { id: 16, type: "Project Spotlight", icon: "PS", title: "Reading Buddies Looking for Partner Schools", author: "Miriam Katz", authorId: "sample-user-13", authorIcon: "MK", time: "5 days ago", location: "Netanya, Israel", areas: ["Education", "Community Building"], description: "A volunteer reading support circle is ready to expand and is looking for schools or community centers to host sessions." }
);

const wishTypeStyles = {
    "Call for Help": { label: "Call for Help", color: "#F9C8D9" },
    "Volunteers Needed": { label: "Volunteers Needed", color: "#C4E3C1" },
    "Resource Request": { label: "Resource Request", color: "#FCF0D9" },
    "Partnership Opportunity": { label: "Looking for Collaboration", color: "#D4C1E0" },
    "Looking for Mentors": { label: "Looking for Mentors", color: "#AED9E0" },
    "Funding Support": { label: "Support Needed", color: "#AEC9D3" },
    "Knowledge Sharing": { label: "Sharing Knowledge", color: "#FCF0D9" },
    "Call for Collaboration": { label: "Call for Collaboration", color: "#D4C1E0" },
    "Open Call": { label: "Open Call", color: "#E9C9CE" },
    "Equipment / Space": { label: "Equipment / Space", color: "#FFE6BB" },
    "Visibility / Media": { label: "Media & Visibility", color: "#DECFE2" },
    "Project Spotlight": { label: "Project Spotlight", color: "#9BB4C7" },
    "We're Hiring": { label: "We're Hiring", color: "#FFE6BB" }
};

const impactSignals = [
    { category: "Collaboration", tag: "Joint Projects", metric: "Projects created or managed in partnership" },
    { category: "Active Account", tag: "Shared Content", metric: "Posts, articles, videos, and comments published" },
    { category: "Expert Writer", tag: "Professional Knowledge", metric: "Professional posts or articles shared" },
    { category: "Leading Volunteer", tag: "Volunteer Hours", metric: "Hours of consulting, mentoring, or activity" },
    { category: "Active Learner", tag: "Knowledge Discovery", metric: "Articles, pages, and projects explored" },
    { category: "Community Bridge", tag: "Connections Made", metric: "People and organizations introduced to one another" },
    { category: "Documented Impact", tag: "Case Studies", metric: "Success stories with impact evidence" },
    { category: "Diversity & Inclusion", tag: "Diverse Collaborations", metric: "Cross-community, cross-country, or cross-sector collaborations" }
];

const dailyActions = [
    {
        label: "Try a support action",
        title: "Offer support to the Urban Forest Sprint",
        description: "Open a real-looking wish, read the context, and send a structured support offer.",
        cta: "Open Wish",
        href: "pages/wishing-well.html"
    },
    {
        label: "Browse an opportunity",
        title: "Mentors for Youth Digital Literacy",
        description: "See how a volunteer role can be presented with skills, location, commitment, and next steps.",
        cta: "See Match",
        href: "pages/wishing-well.html"
    },
    {
        label: "Share practical knowledge",
        title: "Document one field lesson",
        description: "Write a post in the community feed and choose whether it is knowledge, a connection request, an event, or a success story.",
        cta: "Share Knowledge",
        href: "pages/community.html"
    }
];

const smartMatches = [
    {
        score: 94,
        type: "Collaboration",
        title: "Green Earth Initiative ↔ Dr. Rachel Green",
        reason: "Shared climate focus, practical field knowledge, and overlapping composting education needs.",
        action: "Connect"
    },
    {
        score: 88,
        type: "Mentorship",
        title: "Tech for Good ↔ Maya Goldberg",
        reason: "Youth education, digital literacy, and mentor recruitment are aligned with active projects.",
        action: "Connect"
    },
    {
        score: 82,
        type: "Visibility",
        title: "Sarah Cohen ↔ Community Climate Campaign",
        reason: "Storytelling and media capacity can amplify a climate project that needs public reach.",
        action: "Connect"
    }
];

const appliedPlaybooks = [
    {
        area: "Emergency Coordination",
        title: "Rapid Volunteer Coordination",
        description: "A low-bandwidth checklist for matching volunteers, resources, and urgent local needs during crisis conditions."
    },
    {
        area: "Food Security",
        title: "Community Kitchen Starter",
        description: "Action-ready steps for organizing food preparation, distribution, and partner roles."
    },
    {
        area: "Education",
        title: "Displaced Learners Support",
        description: "A practical guide for maintaining learning continuity with limited connectivity and volunteer mentors."
    }
];

const distributionChannels = [
    {
        title: "Quick Social Sharing",
        description: "Use share buttons for Facebook, LinkedIn, X, and WhatsApp on sample wishes and community posts.",
        cta: "Create share pack"
    },
    {
        title: "Campaign Draft",
        description: "Open a draft flow that helps shape audience, message, channels, and rhythm before publishing.",
        cta: "Generate campaign"
    },
    {
        title: "Distribution Notes",
        description: "Use the workspace to discuss how each post could be shared responsibly by topic, urgency, and audience.",
        cta: "View sharing plan"
    }
];

const grantRecommendations = [
    {
        fund: "Green Futures Microgrants",
        fit: 96,
        focus: "Climate education and urban resilience",
        deadline: "June 18, 2026",
        nextStep: "Draft a 700-word project summary"
    },
    {
        fund: "Digital Inclusion Partnership Fund",
        fit: 91,
        focus: "Youth skills, mentoring, and digital access",
        deadline: "July 4, 2026",
        nextStep: "Prepare budget and mentor plan"
    },
    {
        fund: "Women-led Enterprise Catalyst",
        fit: 87,
        focus: "Women entrepreneurs and local economic inclusion",
        deadline: "Rolling applications",
        nextStep: "Create partner letter template"
    }
];

const engagementTools = [
    { title: "Topic Groups", description: "Discussion groups for education, environment, health, technology, and community resilience." },
    { title: "Private Messaging", description: "Direct chat between volunteers, organizations, businesses, and community managers." },
    { title: "Project Feedback", description: "Comments, recommendations, and public endorsements on active projects and profiles." },
    { title: "Tags & Search", description: "Use clear tags to filter content by interest, language, geography, organization size, and sector." },
    { title: "Events & Webinars", description: "Registration flows for professional sessions, courses, community meetings, and partner briefings." },
    { title: "Social Marketplace", description: "A future shop for products and services from social organizations, with direct project support." }
];

const rewardLeaders = [
    { name: "Green Earth Initiative", score: 1840, badge: "Monthly Impact Leader", reason: "High volunteer response, documented field activity, and cross-sector collaboration." },
    { name: "Tech for Good", score: 1610, badge: "Knowledge Builder", reason: "Shared practical guides, mentor recruitment, and strong education outcomes." },
    { name: "Women Empowerment Network", score: 1435, badge: "Collaboration Champion", reason: "New partnership requests, community engagement, and active funding preparation." }
];

const userRoleBlueprint = [
    { role: "Admins", permissions: "Approve users, review content, manage safety, track analytics, and support platform operations." },
    { role: "Community Managers", permissions: "Moderate groups, approve tags, answer community questions, and encourage meaningful participation." },
    { role: "Active Members", permissions: "Manage profiles, publish content, join groups, post opportunities, and receive engagement analytics." },
    { role: "Volunteers", permissions: "Create skill profiles, apply to projects, advise organizations, translate content, and receive recommendations." },
    { role: "Businesses", permissions: "Create CSR/ESG profiles, partner with NGOs, involve employees, and access impact indicators." },
    { role: "Visitors", permissions: "Browse public content, search organizations, read success stories, contact listed organizations, and join the newsletter." }
];

const businessModelItems = [
    "Monthly or annual subscriptions for organizations that need advanced tools.",
    "Success fees for structured NGO-business partnerships.",
    "Premium distribution services for organizations that need stronger campaign reach."
];

const roadmapPhases = [
    { phase: "Phase 1", title: "MVP Workspace", focus: "Landing page, organization registration, basic profiles, search, and first matching engine." },
    { phase: "Phase 2", title: "Engagement & Knowledge", focus: "Posts, groups, chat, professional forums, and a practical knowledge library." },
    { phase: "Phase 3", title: "Businesses & Funding", focus: "Partnership marketplace, commission flows, grant recommendations, and strategic partner onboarding." }
];

const postTopics = [
    {
        id: "knowledge",
        label: "Knowledge Share",
        description: "Share a practical lesson, model, method, or field insight others can adapt.",
        prompt: "What did you learn, where did it work, and how can another organization apply it?"
    },
    {
        id: "connection",
        label: "Connection Request",
        description: "Ask for a partner, mentor, donor, volunteer, business collaborator, or expert.",
        prompt: "Who are you looking for, what do you need from them, and what is the next step?"
    },
    {
        id: "success",
        label: "Success Story",
        description: "Tell the community how a collaboration, grant, event, or project created impact.",
        prompt: "What changed, who helped, and what can others learn from the story?"
    },
    {
        id: "event",
        label: "Event / Webinar",
        description: "Publish a meeting, webinar, course, community gathering, or professional session.",
        prompt: "What is happening, who should join, when is it, and where do people register?"
    },
    {
        id: "grant",
        label: "Grant / Open Call",
        description: "Share funding, awards, fellowships, calls for proposals, or partnership opportunities.",
        prompt: "Who is eligible, what is the deadline, and what should applicants prepare?"
    },
    {
        id: "guide",
        label: "Professional Guide",
        description: "Write a practical tool, checklist, template, or how-to guide for the community.",
        prompt: "What problem does this guide solve, and what steps should readers follow?"
    },
    {
        id: "discussion",
        label: "Community Discussion",
        description: "Start a focused conversation in a topic group such as education, environment, health, or rights.",
        prompt: "What question should the community discuss, and what kind of answers are useful?"
    }
];

const communityPosts = [
    { authorId: "sample-user-5", title: "Smart Home Energy Saving Tips", category: "Sharing Knowledge", text: "Reduce your electricity bill and carbon footprint with practical smart home habits. Small changes can create big impact." },
    { authorId: "sample-user-1", title: "Tree Planting Day - Help Green Our City", category: "Volunteers Needed", text: "Planting 100 trees next month. We need volunteers to help dig, plant, and water." },
    { authorId: "sample-user-4", title: "Petition for More Bike Lanes in Our City", category: "Open Call", text: "Let's make our city more bike-friendly with safe lanes on major roads." },
    { authorId: "sample-user-2", title: "Free Mental Health Workshop Next Week", category: "Event", text: "A free workshop on stress management and mindfulness techniques for anyone feeling overwhelmed." },
    { authorId: "sample-user-3", title: "Looking for Volunteers to Teach Coding to Kids", category: "Volunteers Needed", text: "Our after-school program needs patient volunteers to teach basic coding to elementary school students." }
];

opportunities.push(
    {
        id: 7,
        title: "Grant Proposal Sprint Partner",
        organization: "Health Access Collective",
        orgIcon: "HA",
        location: "Remote",
        commitment: "Project-based",
        duration: "2 weeks",
        field: "community",
        description: "Help turn a mobile clinic plan into a donor-ready proposal, including needs statement, activity plan, and budget notes.",
        skills: ["Grant Writing", "Budget Planning", "Healthcare"],
        requirements: ["Experience with nonprofit proposals", "Comfort editing English copy", "Two review calls over two weeks"],
        responsibilities: ["Review project materials", "Draft proposal summary", "Prepare budget checklist", "Suggest funder-fit improvements"],
        featured: true
    },
    {
        id: 8,
        title: "Arabic-English Toolkit Translator",
        organization: "Circular Repair Lab",
        orgIcon: "CM",
        location: "Remote",
        commitment: "Flexible",
        duration: "1 month",
        field: "education",
        description: "Translate and adapt repair-event guides so more communities can run safe, practical circular economy workshops.",
        skills: ["Translation", "Plain Language", "Sustainability"],
        requirements: ["Arabic and English fluency", "Attention to accessibility", "Interest in repair culture"],
        responsibilities: ["Translate toolkit sections", "Flag unclear steps", "Suggest culturally relevant examples"],
        featured: false
    },
    {
        id: 9,
        title: "Remote Learning Hub Tutor",
        organization: "Open Learning Bridge",
        orgIcon: "OL",
        location: "Remote",
        commitment: "Part-time",
        duration: "3 months",
        field: "education",
        description: "Tutor small groups of learners in language, math, or digital basics using low-bandwidth lesson packs.",
        skills: ["Tutoring", "Mentoring", "Education"],
        requirements: ["Weekly 90-minute availability", "Patient communication", "Experience with youth or adult learners"],
        responsibilities: ["Run online tutoring sessions", "Share progress notes", "Adapt simple exercises to learner needs"],
        featured: true
    },
    {
        id: 10,
        title: "CSR Volunteer Day Coordinator",
        organization: "Impact Retail Partners",
        orgIcon: "IR",
        location: "Ramat Gan, Israel",
        commitment: "Project-based",
        duration: "6 weeks",
        field: "community",
        description: "Coordinate employee volunteer days between business teams and verified community projects.",
        skills: ["Operations", "Event Coordination", "CSR"],
        requirements: ["Strong coordination skills", "Hebrew and English preferred", "Availability for planning calls"],
        responsibilities: ["Match teams to projects", "Prepare day-of plans", "Collect impact feedback"],
        featured: true
    },
    {
        id: 11,
        title: "Food Donation Data Mapper",
        organization: "Food Resilience Network",
        orgIcon: "FR",
        location: "Remote",
        commitment: "Flexible",
        duration: "4 weeks",
        field: "community",
        description: "Clean and organize food donation data so local coordinators can identify nearby kitchens, donors, and drivers.",
        skills: ["Spreadsheets", "Data Cleanup", "Food Security"],
        requirements: ["Comfort with spreadsheets", "Careful attention to privacy", "2-3 hours per week"],
        responsibilities: ["Clean contact records", "Group donors by area", "Prepare simple map-ready exports"],
        featured: false
    },
    {
        id: 12,
        title: "School Zone Mapping Researcher",
        organization: "Safe Streets Alliance",
        orgIcon: "SS",
        location: "Central Israel",
        commitment: "Part-time",
        duration: "2 months",
        field: "advocacy",
        description: "Support citizen research on unsafe crossings near schools and help prepare municipal reports.",
        skills: ["Research", "Mapping", "Policy"],
        requirements: ["Interest in urban safety", "Ability to document observations", "Basic spreadsheet skills"],
        responsibilities: ["Review resident reports", "Map high-risk locations", "Summarize evidence for advocacy use"],
        featured: false
    },
    {
        id: 13,
        title: "UX Review for NGO Onboarding",
        organization: "Open Learning Bridge",
        orgIcon: "OL",
        location: "Remote",
        commitment: "Project-based",
        duration: "10 days",
        field: "education",
        description: "Review learner and volunteer onboarding flows and recommend trust-building improvements.",
        skills: ["UX Research", "Accessibility", "Product Design"],
        requirements: ["Experience reviewing digital flows", "Ability to produce concise recommendations", "One kickoff call"],
        responsibilities: ["Audit onboarding pages", "Identify friction points", "Suggest quick wins and longer-term improvements"],
        featured: false
    },
    {
        id: 14,
        title: "Community Mental Health Workshop Facilitator",
        organization: "Health Access Collective",
        orgIcon: "HA",
        location: "Be'er Sheva, Israel",
        commitment: "Part-time",
        duration: "2 months",
        field: "community",
        description: "Facilitate practical stress-management sessions for community workers and local volunteers.",
        skills: ["Facilitation", "Mental Health", "Workshop Design"],
        requirements: ["Relevant wellbeing or facilitation background", "Trauma-aware approach", "Hebrew or Arabic preferred"],
        responsibilities: ["Prepare workshop materials", "Lead small group sessions", "Collect anonymous feedback"],
        featured: true
    }
);

communityPosts.push(
    { authorId: "sample-org-4", title: "What We Learned from Mobile Clinic Intake", category: "Impact Story", text: "Simple multilingual forms reduced confusion and helped volunteers route people to the right support faster." },
    { authorId: "sample-user-6", title: "Grant Proposal Checklist for Small NGOs", category: "Professional Knowledge", text: "Before applying, clarify the problem, target group, evidence, budget logic, and what success will look like after 90 days." },
    { authorId: "sample-org-5", title: "How to Run a Repair Cafe with Limited Tools", category: "Best Practices", text: "Start with one category, one safety lead, and one clear intake table. A smaller event is easier to repeat." },
    { authorId: "sample-user-8", title: "Trust Signals That Help Volunteers Apply", category: "UX Notes", text: "Show who leads the project, expected time, location, support provided, and what happens after someone clicks apply." },
    { authorId: "sample-org-9", title: "Food Donation Map Pilot Is Looking for Data Volunteers", category: "Open Call", text: "We have the first list of potential donors and need help cleaning records so local coordinators can act quickly." },
    { authorId: "sample-user-10", title: "CSR Teams Need Concrete One-Day Tasks", category: "Business Collaboration", text: "Companies are more likely to join when the task, safety needs, materials, and impact outcome are clearly scoped." },
    { authorId: "sample-org-6", title: "Low-bandwidth Learning Hub Starter Pack", category: "Sharing Knowledge", text: "A practical starter pack can help communities support learners even when connectivity is unstable." },
    { authorId: "sample-user-12", title: "Plain Language Makes Rights Information Usable", category: "Professional Knowledge", text: "People should understand eligibility, documents, deadlines, and where to ask for help without legal jargon." }
);

function getOpportunityById(id) {
    return opportunities.find(opp => opp.id === parseInt(id));
}

function getFeaturedOpportunities() {
    return opportunities.filter(opp => opp.featured);
}

function getOrganizationById(id) {
    return organizations.find(org => org.id === id || org.id === String(id));
}

function getOrganizationByName(name) {
    return organizations.find(org => org.name === name || name === "Green Earth Foundation" && org.id === "sample-org-1");
}

function getPersonById(id) {
    return people.find(person => person.id === id);
}

function getProfileById(id) {
    return getOrganizationById(id) || getPersonById(id);
}

function getAuthorById(id) {
    return getProfileById(id);
}

function filterOpportunities(filters) {
    return opportunities.filter(opp => {
        if (filters.location && filters.location !== "all" && !opp.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
        if (filters.field && filters.field !== "all" && opp.field !== filters.field) return false;
        if (filters.commitment && filters.commitment !== "all" && opp.commitment.toLowerCase() !== filters.commitment.toLowerCase()) return false;
        if (filters.search && !`${opp.title} ${opp.description} ${opp.organization}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });
}
