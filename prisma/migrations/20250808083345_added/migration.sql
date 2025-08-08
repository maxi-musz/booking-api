/*
  Warnings:

  - The `status` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Property` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('confirmed', 'cancelled', 'pending');

-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "status",
ADD COLUMN     "status" "public"."BookingStatus" NOT NULL DEFAULT 'confirmed';

-- AlterTable
ALTER TABLE "public"."Property" DROP COLUMN "status",
ADD COLUMN     "status" "public"."PropertyStatus" NOT NULL DEFAULT 'active';
