import { getEnv } from "../config/env";
import { log } from "../utils/logger";

/**
 * AI 이미지 생성 API로 이미지를 생성하고 Buffer로 반환합니다.
 */
export async function generateAIImage(prompt: string): Promise<Buffer> {
  const { IMAGE_GENERATION_API } = getEnv();

  if (IMAGE_GENERATION_API === "gemini") {
    return generateWithGemini(prompt);
  }

  if (IMAGE_GENERATION_API === "none") {
    throw new Error("이미지 생성 API가 설정되지 않았습니다. IMAGE_GENERATION_API 환경 변수를 'gemini'로 설정하세요.");
  }

  throw new Error(`지원하지 않는 이미지 생성 API입니다: ${IMAGE_GENERATION_API}. 'gemini' 또는 'none'만 사용 가능합니다.`);
}

/**
 * Gemini Nano Banana Pro API를 사용하여 이미지 생성
 * 공식 문서: https://ai.google.dev/gemini-api/docs/nanobanana
 *
 * 참고: 현재 @google/generative-ai SDK는 이미지 생성을 직접 지원하지 않을 수 있으므로
 * REST API를 직접 호출하는 방식으로 구현합니다.
 */
async function generateWithGemini(prompt: string): Promise<Buffer> {
  try {
    const { GOOGLE_GEMINI_API_KEY } = getEnv();

    // Nano Banana Pro 모델 이름 (공식 문서 확인 필요)
    // 가능한 모델: gemini-2.5-flash-image, gemini-3-pro-image-preview 등
    const modelName = "gemini-2.5-flash-image"; // 또는 "gemini-3-pro-image-preview"

    log.debug("Gemini Nano Banana Pro 이미지 생성 시작", {
      promptLength: prompt.length,
      modelName,
    });

    // REST API 직접 호출 (SDK가 지원하지 않는 경우)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const response = await fetch(`${apiUrl}?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${prompt}\n\nIMPORTANT: The generated image must not contain any text, letters, numbers, characters, or words in any language (Korean, English, or any other language). The image must be completely text-free and contain only visual illustrations without any textual elements.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("Gemini API 호출 실패", new Error(`HTTP ${response.status}: ${errorText}`), {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Gemini API 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    log.debug("Gemini API 응답", {
      hasCandidates: !!result.candidates,
      candidatesLength: result.candidates?.length || 0,
    });

    // 응답에서 이미지 데이터 추출
    // Gemini API 응답 형식: { candidates: [{ content: { parts: [{ inlineData: { data, mimeType } }] } }] }
    let imageBase64: string | null = null;
    let mimeType: string = "image/png";

    if (result.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0];

      // finishReason 확인 (이미지 생성 실패 원인 파악)
      if (candidate.finishReason && candidate.finishReason !== "STOP") {
        log.warn("Gemini API 응답에 finishReason이 STOP이 아님", {
          finishReason: candidate.finishReason,
          finishMessage: candidate.finishMessage,
        });
      }

      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // inlineData에 이미지가 있는 경우
          if (part.inlineData) {
            imageBase64 = part.inlineData.data;
            mimeType = part.inlineData.mimeType || "image/png";
            break;
          }
          // text 응답에 base64가 포함된 경우
          if (part.text) {
            const base64Match = part.text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
            if (base64Match) {
              imageBase64 = base64Match[1];
              mimeType = base64Match[0].match(/data:image\/([^;]+)/)?.[1] || "png";
              break;
            }
          }
        }
      }
    }

    if (!imageBase64) {
      // 모델이 존재하지 않거나 이미지 생성을 지원하지 않는 경우
      // 실제 응답 구조를 로깅하여 디버깅 정보 제공
      const candidate = result.candidates?.[0];
      const candidateStructure = candidate
        ? {
            hasContent: !!candidate.content,
            contentKeys: candidate.content ? Object.keys(candidate.content) : [],
            hasParts: !!candidate.content?.parts,
            partsCount: candidate.content?.parts?.length || 0,
            partsStructure: candidate.content?.parts?.map((part: any) => ({
              keys: Object.keys(part),
              hasInlineData: !!part.inlineData,
              hasText: !!part.text,
              textPreview: part.text ? part.text.substring(0, 200) : null,
              inlineDataKeys: part.inlineData ? Object.keys(part.inlineData) : [],
            })) || [],
            candidateKeys: Object.keys(candidate),
          }
        : null;

      log.warn("Gemini API에서 이미지 데이터를 찾을 수 없음", {
        responseKeys: Object.keys(result),
        candidatesCount: result.candidates?.length || 0,
        candidateStructure,
        finishReason: candidate?.finishReason,
        finishMessage: candidate?.finishMessage,
        safetyRatings: candidate?.safetyRatings,
        fullCandidate: candidate ? JSON.stringify(candidate, null, 2).substring(0, 2000) : null,
      });

      throw new Error(
        `Gemini API에서 이미지 데이터를 추출할 수 없습니다. ` + `모델 "${modelName}"이 이미지 생성을 지원하지 않거나, ` + `API 응답 형식이 예상과 다릅니다. ` + `응답 구조를 확인하려면 로그를 확인하세요.`
      );
    }

    // Base64 데이터에서 이미지 Buffer 생성
    const imageBuffer = Buffer.from(imageBase64, "base64");
    log.debug("Gemini 이미지 생성 완료", {
      promptLength: prompt.length,
      imageSize: imageBuffer.length,
      mimeType,
    });

    return imageBuffer;
  } catch (error) {
    log.error("Gemini 이미지 생성 실패", error instanceof Error ? error : new Error(String(error)), {
      promptLength: prompt.length,
    });
    throw error;
  }
}
