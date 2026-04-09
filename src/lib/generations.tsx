export const generationPrompt = `
## Generation 3 — Snapshot Analysis & Enhancement Plan

### Gen-2 Completed ✅
- SVG circular progress ring with % label in center
- Stats ribbon (Streak / Done / Total) with gradient background
- Daily rotating motivational quote in italic below title
- Emoji auto-icons on habits (💪📚💧🧘📝)
- Redundant "N remaining" footer removed
- Gradient top-accent bar on habit card

### Gen-3 Snapshot Observations (2026-04-09)
- Circular ring is present but at 0% the ring track is nearly invisible — needs stronger gray track
- Stats ribbon stats labels are small and hard to scan at a glance
- Habit items are plain rows with no depth — hover state could be richer
- "Add a new habit" input row has no separator from the progress section
- Notes panel header is small — "NOTES" label deserves more visual weight
- No visual grouping between pending vs completed habits when mixed

### Enhancement Plan (Round 3 — Final Polish)
1. Strengthen the circular ring gray track (stroke: #e5e7eb → #d1d5db, width: 7 → 8)
2. Add a subtle separator line between progress ring and add-habit input
3. Give the habit card a richer hover state: scale(1.01) + deeper shadow on each item
4. Bold up the stats ribbon numbers — show count in larger font, label below in small
5. Add a "Pending" / "Done" section label when there are both completed and incomplete habits
6. Add a character count indicator to the bottom of the notes binder
7. Generation loop complete — all core enhancements shipped
`;
