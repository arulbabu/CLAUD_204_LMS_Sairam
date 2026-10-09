"""Preview voice-over generator using free Edge neural voices (Indian female).

Stand-in for gen_vo.py while Gemini credits are depleted — identical output
paths and filenames, so the app and the engine wiring need no changes when the
Gemini clips replace these.

Voices: Indian-accent female neural, moderate pace.
Usage:
  python gen_vo_edge.py           # all 70
  python gen_vo_edge.py 1 5       # questions 1..5
"""
import asyncio, json, os, subprocess, sys, time

import edge_tts

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_ROOT = os.path.join(BASE, "scorm-quiz", "assets", "audio")
LOG = os.path.join(BASE, "SOURCE", "gen_vo_edge_log.txt")

VOICES = {
    "en": "en-IN-NeerjaNeural",
    "ta": "ta-IN-PallaviNeural",
    "hi": "hi-IN-SwaraNeural",
}
# Slightly under default: instructional clarity, still natural.
RATE = "-6%"
PITCH = "+0Hz"


def log(msg):
    line = time.strftime("%H:%M:%S ") + msg
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def normalize(src, dst):
    """Trim edge silence + loudness-normalise so clips don't jump in volume."""
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", src,
         "-af", "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,"
                "areverse,silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,"
                "areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
         "-codec:a", "libmp3lame", "-b:a", "80k", "-ar", "24000", "-ac", "1", dst],
        check=True)


async def make(text, lang, name):
    final = os.path.join(OUT_ROOT, lang, name + ".mp3")
    if os.path.exists(final) and os.path.getsize(final) > 2000:
        return "skip"
    os.makedirs(os.path.dirname(final), exist_ok=True)
    raw = final + ".raw.mp3"
    for attempt in range(3):
        try:
            tts = edge_tts.Communicate(text, VOICES[lang], rate=RATE, pitch=PITCH)
            await tts.save(raw)
            if os.path.getsize(raw) < 1500:
                raise RuntimeError("empty audio")
            normalize(raw, final)
            os.remove(raw)
            log(f"  {lang}/{name} OK {os.path.getsize(final)//1024}KB")
            return "ok"
        except Exception as ex:
            log(f"  {lang}/{name} ERR {type(ex).__name__}: {ex} (attempt {attempt+1})")
            await asyncio.sleep(3)
    if os.path.exists(raw):
        os.remove(raw)
    return "fail"


async def main():
    lo = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    hi = int(sys.argv[2]) if len(sys.argv) > 2 else 70
    vo = json.load(open(os.path.join(BASE, "vo_script.json"), encoding="utf-8"))
    langs = ("en", "ta", "hi")

    jobs = [(vo["leadIn"][L], L, f"lead-{L}") for L in langs]
    for qno in range(lo, hi + 1):
        e = vo["questions"][str(qno)]
        for L in langs:
            jobs.append((e["q"][L], L, f"q{qno}-q"))
            jobs.append((e["correct"][L], L, f"q{qno}-ans"))

    log(f"START edge vo q{lo}-{hi}: {len(jobs)} clips")
    tally = {"ok": 0, "skip": 0, "fail": 0}
    fails = []
    for text, lang, name in jobs:
        r = await make(text, lang, name)
        tally[r] += 1
        if r == "fail":
            fails.append(f"{lang}/{name}")
    log(f"DONE {tally} fails: {fails if fails else 'none'}")


if __name__ == "__main__":
    asyncio.run(main())
