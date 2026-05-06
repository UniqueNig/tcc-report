import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { createGraphQLContext, type GraphQLContext } from "@/src/graphql/context";
import { resolvers } from "@/src/graphql/resolvers";
import { typeDefs } from "@/src/graphql/typeDefs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
});

const apolloHandler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: async (req) => createGraphQLContext(req),
});

export async function GET(req: NextRequest): Promise<Response> {
  return apolloHandler(req);
}

export async function POST(req: NextRequest): Promise<Response> {
  return apolloHandler(req);
}
