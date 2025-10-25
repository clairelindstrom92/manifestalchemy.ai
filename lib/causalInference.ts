import { ConversationMessage, ExtractedData } from "../types";

export class CausalInference {
  public extractImplicitData(conversationHistory: ConversationMessage[]): ExtractedData {
    let implicitData: ExtractedData = {};
    
    if (conversationHistory.length === 0) {
      return implicitData;
    }

    const conversationText = conversationHistory.map(msg => msg.content.toLowerCase()).join(' ');

    // Simple keyword-based extraction
    if (conversationText.includes("money") || conversationText.includes("financial") || conversationText.includes("wealth")) {
      implicitData.coreDesire = "financial abundance";
    }
    if (conversationText.includes("health") || conversationText.includes("fitness") || conversationText.includes("wellness")) {
      implicitData.coreDesire = "optimal health";
    }
    if (conversationText.includes("career") || conversationText.includes("job") || conversationText.includes("work")) {
      implicitData.coreDesire = "career advancement";
    }
    if (conversationText.includes("love") || conversationText.includes("relationship") || conversationText.includes("partner")) {
      implicitData.coreDesire = "harmonious relationships";
    }
    if (conversationText.includes("home") || conversationText.includes("environment") || conversationText.includes("space")) {
      implicitData.coreDesire = "ideal living space";
    }

    // Infer timeframe
    if (conversationText.includes("soon") || conversationText.includes("quickly")) {
      implicitData.timeframe = "short-term";
    } else if (conversationText.includes("long term") || conversationText.includes("future")) {
      implicitData.timeframe = "long-term";
    }

    return implicitData;
  }

  public predictMissingVariables(currentData: ExtractedData, implicitData: ExtractedData): ExtractedData {
    let predicted: ExtractedData = { ...currentData };

    // Combine current data with implicit data
    predicted = { ...implicitData, ...predicted };

    // Fill in defaults if still missing
    predicted.coreDesire = predicted.coreDesire || "personal fulfillment";
    predicted.timeframe = predicted.timeframe || "flexible";
    predicted.constraints = predicted.constraints && predicted.constraints.length > 0 ? predicted.constraints : ["none identified"];
    predicted.emotionalCharge = predicted.emotionalCharge || "positive anticipation";
    predicted.limitingBeliefs = predicted.limitingBeliefs && predicted.limitingBeliefs.length > 0 ? predicted.limitingBeliefs : ["none identified"];

    return predicted;
  }

  public buildCompleteSchema(data: ExtractedData): ExtractedData {
    return {
      coreDesire: data.coreDesire || "personal fulfillment",
      timeframe: data.timeframe || "flexible",
      constraints: data.constraints || ["none identified"],
      emotionalCharge: data.emotionalCharge || "positive anticipation",
      limitingBeliefs: data.limitingBeliefs || ["none identified"],
    };
  }

  public calculateConfidence(data: ExtractedData): number {
    const totalFields = 5;
    let filledFields = 0;
    if (data.coreDesire && data.coreDesire !== "personal fulfillment") filledFields++;
    if (data.timeframe && data.timeframe !== "flexible") filledFields++;
    if (data.constraints && data.constraints.length > 0 && data.constraints[0] !== "none identified") filledFields++;
    if (data.emotionalCharge && data.emotionalCharge !== "positive anticipation") filledFields++;
    if (data.limitingBeliefs && data.limitingBeliefs.length > 0 && data.limitingBeliefs[0] !== "none identified") filledFields++;
    return filledFields / totalFields;
  }
}