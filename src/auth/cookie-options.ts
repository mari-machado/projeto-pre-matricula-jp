import type { CookieOptions } from "express";

export const getAuthCookieOptions = (isProd: boolean): CookieOptions => ({
  httpOnly: false,
  secure: isProd, 
  sameSite: "none",
  path: "/",
  maxAge: 60 * 60 * 1000, 
});

export const getClearAuthCookieOptions = (isProd: boolean): CookieOptions => ({
  httpOnly: false,
  secure: isProd,
  sameSite: "none",
  path: "/",
});
