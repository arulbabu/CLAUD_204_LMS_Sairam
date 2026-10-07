"""Build quiz-data.js for all 70 questions from extracted JSONs.
- en/ta/hi for question + options
- optionImages for image-classified questions (q1,q13 legacy jpg + 24 API-generated)
- scene images only where they exist (q1,q10,q13,q26,q33)
Also converts API PNGs -> compressed JPGs into the app assets folder.
"""
import json, os, sys
from PIL import Image

BASE = r"C:\Users\ABDON\OneDrive - kuvira Cybernetics\KUVIRA 2\CLAUD_204_LMS_Sairam"
APP = os.path.join(BASE, "scorm-quiz")
API_DIR = os.path.join(BASE, "SOURCE", "Generated_API")
OPT_DIR = os.path.join(APP, "assets", "images", "options")

qs = json.load(open(os.path.join(BASE, "all_questions_en.json"), encoding="utf-8"))
tr = json.load(open(os.path.join(BASE, "translations.json"), encoding="utf-8"))
prompts = json.load(open(os.path.join(BASE, "image_prompts.json"), encoding="utf-8"))

IMG_QS = sorted([int(k) for k in prompts["questions"]]) + [1, 13]
SCENE = {1: "assets/images/q1.png", 10: "assets/images/q10.png", 13: "assets/images/q13.png",
         26: "assets/images/q26.png", 33: "assets/images/q33.png"}

def convert_images():
    os.makedirs(OPT_DIR, exist_ok=True)
    converted, missing = 0, []
    for qno in IMG_QS:
        if qno in (1, 13):
            continue  # legacy jpgs already in place
        for L in "ABCD":
            src = os.path.join(API_DIR, f"q{qno}-{L}.png")
            dst = os.path.join(OPT_DIR, f"q{qno}-{L}.jpg")
            if not os.path.exists(src):
                missing.append(f"q{qno}-{L}")
                continue
            if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                converted += 1
                continue
            im = Image.open(src).convert("RGB")
            im.thumbnail((1024, 1024), Image.LANCZOS)
            im.save(dst, "JPEG", quality=82, optimize=True)
            converted += 1
    return converted, missing

def js_str(s):
    return json.dumps(s, ensure_ascii=False)

def build_js():
    out = ["// Construction Safety Quiz — 70 questions, multilingual (English / Tamil / Hindi)",
           "// Generated from Construction_Safety_Quiz_60Q.xlsx + Construction_Safety_Quiz_10Q_New.xlsx",
           "var QUIZ_QUESTIONS = ["]
    for qno in range(1, 71):
        q = qs[str(qno)]
        t = tr[str(qno)]
        out.append("  {")
        out.append(f"    category: {js_str(q['category'])},")
        out.append("    question: {")
        out.append(f"      en: {js_str(q['question'])},")
        out.append(f"      ta: {js_str(t['q']['ta'])},")
        out.append(f"      hi: {js_str(t['q']['hi'])}")
        out.append("    },")
        if qno in SCENE:
            out.append(f"    image: {js_str(SCENE[qno])},")
        out.append('    imageCaption: "",')
        if qno in IMG_QS:
            out.append("    optionImages: {")
            rows = [f'      {L}: "assets/images/options/q{qno}-{L}.jpg"' for L in "ABCD" if q["options"].get(L)]
            out.append(",\n".join(rows))
            out.append("    },")
        out.append("    options: {")
        opt_rows = []
        for L in "ABCD":
            if not q["options"].get(L):
                continue
            opt_rows.append(
                f"      {L}: {{\n"
                f"        en: {js_str(q['options'][L])},\n"
                f"        ta: {js_str(t['o'][L]['ta'])},\n"
                f"        hi: {js_str(t['o'][L]['hi'])}\n"
                f"      }}")
        out.append(",\n".join(opt_rows))
        out.append("    },")
        out.append(f"    correct: {js_str(q['correct'])}")
        out.append("  }" + ("," if qno < 70 else ""))
    out.append("];")
    out.append("")
    out.append("var TIME_PER_QUESTION = 30;")
    return "\n".join(out)

if __name__ == "__main__":
    c, m = convert_images()
    print(f"converted/present: {c}, missing: {len(m)} {m[:10]}")
    js = build_js()
    path = os.path.join(APP, "js", "quiz-data.js")
    with open(path, "w", encoding="utf-8") as f:
        f.write(js)
    print("wrote", path, len(js), "chars")
