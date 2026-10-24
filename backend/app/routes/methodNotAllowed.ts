import type { RequestHandler } from "express";

export function methodNotAllowed(allowed: "GET" | "POST"): RequestHandler {
  return (_req, res) => {
    res.setHeader("Allow", allowed);
    res.status(405).json({ detail: "Method Not Allowed" });
  };
}
