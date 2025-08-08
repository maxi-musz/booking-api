-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'confirmed';

-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
