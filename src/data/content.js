import {
  Activity,
  Baby,
  Thermometer,
  Scale,
  Dna,
  Bone,
  Sun,
  Brain,
  Zap,
  Eye,
  HeartPulse,
  Flower2
} from "lucide-react"

export const DOCTOR = {
  name: 'Dr. Praveen Ramachandra',
  shortName: 'Dr. Praveen',
  initials: 'PR',
  title: 'Consultant Endocrinologist & Internal Medicine Specialist',
  tagline: 'Diabetes, Thyroid & Hormone Super Speciality Care',
  quals: 'MBBS, MD (PGIMER, Chandigarh), DM (Endocrinology – Adult & Pediatric), MRCP (UK)',
  experience: '13+',
  patients: '10,000+',
  rating: '4.7',
  reviews: '131',
  phone: '08041675151',
  whatsapp: '9686039505',
  email: 'praveenendocrine@gmail.com',
  photo: "/doctor.jpg",
  bio: `Dr. Praveen Ramachandra is a highly qualified consultant endocrinologist with extensive experience in managing diabetes, thyroid disorders, hormonal imbalances, obesity, and PCOS. He is known for providing personalized, evidence-based care to ensure long-term patient well-being.`,
  shortBio: `Specialist in diabetes, thyroid, hormones and metabolic disorders.`,
}

export const EDUCATION = [
  { degree: 'MBBS', inst: 'Bachelor of Medicine & Surgery', year: 'Foundation' },
  { degree: 'MD — Internal Medicine', inst: 'PGIMER, Chandigarh', year: 'Post Graduation' },
  { degree: 'DM — Endocrinology', inst: 'Super-Specialization', year: 'Super Specialty' },
  { degree: 'MRCP (UK)', inst: 'Royal College of Physicians', year: 'Fellowship' },
]

export const CLINICS = [
  {
    id: 'diaplus',
    num: '01',
    name: 'DiaPlus Endocrinology Clinic',
    spec: 'Diabetes · Thyroid · Hormones · Obesity · PCOS',
    address: "No. 1218,First Floor,'B' Sector,8th B Cross,Yelahanka New Town, Bengaluru – 560064",
    landmark: ['Near Old RTO', 'Opp.KHB Complex'],
    phone: '08041675151',
    whatsapp: '8073116280',
    timings: ['9:00 AM – 10:00 AM','12:00 PM – 4:00 PM','8:00 PM – 10:00 PM'],
    days: 'Monday – Saturday',
    chips: ['Mon – Sat', '3 Slots Daily'],
    maps: 'https://maps.app.goo.gl/dGSkFPjSw5vA2QZz7',
    color: 'linear-gradient(135deg,#0B7B6F,#096358)',
  },
  {
    id: 'thyroplus',
    num: '02',
    name: 'ThyroPlus Endocrinology Clinic',
    spec: 'Thyroid · Hormone Disorders',
    address: "No. 2122,Opp. BSNL&BWSSB Office,'D' Block ,Sahakaranagar, Bengaluru – 560092",
    landmark: ['Near Water Tank'],
    phone: '08042095642',
    whatsapp: '9686039505',
    timings: ['6:00 PM – 8:00 PM'],
    days: 'Monday – Saturday',
    chips: ['Evening Clinic'],
    maps: 'https://maps.app.goo.gl/3HuZT9nN5FfHuC1o7',
    color: 'linear-gradient(135deg,#0A5C52,#083D36)',
  },
]

/* ✅ FIXED: removed bad "fix()" logic completely */
export const SERVICES = [
  { icon: Activity, name: 'Type 1 & 2 Diabetes', cat: 'diabetes', desc: 'Advanced insulin management.' },
  { icon: Activity, name: 'Prediabetes', cat: 'diabetes', desc: 'Early detection.' },
  { icon: Baby, name: 'Gestational Diabetes', cat: 'diabetes', desc: 'Pregnancy diabetes care.' },

  { icon: Thermometer, name: 'Thyroid Disorders', cat: 'thyroid', desc: 'Thyroid conditions.' },
  { icon: Thermometer, name: 'Thyroid Nodules', cat: 'thyroid', desc: 'Nodule management.' },

  { icon: Scale, name: 'Obesity Management', cat: 'hormones', desc: 'Weight management.' },
  { icon: Dna, name: 'PCOS / PCOD', cat: 'hormones', desc: 'Hormonal care.' },
  { icon: Brain, name: 'Hormone Imbalance', cat: 'hormones', desc: 'Hormone therapy.' },

  { icon: Bone, name: 'Osteoporosis', cat: 'bone', desc: 'Bone care.' },
  { icon: Sun, name: 'Vitamin D Deficiency', cat: 'bone', desc: 'Vitamin correction.' },

  { icon: Zap, name: 'Adrenal Disorders', cat: 'hormones', desc: 'Adrenal care.' },
  { icon: Baby, name: 'Pediatric Endocrinology', cat: 'pediatric', desc: 'Child hormone care.' },

  { icon: Eye, name: 'Retinopathy Screening', cat: 'diabetes', desc: 'Eye screening.' },
  { icon: HeartPulse, name: 'Dyslipidemia', cat: 'hormones', desc: 'Cholesterol care.' },
]

export const BLOG_POSTS = [
  {
    id: 1,
    slug: "diabetes-diet-guide",
    title: "Managing Blood Sugar Through Diet",
    desc: "Learn how food directly impacts your glucose levels.",
    cat: "Diabetes",
    readTime: "5 min read",
    icon: Activity,
    content: `
Maintaining stable blood sugar is the foundation of diabetes care.

Key dietary tips:
• Avoid refined sugars and processed carbs  
• Prefer whole grains like brown rice and oats  
• Include protein in every meal  
• Eat small, frequent meals  

Foods to include:
- Green vegetables  
- Nuts & seeds  
- Low GI fruits  

Consistency is more important than perfection. A structured diet plan can significantly reduce complications.
`
  },

  {
    id: 2,
    slug: "thyroid-disorders",
    title: "Understanding Thyroid Disorders",
    desc: "Symptoms, causes and treatments explained simply.",
    cat: "Thyroid",
    readTime: "6 min read",
    icon: HeartPulse,
    content: `
Thyroid disorders affect metabolism and energy levels.

Hypothyroidism symptoms:
• Weight gain  
• Fatigue  
• Hair loss  

Hyperthyroidism symptoms:
• Weight loss  
• Anxiety  
• Palpitations  

Treatment depends on hormone levels and diagnosis. Regular monitoring is essential.
`
  },

  {
    id: 3,
    slug: "pcos-lifestyle",
    title: "PCOS Lifestyle Changes That Work",
    desc: "Simple changes that improve hormone balance.",
    cat: "PCOS",
    readTime: "4 min read",
    icon: Flower2,
    content: `
PCOS is a lifestyle-sensitive condition.

What helps:
• Regular exercise  
• Weight management  
• Low-carb diet  
• Stress control  

Avoid:
- Junk food  
- Sugary drinks  

Even small changes can improve cycles and fertility outcomes.
`
  },

  // ✅ NEW ARTICLES BELOW

  {
    id: 4,
    slug: "vitamin-d-deficiency",
    title: "Vitamin D Deficiency Explained",
    desc: "Why it's common and how to fix it.",
    cat: "Bone Health",
    readTime: "4 min read",
    icon: Sun,
    content: `
Vitamin D deficiency is very common in India.

Symptoms:
• Bone pain  
• Weakness  
• Fatigue  

Sources:
- Sunlight exposure  
- Supplements  
- Fortified foods  

Daily sunlight for 20 minutes can help significantly.
`
  },

  {
    id: 5,
    slug: "obesity-management",
    title: "Medical Approach to Weight Loss",
    desc: "Not just diet — complete metabolic care.",
    cat: "Hormones",
    readTime: "5 min read",
    icon: Scale,
    content: `
Obesity is a metabolic disorder, not just overeating.

Approach:
• Diet + Exercise  
• Hormonal evaluation  
• Medical therapy if needed  

Crash diets don’t work long term.

Sustainable weight loss is slow but effective.
`
  },

  {
    id: 6,
    slug: "diabetes-complications",
    title: "Preventing Diabetes Complications",
    desc: "Protect eyes, nerves and kidneys.",
    cat: "Diabetes",
    readTime: "5 min read",
    icon: Eye,
    content: `
Uncontrolled diabetes affects multiple organs.

Complications:
• Eye damage (retinopathy)  
• Nerve damage (neuropathy)  
• Kidney disease  

Prevention:
• Regular checkups  
• Sugar control  
• Lifestyle discipline  

Early detection saves organs.
`
  }
]

export const WHATSAPP_MSG = `Hi Dr. Praveen! I would like to book an appointment.`

export const CHATBOT_RESPONSES = {
  greeting: "Hello! I'm the DiaPlus Assistant. How can I help?",
  
  book: "📅 Booking Appointment:\n\n• Visit 'Book Token' page on our website\n• Select your preferred clinic (DiaPlus or ThyroPlus)\n• Choose your preferred time slot\n• Confirm booking - you'll get instant confirmation\n\n💬 Or WhatsApp: 8073116280 (DiaPlus) / 9686039505 (ThyroPlus)",
  
  timings: "🕐 Clinic Timings:\n\n📍 DiaPlus Clinic (Yelahanka):\n• 9:00 AM - 10:00 AM\n• 12:00 PM - 4:00 PM\n• 8:00 PM - 10:00 PM\n• Mon - Sat\n\n📍 ThyroPlus Clinic (Sahakaranagar):\n• 6:00 PM - 8:00 PM\n• Mon - Sat (Evening Clinic)",
  
  location: "📍 Our Clinic Locations:\n\nDiaPlus (Diabetes & Endocrinology):\n• Address: No. 1218, First Floor, 'B' Sector, 8th B Cross, Yelahanka New Town, Bengaluru - 560064\n• Landmarks: Near Old RTO, Opp KHB Complex\n• Phone: 08041675151\n\nThyroPlus (Thyroid & Hormones):\n• Address: No. 2122, Opp. BSNL & BWSSB Office, 'D' Block, Sahakaranagar, Bengaluru - 560092\n• Landmark: Near Water Tank\n• Phone: 08042095642",
  
  services: "🏥 Our Services:\n\n💉 Diabetes Management\n• Type 1 & 2 Diabetes\n• Prediabetes\n• Gestational Diabetes\n• Insulin management\n\n🩺 Thyroid Disorders\n• Hyperthyroidism & Hypothyroidism\n• Thyroid Nodules\n\n⚖️ Weight Management & Hormones\n• Obesity Management\n• PCOS/PCOD\n• Hormone Imbalance\n• Adrenal Disorders\n\n🦴 Bone & Vitamin Health\n• Osteoporosis\n• Vitamin D Deficiency\n\n👶 Specialized Care\n• Pediatric Endocrinology\n• Retinopathy Screening\n• Dyslipidemia Management",
  
  fee: "💰 Consultation Fee:\n\n• General Consultation: ₹500\n• Follow-up Consultation: ₹300\n• Special Investigations: Based on type\n\n📌 Accepted Payment Methods:\n• Cash\n• Card\n• Online/UPI\n• Insurance (Depends on policy)\n\n💡 First-time patients get priority booking!",
  
  doctor: "👨‍⚕️ About Dr. Praveen Ramachandra:\n\n🏆 Credentials:\n• 15+ years of experience\n• Specialist in Endocrinology & Metabolism\n• Trusted by 10,000+ patients\n• Established 2011\n\n📚 Expertise:\n• Diabetes Management\n• Thyroid Disorders\n• Hormonal Disorders\n• PCOS/PCOD Treatment\n• Obesity Management\n\n📍 Clinics: DiaPlus & ThyroPlus\n\n🎥 YouTube: Expert health tips & diabetes care videos\n📞 Contact: 08041675151 (DiaPlus) / 08042095642 (ThyroPlus)",
  
  default: "I'm here to help! You can ask me about:\n\n✓ Clinic Timings\n✓ Book Appointments\n✓ Our Services\n✓ Clinic Locations\n✓ Consultation Fees\n✓ About Dr. Praveen\n\nWhat would you like to know?"
}