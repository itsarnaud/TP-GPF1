-- CreateEnum
CREATE TYPE "GrandstandCategory" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "SessionDay" AS ENUM ('FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('PRACTICE', 'QUALIFYING', 'SPRINT', 'RACE');

-- CreateEnum
CREATE TYPE "LoyaltyProgram" AS ENUM ('NONE', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Grandstand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" "GrandstandCategory" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "isCovered" BOOLEAN NOT NULL,

    CONSTRAINT "Grandstand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "day" "SessionDay" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "SessionType" NOT NULL,
    "priceMultiplier" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spectator" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "loyaltyProgram" "LoyaltyProgram" NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Spectator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "spectatorId" INTEGER NOT NULL,
    "grandstandId" INTEGER NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "status" "ReservationStatus" NOT NULL,
    "reservationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancellationDate" TIMESTAMP(3),
    "refundAmount" DECIMAL(10,2),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ReservationToSession" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ReservationToSession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Spectator_email_key" ON "Spectator"("email");

-- CreateIndex
CREATE INDEX "_ReservationToSession_B_index" ON "_ReservationToSession"("B");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_spectatorId_fkey" FOREIGN KEY ("spectatorId") REFERENCES "Spectator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_grandstandId_fkey" FOREIGN KEY ("grandstandId") REFERENCES "Grandstand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReservationToSession" ADD CONSTRAINT "_ReservationToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReservationToSession" ADD CONSTRAINT "_ReservationToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
