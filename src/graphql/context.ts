import type { NextRequest } from "next/server";
import { getUserFromRequest, type JWTPayload } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/db";

export interface GraphQLContext {
  user: JWTPayload | null;
}

export async function createGraphQLContext(req: NextRequest): Promise<GraphQLContext> {
  await connectDB();

  return {
    user: getUserFromRequest(req),
  };
}
