import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar JSON

  enum UserRole {
    UNIT_HEAD
    CORE_LEADER
    ADMIN
  }

  enum FieldType {
    text
    number
    textarea
    select
    multiselect
    boolean
    currency
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    unitId: ID
    unit: Unit
    unitIds: [ID!]!
    units: [Unit!]!
    createdAt: String!
    updatedAt: String!
  }

  type Unit {
    id: ID!
    name: String!
    coreLeaderId: ID!
    coreLeader: User
    unitHead: User
    formSchema: UnitFormSchema
    reportCount: Int!
    pendingCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type UnitFormField {
    id: String!
    label: String!
    type: FieldType!
    required: Boolean!
    placeholder: String
    options: [String!]
    helpText: String
  }

  type UnitFormSection {
    title: String!
    fields: [UnitFormField!]!
  }

  type UnitFormSchema {
    unitName: String!
    sections: [UnitFormSection!]!
  }

  type ReportField {
    id: String!
    label: String!
    type: FieldType!
    value: JSON!
  }

  type ReportSection {
    title: String!
    fields: [ReportField!]!
  }

  type Report {
    id: ID!
    title: String!
    unitId: ID!
    unit: Unit
    submittedBy: ID!
    submittedByUser: User
    status: String!
    reviewedBy: ID
    reviewedByUser: User
    reviewedAt: String
    sections: [ReportSection!]!
    attachmentUrl: String
    attachmentName: String
    attachmentSize: String
    comments: [Comment!]!
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    id: ID!
    reportId: ID!
    author: ID!
    authorUser: User
    role: UserRole!
    body: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: UserRole!
    unitId: ID
    unitIds: [ID!]
  }

  input UpdateUserInput {
    name: String
    email: String
    password: String
    role: UserRole
    unitId: ID
    unitIds: [ID!]
  }

  input CreateUnitInput {
    name: String!
    coreLeaderId: ID!
    headId: ID
    formSchema: UnitFormSchemaInput
  }

  input UpdateUnitInput {
    name: String
    coreLeaderId: ID
    headId: ID
    formSchema: UnitFormSchemaInput
  }

  input UnitFormFieldInput {
    id: String!
    label: String!
    type: FieldType!
    required: Boolean!
    placeholder: String
    options: [String!]
    helpText: String
  }

  input UnitFormSectionInput {
    title: String!
    fields: [UnitFormFieldInput!]!
  }

  input UnitFormSchemaInput {
    unitName: String!
    sections: [UnitFormSectionInput!]!
  }

  input ReportFieldInput {
    id: String!
    label: String!
    type: FieldType!
    value: JSON!
  }

  input ReportSectionInput {
    title: String!
    fields: [ReportFieldInput!]!
  }

  input CreateReportInput {
    title: String!
    unitId: ID
    sections: [ReportSectionInput!]!
    attachmentUrl: String
    attachmentName: String
    attachmentSize: String
  }

  type Query {
    me: User
    users(role: UserRole): [User!]!
    units: [Unit!]!
    reports(status: String, unitId: ID, mine: Boolean): [Report!]!
    report(id: ID!): Report
    comments(reportId: ID!): [Comment!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!

    createUnit(input: CreateUnitInput!): Unit!
    updateUnit(id: ID!, input: UpdateUnitInput!): Unit!
    deleteUnit(id: ID!): Boolean!

    createReport(input: CreateReportInput!): Report!
    markReportReviewed(id: ID!): Report!
    deleteReport(id: ID!): Boolean!

    addComment(reportId: ID!, body: String!): Comment!
  }
`;
