import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { getConversationState, updateState } from '../../application/services/ConversationStateManager';
import { classifyIntent, Intent, shouldUseFallback, getFallbackResponse } from '../../domain/services/IntentClassifier';
import { searchProducts, formatProductResponse } from '../../infrastructure/api/ProductApi';
import { getOrderById, formatOrderResponse, formatTrackingResponse } from '../../infrastructure/api/OrderApi';
import { decryptLaravelCookie } from '../../infrastructure/api/AuthService';
import { 
  searchProductsExternal, 
  formatExternalProductResponse, 
  getOrderByIdExternal, 
  formatExternalOrderResponse,
  getUserStatusExternal,
  formatUserStatusResponse
} from '../../infrastructure/api/ExternalApi';
dotenv.config();


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export const chat = async (req: Request, res: Response) => {
  const { message, sessionId: clientSessionId } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Get Laravel cookie for authentication if available
  const laravelCookie = req.cookies?.aninka_session;
  
  // Generate or use provided session ID
  const sessionId = clientSessionId || uuidv4();
  
  // Get or create conversation state for this session
  const conversationState = getConversationState(sessionId);
  
  // Classify user intent
  const classification = classifyIntent(message, conversationState);
  
  // Update conversation state with new intent and entities
  let updatedState = updateState(sessionId, {
    currentIntent: classification.intent,
    confidence: classification.confidence,
    entities: classification.entities
  });
  
  // Handle fallback for low confidence
  if (shouldUseFallback(classification)) {
    const fallbackResponse = getFallbackResponse();
    
    // Update state with the message and response
    updatedState = updateState(sessionId, {
      context: {
        lastMessage: message,
        lastResponse: fallbackResponse,
        turnCount: conversationState.context.turnCount + 1,
        previousIntents: [
          ...(conversationState.context.previousIntents || []),
          classification.intent
        ],
      }
    });
    
    return res.json({
      response: fallbackResponse,
      sessionId
    });
  }
  
  let responseText = '';
  
  // Handle intent-specific logic
  try {
    switch (classification.intent) {
      case Intent.PRODUCT_SEARCH:
        // Extract product name or keywords from entities
        const productQuery = classification.entities.product_name || 
                            (classification.entities.product_keywords?.length ? 
                             classification.entities.product_keywords[0] : '');
        
        if (productQuery) {
          try {
            // Try to search products from external API first
            const category = classification.entities.category;
            const color = classification.entities.color;
            const size = classification.entities.size;
            
            const externalProducts = await searchProductsExternal(
              productQuery, 
              category, 
              color, 
              size, 
              1, 
              5, 
              laravelCookie
            );
            
            if (externalProducts && externalProducts.length > 0) {
              // Use external API results
              responseText = formatExternalProductResponse(externalProducts);
            } else {
              // Fallback to mock data if external API fails
              const products = await searchProducts(productQuery);
              responseText = formatProductResponse(products);
            }
          } catch (error) {
            console.error('Error searching products from external API:', error);
            // Fallback to mock data
            const products = await searchProducts(productQuery);
            responseText = formatProductResponse(products);
          }
          
          // Update state with product search info
          updatedState = updateState(sessionId, {
            context: {
              lastProductSearch: productQuery,
              lastMessage: message,
              lastResponse: responseText,
              turnCount: conversationState.context.turnCount + 1,
              previousIntents: [
                ...(conversationState.context.previousIntents || []),
                classification.intent
              ],
            }
          });
        } else {
          // No specific product query found, use Groq for general response
          responseText = await getGroqResponse(message, conversationState);
        }
        break;
        
      case Intent.ORDER_TRACKING:
        // Extract order ID from entities
        const orderId = classification.entities.order_id;
        
        if (orderId) {
          try {
            // Try to get order from external API first
            const externalOrder = await getOrderByIdExternal(orderId, laravelCookie);
            
            if (externalOrder) {
              // Use external API results
              responseText = formatExternalOrderResponse(externalOrder);
            } else {
              // Fallback to mock data if external API fails
              const order = await getOrderById(orderId);
              responseText = formatOrderResponse(order);
            }
          } catch (error) {
            console.error('Error getting order from external API:', error);
            // Fallback to mock data
            const order = await getOrderById(orderId);
            responseText = formatOrderResponse(order);
          }
          
          // Update state with order info
          updatedState = updateState(sessionId, {
            context: {
              lastOrderId: orderId,
              lastMessage: message,
              lastResponse: responseText,
              turnCount: conversationState.context.turnCount + 1,
              previousIntents: [
                ...(conversationState.context.previousIntents || []),
                classification.intent
              ],
            }
          });
        } else {
          // No specific order ID found, use Groq for general response
          responseText = await getGroqResponse(message, conversationState);
        }
        break;
        
      case Intent.GREETING:
        // Handle greetings with a friendly response
        const greetings = [
          'Halo! Selamat datang di Aninka Fashion. Ada yang bisa saya bantu hari ini?',
          'Selamat datang di layanan chat Aninka Fashion. Bagaimana saya bisa membantu Anda?',
          'Hai! Terima kasih telah menghubungi Aninka Fashion. Ada yang bisa saya bantu?'
        ];
        responseText = greetings[Math.floor(Math.random() * greetings.length)];
        break;
        
      case Intent.USER_STATUS:
        // Extract user ID from entities or conversation state
        const userId = classification.entities.user_id;
        
        if (userId && laravelCookie) {
          try {
            // Get user status from external API
            const userStatus = await getUserStatusExternal(userId, laravelCookie);
            responseText = formatUserStatusResponse(userStatus);
          } catch (error) {
            console.error('Error getting user status from external API:', error);
            responseText = 'Maaf, saya tidak dapat mengakses informasi keanggotaan Anda saat ini. Silakan coba lagi nanti atau hubungi customer service kami.';
          }
        } else {
          responseText = 'Untuk melihat status keanggotaan Anda, silakan login terlebih dahulu.';
        }
        break;
        
      default:
        // For general queries, use Groq
        responseText = await getGroqResponse(message, conversationState);
        break;
    }
    
    // Update state with the message and response
    updatedState = updateState(sessionId, {
      context: {
        lastMessage: message,
        lastResponse: responseText,
        turnCount: conversationState.context.turnCount + 1,
        previousIntents: [
          ...(conversationState.context.previousIntents || []),
          classification.intent
        ],
      }
    });
    
    // Send response with session ID
    res.json({
      response: responseText,
      sessionId
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({
      error: 'An error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Helper function to get response from Groq API
async function getGroqResponse(message: string, state: any): Promise<string> {
  const model = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';
  const temperature = Number(process.env.GROQ_TEMPERATURE ?? '0.7');
  const max_tokens = Number(process.env.GROQ_MAX_COMPLETION_TOKENS ?? '1024');
  const top_p = Number(process.env.GROQ_TOP_P ?? '1');
  const stream = false;
  
  // Build context from conversation state
  let contextPrompt = '';
  if (state.context.turnCount > 0) {
    contextPrompt = `\nKonteks percakapan sebelumnya:\nPesan terakhir pengguna: "${state.context.lastMessage}"\nRespon terakhir Anda: "${state.context.lastResponse}"`;
  }
  
  try {
    const completionOrStream = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
          `You are an AI assistant for Aninka Fashion (aninkafashion.com).
          You help customers with:
          - Finding clothing and accessories
          - Answering questions about sizes and materials
          - Providing fashion advice
          - Handling order inquiries
          - Processing returns and exchanges
          - Order Status
          - Tracking Orders
          - Payment Methods
          - Shipping Information
          Please be polite and professional. Use Bahasa Indonesia as primary language.
          If you don't know the answer, just say "Maaf, saya tidak memiliki informasi tersebut saat ini."
          ${contextPrompt}`,
        },
        { role: 'user', content: message },
      ],
      model,
      temperature,
      max_completion_tokens: max_tokens,
      top_p,
      stream,
    });

    const normalResponse = completionOrStream as Groq.Chat.ChatCompletion;
    return normalResponse.choices[0]?.message?.content ?? '';
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
};
