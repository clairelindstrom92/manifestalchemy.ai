import { NextRequest, NextResponse } from "next/server";
import { ManifestationEngine, ManifestationContext } from "../../../lib/manifestationEngine";
import { CausalInference } from "../../../lib/causalInference";
import { StateMemory } from "../../../lib/stateMemory";
import { LocalStorageAdapter } from "../../../lib/storage/localStorageAdapter";

// Initialize agentic AI components
const manifestationEngine = new ManifestationEngine();
const causalInference = new CausalInference();
const stateMemory = new StateMemory(new LocalStorageAdapter(), 'default_user');

function validateRequest(conversationHistory: any[], userMessage: string): string | null {
  if (!userMessage || userMessage.trim().length === 0) {
    return "User message cannot be empty";
  }

  if (userMessage.length > 1000) {
    return "User message too long (max 1000 characters)";
  }

  if (!Array.isArray(conversationHistory)) {
    return "Conversation history must be an array";
  }

  if (conversationHistory.length > 20) {
    return "Too many conversation messages (max 20)";
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory, userMessage }: { conversationHistory: any[], userMessage: string } = await request.json();

    // Validate request
    const validationError = validateRequest(conversationHistory, userMessage);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Extract current extracted data from conversation history
    let currentExtractedData = {};
    if (conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (lastMessage.extractedData) {
        currentExtractedData = lastMessage.extractedData;
      }
    }

    // Use CausalInference to auto-complete data
    const implicitData = causalInference.extractImplicitData(conversationHistory);
    const predictedData = causalInference.predictMissingVariables(currentExtractedData, implicitData);
    const completeExtractedData = causalInference.buildCompleteSchema(predictedData);

    // Create manifestation context
    const context: ManifestationContext = {
      conversationHistory,
      extractedData: completeExtractedData,
      currentState: 'discovered',
      progressVelocity: 0,
      saturationThreshold: 0.8
    };

    // Use ManifestationEngine to process the input
    const result = await manifestationEngine.perceive(userMessage, context);

    // Save conversation state to memory (if possible)
    try {
      const manifestationId = `manifestation-${Date.now()}`;
      await stateMemory.saveConversationHistory(manifestationId, conversationHistory);
    } catch (error) {
      console.error('Error saving conversation history:', error);
      // Continue without saving if localStorage fails
    }

    // Return agentic response format
    return NextResponse.json({
      aiResponse: result.aiResponse,
      manifestationState: result.manifestationState,
      nextActions: result.nextActions,
      causalMap: result.causalMap,
      progressVelocity: result.progressVelocity,
      readyForDashboard: result.readyForDashboard,
      extractedData: result.extractedData,
      saturationLevel: result.saturationLevel
    });

  } catch (err: any) {
    console.error("Error in conversation:", err);
    return NextResponse.json({
      aiResponse: "I am attuning to your manifestation frequency. Please share your core intention.",
      manifestationState: 'discovered',
      nextActions: [],
      causalMap: [],
      progressVelocity: 0,
      readyForDashboard: false,
      extractedData: {},
      saturationLevel: 0
    });
  }
}