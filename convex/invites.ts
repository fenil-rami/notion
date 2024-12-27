// @ts-nocheck
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createInvite = mutation({
  args: {
    email: v.string(),
    docId: v.optional(v.id("documents")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Check if the user exists in the "users" collection
    const existingUser = await ctx.db.query("users").filter(q => q.eq(q.field("subject"), userId)).first();

    // If the user does not exist, create a new user entry in the "users" collection
    if (!existingUser) {
      throw new Error("Not authenticated");
    }

    if (!existingUser.isAdmin) {
      throw new Error("Not Permitted");
    }

    const existingInvites = await ctx.db
      .query("invites")
      .withIndex("by_doc_email", (q) =>
        q.eq("docId", args.docId).eq("email", args.email)
      )
      .order("desc")
      .collect();

    if (existingInvites.length && existingInvites[0]?.createdBy !== userId) {
      throw new Error("Not Permitted");
    }

    if (!existingInvites.length) {
      const invites = await ctx.db.insert("invites", {
        createdBy: userId,
        docId: args.docId,
        status: args.status,
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleDateString(),
        email: args.email
      });
      return invites;
    }
    return existingInvites;
  },
});


// export const getAllUsers = query({
//   handler: async (ctx) => {
//     // Fetch all users from the "users" table
//     const users = await ctx.db.query("users").collect();
//     return users;
//   }
// });

export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    title: v.string(),
    status: v.string(),
    desc: v.string(),
    when: v.optional(v.string()),
    priority: v.optional(v.string()),
    label: v.string(),
    assignee: v.string(),
    reporter: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;
    // Check if the user exists in the "users" collection
    const existingUser = await ctx.db.query("users").filter(q => q.eq(q.field("subject"), userId)).first();

    // If the user does not exist, create a new user entry in the "users" collection
    if (!existingUser) {
      await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        issuer: identity.issuer,
        subject: identity.subject,
        name: identity.name || '',
        givenName: identity.givenName || '',
        familyName: identity.familyName || '',
        pictureUrl: identity.pictureUrl || '',
        email: identity.email || '',
        emailVerified: identity.emailVerified || false,
        phoneNumberVerified: identity.phoneNumberVerified || false,
        updatedAt: new Date().toISOString(),
      });
    }

    const { id, ...rest } = args;

    const existingDocument = await ctx.db.get(id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(id, { ...rest, updatedAt: new Date().toLocaleDateString() });

    return document;
  },
});

export const getInvites = query({
  args: {
    docId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // console.log('document id', args.docId)

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .order("desc")
      .collect();

    return invites;
  },
});

export const getAllInvites = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_user", (q) => q.eq("email", identity?.email as string))
      .order("desc")
      .collect();

    return invites;
  },
});

export const getTasksByDoc = query({
  args: {
    docId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    // Fetch tasks by document ID
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .order("desc")
      .collect();

    // Fetch and add reporter and assignee names for each task
    const tasksWithUserNames = await Promise.all(
      tasks.map(async (task) => {
        // Fetch reporter name
        const reporter = task.reporter
          ? await ctx.db.query("users").filter(q => q.eq(q.field("_id"), task.reporter)).first()
          : null;
        const reporterName = reporter ? reporter.name : "Unknown";

        // Fetch assignee name
        const assignee = task.assignee
          ? await ctx.db.query("users").filter(q => q.eq(q.field("_id"), task.assignee)).first()
          : null;
        const assigneeName = assignee ? assignee.name : "Unknown";

        // Add names to the task object
        return {
          ...task,
          reporterName,
          assigneeName,
        };
      })
    );

    return tasksWithUserNames;
  },
});

export const getTaskById = query({
  args: {
    taskId: v.id("tasks"),  // The auto-generated _id field of the task
  },
  handler: async (ctx, args) => {
    // Fetch the task by its _id
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  },
});

export const getTasksByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return tasks;
  },
});

export const getTasksByUserAndDoc = query({
  args: {
    userId: v.string(),
    docId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_doc", (q) =>
        q.eq("userId", args.userId).eq("docId", args.docId)
      )
      .order("desc")
      .collect();

    return tasks;
  },
});

export const archive = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const archivedChildren = async (documentId: Id<"tasks">) => {
      // const childrens = await ctx.db
      //   .query("tasks")
      //   .withIndex("by_user_parent", (q) =>
      //     q.eq("userId", userId).eq("parentDocument", documentId)
      //   )
      //   .collect();

      // for (const child of childrens) {
      //   await ctx.db.patch(child._id, {
      //     isArchived: true,
      //   });

      //   archivedChildren(child._id);
      // }
    };

    // const document = await ctx.db.patch(args.id, {
    //   isArchived: true,
    // });

    archivedChildren(args.id);

    return document;
  },
});

export const getTrashDocuments = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // const documents = await ctx.db
    //   .query("tasks")
    //   .withIndex("by_user", (q) => q.eq("userId", userId))
    //   .filter((q) => q.eq(q.field("isArchived"), true))
    //   .order("desc")
    //   .collect();

    // return documents;
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.delete(args.id);

    return document;
  },
});

export const getDocumentById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const document = await ctx.db.get(args.id);

    if (!document) {
      throw new Error("Not found");
    }

    // if (document.isPublished && !document.isArchived) {
    //   return document;
    // }

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    if (document.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return document;
  },
});

export const updateInvites = mutation({
  args: {
    id: v.id("invites"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const { id, ...rest } = args;

    const existingInvites = await ctx.db.get(id);

    if (!existingInvites) {
      throw new Error("Not found");
    }

    // if (existingInvites.userId !== userId) {
    //   throw new Error("Unauthorized");
    // }

    const invites = await ctx.db.patch(id, rest);

    return invites;
  },
});

export const restore = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const unarchivedChildren = async (documentId: Id<"tasks">) => {
      // const childrens = await ctx.db
      //   .query("tasks")
      //   .withIndex("by_user_parent", (q) =>
      //     q.eq("userId", userId).eq("parentDocument", documentId)
      //   )
      //   .collect();

      // for (const child of childrens) {
      //   await ctx.db.patch(child._id, {
      //     isArchived: false,
      //   });

      //   unarchivedChildren(child._id);
      // }
    };

    // const options: Partial<Doc<"tasks">> = {
    //   isArchived: false,
    // };

    // if (existingDocument.parentDocument) {
    //   options.parentDocument = undefined;
    // }

    // const document = await ctx.db.patch(args.id, options);

    // unarchivedChildren(args.id);

    return document;
  },
});

export const getSearch = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // const documents = await ctx.db
    //   .query("tasks")
    //   .withIndex("by_user", (q) => q.eq("userId", userId))
    //   .filter((q) => q.eq(q.field("isArchived"), false))
    //   .order("desc")
    //   .collect();

    // return documents;
  },
});

export const getAllDocuments = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // const documents = await ctx.db
    //   .query("tasks")
    //   .withIndex("by_user_parent", (q) =>
    //     q.eq("userId", userId).eq("parentDocument", undefined)
    //   )
    //   .filter((q) => q.eq(q.field("isArchived"), false))
    //   .order("desc")
    //   .collect();

    // return documents;
  },
});
