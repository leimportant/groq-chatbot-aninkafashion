/**
 * IntentClassifier.ts
 * Service for classifying user intents based on message content and entities
 */

import { extractEntities, ExtractedEntities } from "./EntityExtractor";
import { ConversationState } from "../entities/ConversationState";

export interface IntentClassification {
  intent: Intent;
  confidence: number;
  entities: ExtractedEntities;
}

// Intent types
export enum Intent {
  PRODUCT_SEARCH = "product_search",
  ORDER_TRACKING = "order_tracking",
  GREETING = "greeting",
  GENERAL_QUERY = "general_query",
  FALLBACK = "fallback",
  USER_STATUS = "user_status",
  MENU_QUERY = "menu_query",
  ORDER_ACTION = "order_action",
  GENERAL_FAQ = "general_faq",
}

// Greeting patterns in Indonesian and English
const GREETING_PATTERNS = [
  "halo", "hello", "hi", "hey", "selamat pagi", "selamat siang", "selamat sore",
  "selamat malam", "good morning", "good afternoon", "good evening", "assalamualaikum",
  "permisi", "excuse me", "hai", "apa kabar", "how are you",
];

/**
 * Classify user intent based on message content and conversation state
 */
export const classifyIntent = (
  message: string,
  state?: ConversationState
): IntentClassification => {
  const lowercaseMessage = message.toLowerCase();
  const entities: ExtractedEntities = extractEntities(message);

  // === GREETING ===
  for (const pattern of GREETING_PATTERNS) {
    if (lowercaseMessage.includes(pattern) && lowercaseMessage.length < 20) {
      return {
        intent: Intent.GREETING,
        confidence: 0.9,
        entities: {},
      };
    }
  }

  // === PRODUCT SEARCH ===
  if (
    entities.product_keywords ||
    entities.product_name ||
    entities.color ||
    entities.size ||
    entities.category
  ) {
    const confidence =
      entities.product_name || entities.product_keywords?.length
        ? 0.85
        : 0.7;

    return {
      intent: Intent.PRODUCT_SEARCH,
      confidence,
      entities,
    };
  }

  // === ORDER TRACKING ===
  if (entities.order_keywords || entities.order_id) {
    const confidence = entities.order_id ? 0.9 : 0.75;

    return {
      intent: Intent.ORDER_TRACKING,
      confidence,
      entities,
    };
  }

  // === ORDER ACTION (cancel / return / refund) ===
  if (entities.order_action) {
    return {
      intent: Intent.ORDER_ACTION,
      confidence: 0.85,
      entities,
    };
  }

  // === USER STATUS ===
  if (entities.user_status) {
    return {
      intent: Intent.USER_STATUS,
      confidence: 0.9,
      entities,
    };
  }

  // === MENU QUERY ===
  if (entities.menu_query) {
    return {
      intent: Intent.MENU_QUERY,
      confidence: 0.9,
      entities,
    };
  }

  // === GENERAL FAQ ===
  if (entities.general_faq) {
    return {
      intent: Intent.GENERAL_FAQ,
      confidence: 0.85,
      entities,
    };
  }

  // === CONTEXT CONTINUATION ===
  if (state && state.currentIntent) {
    return {
      intent: state.currentIntent as Intent,
      confidence: 0.5, // lower because it's only context-based
      entities,
    };
  }

  // === DEFAULT GENERAL QUERY ===
  return {
    intent: Intent.GENERAL_QUERY,
    confidence: 0.3,
    entities,
  };
};

/**
 * Determine if the intent classification confidence is too low,
 * indicating a fallback should be used
 */
export const shouldUseFallback = (
  classification: IntentClassification
): boolean => {
  return classification.confidence < 0.4;
};

/**
 * Get a fallback response when intent confidence is too low
 */
export const getFallbackResponse = (): string => {
  const fallbackResponses = [
    "Maaf, saya tidak yakin apa yang Anda maksud. Bisakah Anda menjelaskan dengan lebih detail?",
    "Saya kurang memahami permintaan Anda. Anda bisa bertanya tentang produk fashion kami atau status pesanan Anda.",
    "Mohon maaf, saya tidak mengerti. Coba tanyakan dengan cara lain atau berikan informasi lebih spesifik.",
    "Saya masih belajar untuk memahami permintaan Anda. Bisakah Anda mengajukan pertanyaan dengan cara yang berbeda?",
  ];

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};
