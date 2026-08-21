---
name: skill-forge-protocol
description: Use when a session ends in a verified success (tests pass, benchmark green, target metric hit) to distill the trajectory into a reusable candidate skill and keep skill telemetry honest.
---

# Skill Forge Protocol

The harness improves itself by converting verified successful trajectories into reusable skills.

## Protocol

1. **Verify the win**: only distill when an external success signal exists — passing tests, a green benchmark, or a target metric (e.g. an r^2 threshold) confirmed by a tool result.
2. **Distill**: call `forge_distill` with a kebab-case name, a "Use when..." description, and the session trajectory JSONL.
3. **Review and commit the candidate**: read the generated SKILL.md, edit the protocol section so steps generalize beyond the original task, then write it into the workspace with `forge_commit` — the write goes through the host fs policy gate, so sandbox and permission rules apply automatically.
4. **Track outcomes**: every time the skill is invoked, call `forge_record_outcome` with success/failure and estimated turns saved.
5. **Promote or deprecate**: check `forge_leaderboard` regularly; promote skills with sustained high success rates into shipped presets, and deprecate skills that underperform so agents stop recommending them.
6. **Close the loop with rewind**: use `rewind_fork` and `rewind_diff` to check whether a skill still wins on counterfactual branches before promoting it.
