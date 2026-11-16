"""Generate the 20 pending images for Quiz feedback v3.

Each job either:
  - generates a fresh scene from a text prompt (gen), or
  - edits an existing photo by sending it (and an optional client reference
    photo) as additional input images alongside an edit instruction (edit).

Output goes straight to the final scorm-quiz path (as PNG bytes under a .jpg
name — optimize_images.py re-saves everything as real JPEG afterwards).
"""
import base64, json, os, sys, time, urllib.request, urllib.error, random

BASE = r"D:\OneDrive - kuvira Cybernetics\KUVIRA_2_New\CLAUD_204_LMS_Sairam"
KEY = open(os.path.join(BASE, "SOURCE", "gemini_key.txt")).read().strip()
LOGO = os.path.join(BASE, "SOURCE", "lt_logo.png")
IMG = os.path.join(BASE, "scorm-quiz", "assets", "images")
REF = os.path.join(BASE, "Feedback_v3_Pending_Images", "reference_photos")
LOG = os.path.join(BASE, "SOURCE", "gen_v3_log.txt")
MODEL = "gemini-3-pro-image"

STYLE = ("Photorealistic candid photo on an Indian construction site, documentary style, "
         "natural daylight, realistic PPE and equipment detail, wide cinematic composition. ")
SUFFIX = (" Clean composition, no text, no captions, no watermarks, no arrows, no icons, "
          "no illustration elements.")
LOGO_B64 = base64.b64encode(open(LOGO, "rb").read()).decode()
LOGO_RULE = (" The first attached image is the official company logo. Every worker hard hat / "
             "safety helmet visible in the result MUST display this exact blue circular logo "
             "printed on the front, clean and proportionate like a real printed decal. Do not "
             "place the logo anywhere else, do not add any other text or branding. If the image "
             "contains no helmet, ignore the logo entirely.")

def log(msg):
    line = time.strftime("%H:%M:%S ") + msg
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def b64_of(path):
    ext = os.path.splitext(path)[1].lower()
    mime = "image/png" if ext == ".png" else "image/jpeg"
    return mime, base64.b64encode(open(path, "rb").read()).decode()

def generate(prompt, out_path, aspect, extra_images=None, timeout=240):
    parts = [{"inline_data": {"mime_type": "image/png", "data": LOGO_B64}}]
    for p in (extra_images or []):
        mime, data = b64_of(p)
        parts.append({"inline_data": {"mime_type": mime, "data": data}})
    parts.append({"text": prompt + LOGO_RULE})
    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}},
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

JOBS = [
  dict(id="Q4",  out=IMG+"/q4.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "An Indian construction worker about to cut steel with an angle grinder, bright orange "
      "sparks flying near his face area, wearing a full face shield plus goggles for correct eye "
      "protection, confident stance, workshop/site background." + SUFFIX),

  dict(id="Q12", out=IMG+"/q12.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "An Indian worker at height near the open edge of a concrete slab, wearing a full-body "
      "safety harness with a double-leg (twin rope) shock-absorbing lanyard, each leg clipped to "
      "a steel tube-and-clamp guardrail/barricade behind him, city skyline in the distance." + SUFFIX),

  dict(id="Q14", out=IMG+"/q14.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "An Indian worker on a foldable step ladder, standing at least two rungs below the top "
      "step, fixing an electrical wire or fixture on a wall, both hands able to grip the ladder, "
      "clear three points of contact, a co-worker steadying the ladder's base." + SUFFIX),

  dict(id="Q24", out=IMG+"/q24.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "Several heavy-duty orange extension cords plugged into a construction site temporary "
      "electrical distribution panel using round industrial (CEE-form) plugs and sockets, the "
      "panel mounted on a stand off the ground, cables neatly routed and coiled." + SUFFIX),

  dict(id="Q26", out=IMG+"/q26.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "A mobile crane working on a construction site with high-voltage overhead power lines "
      "crossing the sky, a clearly visible safe empty gap between the crane boom tip and the "
      "lines, a yellow warning sign on a post near the lines." + SUFFIX),

  dict(id="Q33", out=IMG+"/q34.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "A sturdy, square, well-braced steel tube scaffold on level, solid ground, bricks stacked "
      "neatly on its working platform, an Indian worker standing on the platform placing more "
      "bricks onto the stack, the whole structure clearly stable and level, no tilt, no "
      "collapse, guardrails in place." + SUFFIX),

  dict(id="Q37", out=IMG+"/q39.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "A deep, wide excavation trench on a construction site, excavated spoil piled a safe "
      "distance back from the trench edge, sloped or shored trench sides clearly visible, the "
      "trench completely empty with no workers in or near it, an excavator parked further away." + SUFFIX),

  dict(id="Q39", out=IMG+"/q41.jpg", aspect="16:9",
    refs=[IMG+"/q41.jpg", REF+"/Q39_utility_detector_reference.jpeg"],
    prompt="Generate an image. The second attached image is the CURRENT photo for this question; "
      "the third attached image is a reference for the correct equipment. " + STYLE +
      "Keep the same Indian worker, pose, yellow helmet and plain open ground setting as the "
      "current photo, but put a handheld underground utility/cable locator (detector) device in "
      "his hands instead of whatever he is currently holding, matching the reference device. Do "
      "not show any underground pipes, cables or trench — plain ground only, daylight." + SUFFIX),

  dict(id="Q40", out=IMG+"/q42.jpg", aspect="16:9",
    refs=[IMG+"/q42.jpg", REF+"/Q40_base_photo_with_client_before_after_marks.png"],
    prompt="Generate an image. The second attached image is the CURRENT photo for this question; "
      "the third attached image is the client's reference. " + STYLE +
      "Using the current trench photo as the base, remove every worker and both excavators from "
      "the scene, keep the yellow helmets theme if any helmets remain visible on background "
      "figures, add a construction barricade (steel tube-and-clamp with red-and-white warning "
      "tape) running along the edge of the trench, keep the concrete mixer and general site "
      "backdrop." + SUFFIX),

  dict(id="Q46", out=IMG+"/q48.jpg", aspect="16:9",
    refs=[REF+"/Q46_reference_1.png", REF+"/Q46_reference_2.png"],
    prompt="Generate an image. The second and third attached images are the client's references "
      "for style. " + STYLE +
      "An Indian worker propping/bracing a newly built, unsupported freestanding brick or "
      "masonry wall with diagonal timber or steel props on both sides, mortar still fresh, "
      "trowel and mortar pan at the base, open sky behind the wall." + SUFFIX),

  dict(id="Q48", out=IMG+"/q50.jpg", aspect="16:9", refs=[IMG+"/q50.jpg", REF+"/Q48_co2_hose_reference.png"],
    prompt="Generate an image. The second attached image is the CURRENT photo for this question; "
      "the third is a reference for the correct equipment. " + STYLE +
      "Keep the same worker, pose and sparking electrical panel from the current photo, but give "
      "the extinguisher a full-length CO2 extinguisher horn and hose assembly matching the "
      "reference, instead of the short stub currently shown." + SUFFIX),

  dict(id="Q56", out=IMG+"/q58.jpg", aspect="16:9", refs=[REF+"/Q56_reference_two_workers_bag.png"],
    prompt="Generate an image. The second attached image is the client's reference. " + STYLE +
      "Two Indian workers together lifting a heavy cement bag, both using correct bent-knee "
      "lifting posture, bright yellow L&T helmets, shallow depth of field with the background "
      "softly blurred, daylight, matching the composition of the reference photo." + SUFFIX),

  dict(id="Q58", out=IMG+"/q60.jpg", aspect="16:9", refs=[IMG+"/q60.jpg"],
    prompt="Generate an image. The second attached image is the CURRENT photo, cropped portrait "
      "and padded into a landscape frame. " + STYLE +
      "Recompose the same subject and action — an Indian construction worker reacting startled, "
      "stepping back after a heavy wrench has fallen near his feet, scaffold work visible above "
      "him — natively as a full-width landscape 16:9 photo, no pillarboxing, no blurred filler "
      "panels on the sides." + SUFFIX),

  dict(id="Q59", out=IMG+"/q61.jpg", aspect="16:9", refs=[IMG+"/q61.jpg"],
    prompt="Generate an image. The second attached image is the CURRENT photo for this question. " + STYLE +
      "Keep this flooded/muddy excavation site scene, but change every worker's helmet to bright "
      "yellow, add a construction barricade (steel tube-and-clamp with warning tape) around the "
      "flooded excavation edge, and reduce the number of workers present to two or three." + SUFFIX),

  dict(id="Q60", out=IMG+"/q62.jpg", aspect="16:9", refs=[IMG+"/q62.jpg"],
    prompt="Generate an image. The second attached image is the CURRENT photo for this question. " + STYLE +
      "Keep this excavation/pit scene with the crane and dump truck, but change every worker's "
      "helmet to bright yellow, and add a construction barricade (steel tube-and-clamp with "
      "warning tape) around the excavation edge." + SUFFIX),

  dict(id="Q66", out=IMG+"/q68.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "An Indian construction worker standing directly beneath a heavy load suspended from a "
      "mobile crane hook mid-lift, the load clearly overhead above him, a clear and obvious "
      "unsafe Line-of-Fire hazard, wide construction site backdrop." + SUFFIX),

  dict(id="Q67", out=IMG+"/q69.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "An Indian construction worker properly anchored at height, wearing a full-body harness "
      "with a double-leg shock-absorbing lanyard, both legs clipped to a certified overhead "
      "anchor point, working safely near a guarded edge, demonstrating a correct mandatory "
      "fall-protection arrangement for work at height." + SUFFIX),

  dict(id="Q68", out=IMG+"/q70.jpg", aspect="16:9", refs=[],
    prompt="Generate an image. " + STYLE +
      "A stationary power tool or machine on a construction site workshop bench with its safety "
      "guard removed for maintenance, a red lockout-tagout tag clearly attached to the machine, "
      "no one operating it, spanners and tools laid out nearby." + SUFFIX),

  dict(id="Q2-D", out=IMG+"/options/q2-D.jpg", aspect="4:3",
    refs=[IMG+"/options/q2-D.jpg", REF+"/Q02_Q09_double_rope_harness_reference.png"],
    prompt="Generate an image. The second attached image is the CURRENT option photo; the third "
      "is the client's reference. " + STYLE +
      "Keep the same full-body safety harness demonstration photo and framing, but change the "
      "lanyard to a double-leg (twin rope) shock-absorbing lanyard with two hooks, matching the "
      "reference, instead of a single leg." + SUFFIX),

  dict(id="Q9-D", out=IMG+"/options/q9-D.jpg", aspect="4:3",
    refs=[IMG+"/options/q9-D.jpg", REF+"/Q02_Q09_double_rope_harness_reference.png"],
    prompt="Generate an image. The second attached image is the CURRENT option photo; the third "
      "is the client's reference. " + STYLE +
      "Keep the same photo showing the back D-ring of a full-body harness on a worker's back, "
      "but add a double-leg (twin rope) lanyard clipped to the D-ring, matching the reference." + SUFFIX),
]

def main():
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    tasks = [j for j in JOBS if (not only or j["id"] in only)]
    log(f"START v3 image gen: {len(tasks)} jobs")
    fails = []
    for i, j in enumerate(tasks):
        done = False
        for attempt in range(4):
            try:
                t0 = time.time()
                n = generate(j["prompt"], j["out"], j["aspect"], j["refs"])
                if n > 50000:
                    log(f"[{i+1}/{len(tasks)}] {j['id']} OK {n//1024}KB {time.time()-t0:.0f}s -> {j['out']}")
                    done = True
                    break
                log(f"[{i+1}/{len(tasks)}] {j['id']} EMPTY (attempt {attempt+1})")
                time.sleep(5)
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    wait = min(300, 20 * (2 ** attempt)) + random.uniform(0, 5)
                    log(f"[{i+1}/{len(tasks)}] {j['id']} 429, waiting {wait:.0f}s")
                    time.sleep(wait)
                elif e.code in (500, 503):
                    log(f"[{i+1}/{len(tasks)}] {j['id']} HTTP {e.code}, retrying")
                    time.sleep(15)
                else:
                    detail = ""
                    try: detail = e.read().decode()[:300]
                    except Exception: pass
                    log(f"[{i+1}/{len(tasks)}] {j['id']} HTTP {e.code} {detail}")
                    time.sleep(10)
            except Exception as ex:
                log(f"[{i+1}/{len(tasks)}] {j['id']} ERR {type(ex).__name__}: {ex}")
                time.sleep(10)
        if not done:
            fails.append(j["id"])
        time.sleep(2)
    log(f"DONE. fails: {fails if fails else 'none'}")

if __name__ == "__main__":
    main()
