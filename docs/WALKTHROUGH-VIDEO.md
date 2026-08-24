# LEVELos narrated walkthrough

This guide is the production script for a 60–90 second, 1080p portfolio walkthrough. Record the screen from a fresh browser profile at 1920×1080 with the guided tour enabled. The narration should be recorded separately in a quiet room so it can be leveled, captioned, and replaced without recapturing the product footage.

## Recording path

| Time | Screen action | Narration |
| --- | --- | --- |
| 0:00–0:08 | Open the LEVELos landing page, select **Start demo**, and reveal the Persistent Pools dashboard. | “LEVELos for the Trades turns a contractor’s full customer journey into one connected operating system. This demo follows Persistent Pools, a fictional pool builder.” |
| 0:08–0:20 | Follow the tour to **Clients** and pause on the Hayward record and lead score. | “Lead and CRM data arrives with contact details, qualification signals, scoring, design preparation, and every related project record in one client workspace.” |
| 0:20–0:38 | Open **Builds**, select **New Build**, and change one dimension or option so totals update. | “The custom estimator turns quoting into minutes. Dimensions, materials, equipment, upgrades, costs, profit, and margin recalculate through deterministic business rules.” |
| 0:38–0:52 | Continue to **Proposals** and open the curated Hayward preview. | “The selected client and estimate supply a polished proposal generator, preserving the project scope, visual story, milestones, and investment details.” |
| 0:52–1:10 | Continue to **Contracts** and open the populated signed sample. Scroll through the project summary, payment schedule, acknowledgments, and signature evidence. | “That same data maps into a print-ready Persistent Pools agreement with milestone payments, sixteen acknowledgments, explicit e-signature consent, and tamper-evident audit evidence.” |
| 1:10–1:20 | Return briefly to the dashboard or hold on the contract header and LEVELos attribution. | “It is a production-derived workflow presented with fictional data, disabled external actions, and a repeatable guided tour. Explore the live LEVELos demo from the repository.” |

## Capture notes

- Reset the tour before recording and dismiss browser extensions, notifications, and password-manager prompts.
- Keep the pointer movement deliberate and allow roughly one second after every route transition.
- Demonstrate only one estimator change; the goal is to show feedback, not complete a new estimate on camera.
- Use the curated Hayward proposal and corresponding signed contract so every segment remains deterministic.
- Avoid showing the browser address bar when tokens are present.
- Capture a clean contract frame for the video poster.

## Audio and captions

- Record narration as mono WAV, 48 kHz, 24-bit when possible.
- Leave about half a second of room tone at the beginning and end.
- Deliver the exact final narration text with the audio so captions can be generated and checked manually.
- Caption meaningful interface actions as well as speech when the action is not obvious from narration.

## Final export

After narration is supplied and a local media encoder is approved, export:

- `levelos-trades-walkthrough.mp4`: H.264, 1920×1080, 30 fps, AAC audio.
- `levelos-trades-walkthrough.vtt`: reviewed WebVTT captions.
- `levelos-trades-walkthrough-poster.jpg`: an accessible poster frame from the contract or proposal sequence.

Publish the MP4 and captions as GitHub Release assets, link the poster from this README, and enable **Watch walkthrough** on the landing page only after the hosted assets have been verified.
