"use client";

import { gql } from "@apollo/client";

export const UNIT_FORM_SCHEMA_FRAGMENT = gql`
  fragment UnitFormSchemaParts on UnitFormSchema {
    unitName
    sections {
      title
      fields {
        id
        label
        type
        required
        placeholder
        options
        helpText
      }
    }
  }
`;

export const REPORT_LIST_ITEM_FRAGMENT = gql`
  fragment ReportListItem on Report {
    id
    title
    status
    createdAt
    updatedAt
    reviewedAt
    attachmentUrl
    attachmentName
    attachmentSize
    unit {
      id
      name
      coreLeader {
        id
        name
        email
      }
      unitHead {
        id
        name
        email
      }
      reportCount
      pendingCount
      formSchema {
        ...UnitFormSchemaParts
      }
    }
    submittedByUser {
      id
      name
      email
    }
    reviewedByUser {
      id
      name
      email
    }
    comments {
      id
      body
      role
      createdAt
      authorUser {
        id
        name
        email
      }
    }
  }
  ${UNIT_FORM_SCHEMA_FRAGMENT}
`;

export const REPORT_DETAIL_FRAGMENT = gql`
  fragment ReportDetail on Report {
    ...ReportListItem
    sections {
      title
      fields {
        id
        label
        type
        value
      }
    }
  }
  ${REPORT_LIST_ITEM_FRAGMENT}
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
        coreLeader {
          id
          name
          email
        }
        unitHead {
          id
          name
          email
        }
        reportCount
        pendingCount
        formSchema {
          ...UnitFormSchemaParts
        }
      }
      units {
        id
        name
        coreLeader {
          id
          name
          email
        }
        unitHead {
          id
          name
          email
        }
        reportCount
        pendingCount
        formSchema {
          ...UnitFormSchemaParts
        }
      }
      createdAt
      updatedAt
    }
  }
  ${UNIT_FORM_SCHEMA_FRAGMENT}
`;

export const ADMIN_DASHBOARD_QUERY = gql`
  query AdminDashboardData {
    me {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
      }
    }
    users {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
        unitHead {
          id
          name
          email
        }
      }
      units {
        id
        name
        unitHead {
          id
          name
          email
        }
      }
      createdAt
      updatedAt
    }
    units {
      id
      name
      coreLeaderId
      coreLeader {
        id
        name
        email
      }
      unitHead {
        id
        name
        email
      }
      reportCount
      pendingCount
      formSchema {
        ...UnitFormSchemaParts
      }
      createdAt
      updatedAt
    }
    reports {
      ...ReportListItem
    }
  }
  ${REPORT_LIST_ITEM_FRAGMENT}
`;

export const CORE_LEADER_DASHBOARD_QUERY = gql`
  query CoreLeaderDashboardData {
    me {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
      }
    }
    units {
      id
      name
      coreLeaderId
      coreLeader {
        id
        name
        email
      }
      unitHead {
        id
        name
        email
      }
      reportCount
      pendingCount
      formSchema {
        ...UnitFormSchemaParts
      }
      createdAt
      updatedAt
    }
    reports {
      ...ReportListItem
    }
  }
  ${REPORT_LIST_ITEM_FRAGMENT}
`;

export const UNIT_HEAD_DASHBOARD_QUERY = gql`
  query UnitHeadDashboardData {
    me {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
        coreLeader {
          id
          name
          email
        }
        reportCount
        pendingCount
      }
      units {
        id
        name
        coreLeader {
          id
          name
          email
        }
        reportCount
        pendingCount
        formSchema {
          ...UnitFormSchemaParts
        }
      }
    }
    reports {
      ...ReportListItem
    }
  }
  ${REPORT_LIST_ITEM_FRAGMENT}
`;

export const USERS_PAGE_QUERY = gql`
  query UsersPageData {
    me {
      id
      name
      email
      role
    }
    users {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
        unitHead {
          id
          name
          email
        }
      }
      units {
        id
        name
        unitHead {
          id
          name
          email
        }
      }
      createdAt
      updatedAt
    }
    units {
      id
      name
      unitHead {
        id
        name
      }
    }
  }
`;

export const UNITS_PAGE_QUERY = gql`
  query UnitsPageData {
    me {
      id
      name
      email
      role
    }
    units {
      id
      name
      coreLeaderId
      coreLeader {
        id
        name
        email
      }
      unitHead {
        id
        name
        email
      }
      reportCount
      pendingCount
      formSchema {
        ...UnitFormSchemaParts
      }
      createdAt
      updatedAt
    }
    coreLeaders: users(role: CORE_LEADER) {
      id
      name
      email
      role
    }
    unitHeads: users(role: UNIT_HEAD) {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
      }
      units {
        id
        name
      }
    }
  }
  ${UNIT_FORM_SCHEMA_FRAGMENT}
`;

export const REPORTS_PAGE_QUERY = gql`
  query ReportsPageData($status: String, $unitId: ID, $mine: Boolean) {
    me {
      id
      name
      email
      role
      unitId
      unit {
        id
        name
      }
    }
    units {
      id
      name
      reportCount
      pendingCount
    }
    reports(status: $status, unitId: $unitId, mine: $mine) {
      ...ReportListItem
    }
  }
  ${REPORT_LIST_ITEM_FRAGMENT}
`;

export const TOPBAR_NOTIFICATIONS_QUERY = gql`
  query TopbarNotifications {
    me {
      id
      name
      email
      role
      unitId
    }
    reports {
      ...ReportListItem
    }
  }
  ${REPORT_LIST_ITEM_FRAGMENT}
`;

export const ADMIN_ANALYTICS_QUERY = gql`
  query AdminAnalyticsData {
    me {
      id
      name
      email
      role
      unitId
      unit {
        id
        name
      }
    }
    reports {
      id
      title
      status
      createdAt
      updatedAt
      unit {
        id
        name
      }
      sections {
        title
        fields {
          id
          label
          type
          value
        }
      }
    }
  }
`;

export const REPORT_DETAIL_QUERY = gql`
  query ReportDetailPageData($id: ID!) {
    me {
      id
      name
      email
      role
      unitId
      unit {
        id
        name
      }
    }
    report(id: $id) {
      ...ReportDetail
    }
  }
  ${REPORT_DETAIL_FRAGMENT}
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
        unitHead {
          id
          name
          email
        }
      }
      units {
        id
        name
        unitHead {
          id
          name
          email
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      role
      unitId
      unitIds
      unit {
        id
        name
        unitHead {
          id
          name
          email
        }
      }
      units {
        id
        name
        unitHead {
          id
          name
          email
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const CREATE_UNIT_MUTATION = gql`
  mutation CreateUnit($input: CreateUnitInput!) {
    createUnit(input: $input) {
      id
      name
      coreLeaderId
      coreLeader {
        id
        name
        email
      }
      unitHead {
        id
        name
        email
      }
      reportCount
      pendingCount
      formSchema {
        ...UnitFormSchemaParts
      }
      createdAt
      updatedAt
    }
  }
  ${UNIT_FORM_SCHEMA_FRAGMENT}
`;

export const UPDATE_UNIT_MUTATION = gql`
  mutation UpdateUnit($id: ID!, $input: UpdateUnitInput!) {
    updateUnit(id: $id, input: $input) {
      id
      name
      coreLeaderId
      coreLeader {
        id
        name
        email
      }
      unitHead {
        id
        name
        email
      }
      reportCount
      pendingCount
      formSchema {
        ...UnitFormSchemaParts
      }
      createdAt
      updatedAt
    }
  }
  ${UNIT_FORM_SCHEMA_FRAGMENT}
`;

export const DELETE_UNIT_MUTATION = gql`
  mutation DeleteUnit($id: ID!) {
    deleteUnit(id: $id)
  }
`;

export const CREATE_REPORT_MUTATION = gql`
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      ...ReportDetail
    }
  }
  ${REPORT_DETAIL_FRAGMENT}
`;

export const MARK_REPORT_REVIEWED_MUTATION = gql`
  mutation MarkReportReviewed($id: ID!) {
    markReportReviewed(id: $id) {
      ...ReportDetail
    }
  }
  ${REPORT_DETAIL_FRAGMENT}
`;

export const DELETE_REPORT_MUTATION = gql`
  mutation DeleteReport($id: ID!) {
    deleteReport(id: $id)
  }
`;

export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($reportId: ID!, $body: String!) {
    addComment(reportId: $reportId, body: $body) {
      id
      reportId
      body
      role
      createdAt
      updatedAt
      authorUser {
        id
        name
        email
      }
    }
  }
`;
