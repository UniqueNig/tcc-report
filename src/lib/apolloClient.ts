"use client";

import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: "/api/graphql",
    credentials: "same-origin",
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          reports: {
            keyArgs: ["status", "unitId", "mine"],
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  devtools: {
    enabled: process.env.NODE_ENV !== "production",
  },
});
