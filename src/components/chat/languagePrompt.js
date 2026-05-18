// components/chat/languagePrompt.js
//
// This module contains helper functions used to build the system prompt for
// language model invocations and to provide a simple heuristic for detecting
// the register (formal, casual, slang or neutral) of a given user message.
//
// Supported languages: isiZulu, isiXhosa, Afrikaans, English, Sesotho,
// Setswana, Sepedi, siSwati, Tshivenda, Xitsonga, isiNdebele, SASL.

/**
 * Build a system prompt block enforcing language and style rules.
 *
 * @param {string} language The target language the assistant must use.
 * @param {string} register The desired register: 'formal', 'neutral', 'casual' or 'slang'.
 * @param {string} [summary] An optional rolling summary of the conversation.
 * @returns {string} A formatted system prompt to prepend to LLM messages.
 */
export function buildLanguageSystemBlock(language, register, summary = '') {
  let prompt = `You are a helpful assistant. Always respond in ${language}.`;
  switch (register) {
    case 'formal':
      prompt += ' Use a formal tone appropriate for professional communication.';
      break;
    case 'casual':
      prompt += ' Keep your tone casual and conversational.';
      break;
    case 'slang':
      prompt += ' Feel free to use slang and colloquial expressions.';
      break;
    default:
      prompt += ' Maintain a neutral tone.';
  }
  if (summary && summary.trim().length > 0) {
    prompt += `\n\nConversation summary:\n${summary.trim()}`;
  }
  return prompt;
}

/**
 * Very simple heuristic to detect the register of a message based on keywords.
 *
 * @param {string} text The user input to analyse.
 * @returns {'formal' | 'casual' | 'slang' | 'neutral'} The detected register.
 */
export function detectRegister(text) {
  const lower = String(text || '').toLowerCase();
  // Check for slang keywords
  const slangWords = ['lol', 'brb', 'afk', 'btw', 'whassup', 'yo', 'ayy'];
  if (slangWords.some((word) => lower.includes(word))) {
    return 'slang';
  }
  // Check for formal markers such as titles or polite phrases
  const formalWords = ['dear', 'sir', 'madam', 'regards', 'sincerely'];
  if (formalWords.some((word) => lower.includes(word))) {
    return 'formal';
  }
  // Default to neutral/casual depending on punctuation length
  if (lower.split(' ').length > 20) {
    return 'formal';
  }
  return 'neutral';
}

export default { buildLanguageSystemBlock, detectRegister };
