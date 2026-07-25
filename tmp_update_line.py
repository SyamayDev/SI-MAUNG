from pathlib import Path
p = Path(r"C:/laragon/www/moneytalk/src/services/aiService.js")
lines = p.read_text().splitlines()
lines[19] = '        Authorization: `Bearer ${key}`,'
p.write_text("\n".join(lines))
print('line updated')
