PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "unitId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authProvider" TEXT NOT NULL DEFAULT 'CREDENTIALS',
    "googleId" TEXT,
    "image" TEXT,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_User" ("id", "name", "email", "passwordHash", "role", "unitId", "isActive", "createdAt", "updatedAt")
SELECT "id", "name", "email", "passwordHash", "role", "unitId", "isActive", "createdAt", "updatedAt" FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

CREATE TABLE "AuthSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "googleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowedDomains" TEXT NOT NULL DEFAULT '[]',
    "allowedEmails" TEXT NOT NULL DEFAULT '[]',
    "allowAutoProvision" BOOLEAN NOT NULL DEFAULT false,
    "defaultRole" TEXT NOT NULL DEFAULT 'Reporter',
    "defaultIsActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "AuthSettings" ("id", "googleEnabled", "allowedDomains", "allowedEmails", "allowAutoProvision", "defaultRole", "defaultIsActive", "updatedAt")
VALUES ('default', false, '[]', '[]', false, 'Reporter', false, CURRENT_TIMESTAMP);

CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "unitId" TEXT,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    CONSTRAINT "UserInvite_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserInvite_email_key" ON "UserInvite"("email");
CREATE INDEX "UserInvite_email_idx" ON "UserInvite"("email");
CREATE INDEX "UserInvite_status_idx" ON "UserInvite"("status");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

