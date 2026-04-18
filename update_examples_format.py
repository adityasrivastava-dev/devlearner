"""Auto-populate sampleInput/sampleOutput from existing `examples` field for files that use that format."""
import json, glob, os

seed_dir = 'C:/Dev/devlearner/devlearner/learning-system/src/main/resources/seeds/'
target_files = ['M03-advanced-sql.json', 'A01-aws-core.json', 'A02-serverless-messaging.json',
                'A03-networking-cdn.json', 'A04-devops-containers.json']

total = 0
for fname in target_files:
    fpath = seed_dir + fname
    with open(fpath, encoding='utf-8') as f: data = json.load(f)
    updated = 0
    for topic in data['topics']:
        for p in topic.get('problems', []):
            if p.get('sampleInput'):
                continue
            examples = p.get('examples', [])
            if examples and isinstance(examples, list) and examples[0]:
                ex = examples[0]
                if isinstance(ex, dict):
                    si = str(ex.get('input', ''))[:300]
                    so = str(ex.get('output', ''))[:300]
                    if si: p['sampleInput'] = si
                    if so: p['sampleOutput'] = so
                    updated += 1
    with open(fpath, 'w', encoding='utf-8') as f: json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"{fname}: {updated} populated from examples")
    total += updated

print(f"\nTotal: {total}")
