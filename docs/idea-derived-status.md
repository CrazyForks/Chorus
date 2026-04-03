# Idea Derived Status State Machine

The Idea Tracker displays ideas with a **derived presentation** computed from multiple entity states across the Idea → Proposal → Task lifecycle. This document defines the mapping from internal state to user-facing display.

## Source Fields (Internal)

| Field | Table | Values |
|---|---|---|
| Idea Status | `Idea.status` | `open`, `elaborating`, `proposal_created`, `completed`, `closed` |
| Elaboration Status | `Idea.elaborationStatus` | `null`, `validating`, `pending_answers`, `resolved` |
| Proposal Status | `Proposal.status` | `draft`, `pending`, `approved`, `rejected`, `closed` |
| Task Status | `Task.status` | `open`, `in_progress`, `to_verify`, `done`, `closed` |

## Full Mapping Table

Left side = internal state machine (5 source fields). Right side = user-facing display (5 presentation dimensions).

| # | Internal Stage | Idea Status | Elab Status | Proposal | Task | Icon | User Label | Phase Progress | Action Type | Human Action? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | New | `open` | — | — | — | ○ gray | Open | — | — | — |
| 2 | AI elaborating | `elaborating` | `null`/`validating`/`resolved` | — | — | ◐ purple spin | Researching | **Research** → Plan → Build | — | — |
| 3 | Pending answers | `elaborating` | `pending_answers` | — | — | ● orange | Answer questions | **Research** → Plan → Build | Answer questions | YES |
| 4 | Drafting proposal | `proposal_created` | — | `draft`/`rejected` | — | ◐ purple spin | Planning | Research → **Plan** → Build | — | — |
| 5 | Pending approval | `proposal_created` | — | `pending` | — | ● orange | Review proposal | Research → **Plan** → Build | Review proposal | YES |
| 6 | In development | `proposal_created` | — | `approved` | `open`/`in_progress` | ◐ purple spin | Building | Research → Plan → **Build** | — | — |
| 7 | Pending verification | `proposal_created` | — | `approved` | any `to_verify` | ● orange | Verify work | Research → Plan → **Build** | Verify deliverables | YES |
| 8 | All tasks done | `proposal_created` | — | `approved` | all `done`/`closed` | ✓ green | Done | — | — | — |
| 9 | Approved, no tasks | `proposal_created` | — | `approved` | (empty) | ✓ green | Done | — | — | — |
| 10 | Completed | `completed` | — | — | — | ✓ green | Done | — | — | — |
| 11 | Closed | `closed` | — | — | — | ✗ gray | Closed | — | — | — |

## Display Dimensions

### Icons (4 variants)

| Icon | Color | Meaning |
|---|---|---|
| ○ | gray | Not started |
| ◐ spin | purple | AI is working |
| ● | orange | Waiting for human |
| ✓ | green | Complete |
| ✗ | gray | Closed |

### User Labels (9 unique, #8/#9/#10 merge into "Done")

`Open` → `Researching` → `Answer questions` → `Planning` → `Review proposal` → `Building` → `Verify work` → `Done` / `Closed`

### Phase Progress Bar (3-segment: Research → Plan → Build)

Shown only during active stages (#2–#7). The currently active phase is **bolded**. Not shown for Open, Done, or Closed.

| Phase | Active During Rows |
|---|---|
| **Research** | 2, 3 |
| **Plan** | 4, 5 |
| **Build** | 6, 7 |

### Action Types (3 human actions)

| Action | Row | Trigger |
|---|---|---|
| Answer questions | 3 | Elaboration Q&A — agent needs information |
| Review proposal | 5 | Proposal ready for approval/rejection |
| Verify deliverables | 7 | Task work submitted for verification |

## Design Notes

11 internal states map to 9 user labels. The presentation uses 3 parallel information channels beyond the label:
- **Icon color** (4 variants) — instant visual status
- **Phase progress bar** (3 segments) — where in the lifecycle
- **Action type** (3 variants) — what the human should do next

## Implementation

- **Service**: `computeDerivedStatus()` in `src/services/idea.service.ts`
- **Tests**: `src/services/__tests__/idea.service.derived-status.test.ts`
- **API**: `GET /api/projects/[uuid]/ideas/tracker` returns derived fields per idea
- **UI**: `src/app/(dashboard)/projects/[uuid]/dashboard/idea-card.tsx` renders the card
