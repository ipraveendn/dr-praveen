# DATABASE DESIGN RECOMMENDATION

Based on a deep analysis of the existing codebase, this document outlines the MINIMUM CLEAN PRODUCTION-READY schema required for the application as it exists today. The goal is to avoid over-engineering while providing a solid foundation for future scalability.

## 1. Actual Current Workflow & Entities

The current application has a simple, linear workflow:

1.  A **Patient** books a token for a specific **Clinic**.
2.  The patient provides their **Name**, **Phone**, **Email** (optional), **Place** (optional), and **Reason for Visit**.
3.  A **Token** is generated and stored in a **Queue** for a specific **Clinic** and **Date**.
4.  A **Receptionist** (Admin) views the **Queue** and manages the flow of patients.
5.  The **Receptionist** marks patients as "serving" and "completed".
6.  The **Patient** can track their position in the **Queue** in real-time.

The core entities are:

*   **Patient:** An individual who books a token.
*   **Clinic:** A physical location where the doctor consults.
*   **Queue:** A list of patients waiting to be seen at a specific clinic on a specific date.
*   **User:** An admin or doctor who logs in to the system.

## 2. Actual Required Models

Based on the current implementation, only the following models are truly necessary right now:

*   `User`: To handle admin and doctor login.
*   `Clinic`: To store information about the clinics.
*   `Token`: To represent a patient's token in the queue.
*   `Patient`: To store basic patient information.

**Models That Can Wait:**

*   `Doctor`: The system is built for a single doctor. A `Doctor` model is not needed until the application needs to support multiple doctors.
*   `Appointment`: The current system is a walk-in queue, not a scheduled appointment system. An `Appointment` model is not needed yet.
*   `Consultation`: The system does not store any consultation details (notes, diagnosis, etc.). This can be added later.

## 3. Suggested Prisma Schema Structure

This schema is designed to be simple, production-ready, and easily expandable. It uses Prisma, a modern database toolkit that makes it easy to work with databases.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// User model for admins and doctors
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  DOCTOR
  USER
}

// Clinic model
model Clinic {
  id      String  @id @default(uuid())
  name    String
  address String
  tokens  Token[]
}

// Patient model
model Patient {
  id     String  @id @default(uuid())
  name   String
  phone  String  @unique
  email  String?
  place  String?
  tokens Token[]
}

// Token model
model Token {
  id             String   @id @default(uuid())
  tokenNumber    Int
  status         Status   @default(WAITING)
  reasonForVisit String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  clinicId  String
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  patientId String
  patient   Patient @relation(fields: [patientId], references: [id])
}

enum Status {
  WAITING
  SERVING
  COMPLETED
  CANCELLED
}
```

## 4. Future Expandable Architecture Plan

This schema is designed to be easily expandable. Here's how you can add new features in the future:

*   **Multiple Doctors:** Add a `Doctor` model and a one-to-many relationship between `Doctor` and `Token`.
*   **Scheduled Appointments:** Add an `Appointment` model with a `scheduledTime` field.
*   **Consultation Notes:** Add a `Consultation` model with a one-to-one relationship with `Token`.
*   **Payments:** Add a `Payment` model with a one-to-one relationship with `Token`.

By starting with this minimal schema, you can avoid unnecessary complexity and build a solid foundation for your application. You can then add new features and models as your application grows.
