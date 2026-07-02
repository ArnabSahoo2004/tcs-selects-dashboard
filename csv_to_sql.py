import csv
import uuid

# We will read data.csv and generate INSERT statements for the Neon Postgres DB.
with open('data.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    candidates = list(reader)

with open('csv_migration.sql', 'w', encoding='utf-8') as out:
    out.write('-- Migration from data.csv to Neon Postgres\n\n')
    
    # Process in batches of 100 to avoid giant SQL statements
    batch_size = 100
    for i in range(0, len(candidates), batch_size):
        batch = candidates[i:i+batch_size]
        
        columns = [
            '"id"', '"referenceId"', '"name"', '"selectedRole"', 
            '"ilpAttempted"', '"bgcStarted"', '"claimStatus"'
        ]
        
        out.write(f'INSERT INTO "Candidate" ({", ".join(columns)}) VALUES\n')
        
        values = []
        for row in batch:
            # Generate a random cuid-like ID (using uuid4 stripped of dashes)
            import random
            import string
            cuid = 'c' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=24))
            
            ref_id = row['Reference ID'].replace("'", "''")
            name = row['Name'].replace("'", "''")
            role = row['Approved Offer'].upper() # e.g. PRIME, DIGITAL, NINJA
            if not role:
                role = "NINJA" # fallback
                
            val_str = f"('{cuid}', '{ref_id}', '{name}', '{role}', 0, false, 'UNCLAIMED')"
            values.append(val_str)
            
        out.write(',\n'.join(values) + ';\n\n')

print("Generated csv_migration.sql successfully.")
