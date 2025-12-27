
import { GoogleGenAI, Type } from "@google/genai";
import { Card } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * AI Narrator: Choose a card and a clue
   */
  async getNarratorClue(hand: Card[]): Promise<{ cardId: number; clue: string }> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are playing a game like Dixit. You have a hand of cards described by their placeholder index. 
        Give me a mysterious, poetic clue for ONE of these cards. 
        The hand is: ${hand.map(c => `Card ${c.id}`).join(", ")}.
        Return a JSON with "cardId" (from the list) and "clue" (a short phrase).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cardId: { type: Type.INTEGER },
              clue: { type: Type.STRING }
            },
            required: ["cardId", "clue"]
          }
        }
      });
      // Correctly access .text property and trim before parsing
      const jsonStr = response.text.trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("AI Narrator Error", error);
      return { cardId: hand[0].id, clue: "Something mysterious..." };
    }
  },

  /**
   * AI Player: Choose a card from hand matching a clue
   */
  async chooseCardForClue(hand: Card[], clue: string): Promise<number> {
    try {
       const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are playing Dixit. The clue is "${clue}". 
        Which of these card IDs best fits this clue (think abstractly)? 
        Cards: ${hand.map(c => c.id).join(", ")}.
        Return just the cardId as a number in JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cardId: { type: Type.INTEGER }
            },
            required: ["cardId"]
          }
        }
      });
      const jsonStr = response.text.trim();
      return JSON.parse(jsonStr).cardId;
    } catch (error) {
      return hand[Math.floor(Math.random() * hand.length)].id;
    }
  },

  /**
   * AI Player: Vote for which card is the Narrator's
   */
  async voteForCard(clue: string, tableCards: { card: Card; playerId: string }[], myPlayerId: string): Promise<string> {
    const options = tableCards.filter(tc => tc.playerId !== myPlayerId);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The Dixit clue is "${clue}". These are the cards on the table (ID and Player). 
        Which player's card do you think is the original narrator's?
        Options: ${options.map(o => `Player ${o.playerId} (Card ${o.card.id})`).join(", ")}.
        Return JSON with "targetPlayerId".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              targetPlayerId: { type: Type.STRING }
            },
            required: ["targetPlayerId"]
          }
        }
      });
      const jsonStr = response.text.trim();
      return JSON.parse(jsonStr).targetPlayerId;
    } catch (error) {
      return options[Math.floor(Math.random() * options.length)].playerId;
    }
  }
};
