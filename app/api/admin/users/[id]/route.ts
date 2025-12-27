import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { log } from "@/lib/utils/logger";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { BadRequestError } from "@/lib/errors";

const updateUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

/**
 * 사용자 역할 업데이트 (관리자 전용)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(
    withErrorHandling(async (req: NextRequest) => {
      const body = await req.json();
      const validatedData = updateUserRoleSchema.parse(body);

      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ role: validatedData.role })
        .eq("id", params.id);

      if (error) {
        log.error("Update user role error", new Error(error.message), { userId: params.id, errorCode: error.code });
        return createErrorResponse(new Error(error.message), 500);
      }

      return createSuccessResponse({ success: true }, "사용자 역할이 업데이트되었습니다.");
    })
  )(request);
}

