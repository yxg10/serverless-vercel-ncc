import { createWriteStream } from "fs";
import * as JSZip from "jszip";

interface WriteParams {
  zipName: string;
  files: { path: string; content: string | Buffer }[];
  outputPath: string;
}

export const writeZip = ({ zipName, files, outputPath }: WriteParams) =>
  new Promise((resolve, reject) => {
    const zip = new JSZip();
    files.forEach((file) => {
      zip.file(file.path, file.content);
    });

    zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(createWriteStream(`${outputPath}/${zipName}.zip`))
      .on("finish", () => resolve(undefined))
      .on("error", reject);
  });
