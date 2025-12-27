import { getEnv } from "../config/env";
import { log } from "../utils/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini AI 클라이언트를 지연 초기화합니다.
 */
function getGenAI(): GoogleGenerativeAI {
  const { GOOGLE_GEMINI_API_KEY } = getEnv();
  return new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
}

/**
 * AI 이미지 생성 API로 이미지를 생성하고 Buffer로 반환합니다.
 */
export async function generateAIImage(prompt: string): Promise<Buffer> {
  const { IMAGE_GENERATION_API } = getEnv();

  switch (IMAGE_GENERATION_API) {
    case "gemini":
      return generateWithGemini(prompt);
    case "replicate":
      return generateWithReplicate(prompt);
    case "huggingface":
      return generateWithHuggingFace(prompt);
    case "deepai":
      return generateWithDeepAI(prompt);
    case "none":
    default:
      throw new Error("이미지 생성 API가 설정되지 않았습니다. IMAGE_GENERATION_API 환경 변수를 확인하세요.");
  }
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
      modelName
    });

    // REST API 직접 호출 (SDK가 지원하지 않는 경우)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const response = await fetch(`${apiUrl}?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
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
      log.warn("Gemini API에서 이미지 데이터를 찾을 수 없음", {
        responseKeys: Object.keys(result),
        candidatesCount: result.candidates?.length || 0,
      });

      throw new Error(
        `Gemini API에서 이미지 데이터를 추출할 수 없습니다. ` +
        `모델 "${modelName}"이 이미지 생성을 지원하지 않거나, ` +
        `API 응답 형식이 예상과 다릅니다. ` +
        `대신 Replicate, Hugging Face, 또는 DeepAI를 사용하세요.`
      );
    }

    // Base64 데이터에서 이미지 Buffer 생성
    const imageBuffer = Buffer.from(imageBase64, "base64");
    log.debug("Gemini 이미지 생성 완료", {
      promptLength: prompt.length,
      imageSize: imageBuffer.length,
      mimeType
    });

    return imageBuffer;
  } catch (error) {
    log.error("Gemini 이미지 생성 실패", error instanceof Error ? error : new Error(String(error)), {
      promptLength: prompt.length,
    });

    // 에러 메시지에 더 자세한 정보 추가
    if (error instanceof Error) {
      throw new Error(`Gemini 이미지 생성 실패: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Replicate API를 사용하여 이미지 생성
 */
async function generateWithReplicate(prompt: string): Promise<Buffer> {
  const { REPLICATE_API_TOKEN } = getEnv();

  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN이 설정되지 않았습니다.");
  }

  try {
    // Replicate API 호출
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API 오류: ${response.status} - ${errorText}`);
    }

    const prediction = await response.json();

    // 예측 완료 대기 (폴링)
    let result = prediction;
    while (result.status === "starting" || result.status === "processing") {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Replicate 상태 확인 오류: ${statusResponse.status}`);
      }

      result = await statusResponse.json();
    }

    if (result.status === "failed") {
      throw new Error(`Replicate 이미지 생성 실패: ${result.error || "알 수 없는 오류"}`);
    }

    if (!result.output || result.output.length === 0) {
      throw new Error("Replicate 이미지 생성 결과가 없습니다.");
    }

    // 이미지 URL에서 이미지 다운로드
    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    log.debug("Replicate 이미지 생성 완료", { promptLength: prompt.length, imageSize: imageBuffer.length });

    return imageBuffer;
  } catch (error) {
    log.error("Replicate 이미지 생성 실패", error instanceof Error ? error : new Error(String(error)), {
      promptLength: prompt.length,
    });
    throw error;
  }
}

/**
 * Hugging Face API를 사용하여 이미지 생성
 */
async function generateWithHuggingFace(prompt: string): Promise<Buffer> {
  const { HUGGINGFACE_API_KEY } = getEnv();

  if (!HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY가 설정되지 않았습니다.");
  }

  try {
    // Hugging Face Inference API 호출
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API 오류: ${response.status} - ${errorText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    log.debug("Hugging Face 이미지 생성 완료", { promptLength: prompt.length, imageSize: imageBuffer.length });

    return imageBuffer;
  } catch (error) {
    log.error("Hugging Face 이미지 생성 실패", error instanceof Error ? error : new Error(String(error)), {
      promptLength: prompt.length,
    });
    throw error;
  }
}

/**
 * DeepAI API를 사용하여 이미지 생성
 */
async function generateWithDeepAI(prompt: string): Promise<Buffer> {
  const { DEEPAI_API_KEY } = getEnv();

  if (!DEEPAI_API_KEY) {
    throw new Error("DEEPAI_API_KEY가 설정되지 않았습니다.");
  }

  try {
    // DeepAI API 호출
    const response = await fetch("https://api.deepai.org/api/text2img", {
      method: "POST",
      headers: {
        "Api-Key": DEEPAI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepAI API 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.output_url) {
      throw new Error("DeepAI 이미지 생성 결과가 없습니다.");
    }

    // 이미지 URL에서 이미지 다운로드
    const imageResponse = await fetch(result.output_url);

    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    log.debug("DeepAI 이미지 생성 완료", { promptLength: prompt.length, imageSize: imageBuffer.length });

    return imageBuffer;
  } catch (error) {
    log.error("DeepAI 이미지 생성 실패", error instanceof Error ? error : new Error(String(error)), {
      promptLength: prompt.length,
    });
    throw error;
  }
}

