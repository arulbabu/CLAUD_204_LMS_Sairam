"""Generate voice-over MP3s via Gemini TTS (female voice, natural pacing).

Clips per question per language: q (question), ans (correct answer text).
Plus 3 shared lead-in clips ("The right answer is") played before `ans` on a
wrong answer.

Output: scorm-quiz/assets/audio/<lang>/q<N>-q.mp3, q<N>-ans.mp3, lead-<lang>.mp3

Usage:
  python gen_vo.py            # all 70
  python gen_vo.py 1 5        # questions 1..5 only
"""
import base64, json, os, random, struct, subprocess, sys, time, urllib.error, urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = open(os.path.join(BASE, "SOURCE", "gemini_key.txt")).read().strip()
OUT_ROOT = os.path.join(BASE, "scorm-quiz", "assets", "audio")
WAV_TMP = os.path.join(BASE, "SOURCE", "TTS_WAV")
LOG = os.path.join(BASE, "SOURCE", "gen_vo_log.txt")
MODEL = "gemini-2.5-flash-preview-tts"

# Single warm female voice across all three languages for a consistent narrator.
VOICE = "Aoede"

LANG_NAME = {"en": "English", "ta": "Tamil", "hi": "Hindi"}

# Natural-pacing direction. Gemini TTS is steered by natural-language style
# prompts rather than numeric rate/pitch knobs.
STYLE = (
    "You are a warm, friendly female safety-training instructor speaking to "
    "construction workers. Deliver the line in {lang} with a calm, clear, "
    "encouraging tone and natural conversational rhythm. Use a moderate, "
    "steady pace -- not rushed and not slow -- with natural pauses at commas "
    "and gentle emphasis on key safety terms. Pronounce technical safety terms "
    "and numbers clearly. Do not add, translate, omit, or comment on anything. "
    "Read exactly this line and nothing else:\n"
)


def log(msg):
    line = time.strftime("%H:%M:%S ") + msg
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def pcm_to_wav(pcm, path, rate=24000):
    hdr = (b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " +
           struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16) +
           b"data" + struct.pack("<I", len(pcm)))
    with open(path, "wb") as f:
        f.write(hdr + pcm)


def tts_pcm(text, lang, timeout=240):
    body = {
        "contents": [{"parts": [{"text": STYLE.format(lang=LANG_NAME[lang]) + text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
        },
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
                return base64.b64decode(part["inlineData"]["data"])
    return b""


def to_mp3(wav, mp3):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav,
                    "-af", "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,"
                           "areverse,silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,areverse,"
                           "loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-codec:a", "libmp3lame", "-b:a", "80k", "-ar", "24000", "-ac", "1", mp3],
                   check=True)


def make(text, lang, name):
    """Generate one clip. Returns 'skip' | 'ok' | 'fail'."""
    mp3 = os.path.join(OUT_ROOT, lang, name + ".mp3")
    if os.path.exists(mp3) and os.path.getsize(mp3) > 2000:
        return "skip"
    os.makedirs(os.path.dirname(mp3), exist_ok=True)
    os.makedirs(WAV_TMP, exist_ok=True)
    wav = os.path.join(WAV_TMP, f"{lang}-{name}.wav")
    for attempt in range(4):
        try:
            pcm = tts_pcm(text, lang)
            if len(pcm) < 4000:
                log(f"  {lang}/{name} EMPTY (attempt {attempt+1})")
                time.sleep(5)
                continue
            pcm_to_wav(pcm, wav)
            to_mp3(wav, mp3)
            log(f"  {lang}/{name} OK {os.path.getsize(mp3)//1024}KB")
            return "ok"
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode()[:160].replace("\n", " ")
            except Exception:
                pass
            if e.code == 429:
                wait = min(240, 20 * (2 ** attempt)) + random.uniform(0, 5)
                log(f"  {lang}/{name} 429, waiting {wait:.0f}s")
                time.sleep(wait)
            elif e.code in (500, 503):
                log(f"  {lang}/{name} HTTP {e.code}, retrying")
                time.sleep(15)
            else:
                log(f"  {lang}/{name} HTTP {e.code} {detail}")
                if e.code in (401, 402, 403):
                    return "fail"
                time.sleep(10)
        except Exception as ex:
            log(f"  {lang}/{name} ERR {type(ex).__name__}: {ex}")
            time.sleep(8)
    return "fail"


def main():
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

    log(f"START vo q{lo}-{hi}: {len(jobs)} clips, voice={VOICE}, model={MODEL}")
    tally = {"ok": 0, "skip": 0, "fail": 0}
    fails = []
    for i, (text, lang, name) in enumerate(jobs, 1):
        r = make(text, lang, name)
        tally[r] += 1
        if r == "fail":
            fails.append(f"{lang}/{name}")
        if r == "ok":
            time.sleep(1.2)
        if i % 20 == 0:
            log(f"[{i}/{len(jobs)}] {tally}")
    log(f"DONE {tally} fails: {fails if fails else 'none'}")


if __name__ == "__main__":
    main()
