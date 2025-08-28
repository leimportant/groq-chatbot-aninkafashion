/**
 * ConversationStateManager.ts
 * Service for managing conversation state across sessions
 */

import { ConversationState, createConversationState, updateConversationState } from '../../domain/entities/ConversationState';

// In-memory store for conversation states
// In a production environment, this would be replaced with a database or Redis
const conversationStates: Record<string, ConversationState> = {};

/**
 * Get conversation state for a session
 * Creates a new state if one doesn't exist
 */
export const getConversationState = (sessionId: string): ConversationState => {
  if (!conversationStates[sessionId]) {
    conversationStates[sessionId] = createConversationState(sessionId);
  }
  
  return conversationStates[sessionId];
};

/**
 * Update conversation state for a session
 */
export const updateState = (
  sessionId: string,
  updates: Partial<ConversationState>
): ConversationState => {
  const currentState = getConversationState(sessionId);
  const updatedState = updateConversationState(currentState, updates);
  
  // Save the updated state
  conversationStates[sessionId] = updatedState;
  
  return updatedState;
};

/**
 * Clear conversation state for a session
 */
export const clearConversationState = (sessionId: string): void => {
  delete conversationStates[sessionId];
};

/**
 * Get all active conversation sessions
 */
export const getAllSessionIds = (): string[] => {
  return Object.keys(conversationStates);
};