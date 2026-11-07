---
'@seanyeh77/ui': minor
'@seanyeh77/ui-cli': patch
---

LayerGraph: selectable edges. `LayerGraphEdge.id` (default `${from}->${to}`), controlled `selectedEdge` and `onSelectEdge`. A click on a line or its label selects it; again, or on the empty diagram, clears it. Tab, Enter or Space and Escape work on lines. Selecting a line clears the selected box and the other way round. Without `onSelectEdge` nothing changes.

ui check lists LayerGraph's selectable lines as exempt touch targets: the label is the touch target.
