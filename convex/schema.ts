// @ts-nocheck
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),

  tasks: defineTable({
    title: v.string(),
    userId: v.string(),
    docId: v.optional(v.id("documents")),
    status: v.string(),
    desc: v.string(),
    taskType: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    when: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    priority: v.optional(v.string()),
    label: v.string(),
    assignee: v.string(),
    reporter: v.string(),
    figma: v.optional(v.string()),
    refLink: v.optional(v.string()),
    comment: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_doc", ["docId"])
    .index("by_user_and_doc", ["userId", "docId"]),

  users: defineTable({
    tokenIdentifier: v.string(),
    isAdmin: v.optional(v.boolean()),
    issuer: v.string(),
    subject: v.string(),
    name: v.string(),
    givenName: v.string(),
    familyName: v.string(),
    pictureUrl: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    phoneNumberVerified: v.boolean(),
    invitedBy: v.optional(v.string()),
    inviteAccepted: v.optional(v.boolean()),
    updatedAt: v.string(), // ISO string format for date
  })
    .index("by_email", ["email"]) // Index for quick lookups by email
    .index("by_inviter", ["invitedBy"])
    .index("by_token_identifier", ["tokenIdentifier"]),

  permissions: defineTable({
    userId: v.string(),
    createdBy: v.string(),
    docId: v.optional(v.id("documents")),
    taskId: v.optional(v.id("tasks")),
    access: v.array(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_doc", ["docId"])
    .index("by_task_doc", ["taskId", "docId"]),

  invites: defineTable({
    email: v.string(),
    createdBy: v.string(),
    docId: v.optional(v.id("documents")),
    status: v.string(),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  })
    .index("by_user", ["email"])
    .index("by_sender", ["createdBy"])
    .index("by_doc", ["docId"])
    .index("by_doc_email", ["docId", "email"])
});
