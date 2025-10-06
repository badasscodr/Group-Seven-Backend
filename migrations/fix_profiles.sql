-- Add businessType column to clientProfiles
ALTER TABLE "clientProfiles" ADD COLUMN IF NOT EXISTS "businessType" VARCHAR(100);

-- Add updatedAt column to clientProfiles
ALTER TABLE "clientProfiles" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create profile records for existing users
INSERT INTO "clientProfiles" ("id", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", NOW(), NOW()
FROM users u
WHERE u."role" = 'client'
AND NOT EXISTS (
  SELECT 1 FROM "clientProfiles" cp WHERE cp."userId" = u."id"
);

INSERT INTO "supplierProfiles" ("id", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", NOW(), NOW()
FROM users u
WHERE u."role" = 'supplier'
AND NOT EXISTS (
  SELECT 1 FROM "supplierProfiles" sp WHERE sp."userId" = u."id"
);

INSERT INTO "employeeProfiles" ("id", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", NOW(), NOW()
FROM users u
WHERE u."role" = 'employee'
AND NOT EXISTS (
  SELECT 1 FROM "employeeProfiles" ep WHERE ep."userId" = u."id"
);

INSERT INTO "candidateProfiles" ("id", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", NOW(), NOW()
FROM users u
WHERE u."role" = 'candidate'
AND NOT EXISTS (
  SELECT 1 FROM "candidateProfiles" cp WHERE cp."userId" = u."id"
);

SELECT 'Profile records created successfully' AS status;
