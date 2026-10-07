import json, urllib.request, sys

KEY = open(r"C:\Users\ABDON\OneDrive - kuvira Cybernetics\KUVIRA 2\CLAUD_204_LMS_Sairam\SOURCE\gemini_key.txt").read().strip()

req = urllib.request.Request(
    "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
    headers={"x-goog-api-key": KEY},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
except urllib.error.HTTPError as e:
    print("HTTP", e.code)
    print(e.read().decode()[:500])
    sys.exit(1)

models = data.get("models", [])
print("total models:", len(models))
for m in models:
    name = m["name"]
    if "image" in name or "banana" in name.lower():
        print(name, "|", m.get("displayName"), "|", ",".join(m.get("supportedGenerationMethods", [])))
