import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createComment, getCommentsByNewsId, deleteComment, getCommentById, updateComment } from "@/lib/db/comments";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rate-limit-helper";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const newsId = searchParams.get("newsId");

  if (!newsId) {
    return NextResponse.json({ error: "newsId is required" }, { status: 400 });
  }

  try {
    const comments = await getCommentsByNewsId(newsId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Failed to get comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Rate Limiting 적용
  const rateLimitResponse = await applyRateLimit(request, RATE_LIMIT_CONFIGS.COMMENTS);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { newsId, content } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await createComment(newsId, session.user.id, content);

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Rate Limiting 적용
  const rateLimitResponse = await applyRateLimit(request, RATE_LIMIT_CONFIGS.COMMENTS);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { commentId, content } = await request.json();

    if (!commentId || !content || content.trim() === "") {
      return NextResponse.json({ error: "commentId and content are required" }, { status: 400 });
    }

    // 댓글 조회
    const comment = await getCommentById(commentId);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 작성자 본인만 수정 가능
    if (!session.user || (comment.user_id !== session.user.id && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 댓글 수정
    const updatedComment = await updateComment(commentId, content);

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error("Update comment error:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("commentId");

  if (!commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
  }

  try {
    // 댓글 작성자 확인 (작성자 본인도 삭제 가능하도록 수정)
    const comment = await getCommentById(commentId);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 작성자 본인 또는 관리자만 삭제 가능
    if (!session.user || (comment.user_id !== session.user.id && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteComment(commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
