export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  courseId: string;
  courseName: string;
  questions: QuizQuestion[];
  passingScore: number;
}

export const courseQuizzes: Quiz[] = [
  {
    courseId: 'body-language',
    courseName: 'Body Language Masterclass',
    passingScore: 80,
    questions: [
      {
        id: 'bl-q1',
        question: 'What is the strongest non-verbal indicator that a candidate is confident and in control during a group exercise?',
        options: [
          'Holding their hands behind their back',
          'Leaning back in the chair',
          'Upright posture with relaxed shoulders and open torso',
          'Crossing their arms'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'bl-q2',
        question: 'A recruiter sees a candidate smiling but with tightened lips and raised shoulders. What does this signal?',
        options: [
          'Genuine happiness',
          'Relaxed interaction',
          'Masked nervousness or insecurity',
          'Dominance'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'bl-q3',
        question: 'During an Open Day, what type of eye contact is most effective?',
        options: [
          'Constant eye contact without break',
          'Short glances to avoid pressure',
          'Balanced eye contact: steady but soft',
          'Avoid eye contact unless spoken to'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'bl-q4',
        question: 'Which microexpression often reveals hidden stress?',
        options: [
          'Slight eyebrow raise paired with a relaxed smile',
          'Tightened jaw and micro-frown',
          'Softened eyelids',
          'Cheek-lift smile'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'bl-q5',
        question: 'What body signal suggests leadership inside a group task?',
        options: [
          'Speaking loudly',
          'Taking notes for everyone',
          'Leaning slightly forward, palms visible, calm tone',
          'Interrupting others assertively'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'bl-q6',
        question: "A candidate's foot direction is pointing toward the exit during discussions. This suggests:",
        options: [
          'Strong interest',
          'Engagement',
          'Desire to leave or discomfort',
          'Confidence'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'bl-q7',
        question: 'What is the biggest red flag for recruiters evaluating body language?',
        options: [
          'Large expressive gestures',
          'Overly rehearsed posture and fake smiles',
          'Natural movement',
          'Subtle hand gestures'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'bl-q8',
        question: 'In moments of silence during group work, what is the best body stance?',
        options: [
          'Rigid, still, waiting',
          'Fidgeting to fill time',
          'Calm posture, composed breathing, attentive face',
          'Looking away or at the floor'
        ],
        correctAnswerIndex: 2
      }
    ]
  },
  {
    courseId: 'first-impression',
    courseName: 'First Impression Mastery',
    passingScore: 80,
    questions: [
      {
        id: 'fi-q1',
        question: 'Recruiters form an initial judgment in approximately:',
        options: [
          '30 seconds',
          '10 seconds',
          '7 seconds',
          '2 minutes'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'fi-q2',
        question: 'What grooming detail destroys a first impression fastest?',
        options: [
          'Minimal makeup',
          'Simple hairstyle',
          'Wrinkled or poorly ironed clothing',
          'Neutral perfume'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'fi-q3',
        question: 'What vocal characteristic signals emotional control and professionalism?',
        options: [
          'Fast speaking',
          'Monotone voice',
          'Slow, clear, warm tone',
          'Whisper-like speaking'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'fi-q4',
        question: 'When entering a room, what should your spatial awareness focus on?',
        options: [
          'Walking fast to avoid being seen',
          'Maintaining straight posture and scanning space confidently',
          'Looking down while walking',
          'Standing randomly anywhere'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'fi-q5',
        question: 'What subtle action creates an instant negative impression?',
        options: [
          'Soft nodding',
          'Micro eye-roll',
          'Calm smile',
          'Adjusting a sleeve'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'fi-q6',
        question: 'A candidate wants to show confidence without being arrogant. What is the best method?',
        options: [
          'Using strong hand gestures',
          'Maintaining composed posture and respectful tone',
          'Taking center space physically',
          'Speaking more than others'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'fi-q7',
        question: 'What subconscious cue are recruiters MOST sensitive to?',
        options: [
          'Accent',
          'Walk speed',
          'Authentic facial expressions',
          'Jewelry style'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'fi-q8',
        question: 'When greeting a recruiter, what combination is ideal?',
        options: [
          'Long handshake + intense eye contact',
          'Fast handshake + wide smile',
          'Moderate handshake + soft confidence in voice + warm smile',
          'Avoid handshake to appear humble'
        ],
        correctAnswerIndex: 2
      }
    ]
  },
  {
    courseId: 'open-day-blueprint',
    courseName: 'Open Day Blueprint',
    passingScore: 80,
    questions: [
      {
        id: 'odb-q1',
        question: 'What is the actual hidden purpose of the first Open Day filter?',
        options: [
          'To check documents',
          'To test English level',
          'To evaluate your confidence under pressure',
          'To give instructions'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odb-q2',
        question: 'In the group task, what usually eliminates candidates fastest?',
        options: [
          'Being too quiet',
          'Being too dominant',
          'Breaking group harmony / poor teamwork',
          'Asking clarification questions'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odb-q3',
        question: 'Recruiters observe candidates MOST during:',
        options: [
          'The final interview only',
          'Group discussion only',
          'Breaks, waiting times, and transitions',
          'When handing documents'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odb-q4',
        question: 'In a decision-making task, what proves leadership?',
        options: [
          'Pushing your idea as the only solution',
          'Speaking the most',
          'Guiding the team to a shared conclusion',
          'Correcting others frequently'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odb-q5',
        question: 'What is the FINAL filter used before choosing who goes to the final interview?',
        options: [
          'Physical fitness',
          'Problem-solving',
          'Consistency in behavior throughout the day',
          'Smiling the most'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odb-q6',
        question: 'Which candidate approach creates suspicion?',
        options: [
          'Being calm and clear',
          'Over-rehearsed speeches and scripted phrases',
          'Being attentive',
          'Asking questions at the right moment'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'odb-q7',
        question: 'What is the secret grading criteria during group activities?',
        options: [
          'Best idea wins',
          'The loudest person scores highest',
          'How the group reaches a decision',
          'Who finishes first'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odb-q8',
        question: "When summarizing your group's solution, what MUST you avoid?",
        options: [
          'Speaking clearly',
          'Representing your group',
          'Saying "I decided…"',
          'Smiling naturally'
        ],
        correctAnswerIndex: 2
      }
    ]
  },
  {
    courseId: 'open-day-introduction',
    courseName: 'Open Day Introduction',
    passingScore: 80,
    questions: [
      {
        id: 'odi-q1',
        question: 'What is the psychological purpose of having hundreds of candidates in one room?',
        options: [
          'Create excitement',
          'Force competition',
          'Increase stress and test emotional control',
          'Confuse applicants'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odi-q2',
        question: 'Why do some recruiters walk around silently before the event begins?',
        options: [
          'They are bored',
          'To test punctuality',
          'To observe natural behavior',
          'To check the room temperature'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odi-q3',
        question: 'What is the first internal question candidates usually ask that weakens confidence?',
        options: [
          'What are the rules?',
          'Am I good enough?',
          'Where is the bathroom?',
          'Should I sit?'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'odi-q4',
        question: 'Emotional control during elimination rounds means:',
        options: [
          'Not reacting at all',
          'Smiling excessively',
          'Remaining composed and respectful',
          'Asking why you were eliminated'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odi-q5',
        question: 'What is the biggest behavioral trap candidates fall into early?',
        options: [
          'Sitting quietly',
          'Forming small social circles that exclude others',
          'Asking too many questions',
          'Standing alone'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'odi-q6',
        question: 'Recruiters eliminate candidates early based on:',
        options: [
          'Clothes brand',
          'Natural attitude in the room',
          'Height',
          'Social media'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'odi-q7',
        question: "What should you do if you didn't understand an instruction?",
        options: [
          'Interrupt the recruiter',
          'Ask the person next to you loudly',
          'Raise your hand politely and wait for the right moment',
          'Ignore it and hope it makes sense later'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'odi-q8',
        question: 'The introduction phase reveals who:',
        options: [
          'Speaks the most',
          'Acts the most friendly',
          'Shows authenticity under pressure',
          'Looks the most confident physically'
        ],
        correctAnswerIndex: 2
      }
    ]
  }
];

export function getQuizByCourseId(courseId: string): Quiz | undefined {
  return courseQuizzes.find(q => q.courseId === courseId);
}

export function shuffleOptions(question: QuizQuestion): QuizQuestion {
  const shuffled = [...question.options];
  const correctAnswer = shuffled[question.correctAnswerIndex];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return {
    ...question,
    options: shuffled,
    correctAnswerIndex: shuffled.indexOf(correctAnswer)
  };
}
