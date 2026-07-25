from pathlib import Path
p = Path(r"C:/laragon/www/moneytalk/src/services/aiService.js")
text = p.read_text()
old = 'headers: {\r\n        Authorization: `******\r\n        "Content-Type": "application/json",\r\n      },\r\n'
new = 'headers: {\r\n        Authorization: `Bearer ${key}`,\r\n        "Content-Type": "application/json",\r\n      },\r\n'
if old not in text:
    raise SystemExit('old string not found')
text = text.replace(old, new, 1)
p.write_text(text)
print('patched')
