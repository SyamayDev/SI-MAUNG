from pathlib import Path
p = Path(r"C:/laragon/www/moneytalk/src/services/aiService.js")
text = p.read_text()
start = text.index('const res = await fetch("https://api.openai.com/v1/chat/completions", {')
end = text.index('});', start) + 3
new_block = '''const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 300,
      }),
    });'''
text = text[:start] + new_block + text[end:]
p.write_text(text)
print('patched')
