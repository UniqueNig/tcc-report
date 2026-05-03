import { gql } from "graphql-tag"

export const userTypeDef = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }
`