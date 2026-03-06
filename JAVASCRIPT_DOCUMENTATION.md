# Andon Dashboard - JavaScript Documentation

## Overview
This document explains the JavaScript functionality powering the Emerson Andon Dashboard. The application uses **jQuery** for DOM manipulation and is designed for **backend data integration** via AJAX calls.

---

## Table of Contents
1. [API Functions](#api-functions)
2. [Configuration](#configuration)
3. [Data Structures](#data-structures)
4. [Internal Functions](#internal-functions)
5. [Event Handlers](#event-handlers)
6. [Color Codes](#color-codes)

---

## API Functions

The following functions are exposed via `window.AndonDashboard` for your AJAX calls.  
**All functions accept direct JavaScript objects** (not wrapped in `response.outputs`).

### `initializeCapacity(data)`
**Purpose**: Initialize capacity values from backend. Call **ONCE** on page load.

**Parameter**: Direct JS object with capacity arrays per work center.
```javascript
{
    planBoard: { capacity: [15, 20, 16, 15, 20] },
    welding: { capacity: [[4, 0], [1, 8], [1], [2], [2, 0]] },
    // ... other work centers
}
```

**Usage**:
```javascript
$.ajax({
    url: '/api/capacity',
    success: function(data) {
        window.AndonDashboard.initializeCapacity(data);
    }
});
```

---

### `updateActualValues(data, colorCallback)`
**Purpose**: Update actual values. Call on **INTERVAL** for real-time updates.  
**Note**: Only updates cell values (status text & color), does NOT re-render entire DOM.

**Parameters**:
- `data`: Direct JS object with actual arrays (same structure as capacity)
- `colorCallback`: Optional `(actual, capacity) => { color }` function

```javascript
{
    planBoard: { actual: [10, 18, 14, 12, 15] },
    welding: { actual: [[3, 0], [1, 6], [1], [2], [1, 0]] },
    // ... other work centers
}
```

**Usage**:
```javascript
setInterval(function() {
    $.ajax({
        url: '/api/actual',
        success: function(data) {
            // With default color logic
            window.AndonDashboard.updateActualValues(data);
            
            // With custom color logic
            window.AndonDashboard.updateActualValues(data, function(actual, capacity) {
                if (actual >= capacity) return { color: 'green' };
                if (actual < capacity * 0.5) return { color: 'red' };
                return { color: 'yellow' };
            });
        }
    });
}, 60000);
```

---

### `updateHeader(data)`
**Purpose**: Update header metrics from backend.

**Parameter**: Direct JS object with metric values.
```javascript
{
    recordableDays: 1268,
    ncCount: 10,
    obqCount: 0,
    targetCount: 32,
    pastDueCount: 10,
    builtCount: 18
}
```

**Usage**:
```javascript
$.ajax({
    url: '/api/header',
    success: function(data) {
        window.AndonDashboard.updateHeader(data);
    }
});
```

---

### `updateModalData(data, colorCallback)`
**Purpose**: Update NC/OSP/CI modal data from backend.

**Parameter**: Direct JS object with type, orders, and optional details.
```javascript
{
    type: 'nc',  // or 'osp', 'ci'
    orders: [
        { wipjob: '45605410', cart_nr: '', compl_date: '17-12-2025', location: 'S_ElecAssy_Small', status: 'Reject' }
    ],
    details: {  // Optional
        '45605410': { item: '...', salesOrder: '...', ... }
    }
}
```

**Usage**:
```javascript
$.ajax({
    url: '/api/wip/nc',
    success: function(data) {
        window.AndonDashboard.updateModalData(data);
    }
});
```

---

## Configuration

### `WORK_CENTER_CONFIG`
Static labels for each work center. These are **constants** and never fetched from backend.

```javascript
const WORK_CENTER_CONFIG = {
    planBoard: { labels: ['SMALL', 'MEDIUM', 'LARGE', 'B28', 'SPARE'] },
    welding: { 
        isMultiCard: true,
        labels: [['SEFW', 'MANUAL'], ['ROBOT', 'NDEFW'], ...] 
    },
    // ... other work centers
};
```

### `COLUMN_ORDER`
Order of columns in the dashboard table:
```javascript
['planBoard', 'orderPicking', 'welding', 'ndt', 'hydro', 'ea1', 'calibration', 'finalAssy', 'quality', 'packing']
```

---

## Data Structures !!

### Runtime Variables
| Variable | Type | Description |
|----------|------|-------------|
| `capacityData` | Object | Capacity values from backend |
| `actualData` | Object | Actual values from backend |
| `colorCallback` | Function | Current color logic function |
| `wipData` | Object | NC/OSP/CI order lists |
| `wipDetails` | Object | WIP order details keyed by wipjob |

---

## Internal Functions

| Function | Description |
|----------|-------------|
| `defaultColorLogic(actual, capacity)` | Returns color based on ratio (>1: red, ≥0.9: green, ≥0.7: yellow, ≥0.5: orange, else: lightgray) |
| `renderDashboard()` | Renders complete table from config + data. Called once on page load. |
| `updateCardValues()` | Efficiently updates only status text/color using data attributes. |
| `createWIPRow(row)` | Creates WIP table row element. Reused by table & search. |
| `populateWIPTable(type)` | Populates modal table with orders. |
| `resetDetailsPanel()` | Resets WIP details panel to initial state. |
| `displayWIPDetails(wipjob)` | Updates WIP details using data-field attributes. |

---

## Event Handlers

| Element | Event | Action |
|---------|-------|--------|
| `[data-modal-type]` | click | Opens modal for that type |
| `.modal-close, #wip-modal` | click | Closes modal |
| `#wip-table-body tr` | click | Shows WIP details |
| `#search-btn` | click | Filters WIP table |
| `.cell-status` | click | Opens relevant modal |
| `.header-section` | click | Opens NC modal |

---

## HTML Data Attributes

| Attribute | Purpose |
|-----------|---------|
| `data-row`, `data-col`, `data-idx` | Cell targeting for updates |
| `data-field` | WIP detail field binding |
| `data-modal-type` | Button modal type |
| `data-default` | Initial placeholder value |

---

## Quick Start Example

```javascript
$(document).ready(function() {
    // 1. Initialize capacity (once)
    $.get('/api/capacity', window.AndonDashboard.initializeCapacity);
    
    // 2. Load header metrics
    $.get('/api/header', window.AndonDashboard.updateHeader);
    
    // 3. Load modal data
    $.get('/api/wip/nc', window.AndonDashboard.updateModalData);
    $.get('/api/wip/osp', window.AndonDashboard.updateModalData);
    $.get('/api/wip/ci', window.AndonDashboard.updateModalData);
    
    // 4. Start interval updates
    setInterval(function() {
        $.get('/api/actual', window.AndonDashboard.updateActualValues);
        $.get('/api/header', window.AndonDashboard.updateHeader);
    }, 60000);
});
```

---

**Last Updated**: 2026-02-07  
**Version**: 3.1  
**Author**: Antigravity AI Assistant
