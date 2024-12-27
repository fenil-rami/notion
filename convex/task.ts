// @ts-nocheck
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const createDocument = mutation({
  args: {
    title: v.string(),
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

    const document = await ctx.db.insert("tasks", {
      title: args.title,
      userId,
      docId: args.docId,
      status: args.status,
      desc: args.desc,
      // @ts-ignore
      taskType: args.taskType,
      createdAt: new Date().toLocaleDateString(),
      when: args.when,
      updatedAt: new Date().toLocaleDateString(),
      priority: args.priority,
      label: args.label,
      assignee: args.assignee,
      reporter: args.reporter,
      figma: args?.figma || '',
      refLink: args?.refLink || '',
      comment: args?.comment || '',
    });

    return document;
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
    taskType: v.optional(v.string()),
    priority: v.optional(v.string()),
    label: v.string(),
    assignee: v.string(),
    reporter: v.string(),
    figma: v.optional(v.string()),
    refLink: v.optional(v.string()),
    comment: v.optional(v.string()),
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

export const getDocuments = query({
  args: {
    docId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // const documents = await ctx.db
    //   .query("tasks")
    //   .withIndex("by_user", (q) =>
    //     q.eq("userId", userId).eq("docId", args.docId)
    //   )
    //   .filter((q) => q.eq(q.field("isArchived"), false))
    //   .order("desc")
    //   .collect();

    // return documents;
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
    await ctx.db.delete(args.id);

    return true;
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

export const updateFields = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const { id, ...rest } = args;

    const existingDocument = await ctx.db.get(id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(id, rest);

    return document;
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
