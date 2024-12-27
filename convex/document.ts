// @ts-nocheck
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createDocument = mutation({
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id("documents")),
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

    const document = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentDocument,
      userId,
      isArchived: false,
      isPublished: false,
    });

    return document;
  },
});

export const getDocuments = query({
  args: {
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentDocument", args.parentDocument)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

      // Fetch invites where `createdBy` is equal to the current user's `userId`
      const acceptedInvites = await ctx.db
      .query("invites")
      .withIndex("by_user", (q) => q.eq("email", identity.email as string))
      .filter((q) => q.eq(q.field("status"), "Accepted"))
      .collect();

      // Step 2: Extract unique document IDs, filtering out any `undefined` values
    const acceptedDocIds = [...new Set(acceptedInvites.map((invite) => invite.docId).filter((id) => id !== undefined))];

    // Step 3: Fetch each document by ID using Promise.all
    const documentPromises = acceptedDocIds.map((docId) =>
      // ctx.db.query("documents").filter((q) => q.eq(q.field("_id"), docId)).first()
      ctx.db.query("documents").filter((q) => q.eq(q.field("_id"), docId)).first()
    );

    // Execute all queries concurrently and collect the results
    let acceptedDocuments = await Promise.all(documentPromises);

    // Filter out any null values in case some docIds do not correspond to existing documents
    acceptedDocuments = acceptedDocuments.filter((doc) => doc !== null);

      // console.log('acceptedInvites - ', acceptedDocuments)
      // console.log('documents - ', documents)

    return [...documents, ...acceptedDocuments];
  },
});

export const archive = mutation({
  args: {
    id: v.id("documents"),
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

    const archivedChildren = async (documentId: Id<"documents">) => {
      const childrens = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of childrens) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });

        archivedChildren(child._id);
      }
    };

    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });

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

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return documents;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
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
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const document = await ctx.db.get(args.id);

    if (!document) {
      throw new Error("Not found");
    }

    if (document.isPublished && !document.isArchived) {
      return document;
    }

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // if (document.userId !== userId) {
    //   throw new Error("Unauthorized");
    // }

    return document;
  },
});

export const updateFields = mutation({
  args: {
    id: v.id("documents"),
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

    const document = await ctx.db.patch(id, rest);

    return document;
  },
});

export const restore = mutation({
  args: { id: v.id("documents") },
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

    const unarchivedChildren = async (documentId: Id<"documents">) => {
      const childrens = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of childrens) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });

        unarchivedChildren(child._id);
      }
    };

    const options: Partial<Doc<"documents">> = {
      isArchived: false,
    };

    if (existingDocument.parentDocument) {
      options.parentDocument = undefined;
    }

    const document = await ctx.db.patch(args.id, options);

    unarchivedChildren(args.id);

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

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

export const getAllDocuments = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Fetch root-level documents for the authenticated user
    const userDocuments = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentDocument", undefined)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

      // Fetch invites where `createdBy` is equal to the current user's `userId`
      const acceptedInvites = await ctx.db
      .query("invites")
      .withIndex("by_user", (q) => q.eq("email", identity.email as string))
      .filter((q) => q.eq(q.field("status"), "Accepted"))
      .collect();

      // Step 2: Extract unique document IDs, filtering out any `undefined` values
    const acceptedDocIds = [...new Set(acceptedInvites.map((invite) => invite.docId).filter((id) => id !== undefined))];

    // Step 3: Fetch each document by ID using Promise.all
    const documentPromises = acceptedDocIds.map((docId) =>
      ctx.db.query("documents").filter((q) => q.eq(q.field("_id"), docId)).first()
    );

    // Execute all queries concurrently and collect the results
    let acceptedDocuments = await Promise.all(documentPromises);

    // Filter out any null values in case some docIds do not correspond to existing documents
    acceptedDocuments = acceptedDocuments.filter((doc) => doc !== null);

      // console.log('acceptedInvitessssss - ', acceptedDocuments)
      
      
      // return userInvites;
      const documents = [...userDocuments, ...acceptedDocuments];
      // console.log('accepteddocuments - ', documents)


    return documents;
  },
});
