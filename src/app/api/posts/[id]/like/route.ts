import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.googleId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const postId = parseInt(params.id, 10);
  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { googleId: session.user.googleId },
    select: { id: true, username: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Cannot like own post
  if (post.username === user.username) {
    return NextResponse.json({ error: "Cannot like your own post" }, { status: 403 });
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing) {
    // Unlike
    await prisma.$transaction([
      prisma.postLike.delete({ where: { postId_userId: { postId, userId: user.id } } }),
      prisma.post.update({ where: { id: postId }, data: { likes: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await prisma.$transaction([
      prisma.postLike.create({ data: { postId, userId: user.id } }),
      prisma.post.update({ where: { id: postId }, data: { likes: { increment: 1 } } }),
    ]);
    return NextResponse.json({ liked: true });
  }
}
