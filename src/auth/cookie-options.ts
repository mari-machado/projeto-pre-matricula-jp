import type { CookieOptions } from "express";

export const getAuthCookieOptions = (isProd: boolean): CookieOptions => {
  const opts: CookieOptions & Record<string, any> = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : ("lax" as any),
    path: "/",
    maxAge: 60 * 60 * 1000,
  };
  if (isProd) {
    opts.partitioned = true;
  }
  return opts;
};

export const getClearAuthCookieOptions = (isProd: boolean): CookieOptions => {
  const opts: CookieOptions & Record<string, any> = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : ("lax" as any),
    path: "/",
  };
  if (isProd) {
    opts.partitioned = true;
  }
  return opts;
};
