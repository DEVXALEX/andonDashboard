# Andon Dashboard — script.js Documentation

## Global Variables

| Variable | Type | Purpose |
|---|---|---|
| `workCentersData` | Object/null | Stores parsed `{ workCenters: [...] }` config |
| `ROW_COUNT` | const 5 | Fixed rows per work center |
| `actualData` | Object | Actual values from backend per work center |
| `refreshCounter` | number | Minutes since last data refresh |

---

## Functions

### parseConfigurationData(data)
Converts AJAX flat arrays into `{ workCenters }` structure.

**Input** — AJAX response with 4 parallel arrays:
```
{ WorkCenter: [...], BucketName: [...], Capacity: [...], Position: [...] }
```

**Output:**
```json
{
  "workCenters": [
    {
      "name": "WELDING",
      "buckets": [
        { "name": "SEFW", "position": 1, "capacity": 4 },
        { "name": "SMALL MANUAL", "position": 1, "capacity": 4 }
      ]
    }
  ]
}
```

**Steps:**
1. Loop through arrays, group buckets by work center name
2. Filter and order by `standardOrder` array for consistent column display
3. Sort each work center's buckets by position (ascending)

---

### groupBucketsByPosition(buckets)
Helper that groups a bucket array by `position` property.

**Input:** `[{ name, position, capacity }, ...]`
**Output:** `{ 1: [bucket, bucket], 2: [bucket], ... }`

Used by `renderDashboard` and `updateCardValues` to detect multi-card cells (multiple buckets at same position).

---

### getStatusColor(actual, capacity)
Returns `{ color: string }` based on actual/capacity ratio.

| Ratio | Color |
|---|---|
| capacity = 0 | lightgray |
| > 100% | red |
| ≥ 90% | green |
| ≥ 70% | yellow |
| ≥ 50% | orange |
| < 50% | lightgray |

---

### initializeDashboard(parsedData)
Stores parsed config in `workCentersData` and calls `renderDashboard()`.

**Call once** on page load after parsing AJAX data.

---

### updateActualValues(data)
Stores actual values in `actualData`, calls `updateCardValues()`, resets refresh counter.

**Call on interval** for real-time updates.

**Input format:**
```json
{
  "WELDING": { "actual": [[3, 2], [1, 6], [4, 1], [2]] },
  "NDT": { "actual": [1, 0, 3] }
}
```

Multi-card positions use arrays `[val1, val2]`, single-card positions use plain numbers.

---

### updateCardValues()
Updates DOM card elements with actual values and colors **without re-rendering**.

For each work center → for each row → for each bucket at that position:
1. Calculate actual value from `actualData`
2. Get color from `getStatusColor`
3. Find DOM element via `[data-row][data-col][data-idx] .cell-status`
4. Update text and CSS class

---

### calculateCurrentPeriod()
Returns fiscal period P1–P12 (October = P1 through September = P12).

---

### updateHeader(data)
Updates header metric elements using field mapping.

**Input:** `{ recordableDays, ncCount, obqCount, targetCount, pastDueCount, builtCount }`

**Note:** NC and OBQ counts should be **filtered by period** on the backend before sending.

---

### renderDashboard()
Builds the table DOM structure using a **column-first approach**.

**Algorithm:**
1. Iterate work centers (columns) sequentially
2. For each column, iterate rows 0–4:
   - **First column (colIdx=0):** Create `<tr>`, append to `<tbody>`
   - **Other columns:** Find existing `<tr>` by row index
3. Create `<td>` for each cell
4. Group buckets by position → if multiple buckets share a position, append multiple `.cell-content` divs to same `<td>` (multi-card)
5. Each card gets `data-row`, `data-col`, `data-idx` attributes for targeted updates
6. Status divs are created empty — `updateCardValues()` fills them after actual data is available

---

### updateTime()
Sets clock display to `HH:MM` format.

### updateRefreshTime()
Sets refresh indicator to `X MIN AGO`.

### openPopup(dataFlag, column, label)
Opens popup/modal. Currently a placeholder with `alert()`.

**Parameters:**
- `dataFlag` — Source: `"CELL"`, `"NC"`, `"OBQ"`, `"TARGET"`, `"PASTDUE"`, `"BUILT"`, `"NCHOLD"`, `"OSP"`, `"CI"`
- `column` — Work center name (only for CELL clicks)
- `label` — Bucket label (only for CELL clicks)

---

## Execution Order

```
Page Load (document.ready)
├── updateTime()
├── updateRefreshTime()
├── Set default header values from data-default attributes
├── parseConfigurationData(AJAX_DATA)
├── initializeDashboard(parsedConfig)
│   └── renderDashboard()  ← builds DOM structure only
├── updateActualValues(actualData)
│   └── updateCardValues()  ← fills in values and colors
├── updateHeader(headerData)
│   └── calculateCurrentPeriod()
└── Start intervals (60s each)
    ├── updateTime()
    └── refreshCounter++ → updateRefreshTime()

User Clicks
├── [data-modal-type] → openPopup(dataFlag)
└── .cell-status → openPopup("CELL", column, label)
```

---

## Exposed API

All functions available via `window.AndonDashboard`:

```js
window.AndonDashboard.parseConfigurationData(ajaxData)
window.AndonDashboard.initializeDashboard(parsedData)
window.AndonDashboard.updateActualValues(data)
window.AndonDashboard.updateHeader(data)
window.AndonDashboard.openPopup(dataFlag, column, label)
window.AndonDashboard.getStatusColor(actual, capacity)
```
