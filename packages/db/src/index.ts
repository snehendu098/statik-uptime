import dotenv from "dotenv"

dotenv.config()

import { PrismaClient } from "../generate/prisma";

export const prismaClient = new PrismaClient()