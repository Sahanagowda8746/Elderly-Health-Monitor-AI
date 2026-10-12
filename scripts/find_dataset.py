import json
import os

full_path = r'C:\Users\SAHANA GOWDA\.gemini\antigravity-ide\brain\fe2fd294-16f5-4028-82c2-a2cc0713831f\.system_generated\logs\transcript_full.jsonl'
target_path = r'C:\Users\SAHANA GOWDA\Desktop\Capstone project\data\elderly_health_monitoring_synthetic_demo_dataset.csv'
os.makedirs(os.path.dirname(target_path), exist_ok=True)

found = False
with open(full_path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'SIM0600' in line:
            data = json.loads(line)
            for k, v in data.items():
                if isinstance(v, str) and 'SIM0600' in v and 'record_id,timestamp' in v:
                    idx = v.find('record_id,timestamp')
                    csv_text = v[idx:].strip()
                    if '<SYSTEM_MESSAGE>' in csv_text:
                        csv_text = csv_text[:csv_text.find('<SYSTEM_MESSAGE>')].strip()
                    with open(target_path, 'w', encoding='utf-8', newline='') as out:
                        out.write(csv_text + '\n')
                    print('Successfully wrote CSV to', target_path)
                    with open(target_path, 'r', encoding='utf-8') as cf:
                        rows = cf.readlines()
                    print('Total lines in CSV:', len(rows))
                    print('Header:', rows[0].strip())
                    print('Row 1:', rows[1].strip())
                    print('Last row:', rows[-1].strip())
                    found = True
                    break
        if found:
            break

if not found:
    print('SIM0600 with header not found in transcript_full')
