import { downloadBrief } from "../../../lib/programs/brief-download";
export async function GET(request: Request) { return downloadBrief(request, "csv"); }
