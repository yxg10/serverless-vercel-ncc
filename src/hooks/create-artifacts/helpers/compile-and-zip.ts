/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import * as Ncc from "@vercel/ncc";
import type { FunctionDefinitionHandler } from "serverless";
import { existsSync } from "fs";
import * as path from "path";

import { getRootPath } from "utils/get-root-path";
import { Context } from "types/context";
import { writeZip } from "utils/zip/write";

interface CompileAndZipParams {
  context: Context;
  funcName: string;
  serverlessFolderPath: string;
}

/**
 *
 *
 *
 */

const getExternalModules = (context: Context) => {
  const externals = context.opt?.dependenciesToExclude || [];

  if (context.opt?.excludeDependencies) {
    const packageJson = require(getRootPath("package.json"));

    return [
      ...externals,
      ...Object.keys(packageJson.dependencies),
      ...Object.keys(packageJson.devDependencies),
    ];
  }

  return externals;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getHandlerPath = (handler: any) => {
  // Check if handler is a well-formed path based handler.
  const handlerEntries = /(.*)\..*?$/.exec(handler);

  // Get the file path
  const [, handlerEntry] = handlerEntries!;
  const handlerPath = findValidHandlerPath(handlerEntry);
  if (!handlerPath) {
    throw new Error(`Could not find handler: ${handlerEntry}`);
  }

  return {
    rootPath: handlerPath,
    path: handlerEntry,
  };
};

const ALLOWED_HANDLER_EXTENSIONS = ["ts", "js", "tsx", "jsx"];

const findValidHandlerPath = (pathName: string): string | null => {
  for (const extension of ALLOWED_HANDLER_EXTENSIONS) {
    const handlerPath = getRootPath(`${pathName}.${extension}`);
    if (existsSync(handlerPath)) {
      return handlerPath;
    }
  }
  return null;
};

export const compileAndZip = async ({
  funcName,
  context,
  serverlessFolderPath,
}: CompileAndZipParams) => {
  const externals = getExternalModules(context);

  const func = context.serverless.service.functions[
    funcName
  ] as FunctionDefinitionHandler;

  const { rootPath, path: handlerPath } = getHandlerPath(func.handler);
  const { code, assets } = await Ncc(rootPath, {
    externals,
    quiet: false,
    minify: context.opt?.minify,
    sourceMap: context.opt?.sourceMap,
    sourceMapRegister: context.opt?.sourceMapRegister,
  });

  const handlerFolder = handlerPath.substring(0, handlerPath.lastIndexOf("/"));
  try {
    await writeZip({
      files: [
        {
          path: `${handlerPath}.js`,
          content: code,
        },
        ...Object.entries(assets || {}).map(([fileName, content]) => {
          return {
            path: path.join(handlerFolder, fileName),
            content: content.source,
          };
        }),
      ],
      zipName: funcName,
      outputPath: serverlessFolderPath,
    });
    // Only sets the new values if successfully writes the zip file
    func.package = {
      artifact: `${serverlessFolderPath}/${funcName}.zip`,
    };
  } catch (e) {
    console.error("Failed to zip", e);
  }
};
