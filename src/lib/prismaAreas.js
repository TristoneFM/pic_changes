import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
if (typeof window === 'undefined') {
  dotenv.config();
}

const globalForPrismaAreas = globalThis;

// Separate Prisma client for the 'areas' database
const prismaAreas = globalForPrismaAreas.prismaAreas || new PrismaClient({
  datasources: {
    db: {
      url: process.env.AREAS_DATABASE_URL  
    }
  }
});

if (typeof window === 'undefined') {
  globalForPrismaAreas.prismaAreas = prismaAreas;
}

export default prismaAreas;

