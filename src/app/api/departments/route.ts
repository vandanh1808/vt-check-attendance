import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/helpers/api-response";
import { getAllDepartments } from "@/lib/queries/departments";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();

    const departments = await getAllDepartments();
    return successResponse(departments);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
