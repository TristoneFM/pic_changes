import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
if (typeof window === 'undefined') {
  dotenv.config();
}

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

