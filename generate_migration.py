import sqlite3
import json
import datetime

conn = sqlite3.connect('prisma/dev.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

def format_val(val):
    if val is None:
        return 'NULL'
    if isinstance(val, int) or isinstance(val, float):
        return str(val)
    if isinstance(val, str):
        val = val.replace("'", "''")
        return f"'{val}'"
    return f"'{str(val)}'"

with open('neon_migration.sql', 'w', encoding='utf-8') as f:
    f.write('-- Migration from SQLite to Neon Postgres\n\n')
    
    # 1. Users
    cursor.execute('SELECT * FROM User')
    users = cursor.fetchall()
    if users:
        f.write('INSERT INTO "User" ("id", "email", "passwordHash") VALUES\n')
        values = []
        for row in users:
            val_str = f"({format_val(row['id'])}, {format_val(row['email'])}, {format_val(row['passwordHash'])})"
            values.append(val_str)
        f.write(',\n'.join(values) + ';\n\n')

    # 2. Candidates
    cursor.execute('SELECT * FROM Candidate')
    candidates = cursor.fetchall()
    if candidates:
        columns = [
            '"id"', '"userId"', '"referenceId"', '"name"', '"selectedRole"', 
            '"campusType"', '"offerLetterDate"', '"jrsDate"', '"joiningDate"', 
            '"ilpAttempted"', '"bgcStarted"', '"claimStatus"'
        ]
        f.write(f'INSERT INTO "Candidate" ({", ".join(columns)}) VALUES\n')
        values = []
        for row in candidates:
            row_vals = []
            for col in ['id', 'userId', 'referenceId', 'name', 'selectedRole', 'campusType']:
                row_vals.append(format_val(row[col]))
            
            for col in ['offerLetterDate', 'jrsDate', 'joiningDate']:
                val = row[col]
                if val:
                    if isinstance(val, int) or str(val).isdigit():
                        val = datetime.datetime.utcfromtimestamp(int(val)/1000).isoformat()
                    row_vals.append(format_val(val + 'Z' if 'T' in str(val) and not str(val).endswith('Z') else val))
                else:
                    row_vals.append('NULL')
                    
            row_vals.append(format_val(row['ilpAttempted']))
            row_vals.append('true' if row['bgcStarted'] else 'false')
            row_vals.append(format_val(row['claimStatus']))
            
            values.append(f"({', '.join(row_vals)})")
            
        f.write(',\n'.join(values) + ';\n\n')

    # 3. DisputeTickets
    cursor.execute('SELECT * FROM DisputeTicket')
    tickets = cursor.fetchall()
    if tickets:
        columns = ['"id"', '"candidateId"', '"claimantEmail"', '"reason"', '"status"']
        f.write(f'INSERT INTO "DisputeTicket" ({", ".join(columns)}) VALUES\n')
        values = []
        for row in tickets:
            row_vals = [
                format_val(row['id']),
                format_val(row['candidateId']),
                format_val(row['claimantEmail']),
                format_val(row['reason']),
                format_val(row['status'])
            ]
            values.append(f"({', '.join(row_vals)})")
        f.write(',\n'.join(values) + ';\n\n')
        
    print('Generated neon_migration.sql successfully.')
