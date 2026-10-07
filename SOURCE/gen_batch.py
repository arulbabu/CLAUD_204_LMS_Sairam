import json, base64, os, sys, time, urllib.request, urllib.error, random

BASE = r"C:\Users\ABDON\OneDrive - kuvira Cybernetics\KUVIRA 2\CLAUD_204_LMS_Sairam"
KEY = open(os.path.join(BASE, "SOURCE", "gemini_key.txt")).read().strip()
LOGO = os.path.join(BASE, "SOURCE", "lt_logo.png")
OUT_PNG = os.path.join(BASE, "SOURCE", "Generated_API")
MODEL = "gemini-3-pro-image"
LOG = os.path.join(BASE, "SOURCE", "gen_api_log.txt")

LOGO_B64 = base64.b64encode(open(LOGO, "rb").read()).decode()
LOGO_RULE = (" The attached image is the official company logo. Every worker hard hat / safety helmet "
             "visible in the image MUST display this exact blue circular logo printed on the front of the helmet, "
             "clean and proportionate like a real printed decal. Do not place the logo anywhere else in the scene, "
             "do not add any other text or branding. If the image contains no helmet, ignore the logo entirely.")

def log(msg):
    line = time.strftime("%H:%M:%S ") + msg
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def generate(prompt, out_path, timeout=240):
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
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
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

def main():
    prompts = json.load(open(os.path.join(BASE, "image_prompts.json"), encoding="utf-8"))
    S, X = prompts["style_prefix"], prompts["style_suffix"]
    qnos = sorted(int(k) for k in prompts["questions"])
    tasks = []
    for qno in qnos:
        for L in "ABCD":
            out = os.path.join(OUT_PNG, f"q{qno}-{L}.png")
            if os.path.exists(out) and os.path.getsize(out) > 50000:
                continue
            tasks.append((qno, L, "Generate an image. " + S + prompts["questions"][str(qno)][L] + X, out))
    log(f"START batch: {len(tasks)} images to generate, model={MODEL}")

    fails = []
    for i, (qno, L, prompt, out) in enumerate(tasks):
        done = False
        for attempt in range(4):
            try:
                t0 = time.time()
                n = generate(prompt, out)
                if n > 50000:
                    log(f"[{i+1}/{len(tasks)}] q{qno}-{L} OK {n//1024}KB {time.time()-t0:.0f}s")
                    done = True
                    break
                else:
                    log(f"[{i+1}/{len(tasks)}] q{qno}-{L} EMPTY (attempt {attempt+1}) — maybe safety block")
                    time.sleep(5)
            except urllib.error.HTTPError as e:
                detail = ""
                try: detail = e.read().decode()[:200]
                except Exception: pass
                if e.code == 429:
                    wait = min(300, 20 * (2 ** attempt)) + random.uniform(0, 5)
                    log(f"[{i+1}/{len(tasks)}] q{qno}-{L} 429 rate-limit, waiting {wait:.0f}s")
                    time.sleep(wait)
                elif e.code in (500, 503):
                    log(f"[{i+1}/{len(tasks)}] q{qno}-{L} HTTP {e.code}, retrying")
                    time.sleep(15)
                else:
                    log(f"[{i+1}/{len(tasks)}] q{qno}-{L} HTTP {e.code} {detail}")
                    time.sleep(10)
            except Exception as ex:
                log(f"[{i+1}/{len(tasks)}] q{qno}-{L} ERR {type(ex).__name__}: {ex}")
                time.sleep(10)
        if not done:
            fails.append(f"q{qno}-{L}")
        time.sleep(1.5)

    log(f"DONE. fails: {fails if fails else 'none'}")

if __name__ == "__main__":
    main()
