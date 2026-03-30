/*
  Warnings:

  - The primary key for the `assigned_courses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `courses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `courses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `courseId` column on the `last_activities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `purchased_courses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `courseId` on the `assigned_courses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `purchased_courses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `questions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `ratings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `section_lessons` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "assigned_courses" DROP CONSTRAINT "assigned_courses_courseId_fkey";

-- DropForeignKey
ALTER TABLE "last_activities" DROP CONSTRAINT "last_activities_courseId_fkey";

-- DropForeignKey
ALTER TABLE "purchased_courses" DROP CONSTRAINT "purchased_courses_courseId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_courseId_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_courseId_fkey";

-- DropForeignKey
ALTER TABLE "section_lessons" DROP CONSTRAINT "section_lessons_courseId_fkey";

-- AlterTable
ALTER TABLE "assigned_courses" DROP CONSTRAINT "assigned_courses_pkey",
DROP COLUMN "courseId",
ADD COLUMN     "courseId" INTEGER NOT NULL,
ADD CONSTRAINT "assigned_courses_pkey" PRIMARY KEY ("userId", "courseId");

-- AlterTable
ALTER TABLE "courses" DROP CONSTRAINT "courses_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "last_activities" DROP COLUMN "courseId",
ADD COLUMN     "courseId" INTEGER;

-- AlterTable
ALTER TABLE "purchased_courses" DROP CONSTRAINT "purchased_courses_pkey",
DROP COLUMN "courseId",
ADD COLUMN     "courseId" INTEGER NOT NULL,
ADD CONSTRAINT "purchased_courses_pkey" PRIMARY KEY ("courseId", "userId");

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "courseId",
ADD COLUMN     "courseId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ratings" DROP COLUMN "courseId",
ADD COLUMN     "courseId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "section_lessons" DROP COLUMN "courseId",
ADD COLUMN     "courseId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "assigned_courses" ADD CONSTRAINT "assigned_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_courses" ADD CONSTRAINT "purchased_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "last_activities" ADD CONSTRAINT "last_activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_lessons" ADD CONSTRAINT "section_lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
