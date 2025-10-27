// server/middleware/authMiddleware.js
import { clerkClient } from "@clerk/express";

/**
 * clerkAuth middleware:
 * - expects Clerk's requireAuth to run first (so req.auth exists),
 * - ensures both req.auth.userId and req.userId are set for controllers.
 */
export const clerkAuth = async (req, res, next) => {
  try {
    // If requireAuth ran, req.auth should exist and contain userId
    const clerkUserIdFromReqAuth = req.auth?.userId;

    // If we have an auth user id from req.auth, use it. Otherwise try to parse header (fallback).
    if (clerkUserIdFromReqAuth) {
      req.userId = clerkUserIdFromReqAuth;
      // ensure controllers that read req.auth.userId still work
      req.auth = req.auth || {};
      req.auth.userId = clerkUserIdFromReqAuth;
      return next();
    }

    // Fallback: try to extract from authorization header and ask Clerk (optional)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Invalid authorization header" });
    }

    // Verify session via Clerk (server-side)
    // Note: clerkClient.sessions.getSession or verifyToken usage depends on your Clerk package.
    // We try to get user via token using Clerk client; if your Clerk SDK has a different verify call,
    // replace with the correct method for your SDK version.
    try {
      // attempt to get session info from token (Clerk server SDK methods vary)
      const session = await clerkClient.sessions.verifySessionToken(token);
      // If session contains a userId / sub, set it
      const userId = session?.sub || session?.userId;
      if (userId) {
        req.userId = userId;
        req.auth = req.auth || {};
        req.auth.userId = userId;
        return next();
      }
    } catch (err) {
      // If verifySessionToken not available, as a minimal fallback try to find user from token in Clerk
      // (This fallback block is optional — keep to match your Clerk SDK)
      // console.warn('Fallback clerk session verification failed', err);
    }

    return res.status(401).json({ success: false, message: "Unauthorized" });
  } catch (error) {
    console.error("clerkAuth error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized: " + error.message });
  }
};
