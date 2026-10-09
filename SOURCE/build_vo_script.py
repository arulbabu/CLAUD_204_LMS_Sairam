"""Build vo_script.json — exact voice-over scripts (en/ta/hi) for all 70 questions.

Per question, per language, three playback units:
  q       : the question text, spoken when the question loads (Next)
  correct : the correct option's text, spoken when the learner picks right
  wrong   : lead-in ("The right answer is") + the correct option's text

The lead-in is a SHARED clip per language (assets/audio/lead-<lang>.mp3), chained
in the engine before the per-question `correct` clip, so only 2 clips per
question per language need generating (70 x 2 x 3 = 420 + 3 lead-ins).
"""
import json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LEAD_IN = {
    "en": "The right answer is",
    "ta": "\u0b9a\u0bb0\u0bbf\u0baf\u0bbe\u0ba9 \u0bb5\u0bbf\u0b9f\u0bc8",
    "hi": "\u0938\u0939\u0940 \u0909\u0924\u094d\u0924\u0930 \u0939\u0948",
}

qs = json.load(open(os.path.join(BASE, "all_questions_en.json"), encoding="utf-8"))
tr = json.load(open(os.path.join(BASE, "translations.json"), encoding="utf-8"))


def clean(s):
    """Spoken-form tidy: TTS reads these better without bracketed glosses kept inline."""
    return " ".join(str(s).split()).strip()


def build():
    out = {"leadIn": LEAD_IN, "questions": {}}
    for qno in range(1, 71):
        q, t = qs[str(qno)], tr[str(qno)]
        letter = q["correct"]
        entry = {
            "correctLetter": letter,
            "q": {
                "en": clean(q["question"]),
                "ta": clean(t["q"]["ta"]),
                "hi": clean(t["q"]["hi"]),
            },
            "correct": {
                "en": clean(q["options"][letter]),
                "ta": clean(t["o"][letter]["ta"]),
                "hi": clean(t["o"][letter]["hi"]),
            },
        }
        entry["wrong"] = {
            lang: f"{LEAD_IN[lang]}, {entry['correct'][lang]}" for lang in ("en", "ta", "hi")
        }
        out["questions"][str(qno)] = entry
    return out


if __name__ == "__main__":
    data = build()
    path = os.path.join(BASE, "vo_script.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    n = len(data["questions"])
    print(f"wrote {path}: {n} questions, {n*2*3 + 3} clips to generate")
    for i in ("1", "2"):
        print(json.dumps(data["questions"][i], ensure_ascii=False, indent=1))
