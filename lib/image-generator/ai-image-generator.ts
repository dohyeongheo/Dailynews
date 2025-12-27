import { getEnv } from "../config/env";
import { log } from "../utils/logger";

/**
 * AI 이미지 생성 API로 이미지를 생성하고 Buffer로 반환합니다.
 */
export async function generateAIImage(prompt: string): Promise<Buffer> {
  const { IMAGE_GENERATION_API } = getEnv();

  switch (IMAGE_GENERATION_API) {
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

