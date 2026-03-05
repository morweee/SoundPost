import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = createPostSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { title, content, album } = result.data;
  const username = session.user.username;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { avatarUrl: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      username,
      avatarUrl: user.avatarUrl ?? `/api/avatar/${username}`,
      album: album ?? null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
