// components/chat/chatLimits.js
//
// This module defines a set of constants controlling how many conversations and
// messages a user can persist as well as how many recent messages are
// forwarded to the language model for context. The values mirror the
// former Base44 defaults but can be tuned by your team as needed.

export const LIMITS = {
  /** Maximum number of saved conversations per user. */
  MAX_CONVERSATIONS_PER_USER: 20,
  /** Maximum number of messages stored per conversation. */
  MAX_MESSAGES_PER_CONVERSATION: 300,
  /** Number of most recent messages sent to the LLM for context. */
  CONTEXT_LAST_K_MESSAGES: 20,
  /** How often to update the rolling summary (every N messages). */
  SUMMARY_UPDATE_EVERY_N: 10,
};

export default LIMITS;
