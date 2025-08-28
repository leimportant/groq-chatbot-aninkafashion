/**
 * ConversationState.ts
 * Defines the conversation state entity for tracking chat context
 */

export interface ConversationState {
  sessionId: string;
  currentIntent: string | null;
  entities: Record<string, any>;
  context: {
    lastMessage: string;
    lastResponse: string;
    previousIntents: string[];
    turnCount: number;
    lastProductSearch?: string;
    lastOrderId?: string;
  };
  confidence: number;
}

export const createConversationState = (sessionId: string): ConversationState => {
  return {
    sessionId,
    currentIntent: null,
    entities: {},
    context: {
      lastMessage: '',
      lastResponse: '',
      previousIntents: [],
      turnCount: 0
    },
    confidence: 1.0
  };
};

export const updateConversationState = (
  state: ConversationState,
  updates: Partial<ConversationState>
): ConversationState => {
  return {
    ...state,
    ...updates,
    context: {
      ...state.context,
      ...(updates.context || {})
    },
    entities: {
      ...state.entities,
      ...(updates.entities || {})
    }
  };
};

export const addMessageToState = (
  state: ConversationState,
  message: string,
  response: string
): ConversationState => {
  return updateConversationState(state, {
    context: {
      lastMessage: message,
      lastResponse: response,
      turnCount: state.context.turnCount + 1,
      previousIntents: [...state.context.previousIntents]
    }
  });
};

export const addIntentToState = (
  state: ConversationState,
  intent: string,
  confidence: number
): ConversationState => {
  return updateConversationState(state, {
    currentIntent: intent,
    confidence,
    context: {
      lastMessage: state.context.lastMessage,
      lastResponse: state.context.lastResponse,
      previousIntents: [...state.context.previousIntents, intent],
      turnCount: state.context.turnCount + 1
    }
  });
};

export const addEntityToState = (
  state: ConversationState,
  entityName: string,
  entityValue: any
): ConversationState => {
  return updateConversationState(state, {
    entities: {
      [entityName]: entityValue
    }
  });
};