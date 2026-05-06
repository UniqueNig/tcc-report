import bcrypt from "bcryptjs";
import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from "graphql";
import mongoose from "mongoose";
import type { GraphQLContext } from "@/src/graphql/context";
import { Comment, type IComment } from "@/src/models/Comment";
import { Report, type IReport, type IReportSection } from "@/src/models/Report";
import { Unit, type IUnit } from "@/src/models/Unit";
import { User, type IUser } from "@/src/models/User";
import type { JWTPayload, UserRole } from "@/src/lib/auth";

type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "boolean"
  | "currency";

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  unitId?: string | null;
};

type UpdateUserInput = Partial<Omit<CreateUserInput, "password">> & {
  password?: string | null;
};

type CreateUnitInput = {
  name: string;
  coreLeaderId: string;
  headId?: string | null;
};

type UpdateUnitInput = Partial<CreateUnitInput>;

type ReportFieldInput = {
  id: string;
  label: string;
  type: FieldType;
  value: unknown;
};

type ReportSectionInput = {
  title: string;
  fields: ReportFieldInput[];
};

type CreateReportInput = {
  title: string;
  sections: ReportSectionInput[];
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: string | null;
};

type MaybeObjectWithId = {
  _id?: unknown;
};

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  parseValue: (value) => value,
  serialize: (value) => value,
  parseLiteral: parseJSONLiteral,
});

function parseJSONLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.LIST:
      return ast.values.map(parseJSONLiteral);
    case Kind.OBJECT:
      return Object.fromEntries(
        ast.fields.map((field) => [field.name.value, parseJSONLiteral(field.value)])
      );
    case Kind.NULL:
      return null;
    default:
      return null;
  }
}

function toId(value: unknown): string {
  if (!value) return "";
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === "object" && "_id" in value) {
    return toId((value as MaybeObjectWithId)._id);
  }

  return String(value);
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new GraphQLError("Invalid id", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return new mongoose.Types.ObjectId(id);
}

function requireUser(ctx: GraphQLContext): JWTPayload {
  if (!ctx.user) {
    throw new GraphQLError("You must be signed in", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return ctx.user;
}

function requireRole(ctx: GraphQLContext, roles: UserRole[]): JWTPayload {
  const user = requireUser(ctx);
  if (!roles.includes(user.role)) {
    throw new GraphQLError("You do not have permission to perform this action", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return user;
}

async function getCoreLeaderUnitIds(userId: string): Promise<string[]> {
  const units = await Unit.find({ coreLeaderId: toObjectId(userId) }).select("_id").exec();
  return units.map((unit) => toId(unit._id));
}

async function assertCanAccessReport(user: JWTPayload, report: IReport): Promise<void> {
  if (user.role === "ADMIN") return;

  if (user.role === "UNIT_HEAD") {
    const ownsReport = toId(report.submittedBy) === user.id;
    const ownsUnit = Boolean(user.unitId) && toId(report.unitId) === user.unitId;
    if (ownsReport || ownsUnit) return;
  }

  if (user.role === "CORE_LEADER") {
    const unitIds = await getCoreLeaderUnitIds(user.id);
    if (unitIds.includes(toId(report.unitId))) return;
  }

  throw new GraphQLError("You do not have permission to access this report", {
    extensions: { code: "FORBIDDEN" },
  });
}

function normalizeStatus(status?: string | null) {
  if (!status) return undefined;
  const normalized = status.toLowerCase();
  if (!["pending", "reviewed"].includes(normalized)) {
    throw new GraphQLError("Status must be pending or reviewed", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return normalized;
}

function dateString(value?: Date | null): string | null {
  return value ? value.toISOString() : null;
}

async function assignUnitHead(unitId: string, headId?: string | null) {
  const unitObjectId = toObjectId(unitId);

  await User.updateMany({ role: "UNIT_HEAD", unitId: unitObjectId }, { $unset: { unitId: "" } }).exec();

  if (!headId) return;

  const head = await User.findById(toObjectId(headId)).exec();
  if (!head || head.role !== "UNIT_HEAD") {
    throw new GraphQLError("Selected head must be an existing unit head", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  head.unitId = unitObjectId;
  await head.save();
}

async function syncUserUnitAssignment(user: IUser, unitId?: string | null) {
  if (user.role !== "UNIT_HEAD") {
    user.unitId = undefined;
    return;
  }

  if (!unitId) {
    user.unitId = undefined;
    return;
  }

  const unitObjectId = toObjectId(unitId);

  await User.updateMany(
    {
      role: "UNIT_HEAD",
      unitId: unitObjectId,
      _id: { $ne: user._id },
    },
    { $unset: { unitId: "" } }
  ).exec();

  user.unitId = unitObjectId;
}

export const resolvers = {
  JSON: JSONScalar,

  Query: {
    me: async (_parent: unknown, _args: Record<string, never>, ctx: GraphQLContext) => {
      if (!ctx.user) return null;
      return User.findById(toObjectId(ctx.user.id)).exec();
    },

    users: async (
      _parent: unknown,
      args: { role?: UserRole | null },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx, ["ADMIN"]);
      const filter: Record<string, unknown> = {};
      if (args.role) filter.role = args.role;

      return User.find(filter).sort({ createdAt: -1 }).exec();
    },

    units: async (_parent: unknown, _args: Record<string, never>, ctx: GraphQLContext) => {
      const user = requireUser(ctx);
      if (user.role === "CORE_LEADER") {
        return Unit.find({ coreLeaderId: toObjectId(user.id) }).sort({ name: 1 }).exec();
      }

      requireRole(ctx, ["ADMIN"]);
      return Unit.find().sort({ name: 1 }).exec();
    },

    reports: async (
      _parent: unknown,
      args: { status?: string | null; unitId?: string | null; mine?: boolean | null },
      ctx: GraphQLContext
    ) => {
      const user = requireUser(ctx);
      const filter: Record<string, unknown> = {};
      const status = normalizeStatus(args.status);
      if (status) filter.status = status;

      if (user.role === "UNIT_HEAD") {
        filter.submittedBy = toObjectId(user.id);
      }

      if (user.role === "CORE_LEADER") {
        const unitIds = await getCoreLeaderUnitIds(user.id);
        filter.unitId = { $in: unitIds.map(toObjectId) };
      }

      if (args.unitId) {
        const requestedUnitId = toObjectId(args.unitId);
        if (user.role === "CORE_LEADER") {
          const unitIds = await getCoreLeaderUnitIds(user.id);
          if (!unitIds.includes(args.unitId)) {
            throw new GraphQLError("You do not oversee this unit", {
              extensions: { code: "FORBIDDEN" },
            });
          }
        }
        filter.unitId = requestedUnitId;
      }

      if (args.mine) filter.submittedBy = toObjectId(user.id);

      return Report.find(filter).sort({ createdAt: -1 }).exec();
    },

    report: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const user = requireUser(ctx);
      const report = await Report.findById(toObjectId(args.id)).exec();
      if (!report) return null;
      await assertCanAccessReport(user, report);

      return report;
    },

    comments: async (_parent: unknown, args: { reportId: string }, ctx: GraphQLContext) => {
      const user = requireUser(ctx);
      const report = await Report.findById(toObjectId(args.reportId)).exec();
      if (!report) return [];
      await assertCanAccessReport(user, report);

      return Comment.find({ reportId: report._id }).sort({ createdAt: 1 }).exec();
    },
  },

  Mutation: {
    createUser: async (
      _parent: unknown,
      args: { input: CreateUserInput },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx, ["ADMIN"]);
      const email = args.input.email.toLowerCase().trim();
      const existing = await User.findOne({ email }).exec();
      if (existing) {
        throw new GraphQLError("A user with this email already exists", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = new User({
        name: args.input.name.trim(),
        email,
        passwordHash: await bcrypt.hash(args.input.password, 10),
        role: args.input.role,
      });

      await syncUserUnitAssignment(user, args.input.unitId);
      await user.save();
      return user;
    },

    updateUser: async (
      _parent: unknown,
      args: { id: string; input: UpdateUserInput },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx, ["ADMIN"]);
      const user = await User.findById(toObjectId(args.id)).exec();
      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (args.input.name !== undefined) user.name = args.input.name.trim();
      if (args.input.email !== undefined) user.email = args.input.email.toLowerCase().trim();
      if (args.input.role !== undefined) user.role = args.input.role;
      if (args.input.password) {
        user.passwordHash = await bcrypt.hash(args.input.password, 10);
      }

      if (args.input.unitId !== undefined || args.input.role !== undefined) {
        await syncUserUnitAssignment(user, args.input.unitId);
      }

      await user.save();
      return user;
    },

    deleteUser: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const currentUser = requireRole(ctx, ["ADMIN"]);
      if (currentUser.id === args.id) {
        throw new GraphQLError("You cannot delete your own account", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = await User.findById(toObjectId(args.id)).exec();
      if (!user) {
        return false;
      }

      if (user.role === "CORE_LEADER") {
        const assignedUnit = await Unit.findOne({ coreLeaderId: user._id }).select("_id").exec();
        if (assignedUnit) {
          throw new GraphQLError("Reassign this core leader's units before deleting the account", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      if (user.role === "UNIT_HEAD") {
        const submittedReport = await Report.findOne({ submittedBy: user._id }).select("_id").exec();
        if (submittedReport) {
          throw new GraphQLError("This unit head has submitted reports and cannot be deleted", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      const result = await User.findByIdAndDelete(user._id).exec();
      return Boolean(result);
    },

    createUnit: async (
      _parent: unknown,
      args: { input: CreateUnitInput },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx, ["ADMIN"]);
      const coreLeader = await User.findById(toObjectId(args.input.coreLeaderId)).exec();
      if (!coreLeader || coreLeader.role !== "CORE_LEADER") {
        throw new GraphQLError("Core leader must be an existing core leader", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const unit = await Unit.create({
        name: args.input.name.trim(),
        coreLeaderId: coreLeader._id,
      });

      await assignUnitHead(toId(unit._id), args.input.headId);
      return unit;
    },

    updateUnit: async (
      _parent: unknown,
      args: { id: string; input: UpdateUnitInput },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx, ["ADMIN"]);
      const unit = await Unit.findById(toObjectId(args.id)).exec();
      if (!unit) {
        throw new GraphQLError("Unit not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (args.input.name !== undefined) unit.name = args.input.name.trim();
      if (args.input.coreLeaderId !== undefined) {
        const coreLeader = await User.findById(toObjectId(args.input.coreLeaderId)).exec();
        if (!coreLeader || coreLeader.role !== "CORE_LEADER") {
          throw new GraphQLError("Core leader must be an existing core leader", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
        unit.coreLeaderId = coreLeader._id;
      }

      await unit.save();
      await assignUnitHead(toId(unit._id), args.input.headId);
      return unit;
    },

    deleteUnit: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, ["ADMIN"]);
      const unitId = toObjectId(args.id);
      const reportCount = await Report.countDocuments({ unitId }).exec();
      if (reportCount > 0) {
        throw new GraphQLError("This unit has existing reports and cannot be deleted", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      await User.updateMany({ unitId }, { $unset: { unitId: "" } }).exec();
      const result = await Unit.findByIdAndDelete(unitId).exec();
      return Boolean(result);
    },

    createReport: async (
      _parent: unknown,
      args: { input: CreateReportInput },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx, ["UNIT_HEAD"]);
      if (!user.unitId) {
        throw new GraphQLError("Your account is not assigned to a unit", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const sections: IReportSection[] = args.input.sections.map((section) => ({
        title: section.title.trim(),
        fields: section.fields.map((field) => ({
          id: field.id,
          label: field.label,
          type: field.type,
          value: field.value as string | number | boolean | string[],
        })),
      }));

      return Report.create({
        title: args.input.title.trim(),
        unitId: toObjectId(user.unitId),
        submittedBy: toObjectId(user.id),
        sections,
        attachmentUrl: args.input.attachmentUrl ?? undefined,
        attachmentName: args.input.attachmentName ?? undefined,
        attachmentSize: args.input.attachmentSize ?? undefined,
      });
    },

    markReportReviewed: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx, ["CORE_LEADER", "ADMIN"]);
      const report = await Report.findById(toObjectId(args.id)).exec();
      if (!report) {
        throw new GraphQLError("Report not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      await assertCanAccessReport(user, report);
      report.status = "reviewed";
      report.reviewedBy = toObjectId(user.id);
      report.reviewedAt = new Date();
      await report.save();

      return report;
    },

    deleteReport: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, ["ADMIN"]);
      const reportId = toObjectId(args.id);
      const result = await Report.findByIdAndDelete(reportId).exec();
      if (result) await Comment.deleteMany({ reportId }).exec();

      return Boolean(result);
    },

    addComment: async (
      _parent: unknown,
      args: { reportId: string; body: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx, ["CORE_LEADER", "ADMIN"]);
      const report = await Report.findById(toObjectId(args.reportId)).exec();
      if (!report) {
        throw new GraphQLError("Report not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      await assertCanAccessReport(user, report);

      return Comment.create({
        reportId: report._id,
        author: toObjectId(user.id),
        role: user.role,
        body: args.body.trim(),
      });
    },
  },

  User: {
    id: (user: IUser) => toId(user._id),
    unitId: (user: IUser) => (user.unitId ? toId(user.unitId) : null),
    unit: (user: IUser) => (user.unitId ? Unit.findById(user.unitId).exec() : null),
    createdAt: (user: IUser) => user.createdAt.toISOString(),
    updatedAt: (user: IUser) => user.updatedAt.toISOString(),
  },

  Unit: {
    id: (unit: IUnit) => toId(unit._id),
    coreLeaderId: (unit: IUnit) => toId(unit.coreLeaderId),
    coreLeader: (unit: IUnit) => User.findById(unit.coreLeaderId).exec(),
    unitHead: (unit: IUnit) => User.findOne({ role: "UNIT_HEAD", unitId: unit._id }).exec(),
    reportCount: (unit: IUnit) => Report.countDocuments({ unitId: unit._id }).exec(),
    pendingCount: (unit: IUnit) =>
      Report.countDocuments({ unitId: unit._id, status: "pending" }).exec(),
    createdAt: (unit: IUnit) => unit.createdAt.toISOString(),
    updatedAt: (unit: IUnit) => unit.updatedAt.toISOString(),
  },

  Report: {
    id: (report: IReport) => toId(report._id),
    unitId: (report: IReport) => toId(report.unitId),
    unit: (report: IReport) => Unit.findById(report.unitId).exec(),
    submittedBy: (report: IReport) => toId(report.submittedBy),
    submittedByUser: (report: IReport) => User.findById(report.submittedBy).exec(),
    reviewedBy: (report: IReport) => (report.reviewedBy ? toId(report.reviewedBy) : null),
    reviewedByUser: (report: IReport) =>
      report.reviewedBy ? User.findById(report.reviewedBy).exec() : null,
    reviewedAt: (report: IReport) => dateString(report.reviewedAt),
    comments: (report: IReport) =>
      Comment.find({ reportId: report._id }).sort({ createdAt: 1 }).exec(),
    createdAt: (report: IReport) => report.createdAt.toISOString(),
    updatedAt: (report: IReport) => report.updatedAt.toISOString(),
  },

  Comment: {
    id: (comment: IComment) => toId(comment._id),
    reportId: (comment: IComment) => toId(comment.reportId),
    author: (comment: IComment) => toId(comment.author),
    authorUser: (comment: IComment) => User.findById(comment.author).exec(),
    createdAt: (comment: IComment) => comment.createdAt.toISOString(),
    updatedAt: (comment: IComment) => comment.updatedAt.toISOString(),
  },
};
