from pathlib import Path
p = Path(r"C:/laragon/www/moneytalk/src/services/aiService.js")
text = p.read_text()
idx = text.index('headers: {')
print(repr(text[idx:idx+120]))
print(text[idx:idx+120])
