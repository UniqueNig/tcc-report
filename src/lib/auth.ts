import { NextRequest } from "next/server"

export const getUserFromRequest = async (req: NextRequest) => {
  // Replace with real JWT / NextAuth later
  return {
    id: "mock-user-id",
    role: "ADMIN", // UNIT_HEAD | CORE_LEADER | ADMIN
  }
}