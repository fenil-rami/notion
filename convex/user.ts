// @ts-nocheck
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const getAllUsers = query({
  handler: async (ctx) => {
    // Fetch all users from the "users" collection
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Fetch the user by their ID
    const user = await ctx.db.query("users").filter(q => q.eq(q.field("subject"), args.userId)).first();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
});