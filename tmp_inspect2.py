from pathlib import Path
p = Path(r"C:/laragon/www/moneytalk/src/services/aiService.js")
text = p.read_text()
idx = text.index('headers: {')
segment = text[idx:idx+90]
print('SEGMENT REPR:', repr(segment))
print('SEGMENT RAW:')
print(segment)
print('---')
for i,ch in enumerate(segment):
    print(i, repr(ch), ord(ch))
