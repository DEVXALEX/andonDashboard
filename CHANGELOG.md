# Changelog - Andon Dashboard

## 2026-02-17 — Simplified Update Logic (Bucket-Name Lookup)

### Summary
Removed position-group-based lookups from `updateCardValues`. Both capacity and actual values are now accessed directly by **bucket name**. `groupBucketsByPosition` is only used in `renderDashboard` for layout.

---

### 1. `initializeDashboard` — Added `updateCardValues()` call

**Old line 67** → **New line 68**

```diff
     workCentersData = parsedData;
     renderDashboard();
+    updateCardValues();
 }
```

---

### 2. New function `parseActualData(data)`

**New lines 71–82** (did not exist before)

**Input (from AJAX):**
```javascript
{ WorkCenter: ["PLAN BOARD", ...], BucketName: ["SMALL", ...], Actual: [10, ...] }
```

**Output:**
```javascript
{ "PLAN BOARD": { "SMALL": 10, "MEDIUM": 18, ... }, ... }
```

**Code added:**
```javascript
function parseActualData(data) {
    if (!data || !data.WorkCenter || !data.BucketName || !data.Actual) {
        console.error('Invalid AJAX actual data structure');
        return null;
    }
    const result = {};
    for (let i = 0; i < data.WorkCenter.length; i++) {
        if (!result[data.WorkCenter[i]]) result[data.WorkCenter[i]] = {};
        result[data.WorkCenter[i]][data.BucketName[i]] = data.Actual[i];
    }
    return result;
}
```

---

### 3. `updateCardValues` — Simplified (removed position grouping)

**Old lines 81–115 (35 lines)** → **New lines 95–114 (20 lines)**

**Removed (old lines 81–115):**
```javascript
function updateCardValues() {
    if (!workCentersData || !workCentersData.workCenters) return;

    workCentersData.workCenters.forEach(wc => {
        const positionGroups = groupBucketsByPosition(wc.buckets);
        const colActual = actualData[wc.name];

        for (let row = 0; row < ROW_COUNT; row++) {
            const bucketsAtPosition = positionGroups[row + 1] || [];
            const isMultiCard = bucketsAtPosition.length > 1;

            bucketsAtPosition.forEach((bucket, idx) => {
                const cap = bucket.capacity || 0;
                let actVal;
                if (isMultiCard) {
                    actVal = colActual?.actual?.[row]?.[idx] ?? 0;
                } else {
                    const act = colActual?.actual?.[row];
                    actVal = Array.isArray(act) ? act[0] : (act ?? 0);
                }
                const colors = getStatusColor(actVal, cap);
                const status = cap > 0 ? `${actVal} / ${cap}` : '';
                const $cell = $(`[data-row="${row}"][data-col="${wc.name}"][data-idx="${idx}"] .cell-status`);
                if ($cell.length) {
                    $cell.text(status);
                    $cell.removeClass('status-green status-yellow status-orange status-red status-brown status-lightgray');
                    $cell.addClass(`status-${colors.color}`);
                }
            });
        }
    });
}
```

**Added (new lines 95–114):**
```javascript
function updateCardValues() {
    if (!workCentersData || !workCentersData.workCenters) return;

    workCentersData.workCenters.forEach(wc => {
        const colActual = actualData[wc.name];

        wc.buckets.forEach(bucket => {
            const cap = bucket.capacity || 0;
            const actVal = colActual?.[bucket.name] ?? 0;
            const colors = getStatusColor(actVal, cap);
            const status = cap > 0 ? `${actVal} / ${cap}` : '';
            const $cell = $(`[data-col="${wc.name}"][data-bucket="${bucket.name}"] .cell-status`);
            if ($cell.length) {
                $cell.text(status);
                $cell.removeClass('status-green status-yellow status-orange status-red status-brown status-lightgray');
                $cell.addClass(`status-${colors.color}`);
            }
        });
    });
}
```

---

### 4. `renderDashboard` — Changed cell data attributes

**Old lines 168–171** → **New lines 168–170**

**Removed:**
```javascript
const content = $('<div class="cell-content"></div>')
    .attr('data-row', row)
    .attr('data-col', wc.name)
    .attr('data-idx', idx);
```

**Added:**
```javascript
const content = $('<div class="cell-content"></div>')
    .attr('data-col', wc.name)
    .attr('data-bucket', bucket.name);
```

---

### 5. Sample actual data generation — Simplified

**Old lines 270–284 (15 lines)** → **New lines 268–274 (7 lines)**

**Removed:**
```javascript
const positionGroups = groupBucketsByPosition(wc.buckets);
const actualArr = [];
for (let row = 0; row < ROW_COUNT; row++) {
    const buckets = positionGroups[row + 1] || [];
    if (buckets.length > 1) {
        actualArr.push(buckets.map(b => Math.floor(b.capacity * (0.8 + Math.random() * 0.15))));
    } else if (buckets.length === 1) {
        actualArr.push(Math.floor(buckets[0].capacity * (0.8 + Math.random() * 0.15)));
    } else {
        actualArr.push(0);
    }
}
SAMPLE_ACTUAL[wc.name] = { actual: actualArr };
```

**Added:**
```javascript
SAMPLE_ACTUAL[wc.name] = {};
wc.buckets.forEach(bucket => {
    SAMPLE_ACTUAL[wc.name][bucket.name] = Math.floor(bucket.capacity * (0.8 + Math.random() * 0.15));
});
```

---

### 6. Exports — Added `parseActualData` (new line 285)

**Old line 293** → **New lines 283–291**

```diff
 window.AndonDashboard = {
     parseConfigurationData: parseConfigurationData,
+    parseActualData: parseActualData,
     initializeDashboard: initializeDashboard,
```

---

### AJAX Usage

**Config (once on page load):**
```javascript
callAjax(context, function(outputs) {
    var parsedConfig = parseConfigurationData(outputs);
    if (parsedConfig) {
        initializeDashboard(parsedConfig);
    }
});
```

**Actual values (on interval):**
```javascript
callAjax(context, function(outputs) {
    var parsedActual = parseActualData(outputs);
    if (parsedActual) {
        updateActualValues(parsedActual);
    }
});
```
