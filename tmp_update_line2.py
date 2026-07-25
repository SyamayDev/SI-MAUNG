from pathlib import Path
p = Path(r"C:/laragon/www/moneytalk/src/services/aiService.js")
lines = p.read_text().splitlines()
quote = chr(96)
lines[19] = '        Authorization: ' + quote + 'Bearer ${key}' + quote + ','
p.write_text("\n".join(lines))
print('line updated', repr(lines[19]))
