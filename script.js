$(document).ready(function () {
    // ============================================
    // CONFIGURATION: Static Labels (Constants)
    // ============================================
    const WORK_CENTER_CONFIG = {
        planBoard: {
            labels: ['SMALL', 'MEDIUM', 'LARGE', 'B28', 'SPARE']
        },
        orderPicking: {
            labels: ['PICK 1 / 2', '', '', '', '']
        },
        welding: {
            isMultiCard: true,
            labels: [
                ['SEFW', 'MANUAL'],
                ['ROBOT', 'NDEFW'],
                ['MANUAL'],
                ['POLNE'],
                ['ROBOT', 'MANUAL']
            ]
        },
        ndt: {
            labels: ['SMALL', '', 'LARGE', '', 'DYE PEN']
        },
        hydro: {
            labels: ['SMALL 0 / 2', 'MEDIUM', 'LARGE', '', '']
        },
        ea1: {
            labels: ['SMALL (1)', 'MEDIUM', 'LARGE', '', 'REP 3 / 6 *']
        },
        calibration: {
            labels: ['SMALL (4)', 'MEDIUM (1)', 'LARGE (2)', '', '']
        },
        finalAssy: {
            isMultiCard: true,
            labels: [
                ['O2'],
                ['FA 7 / 0', 'SPARE 3 / 10'],
                ['IBQ (2)'],
                [],
                []
            ]
        },
        quality: {
            labels: ['Q CERTS', 'QA VERIFY (3)', '', '', '']
        },
        packing: {
            labels: ['PACK 2/2 (2)', '', 'SPARE 0 / 10', 'REP 1 / 6', '']
        }
    };

    // Column order for rendering
    const COLUMN_ORDER = ['planBoard', 'orderPicking', 'welding', 'ndt', 'hydro', 'ea1', 'calibration', 'finalAssy', 'quality', 'packing'];
    const ROW_COUNT = 5; // SMALL, MEDIUM, LARGE, B28, SPARE

    // ============================================
    // DATA STORAGE: Runtime Variables
    // ============================================
    let capacityData = {};
    let actualData = {};
    let colorCallback = defaultColorLogic;

    // WIP Modal variables removed - openModal() will handle all logic

    // ============================================
    // BACKEND DATA FUNCTIONS
    // ============================================

    /**
     * Default color logic based on actual vs capacity ratio
     * @param {number} actual - Actual value
     * @param {number} capacity - Capacity value
     * @returns {Object} { color: string }
     */
    function defaultColorLogic(actual, capacity) {
        if (capacity === 0 || capacity === undefined) return { color: 'lightgray' };

        const ratio = actual / capacity;

        if (ratio > 1) return { color: 'red' };        // Over capacity
        if (ratio >= 0.9) return { color: 'green' };   // Good
        if (ratio >= 0.7) return { color: 'yellow' };  // Warning
        if (ratio >= 0.5) return { color: 'orange' };  // Alert
        return { color: 'lightgray' };                  // Low/No data
    }

    /**
     * Initialize capacity values from backend.
     * Call this ONCE on page load.
     * 
     * @param {Object} data - Work center data object with capacity arrays
     * @example { planBoard: { capacity: [15, 20, 16] }, welding: { capacity: [[4, 0], [1, 8]] } }
     */
    function initializeCapacity(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data object for capacity initialization');
            return;
        }
        capacityData = data;
        renderDashboard();
    }

    /**
     * Update actual values from backend.
     * Call this on INTERVAL for real-time updates.
     * Only updates the card values, does NOT re-render the entire dashboard.
     * 
     * @param {Object} data - Work center data object with actual arrays
     * @param {Function} customColorCallback - Optional: (actual, capacity) => { color }
     * @example { planBoard: { actual: [10, 18, 14] }, welding: { actual: [[3, 0], [1, 6]] } }
     */
    function updateActualValues(data, customColorCallback) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data object for actual values update');
            return;
        }
        actualData = data;

        if (customColorCallback) {
            colorCallback = customColorCallback;
        }

        updateCardValues();

        // Reset refresh counter
        refreshCounter = 0;
        updateRefreshTime();
    }

    /**
     * Update only the card values (status and color) without re-rendering.
     * Called on interval updates for efficiency.
     */
    function updateCardValues() {
        for (let row = 0; row < ROW_COUNT; row++) {
            COLUMN_ORDER.forEach((col, colIdx) => {
                const config = WORK_CENTER_CONFIG[col];
                const colCapacity = capacityData[col];
                const colActual = actualData[col];

                if (config.isMultiCard) {
                    const labels = config.labels[row] || [];
                    labels.forEach((label, idx) => {
                        const cap = colCapacity?.capacity?.[row]?.[idx] ?? 0;
                        const act = colActual?.actual?.[row]?.[idx] ?? 0;
                        const colors = colorCallback(act, cap);
                        const status = cap > 0 ? `${act} / ${cap}` : '';

                        // Find and update the status element
                        const $cell = $(`[data-row="${row}"][data-col="${col}"][data-idx="${idx}"] .cell-status`);
                        if ($cell.length) {
                            $cell.text(status);
                            // Remove all status classes and add new one
                            $cell.removeClass('status-green status-yellow status-orange status-red status-brown status-lightgray');
                            $cell.addClass(`status-${colors.color}`);
                        }
                    });
                } else {
                    const label = config.labels[row] || '';
                    if (label) {
                        const cap = colCapacity?.capacity?.[row] ?? 0;
                        const act = colActual?.actual?.[row] ?? 0;
                        const colors = colorCallback(act, cap);
                        const status = cap > 0 ? `${act} / ${cap}` : '';

                        // Find and update the status element
                        const $cell = $(`[data-row="${row}"][data-col="${col}"] .cell-status`);
                        if ($cell.length) {
                            $cell.text(status);
                            $cell.removeClass('status-green status-yellow status-orange status-red status-brown status-lightgray');
                            $cell.addClass(`status-${colors.color}`);
                        }
                    }
                }
            });
        }
    }


    /**
     * Calculate current period based on fiscal year starting in October.
     * October = P1, November = P2, ..., September = P12
     * @returns {number} Period number (1-12)
     */
    function calculateCurrentPeriod() {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0 = January, 9 = October

        // October (9) = P1, November (10) = P2, December (11) = P3
        // January (0) = P4, February (1) = P5, ..., September (8) = P12
        if (currentMonth >= 9) {
            // October, November, December
            return currentMonth - 9 + 1; // Oct=1, Nov=2, Dec=3
        } else {
            // January through September
            return currentMonth + 4; // Jan=4, Feb=5, ..., Sep=12
        }
    }

    /**
     * Update header metrics from backend.
     * Uses field mapping for cleaner code.
     * 
     * IMPORTANT: The NC and OBQ counts should be FILTERED BY PERIOD on the backend
     * before being sent to this function. The period is calculated based on fiscal
     * year starting in October (P1) through September (P12).
     * 
     * Example period mapping:
     * - October = P1, November = P2, December = P3
     * - January = P4, February = P5, ..., September = P12
     * 
     * @param {Object} data - Header metrics object
     * @example { recordableDays: 1268, ncCount: 10, obqCount: 0, targetCount: 32 }
     *          where ncCount and obqCount are for the CURRENT PERIOD only
     */
    function updateHeader(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data for header update');
            return;
        }

        // Calculate and display current period
        const currentPeriod = calculateCurrentPeriod();
        $('#p5-count').text(`P${currentPeriod}`);

        const fieldMap = {
            recordableDays: '#recordable-days',
            ncCount: '#nc-count',
            obqCount: '#obq-count',
            targetCount: '#target-count',
            pastDueCount: '#pastdue-count',
            builtCount: '#built-count'
        };

        Object.entries(fieldMap).forEach(([key, selector]) => {
            if (data[key] !== undefined) {
                $(selector).text(data[key]);
            }
        });
    }
    // updateModalData removed - openModal() will handle all modal logic

    // ============================================
    // RENDERING FUNCTIONS
    // ============================================

    /**
     * Render the complete dashboard structure.
     * Called ONCE on page load with config + capacity data.
     * Adds data attributes to cells for targeted value updates.
     */
    function renderDashboard() {
        const tbody = $('#dashboard-body');
        tbody.empty();

        for (let row = 0; row < ROW_COUNT; row++) {
            const tr = $('<tr></tr>');

            COLUMN_ORDER.forEach((col, colIdx) => {
                const config = WORK_CENTER_CONFIG[col];
                const colCapacity = capacityData[col];
                const colActual = actualData[col];
                const td = $('<td></td>');

                if (config.isMultiCard) {
                    const labels = config.labels[row] || [];
                    if (labels.length === 0) {
                        td.addClass('empty-cell');
                    } else {
                        labels.forEach((label, idx) => {
                            const cap = colCapacity?.capacity?.[row]?.[idx] ?? 0;
                            const act = colActual?.actual?.[row]?.[idx] ?? 0;
                            const colors = colorCallback(act, cap);
                            const status = cap > 0 ? `${act} / ${cap}` : '';

                            // Add data attributes for targeted updates
                            const content = $('<div class="cell-content"></div>')
                                .attr('data-row', row)
                                .attr('data-col', col)
                                .attr('data-idx', idx);
                            content.append(`<div class="cell-label">${label}</div>`);
                            if (status) {
                                content.append(`<div class="cell-status status-${colors.color}">${status}</div>`);
                            } else if (colors.color) {
                                content.append(`<div class="cell-status status-${colors.color}"></div>`);
                            }
                            td.append(content);
                        });
                    }
                } else {
                    const label = config.labels[row] || '';
                    if (!label) {
                        td.addClass('empty-cell');
                    } else {
                        const cap = colCapacity?.capacity?.[row] ?? 0;
                        const act = colActual?.actual?.[row] ?? 0;
                        const colors = colorCallback(act, cap);
                        const status = cap > 0 ? `${act} / ${cap}` : '';

                        // Add data attributes for targeted updates
                        const content = $('<div class="cell-content"></div>')
                            .attr('data-row', row)
                            .attr('data-col', col);
                        content.append(`<div class="cell-label">${label}</div>`);
                        if (status) {
                            content.append(`<div class="cell-status status-${colors.color}">${status}</div>`);
                        } else if (colors.color) {
                            content.append(`<div class="cell-status status-${colors.color}"></div>`);
                        }
                        td.append(content);
                    }
                }

                tr.append(td);
            });

            tbody.append(tr);
        }
    }

    // ============================================
    // TIME & REFRESH FUNCTIONS
    // ============================================

    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        $('#nl-time').text(`${hours}:${minutes}`);
    }

    let refreshCounter = 0;
    function updateRefreshTime() {
        $('#refresh-time').text(`${refreshCounter} MIN AGO`);
    }

    // ============================================
    // MODAL FUNCTIONS
    // ============================================

    /**
     * Opens modal for given type with detailed context.
     * 
     * @param {string} dataFlag - Required. Indicates the source of the click:
     *                            - "CELL" for table cell clicks
     *                            - "NC", "OBQ", "TARGET", "PASTDUE", "BUILT" for header clicks
     *                            - "NCHOLD", "OSP", "CI" for footer button clicks
     * @param {string} column - Optional. Only for CELL clicks. The column name (e.g., "welding", "planBoard")
     * @param {string} label - Optional. Only for CELL clicks. The label name of the clicked item (e.g., "SEFW", "SMALL")
     * 
     * @example
     * // Header click
     * callpopupAction("NC");
     * 
     * // Footer click
     * callpopupAction("NCHOLD");
     * 
     * // Cell click
     * callpopupAction("CELL", "welding", "SEFW");
     */
    function callpopupAction(dataFlag, column, label) {
        // TODO: Write modal logic
        console.log('callpopupAction called with:', { dataFlag, column, label });

        // Testing alert
        let message = `dataFlag: ${dataFlag}`;
        if (column) message += `\ncolumn: ${column}`;
        if (label) message += `\nlabel: ${label}`;
        alert(message);
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    // Footer button and header section handlers (consolidated using data attribute)
    $(document).on('click', '[data-modal-type]', function () {
        const dataFlag = $(this).data('modal-type');
        callpopupAction(dataFlag);
    });

    // Dashboard card click handlers - pass CELL with column and label
    $(document).on('click', '.cell-status', function () {
        const $content = $(this).closest('.cell-content');
        const column = $content.data('col');
        const label = $content.find('.cell-label').text().trim();
        callpopupAction('CELL', column, label);
    });

    // ============================================
    // INITIALIZATION
    // ============================================

    // Initialize time display
    updateTime();
    updateRefreshTime();

    // Set default header values using data attributes (will be replaced by backend data)
    $('[data-default]').each(function () {
        $(this).text($(this).data('default'));
    });

    // ============================================
    // SAMPLE DATA - REMOVE THIS SECTION LATER
    // ============================================
    const SAMPLE_CAPACITY = {
        planBoard: { capacity: [15, 20, 16, 15, 20] },
        orderPicking: { capacity: [10, 0, 0, 0, 0] },
        welding: { capacity: [[4, 8], [6, 8], [5], [3], [4, 6]] },
        ndt: { capacity: [12, 0, 10, 0, 8] },
        hydro: { capacity: [8, 10, 12, 0, 0] },
        ea1: { capacity: [15, 12, 10, 0, 6] },
        calibration: { capacity: [10, 8, 6, 0, 0] },
        finalAssy: { capacity: [[5], [7, 10], [4], [], []] },
        quality: { capacity: [8, 6, 0, 0, 0] },
        packing: { capacity: [10, 0, 8, 6, 0] }
    };

    const SAMPLE_ACTUAL = {
        planBoard: { actual: [12, 18, 14, 16, 15] },
        orderPicking: { actual: [8, 0, 0, 0, 0] },
        welding: { actual: [[3, 7], [5, 9], [4], [3], [2, 4]] },
        ndt: { actual: [10, 0, 11, 0, 5] },
        hydro: { actual: [7, 9, 13, 0, 0] },
        ea1: { actual: [14, 10, 8, 0, 4] },
        calibration: { actual: [9, 7, 5, 0, 0] },
        finalAssy: { actual: [[4], [6, 8], [3], [], []] },
        quality: { actual: [7, 5, 0, 0, 0] },
        packing: { actual: [9, 0, 6, 5, 0] }
    };

    const SAMPLE_HEADER = {
        recordableDays: 1268,
        ncCount: 8,
        obqCount: 2,
        targetCount: 23,
        pastDueCount: 10,
        builtCount: 42
    };

    // Initialize with sample data
    initializeCapacity(SAMPLE_CAPACITY);
    updateActualValues(SAMPLE_ACTUAL);
    updateHeader(SAMPLE_HEADER);
    // ============================================
    // END SAMPLE DATA
    // ============================================

    // Start time intervals
    setInterval(updateTime, 60000);
    setInterval(() => {
        refreshCounter++;
        updateRefreshTime();
    }, 60000);

    // ============================================
    // EXPOSE FUNCTIONS FOR AJAX CALLS
    // ============================================
    window.AndonDashboard = {
        initializeCapacity: initializeCapacity,
        updateActualValues: updateActualValues,
        updateHeader: updateHeader,
        callpopupAction: callpopupAction,
        defaultColorLogic: defaultColorLogic
    };
});

