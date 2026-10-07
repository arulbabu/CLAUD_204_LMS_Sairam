"""Finish q69/q70 scenes on a fallback model (free-tier eligible)."""
import json, base64, os, time, urllib.request, urllib.error, sys

BASE = r"C:\Users\ABDON\OneDrive - kuvira Cybernetics\KUVIRA 2\CLAUD_204_LMS_Sairam"
KEY = open(os.path.join(BASE, "SOURCE", "gemini_key.txt")).read().strip()
LOGO = os.path.join(BASE, "SOURCE", "lt_logo.png")
OUT = os.path.join(BASE, "SOURCE", "Generated_Scenes")

STYLE = ("Photorealistic candid photo on an Indian construction site, documentary style, "
         "natural daylight, realistic PPE and equipment detail, wide cinematic composition. ")
SUFFIX = (" Clean composition, no text, no captions, no watermarks, no arrows, no icons, "
          "no illustration elements.")
LOGO_B64 = base64.b64encode(open(LOGO, "rb").read()).decode()
LOGO_RULE = (" The attached image is the official company logo. Every worker hard hat / safety helmet "
             "visible in the image MUST display this exact blue circular logo printed on the front of the helmet, "
             "clean and proportionate like a real printed decal. Do not place the logo anywhere else in the scene, "
             "do not add any other text or branding. If the image contains no helmet, ignore the logo entirely.")

def generate(model, prompt, out_path):
    body = {
        "contents": [{"parts": [
            {"inline_data": {"mime_type": "image/png", "data": LOGO_B64}},
            {"text": prompt + LOGO_RULE},
        ]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9"}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=240) as r:
        data = json.loads(r.read())
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if "inlineData" in part:
                raw = base64.b64decode(part["inlineData"]["data"])
                with open(out_path, "wb") as f:
                    f.write(raw)
                return len(raw)
    return 0

scenes = json.load(open(os.path.join(BASE, "scene_prompts.json"), encoding="utf-8"))
models = ["gemini-3.1-flash-image", "gemini-2.5-flash-image", "gemini-nano-banana-2.1"]
for qno in ["69", "70"]:
    out = os.path.join(OUT, f"q{qno}.png")
    if os.path.exists(out) and os.path.getsize(out) > 50000:
        print(f"q{qno} already done"); continue
    prompt = "Generate an image. " + STYLE + scenes[qno] + SUFFIX
    done = False
    for m in models:
        for attempt in range(2):
            try:
                n = generate(m, prompt, out)
                if n > 50000:
                    print(f"q{qno} OK via {m}: {n//1024}KB")
                    done = True
                    break
                print(f"q{qno} {m} empty")
            except urllib.error.HTTPError as e:
                msg = ""
                try: msg = e.read().decode()[:150]
                except Exception: pass
                print(f"q{qno} {m} HTTP {e.code} {msg}")
                if e.code in (402, 404):
                    break  # try next model
                time.sleep(10)
            except Exception as ex:
                print(f"q{qno} {m} ERR {ex}")
                time.sleep(5)
        if done:
            break
