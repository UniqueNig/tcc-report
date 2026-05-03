import { gql } from "graphql-tag"

export const unitTypeDef = gql`
  type Unit {
    id: ID!
    name: String!
  }
`