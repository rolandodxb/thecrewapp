export interface PresentationSlide {
  id: number;
  title: string;
  content: string;
  bullets?: string[];
  tips?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface EnglishQuestion {
  id: string;
  section: 'grammar' | 'vocabulary' | 'reading';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export const presentationSlides: PresentationSlide[] = [
  {
    id: 1,
    title: "Welcome to the Emirates Open Day",
    content: "The Open Day is the first step in the Emirates recruitment process. It's your opportunity to make a lasting first impression and showcase why you're the perfect fit for the Emirates cabin crew team.",
    bullets: [
      "The Open Day typically lasts 3-4 hours",
      "You'll be assessed from the moment you arrive",
      "Professional conduct is expected at all times",
      "This is a competitive process - stand out positively"
    ]
  },
  {
    id: 2,
    title: "Dress Code & First Impressions",
    content: "Your attire should be conservative, neat, and reflect the Emirates brand values of elegance and professionalism.",
    bullets: [
      "Women: Business suit, knee-length skirt or dress pants, closed-toe heels (5-7cm)",
      "Men: Dark business suit, white or light blue shirt, conservative tie, polished dress shoes",
      "Hair: Neat, professional style. Long hair tied back elegantly",
      "Makeup: Natural and subtle. Avoid heavy or dramatic looks",
      "Accessories: Minimal and professional. Remove visible piercings except small earrings",
      "Nails: Clean, short, natural or subtle polish"
    ],
    tips: [
      "Arrive 30 minutes early to show punctuality",
      "Bring multiple copies of your CV",
      "Carry a professional folder or portfolio"
    ]
  },
  {
    id: 3,
    title: "Attitude and Conduct Expectations",
    content: "Recruiters are observing your behavior, body language, and interaction skills throughout the entire Open Day.",
    bullets: [
      "Smile genuinely and make eye contact",
      "Display confidence without arrogance",
      "Show respect to everyone - staff, recruiters, and fellow candidates",
      "Be attentive and engaged during presentations",
      "Ask thoughtful questions when appropriate",
      "Maintain positive body language - stand tall, shoulders back"
    ],
    tips: [
      "Switch off your mobile phone completely",
      "Avoid gossiping or negative comments about other candidates",
      "Show enthusiasm for Emirates and the cabin crew role"
    ]
  },
  {
    id: 4,
    title: "Typical Group Activities",
    content: "Group exercises are designed to assess your teamwork, communication, leadership, and problem-solving abilities.",
    bullets: [
      "Building challenges (e.g., paper tower, bridge construction)",
      "Role-play customer service scenarios",
      "Group discussions on industry-related topics",
      "Creative problem-solving tasks with limited resources"
    ],
    tips: [
      "Participate actively but don't dominate the conversation",
      "Listen to others and acknowledge their ideas",
      "Show leadership by organizing or mediating when needed",
      "Stay positive even if your team struggles",
      "Focus on collaboration over competition"
    ]
  },
  {
    id: 5,
    title: "Common Recruiter Evaluations",
    content: "Recruiters use specific criteria to assess candidates. Understanding these will help you perform better.",
    bullets: [
      "First Impression: Grooming, punctuality, professionalism",
      "Communication Skills: Clarity, confidence, English proficiency",
      "Teamwork: Collaboration, respect, conflict resolution",
      "Customer Service Mindset: Empathy, problem-solving, patience",
      "Cultural Awareness: Respect for diversity, adaptability",
      "Passion for Emirates: Knowledge of the brand, genuine interest"
    ],
    tips: [
      "Research Emirates thoroughly before attending",
      "Prepare a brief personal introduction",
      "Practice speaking about your strengths and experiences"
    ]
  },
  {
    id: 6,
    title: "Final Preparation Tips",
    content: "You're almost ready! Here are final reminders to maximize your success at the Open Day.",
    bullets: [
      "Get a good night's sleep before the Open Day",
      "Eat a healthy breakfast - you'll need energy",
      "Practice your smile and confident posture in front of a mirror",
      "Prepare answers to common questions (Why Emirates? Why cabin crew?)",
      "Bring a positive mindset and be yourself",
      "Remember: They're looking for genuine, passionate people"
    ]
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "During the Open Day, when should you arrive?",
    options: [
      "Exactly on time",
      "30 minutes early",
      "5 minutes early",
      "15 minutes early"
    ],
    correctAnswer: "30 minutes early",
    explanation: "Arriving 30 minutes early shows punctuality and gives you time to compose yourself and observe the environment.",
    points: 10
  },
  {
    id: "q2",
    question: "What should you do when the recruiter enters the room?",
    options: [
      "Continue your conversation until they speak",
      "Stand up, smile, and greet them confidently",
      "Wave casually to show confidence",
      "Remain seated and nod politely"
    ],
    correctAnswer: "Stand up, smile, and greet them confidently",
    explanation: "Recruiters observe first impressions. Standing and greeting them shows respect, confidence, and professionalism.",
    points: 10
  },
  {
    id: "q3",
    question: "You're in a group task and one member disagrees loudly with the group's approach. What should you do?",
    options: [
      "Ignore them and continue with your idea",
      "Argue back to prove your point is better",
      "Stay calm, listen to their concerns, and help mediate politely",
      "Ask the recruiter to intervene"
    ],
    correctAnswer: "Stay calm, listen to their concerns, and help mediate politely",
    explanation: "Emirates values conflict resolution and inclusive communication. Showing diplomacy and active listening demonstrates cabin crew qualities.",
    points: 10
  },
  {
    id: "q4",
    question: "What is the appropriate heel height for female candidates?",
    options: [
      "Flat shoes for comfort",
      "10cm stiletto heels",
      "5-7cm professional heels",
      "Any height is acceptable"
    ],
    correctAnswer: "5-7cm professional heels",
    explanation: "Professional heels of 5-7cm show you meet Emirates grooming standards while being practical for cabin crew work.",
    points: 10
  },
  {
    id: "q5",
    question: "During a group discussion, you notice a quiet member hasn't contributed. What do you do?",
    options: [
      "Focus on the active members to save time",
      "Take over the discussion to move things forward",
      "Politely ask for their opinion and encourage their input",
      "Point out to the recruiter that they're not participating"
    ],
    correctAnswer: "Politely ask for their opinion and encourage their input",
    explanation: "Great leadership includes everyone. This shows emotional intelligence and team awareness, which are key cabin crew skills.",
    points: 10
  },
  {
    id: "q6",
    question: "What type of makeup is appropriate for the Open Day?",
    options: [
      "Heavy and dramatic to stand out",
      "Natural and subtle",
      "No makeup at all",
      "Colorful and creative"
    ],
    correctAnswer: "Natural and subtle",
    explanation: "Emirates expects natural, professional makeup that enhances your features without being dramatic.",
    points: 10
  },
  {
    id: "q7",
    question: "Your team's project is failing during the group task. What's the best response?",
    options: [
      "Blame the weakest team member",
      "Give up and wait for it to end",
      "Stay positive, adapt, and work together to find solutions",
      "Ask for extra time from the recruiter"
    ],
    correctAnswer: "Stay positive, adapt, and work together to find solutions",
    explanation: "Cabin crew face challenges constantly. Showing resilience, adaptability, and teamwork under pressure is crucial.",
    points: 10
  },
  {
    id: "q8",
    question: "What should you bring to the Open Day?",
    options: [
      "Just yourself and confidence",
      "Multiple copies of your CV in a professional folder",
      "Your mobile phone for notes",
      "A friend for moral support"
    ],
    correctAnswer: "Multiple copies of your CV in a professional folder",
    explanation: "Being prepared with CVs shows professionalism. A friend is not allowed, and phones should be switched off.",
    points: 10
  },
  {
    id: "q9",
    question: "How should male candidates wear their hair?",
    options: [
      "Any style is fine as long as it's clean",
      "Neatly groomed, conservative style, no extreme cuts",
      "Long hair is acceptable if tied back",
      "Trendy and fashionable cuts"
    ],
    correctAnswer: "Neatly groomed, conservative style, no extreme cuts",
    explanation: "Emirates has strict grooming standards. Men should have conservative, neat hairstyles that align with professional standards.",
    points: 10
  },
  {
    id: "q10",
    question: "What's the best way to show your passion for Emirates during the Open Day?",
    options: [
      "Tell them you just need any job",
      "Demonstrate knowledge of the brand, share genuine reasons, and show enthusiasm",
      "Say you've always wanted to travel",
      "Mention the salary and benefits"
    ],
    correctAnswer: "Demonstrate knowledge of the brand, share genuine reasons, and show enthusiasm",
    explanation: "Research and genuine passion for Emirates specifically (not just travel) shows commitment and cultural fit.",
    points: 10
  }
];

export const englishQuestions: EnglishQuestion[] = [
  {
    id: "e1",
    section: "grammar",
    question: "The passengers ___ waiting for boarding.",
    options: ["is", "are", "was", "been"],
    correctAnswer: "are",
    explanation: "The subject 'passengers' is plural, so it requires the plural verb 'are'.",
    points: 5
  },
  {
    id: "e2",
    section: "grammar",
    question: "She ___ to the airport every morning.",
    options: ["go", "goes", "going", "gone"],
    correctAnswer: "goes",
    explanation: "Third person singular present tense requires 'goes'.",
    points: 5
  },
  {
    id: "e3",
    section: "grammar",
    question: "If I ___ the flight details, I would have arrived on time.",
    options: ["knew", "had known", "know", "have known"],
    correctAnswer: "had known",
    explanation: "This is a third conditional sentence referring to a past unreal situation, requiring 'had known'.",
    points: 5
  },
  {
    id: "e4",
    section: "grammar",
    question: "The cabin crew ___ trained to handle emergencies.",
    options: ["is", "are", "was", "be"],
    correctAnswer: "are",
    explanation: "'Cabin crew' is treated as plural when referring to the members collectively, so 'are' is correct.",
    points: 5
  },
  {
    id: "e5",
    section: "grammar",
    question: "By the time we arrive, the plane ___ already left.",
    options: ["will have", "will", "has", "had"],
    correctAnswer: "will have",
    explanation: "Future perfect tense 'will have' is used for an action that will be completed before a future time.",
    points: 5
  },
  {
    id: "e6",
    section: "vocabulary",
    question: "Which word best completes: 'We apologize for the ___ delay.'",
    options: ["unexpected", "unexpecting", "not expected", "unexpect"],
    correctAnswer: "unexpected",
    explanation: "'Unexpected' is the proper adjective form meaning 'not anticipated'.",
    points: 5
  },
  {
    id: "e7",
    section: "vocabulary",
    question: "The flight attendant spoke in a calm and ___ manner.",
    options: ["assure", "assured", "assuring", "assurance"],
    correctAnswer: "assuring",
    explanation: "'Assuring' is the correct adjective form meaning 'comforting' or 'confidence-inspiring'.",
    points: 5
  },
  {
    id: "e8",
    section: "vocabulary",
    question: "Passengers must ___ all safety regulations during the flight.",
    options: ["obey", "order", "observe", "obtain"],
    correctAnswer: "obey",
    explanation: "'Obey' means to follow rules or regulations, which is the appropriate verb here.",
    points: 5
  },
  {
    id: "e9",
    section: "vocabulary",
    question: "The airline provides ___ service to all passengers.",
    options: ["exception", "exceptional", "except", "excepting"],
    correctAnswer: "exceptional",
    explanation: "'Exceptional' is the adjective meaning 'outstanding' or 'unusually good'.",
    points: 5
  },
  {
    id: "e10",
    section: "vocabulary",
    question: "Please ___ your seatbelt during takeoff.",
    options: ["fasten", "faster", "fashion", "fixed"],
    correctAnswer: "fasten",
    explanation: "'Fasten' means to secure or attach, commonly used with seatbelts.",
    points: 5
  },
  {
    id: "e11",
    section: "reading",
    question: "Read: 'Emirates Airlines is committed to providing exceptional customer service. Our cabin crew undergo rigorous training to ensure passenger safety and comfort.' What is the main focus?",
    options: [
      "Marketing strategy",
      "Training and service quality",
      "Financial performance",
      "Fleet expansion"
    ],
    correctAnswer: "Training and service quality",
    explanation: "The passage emphasizes training and exceptional service as the main focus.",
    points: 5
  },
  {
    id: "e12",
    section: "reading",
    question: "Read: 'In case of turbulence, passengers should remain seated with seatbelts fastened. Flight attendants will suspend service until conditions improve.' What should passengers do during turbulence?",
    options: [
      "Ask for service immediately",
      "Stand up and move carefully",
      "Remain seated with seatbelts fastened",
      "Help the flight attendants"
    ],
    correctAnswer: "Remain seated with seatbelts fastened",
    explanation: "The passage clearly states passengers should remain seated with seatbelts fastened during turbulence.",
    points: 5
  },
  {
    id: "e13",
    section: "reading",
    question: "Read: 'Our recruitment process seeks individuals who demonstrate cultural sensitivity, excellent communication skills, and a genuine passion for hospitality.' What quality is NOT mentioned?",
    options: [
      "Cultural sensitivity",
      "Communication skills",
      "Technical expertise",
      "Passion for hospitality"
    ],
    correctAnswer: "Technical expertise",
    explanation: "The passage mentions cultural sensitivity, communication, and passion but not technical expertise.",
    points: 5
  },
  {
    id: "e14",
    section: "reading",
    question: "Read: 'Cabin crew must maintain professional appearance standards at all times, including proper uniform wear, grooming, and hygiene.' What is emphasized?",
    options: [
      "Physical fitness",
      "Language skills",
      "Professional appearance",
      "Sales ability"
    ],
    correctAnswer: "Professional appearance",
    explanation: "The passage focuses on maintaining professional appearance standards.",
    points: 5
  },
  {
    id: "e15",
    section: "reading",
    question: "Read: 'Emirates operates flights to over 150 destinations worldwide, connecting passengers across six continents.' What does this demonstrate?",
    options: [
      "Local focus",
      "Global reach",
      "Small network",
      "Regional service"
    ],
    correctAnswer: "Global reach",
    explanation: "Operating to 150+ destinations across six continents demonstrates a global reach.",
    points: 5
  },
  {
    id: "e16",
    section: "grammar",
    question: "Neither the pilot nor the crew members ___ aware of the issue.",
    options: ["was", "were", "is", "be"],
    correctAnswer: "were",
    explanation: "When using 'neither...nor' with a plural noun closer to the verb, use the plural form 'were'.",
    points: 5
  },
  {
    id: "e17",
    section: "vocabulary",
    question: "The cabin crew showed great ___ during the emergency.",
    options: ["compose", "composer", "composure", "composed"],
    correctAnswer: "composure",
    explanation: "'Composure' is the noun meaning calmness and self-control in difficult situations.",
    points: 5
  },
  {
    id: "e18",
    section: "reading",
    question: "Read: 'Customer feedback is essential for continuous improvement. We encourage passengers to share their experiences.' What does the airline value?",
    options: [
      "Passenger feedback",
      "Low prices",
      "Fast flights",
      "Large aircraft"
    ],
    correctAnswer: "Passenger feedback",
    explanation: "The passage explicitly states customer feedback is essential and encouraged.",
    points: 5
  },
  {
    id: "e19",
    section: "grammar",
    question: "The announcement ___ just been made by the captain.",
    options: ["has", "have", "had", "having"],
    correctAnswer: "has",
    explanation: "'The announcement' is singular, so it requires 'has' in present perfect tense.",
    points: 5
  },
  {
    id: "e20",
    section: "vocabulary",
    question: "Select the most professional response: A passenger asks, 'Could you help me with my luggage?'",
    options: [
      "Yeah, sure, no problem",
      "Of course, I'd be happy to assist you",
      "Okay, give me a second",
      "I guess so"
    ],
    correctAnswer: "Of course, I'd be happy to assist you",
    explanation: "This response is professional, polite, and warm, reflecting excellent customer service standards.",
    points: 5
  }
];
