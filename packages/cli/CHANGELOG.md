# @seanyeh77/ui-cli

## 0.9.0

### Patch Changes

- Updated dependencies [7cdfbd9]
- Updated dependencies [0d5a351]
  - @seanyeh77/ui@0.9.0

## 0.8.1

### Patch Changes

- Updated dependencies [339b776]
- Updated dependencies [09d1537]
  - @seanyeh77/ui@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [68b7c0f]
  - @seanyeh77/ui@0.8.0

## 0.7.1

### Patch Changes

- Updated dependencies [6119d5e]
  - @seanyeh77/ui@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [e991df7]
- Updated dependencies [4f5890f]
  - @seanyeh77/ui@0.7.0

## 0.6.1

### Patch Changes

- Updated dependencies [2e8d631]
  - @seanyeh77/ui@0.6.1

## 0.6.0

### Patch Changes

- 76f204a: LayerGraph: on touch screens the shared-item boxes no longer cover the whole page. Their enlarged touch area (::after) measured against the window because the box was `position: static`; it is `relative` now. Tooltip: closes when its trigger loses focus, only one is open at a time, and a closing Tooltip leaves at once instead of waiting for its entrance animation, so tabbing through cut-off DataTable cells no longer leaves Tooltips stacked. ui check: reports touch areas larger than their own control (they cover other controls) and no longer counts them as big enough targets.
- Updated dependencies [8f9e284]
- Updated dependencies [4e7a669]
- Updated dependencies [f920576]
- Updated dependencies [76f204a]
  - @seanyeh77/ui@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [87d835f]
- Updated dependencies [e17cbf2]
  - @seanyeh77/ui@0.5.0

## 0.4.1

### Patch Changes

- Updated dependencies [74d39d3]
- Updated dependencies [b036f55]
  - @seanyeh77/ui@0.4.1

## 0.4.0

### Patch Changes

- 9dc8165: LayerGraph: selectable edges. `LayerGraphEdge.id` (default `${from}->${to}`), controlled `selectedEdge` and `onSelectEdge`. A click on a line or its label selects it; again, or on the empty diagram, clears it. Tab, Enter or Space and Escape work on lines. Selecting a line clears the selected box and the other way round. Without `onSelectEdge` nothing changes.
  
  ui check lists LayerGraph's selectable lines as exempt touch targets: the label is the touch target.
- Updated dependencies [9dc8165]
- Updated dependencies [5c08281]
  - @seanyeh77/ui@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [9e7a950]
  - @seanyeh77/ui@0.3.0
