/* eslint-disable no-await-in-loop */

import { Context } from "types/context";

import { DEFAULT_CONCURRENCY } from "config";

import { getAllNodeFunctions } from "./helpers/get-all-node-functions";
import { createServerlessFolder } from "./helpers/create-serverless-folder";
import { compileAndZip } from "./helpers/compile-and-zip";
import { getRootPath } from "utils/get-root-path";
import { chunk } from "utils/chunk";

export const createArtifacts = async (context: Context) => {
  const functions = getAllNodeFunctions(context);

  const serverlessFolderPath = getRootPath(".serverless");

  createServerlessFolder(serverlessFolderPath);

  const concurrency = context.opt?.concurrency || DEFAULT_CONCURRENCY;

  const chunks = chunk(functions, concurrency);

  const results: Array<PromiseSettledResult<any>> = [];

  for (const c of chunks) {
    const result = await Promise.allSettled(
      c.map((funcName: string) =>
        compileAndZip({
          context,
          funcName,
          serverlessFolderPath,
        })
      )
    );

    results.push(...result);
  }

  /**
   * Log all errors
   */
  results
    .filter(({ status }) => status !== "fulfilled")
    .forEach((err: any) => {
      context.serverless.cli.log("Fail to compile a file", undefined, {
        color: "red",
      });
      console.error(err);
    });
};
