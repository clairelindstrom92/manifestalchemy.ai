import { ConversationQuestion } from '../types';

export const conversationQuestions: ConversationQuestion[] = [
  {
    id: 'name',
    question: "Hi! I'm Aurelia, your manifestation coach. What's your name?",
    field: 'userName',
    placeholder: 'Enter your name...',
    isLast: false
  },
  {
    id: 'spark',
    question: "Close your eyes for a moment…\nImagine the world softening around you — all noise fading away.\nYou're standing at the edge of a new chapter.\nTell me, what part of your life do you feel is ready to transform first — your home, your work, your heart, or your purpose?",
    field: 'manifestation_category',
    placeholder: 'Describe what area of life...',
    isLast: false
  },
  {
    id: 'vision',
    question: "Good… now see it clearly.\nPicture yourself six months from now — everything feels aligned, balanced, beautifully yours.\nWhere are you? What does the space around you look and feel like?",
    field: 'environment_description',
    placeholder: 'Describe your vision...',
    isLast: false
  },
  {
    id: 'emotion',
    question: "Feel into that version of you.\nWhat emotions are alive in your chest right now — peace, pride, excitement, love, freedom?\nLet your heart answer, not your mind.",
    field: 'core_emotion',
    placeholder: 'Describe your emotions...',
    isLast: false
  },
  {
    id: 'symbols',
    question: "Beautiful. Every vision carries symbols — things that call to you again and again.\nMaybe it's a home by the water, creative freedom, radiant health, or someone to share your journey with.\nWhat images or symbols keep appearing in your vision?",
    field: 'symbolic_elements',
    placeholder: 'Describe the symbols...',
    isLast: false
  },
  {
    id: 'claim',
    question: "This is your moment of alignment.\nWhisper it if you can — 'I'm ready for this.'\nNow tell me in one breath: what are you ready to call into your reality?",
    field: 'manifestation_title',
    placeholder: 'State your intention...',
    isLast: true
  }
];
