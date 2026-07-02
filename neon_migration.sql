-- Migration from SQLite to Neon Postgres

INSERT INTO "User" ("id", "email", "passwordHash") VALUES
('cmr3h50hw0000elyg01e8kr3x', 'arnabsahoo27@gmail.com', '$2b$12$/HW0bBYqe3J0Vyhq0SAPPuEVINzJB7zooKqKB5F8jehCk.e.VXtKO');

INSERT INTO "Candidate" ("id", "userId", "referenceId", "name", "selectedRole", "campusType", "offerLetterDate", "jrsDate", "joiningDate", "ilpAttempted", "bgcStarted", "claimStatus") VALUES
('cmr3gd09p0000el70donbaclp', 'cmr3h50hw0000elyg01e8kr3x', 'CT20261234567', 'John Doe', 'DIGITAL', NULL, NULL, NULL, NULL, 0, false, 'CLAIMED'),
('cmr3gd0a00001el70nv62u1ki', NULL, 'DT20267654321', 'Jane Smith', 'PRIME', NULL, NULL, NULL, NULL, 0, false, 'UNCLAIMED');

