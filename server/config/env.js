import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(serverRoot, ".env") });
dotenv.config({ path: path.resolve(serverRoot, "..", ".env") });
