import { gql } from "graphql-tag"

export const reportTypeDef = gql`
  type Report {
    id: ID!
    title: String!
    content: String!
    status: String!
    createdAt: String!
  }

  type Query {
    getReports: [Report]
  }

  type Mutation {
    createReport(title: String!, content: String!): Report
  }
`