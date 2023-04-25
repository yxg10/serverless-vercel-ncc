import { resolve } from "path";

export const LEADING_BAR = /^\//;
/**
 * Get the root path of the process
 *
 * Extremely useful to create CLIs and Libs
 */
export const getRootPath = (path: string) => {
  return resolve(process.cwd(), path.replace(LEADING_BAR, ""));
};
