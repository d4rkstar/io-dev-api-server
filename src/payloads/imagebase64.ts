import * as fs from "fs";

const bitmap = fs.readFileSync("assets/imgs/test.jpg");
// convert binary data to base64 encoded string
export const base64Image = Buffer.from(bitmap).toString("base64");
