import * as fs from "fs";

const bitmap = fs.readFileSync("assets/imgs/test.jpg");
const bitmap2 = fs.readFileSync("assets/imgs/test2.jpg");
// convert binary data to base64 encoded string
export const base64Image = Buffer.from(bitmap).toString("base64");
export const base64Image2 = Buffer.from(bitmap2).toString("base64");
