import json, base64, os, sys, time, urllib.request, urllib.error

BASE = r"C:\Users\ABDON\OneDrive - kuvira Cybernetics\KUVIRA 2\CLAUD_204_LMS_Sairam"
KEY = open(os.path.join(BASE, "SOURCE", "gemini_key.txt")).read().strip()
LOGO = os.path.join(BASE, "SOURCE", "lt_logo.png")
OUT = os.path.join(BASE, "SOURCE", "Generated_Options")

LOGO_B64 = base64.b64encode(open(LOGO, "rb").read()).decode()
LOGO_RULE = (" The attached image is the official company logo. Every worker hard hat / safety helmet "
             "visible in the image MUST display this exact blue circular logo printed on the front of the helmet, "
             "clean and proportionate like a real printed decal. Do not place the logo anywhere else in the scene, "
             "do not add any other text or branding. If the image contains no helmet, ignore the logo entirely.")

def generate(model, prompt, out_path, timeout=180):
    body = {
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": "image/png", "data": LOGO_B64}},
                {"text": prompt + LOGO_RULE},
            ]
        }],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "4:3"}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.loads(r.read())
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if "inlineData" in part:
                raw = base64.b64decode(part["inlineData"]["data"])
                os.makedirs(os.path.dirname(out_path), exist_ok=True)
                with open(out_path, "wb") as f:
                    f.write(raw)
                return len(raw)
    return 0

if __name__ == "__main__":
    model = sys.argv[1] if len(sys.argv) > 1 else "gemini-3-pro-image"
    prompts = json.load(open(os.path.join(BASE, "image_prompts.json"), encoding="utf-8"))
    S, X = prompts["style_prefix"], prompts["style_suffix"]
    p = "Generate an image. " + S + prompts["questions"]["28"]["B"] + X
    t0 = time.time()
    try:
        n = generate(model, p, os.path.join(OUT, "_api_test_q28B.png"))
        print(f"{model}: {n} bytes in {time.time()-t0:.0f}s")
    except urllib.error.HTTPError as e:
        print(f"{model}: HTTP {e.code}")
        print(e.read().decode()[:800])
