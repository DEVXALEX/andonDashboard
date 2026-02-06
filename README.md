# Andon Board Production Dashboard

A complete replication of the Andon board production tracking dashboard using plain HTML, CSS, and jQuery.

## Features

✅ **Production Status Tracking**: Visual dashboard showing status across all production stages
✅ **Color-Coded Status Indicators**: Green (on-track), Red (issues), Yellow (warnings), etc.
✅ **Real-Time Updates**: Dynamic time display and refresh tracking
✅ **Responsive Grid Layout**: Professional industrial dashboard design
✅ **Interactive Elements**: Clickable buttons and status cells

## Files Included

- `index.html` - Main dashboard structure
- `styles.css` - Complete styling with color schemes and layout
- `script.js` - jQuery-powered dynamic updates and interactivity

## How to Use

1. **Open the Dashboard**: Simply double-click `index.html` or open it in any modern web browser
2. **View Status**: The dashboard displays production status across 10 stages:
   - Plan Board
   - Order Picking
   - Welding
   - NDT (Non-Destructive Testing)  
   - Hydro (Hydrostatic Testing)
   - EA1
   - Calibration
   - Final Assembly
   - Quality
   - Packing

3. **Status Colors**:
   - 🟢 **Green**: On track / Available capacity
   - 🔴 **Red**: Over capacity / Issues
   - 🟡 **Yellow**: Warning / Attention needed
   - 🟤 **Brown**: Special status
   - ⚪ **Gray**: Empty / Inactive

## Customization

### Update Dashboard Data

Edit `script.js` and modify the `dashboardData` array to change status information:

```javascript
const dashboardData = [
    {
        planBoard: { label: 'SMALL', status: '0 / 14', color: 'green' },
        // ... add your data
    }
];
```

### Modify Header Metrics

Update the header values in `script.js` or directly in `index.html`:

```javascript
$('#nc-count').text('8');
$('#target-count').text('23');
```

### Change Colors

Modify color classes in `styles.css`:

```css
.status-green {
    background-color: #4a8b4a;
}
```

## Technical Details

- **No External Dependencies**: Uses jQuery from CDN only
- **Browser Compatibility**: Works in all modern browsers (Chrome, Firefox, Edge, Safari)
- **Responsive Design**: Adapts to different screen sizes
- **Auto-Refresh**: Time updates automatically every minute

## Dashboard Sections

### Header
- Days without recordables counter
- Key metrics (P5, NC, OBQ, Target, Past Due, Built)

### Main Grid
- 10 production stage columns
- Multiple rows for different product sizes (Small, Medium, Large, etc.)
- Color-coded status cells with counts

### Footer
- Legend explaining status colors
- Current time display (NL-EDE timezone)
- Last refresh indicator
- Quick action buttons

## Notes

- The dashboard currently uses static demo data
- To connect to live data, modify the `script.js` file to fetch from your API
- Time display updates automatically
- Refresh counter increments every minute

---

**Created**: February 2026  
**Version**: 1.0  
**Technology**: HTML5, CSS3, jQuery 3.6.0
