
// This file is no longer used for Gemini API calls.
// Kept to avoid breaking potential imports, but functionality is removed.

// import type { EnhancedGameState, GeminiAction } from '../types'; // Types no longer needed here

// No API key or AI client initialization needed.

export const getGeminiResponse = async (
  // gameState: EnhancedGameState, // No longer used
  // action: GeminiAction // No longer used
): Promise<string> => {
  // Return placeholder messages as Gemini API is removed.
  // This function will not be called by App.tsx anymore.
  // const type = action; // action is not passed anymore
  // if (type === "news") {
  //   return "뉴스를 가져오는 중... (실제 API 호출 없음)";
  // }
  // return "조언을 생성하는 중... (실제 API 호출 없음)";
  return "AI 기능이 비활성화되었습니다.";
};
