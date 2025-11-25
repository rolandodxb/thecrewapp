export interface ExamQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export interface CourseExam {
  courseId: string;
  courseName: string;
  questions: ExamQuestion[];
  passingScore: number;
}

export const courseExams: CourseExam[] = [
  {
    courseId: 'e5f8fb59-cf13-4be7-9f52-138db19fef9e',
    courseName: 'Open Day Introduction',
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        question: 'What is the primary purpose of an Open Day?',
        options: [
          { id: 'a', text: 'To show passengers how aircraft cabins work', isCorrect: false },
          { id: 'b', text: 'To present yourself and pass initial recruitment filters', isCorrect: true },
          { id: 'c', text: 'To meet current cabin crew for selfies', isCorrect: false },
          { id: 'd', text: 'To register for airport access', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        question: 'Why do recruiters observe candidates before the official activities begin?',
        options: [
          { id: 'a', text: 'They are bored', isCorrect: false },
          { id: 'b', text: 'They want to check your height secretly', isCorrect: false },
          { id: 'c', text: 'Your natural behavior reveals true personality', isCorrect: true },
          { id: 'd', text: 'They need to test the camera system', isCorrect: false },
        ],
      },
      {
        id: 'q3',
        question: 'What internal barrier eliminates most candidates before they even begin?',
        options: [
          { id: 'a', text: 'Not speaking enough languages', isCorrect: false },
          { id: 'b', text: 'Overthinking and self-doubt', isCorrect: true },
          { id: 'c', text: 'The wrong shoes', isCorrect: false },
          { id: 'd', text: 'Sitting near the wrong people', isCorrect: false },
        ],
      },
      {
        id: 'q4',
        question: 'Why is interacting with multiple candidates beneficial during the Open Day?',
        options: [
          { id: 'a', text: 'It makes you look talkative', isCorrect: false },
          { id: 'b', text: 'Recruiters see that you are socially adaptable', isCorrect: true },
          { id: 'c', text: 'It helps you find who to copy', isCorrect: false },
          { id: 'd', text: 'It allows you to form cliques', isCorrect: false },
        ],
      },
      {
        id: 'q5',
        question: 'What makes a candidate appear "fake" and therefore risky?',
        options: [
          { id: 'a', text: 'Smiling often', isCorrect: false },
          { id: 'b', text: 'Over-acting elegance or confidence', isCorrect: true },
          { id: 'c', text: 'Being too quiet', isCorrect: false },
          { id: 'd', text: 'Taking notes during activities', isCorrect: false },
        ],
      },
      {
        id: 'q6',
        question: 'What is the biggest psychological enemy during the day?',
        options: [
          { id: 'a', text: 'Recruiters', isCorrect: false },
          { id: 'b', text: 'Other candidates', isCorrect: false },
          { id: 'c', text: 'Your own mind', isCorrect: true },
          { id: 'd', text: 'The dress code', isCorrect: false },
        ],
      },
      {
        id: 'q7',
        question: 'Why do airlines start evaluating from the moment you arrive?',
        options: [
          { id: 'a', text: 'To see if you brought your passport', isCorrect: false },
          { id: 'b', text: 'To observe authenticity and pressure handling early', isCorrect: true },
          { id: 'c', text: 'To test punctuality for free', isCorrect: false },
          { id: 'd', text: 'To intimidate candidates', isCorrect: false },
        ],
      },
      {
        id: 'q8',
        question: 'What is the expected attitude even when instructions are unclear?',
        options: [
          { id: 'a', text: 'Panic', isCorrect: false },
          { id: 'b', text: 'Look confused and freeze', isCorrect: false },
          { id: 'c', text: 'Ask politely for clarification at the right moment', isCorrect: true },
          { id: 'd', text: 'Copy others silently', isCorrect: false },
        ],
      },
      {
        id: 'q9',
        question: 'What differentiates candidates who progress from those who don\'t?',
        options: [
          { id: 'a', text: 'Accents', isCorrect: false },
          { id: 'b', text: 'Social media followers', isCorrect: false },
          { id: 'c', text: 'Mindset and emotional control', isCorrect: true },
          { id: 'd', text: 'Expensive grooming products', isCorrect: false },
        ],
      },
      {
        id: 'q10',
        question: 'What helps you survive the psychological pressure across each elimination round?',
        options: [
          { id: 'a', text: 'Pretending not to care', isCorrect: false },
          { id: 'b', text: 'Focusing on winning your own mind first', isCorrect: true },
          { id: 'c', text: 'Standing far from recruiters', isCorrect: false },
          { id: 'd', text: 'Practicing scripts', isCorrect: false },
        ],
      },
    ],
  },
  {
    courseId: '856ababc-dc84-4eaa-9fed-83810647b43d',
    courseName: 'Open Day Blueprint',
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        question: 'What is the main goal of the Open Day Blueprint?',
        options: [
          { id: 'a', text: 'Teach how to dress like a model', isCorrect: false },
          { id: 'b', text: 'Provide the step-by-step structure of the entire day', isCorrect: true },
          { id: 'c', text: 'Help candidates memorize answers', isCorrect: false },
          { id: 'd', text: 'Teach how to fly the A380', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        question: 'Why is the Observation Stage critical?',
        options: [
          { id: 'a', text: 'It shows your IQ', isCorrect: false },
          { id: 'b', text: 'Recruiters judge natural behavior before any tasks', isCorrect: true },
          { id: 'c', text: 'It determines grooming standards only', isCorrect: false },
          { id: 'd', text: 'It measures English level only', isCorrect: false },
        ],
      },
      {
        id: 'q3',
        question: 'What is the most important strategy during registration?',
        options: [
          { id: 'a', text: 'Handing documents as fast as possible', isCorrect: false },
          { id: 'b', text: 'Smiling, greeting confidently, showing emotional stability', isCorrect: true },
          { id: 'c', text: 'Trying to impress recruiters with jokes', isCorrect: false },
          { id: 'd', text: 'Copying the actions of the person before you', isCorrect: false },
        ],
      },
      {
        id: 'q4',
        question: 'Why is small talk with candidates valuable?',
        options: [
          { id: 'a', text: 'It helps pass time', isCorrect: false },
          { id: 'b', text: 'It demonstrates sociability and team adaptation', isCorrect: true },
          { id: 'c', text: 'It hides nervousness', isCorrect: false },
          { id: 'd', text: 'It distracts you from recruiters', isCorrect: false },
        ],
      },
      {
        id: 'q5',
        question: 'In the group activity, what is the biggest mistake?',
        options: [
          { id: 'a', text: 'Speaking softly', isCorrect: false },
          { id: 'b', text: 'Not dominating all decisions', isCorrect: false },
          { id: 'c', text: 'Speaking over others or overriding teammates', isCorrect: true },
          { id: 'd', text: 'Asking questions to clarify the task', isCorrect: false },
        ],
      },
      {
        id: 'q6',
        question: 'What is the correct way to present a group decision?',
        options: [
          { id: 'a', text: '"I decided we should…"', isCorrect: false },
          { id: 'b', text: '"We concluded…"', isCorrect: true },
          { id: 'c', text: '"I think this is the best idea…"', isCorrect: false },
          { id: 'd', text: '"They told me to say…"', isCorrect: false },
        ],
      },
      {
        id: 'q7',
        question: 'Why do recruiters test decision-making under time pressure?',
        options: [
          { id: 'a', text: 'To check who memorized procedures', isCorrect: false },
          { id: 'b', text: 'Because they enjoy stressing candidates', isCorrect: false },
          { id: 'c', text: 'It mirrors real onboard situations', isCorrect: true },
          { id: 'd', text: "It's the easiest way to eliminate people", isCorrect: false },
        ],
      },
      {
        id: 'q8',
        question: 'What happens when you speak too little in a group task?',
        options: [
          { id: 'a', text: 'You automatically fail', isCorrect: false },
          { id: 'b', text: 'You show no leadership contribution', isCorrect: true },
          { id: 'c', text: 'You are seen as mysterious', isCorrect: false },
          { id: 'd', text: 'You become the favorite', isCorrect: false },
        ],
      },
      {
        id: 'q9',
        question: 'What shows emotional intelligence during debates?',
        options: [
          { id: 'a', text: 'Interrupting gently', isCorrect: false },
          { id: 'b', text: 'Letting others talk, analyzing, and building on their ideas', isCorrect: true },
          { id: 'c', text: 'Saying yes to everything', isCorrect: false },
          { id: 'd', text: 'Avoiding eye contact', isCorrect: false },
        ],
      },
      {
        id: 'q10',
        question: 'Why does the blueprint insist on mental preparation?',
        options: [
          { id: 'a', text: 'To help candidates look robotic', isCorrect: false },
          { id: 'b', text: 'Because stress management is part of the role', isCorrect: true },
          { id: 'c', text: 'To eliminate weak candidates fast', isCorrect: false },
          { id: 'd', text: 'To help recruiters finish early', isCorrect: false },
        ],
      },
    ],
  },
  {
    courseId: 'f2986ae5-c2bc-4b17-bc88-51fa24786cf2',
    courseName: 'First Impression Mastery',
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        question: 'What is the first thing recruiters evaluate before you speak?',
        options: [
          { id: 'a', text: 'Accent', isCorrect: false },
          { id: 'b', text: 'Shoes', isCorrect: false },
          { id: 'c', text: 'Your presence and energy', isCorrect: true },
          { id: 'd', text: 'Your résumé design', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        question: 'What is the strongest first-impression booster?',
        options: [
          { id: 'a', text: 'Overconfidence', isCorrect: false },
          { id: 'b', text: 'Natural, relaxed smile', isCorrect: true },
          { id: 'c', text: 'Speaking loudly', isCorrect: false },
          { id: 'd', text: 'Matching lipstick to your bag', isCorrect: false },
        ],
      },
      {
        id: 'q3',
        question: 'Why is consistency important?',
        options: [
          { id: 'a', text: 'Recruiters dislike change', isCorrect: false },
          { id: 'b', text: 'It shows emotional stability', isCorrect: true },
          { id: 'c', text: 'It helps you act like someone else', isCorrect: false },
          { id: 'd', text: 'It tricks recruiters', isCorrect: false },
        ],
      },
      {
        id: 'q4',
        question: 'Which micro-behavior immediately destroys first impressions?',
        options: [
          { id: 'a', text: 'Looking around', isCorrect: false },
          { id: 'b', text: 'Nervous lip touching', isCorrect: true },
          { id: 'c', text: 'Slow breathing', isCorrect: false },
          { id: 'd', text: 'Taking notes', isCorrect: false },
        ],
      },
      {
        id: 'q5',
        question: 'What is "social fluidity"?',
        options: [
          { id: 'a', text: 'Being the loudest in the room', isCorrect: false },
          { id: 'b', text: 'Moving naturally in groups and interacting smoothly', isCorrect: true },
          { id: 'c', text: 'Copying dominant candidates', isCorrect: false },
          { id: 'd', text: 'Changing personality per person', isCorrect: false },
        ],
      },
      {
        id: 'q6',
        question: 'How should your greeting be delivered?',
        options: [
          { id: 'a', text: 'Fast, to avoid awkwardness', isCorrect: false },
          { id: 'b', text: 'Calm, respectful, and with eye contact', isCorrect: true },
          { id: 'c', text: 'Over-excited and energetic', isCorrect: false },
          { id: 'd', text: 'Whispered, to seem elegant', isCorrect: false },
        ],
      },
      {
        id: 'q7',
        question: 'Why is posture critical at first contact?',
        options: [
          { id: 'a', text: 'It makes clothes fit better', isCorrect: false },
          { id: 'b', text: 'It signals confidence and control instantly', isCorrect: true },
          { id: 'c', text: 'Recruiters judge fashion', isCorrect: false },
          { id: 'd', text: 'It prevents sweating', isCorrect: false },
        ],
      },
      {
        id: 'q8',
        question: 'Why is being "too polished" dangerous?',
        options: [
          { id: 'a', text: 'You seem boring', isCorrect: false },
          { id: 'b', text: 'You look rehearsed and unnatural', isCorrect: true },
          { id: 'c', text: 'You distract other candidates', isCorrect: false },
          { id: 'd', text: 'You look like staff', isCorrect: false },
        ],
      },
      {
        id: 'q9',
        question: "What's the best strategy when entering the room for the first time?",
        options: [
          { id: 'a', text: 'Scan for recruiters', isCorrect: false },
          { id: 'b', text: 'Walk slowly, smile, take presence of the environment', isCorrect: true },
          { id: 'c', text: 'Rush to find a seat', isCorrect: false },
          { id: 'd', text: 'Wait outside until someone calls you', isCorrect: false },
        ],
      },
      {
        id: 'q10',
        question: 'What makes a first impression last during the entire day?',
        options: [
          { id: 'a', text: 'Wearing expensive perfume', isCorrect: false },
          { id: 'b', text: 'Emotional stability and consistency', isCorrect: true },
          { id: 'c', text: 'Talking continuously', isCorrect: false },
          { id: 'd', text: 'Smiling excessively', isCorrect: false },
        ],
      },
    ],
  },
  {
    courseId: 'ea931a34-c05e-4433-ad23-580d8f3fa818',
    courseName: 'Body Language Masterclass',
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        question: 'Why is body language vital in an Open Day?',
        options: [
          { id: 'a', text: 'It replaces your résumé', isCorrect: false },
          { id: 'b', text: 'It reveals the truth behind your words', isCorrect: true },
          { id: 'c', text: 'Recruiters are trained psychologists', isCorrect: false },
          { id: 'd', text: "It shows if you're tired", isCorrect: false },
        ],
      },
      {
        id: 'q2',
        question: 'What is a universal sign of confidence?',
        options: [
          { id: 'a', text: 'Arms crossed', isCorrect: false },
          { id: 'b', text: 'Expanding posture, open shoulders', isCorrect: true },
          { id: 'c', text: 'Looking down', isCorrect: false },
          { id: 'd', text: 'Flicking hair', isCorrect: false },
        ],
      },
      {
        id: 'q3',
        question: 'Why should you avoid scanning the room nervously?',
        options: [
          { id: 'a', text: "Recruiters think you're spying", isCorrect: false },
          { id: 'b', text: 'It signals insecurity and loss of control', isCorrect: true },
          { id: 'c', text: 'It distracts the group', isCorrect: false },
          { id: 'd', text: 'It wastes time', isCorrect: false },
        ],
      },
      {
        id: 'q4',
        question: 'What is the purpose of mirroring?',
        options: [
          { id: 'a', text: 'To copy others', isCorrect: false },
          { id: 'b', text: 'To build subconscious rapport', isCorrect: true },
          { id: 'c', text: 'To look funny', isCorrect: false },
          { id: 'd', text: 'To hide stress', isCorrect: false },
        ],
      },
      {
        id: 'q5',
        question: 'Which behavior shows high emotional intelligence?',
        options: [
          { id: 'a', text: 'Leaning aggressively forward', isCorrect: false },
          { id: 'b', text: 'Leaning slightly in when listening', isCorrect: true },
          { id: 'c', text: 'Sitting very stiff', isCorrect: false },
          { id: 'd', text: 'Looking at the floor to think', isCorrect: false },
        ],
      },
      {
        id: 'q6',
        question: 'What does constant fidgeting tell recruiters?',
        options: [
          { id: 'a', text: 'You are friendly', isCorrect: false },
          { id: 'b', text: 'You are hiding stress or insecurity', isCorrect: true },
          { id: 'c', text: 'You are cold', isCorrect: false },
          { id: 'd', text: 'You drank too much coffee', isCorrect: false },
        ],
      },
      {
        id: 'q7',
        question: 'Why is hand placement important?',
        options: [
          { id: 'a', text: 'Recruiters analyze rings', isCorrect: false },
          { id: 'b', text: 'Hands communicate trust and openness', isCorrect: true },
          { id: 'c', text: 'It affects your clothes', isCorrect: false },
          { id: 'd', text: 'It helps recruiters memorize you', isCorrect: false },
        ],
      },
      {
        id: 'q8',
        question: 'What signals leadership without dominating?',
        options: [
          { id: 'a', text: 'Taking the center of the room', isCorrect: false },
          { id: 'b', text: 'Calm posture, open gestures, controlled movement', isCorrect: true },
          { id: 'c', text: 'Talking louder than others', isCorrect: false },
          { id: 'd', text: 'Writing on the board first', isCorrect: false },
        ],
      },
      {
        id: 'q9',
        question: "When you don't agree with someone in a group task, what should your body do?",
        options: [
          { id: 'a', text: 'Turn away slightly (bad)', isCorrect: false },
          { id: 'b', text: 'Close off (cross arms)', isCorrect: false },
          { id: 'c', text: "Maintain openness and show you're considering ideas", isCorrect: true },
          { id: 'd', text: 'Lean back dramatically', isCorrect: false },
        ],
      },
      {
        id: 'q10',
        question: 'What is the foundation of convincing body language?',
        options: [
          { id: 'a', text: 'Acting', isCorrect: false },
          { id: 'b', text: 'Emotional regulation', isCorrect: true },
          { id: 'c', text: 'Clothes', isCorrect: false },
          { id: 'd', text: 'Hair style', isCorrect: false },
        ],
      },
    ],
  },
];

export function getExamByCourseId(courseId: string): CourseExam | undefined {
  return courseExams.find((exam) => exam.courseId === courseId);
}
