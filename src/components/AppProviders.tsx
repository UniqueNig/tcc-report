"use client";

import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/src/lib/apolloClient";
import PwaRegistration from "@/src/components/PwaRegistration";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <PwaRegistration />
      {children}
    </ApolloProvider>
  );
}
