$(document).ready(function () {
    // ============================================
    // CONFIGURATION: Dynamic Configuration Variables
    // ============================================
    let WORK_CENTER_CONFIG = {};
    let COLUMN_ORDER = [];
    const ROW_COUNT = 5; // Standard row count

    /**
     * Parse AJAX configuration data and build work center configuration.
     * Automatically detects multi-card cells when multiple buckets share the same Position.
     * 
     * @param {Object} data - AJAX response with WorkCenter, BucketName, Capacity, Position arrays
     * @returns {Object} { config: WORK_CENTER_CONFIG, columnOrder: COLUMN_ORDER, capacityData: {} }
     * 
     * @example
     * const ajaxData = {
     *     WorkCenter: ["WELDING", "WELDING", "WELDING"],
     *     BucketName: ["SEFW", "MANUAL", "ROBOT"],
     *     Capacity: [4, 8, 6],
     *     Position: [1, 1, 2]  // SEFW and MANUAL share position 1 -> multicard
     * };
     * const result = parseConfigurationData(ajaxData);
     */
    function parseConfigurationData(data) {
        if (!data || !data.WorkCenter || !data.BucketName || !data.Capacity || !data.Position) {
            console.error('Invalid AJAX data structure');
            return null;
        }

        const config = {};
        const capacityData = {};
        const columnOrderSet = new Set();

        // Group data by WorkCenter and Position
        const grouped = {};

        for (let i = 0; i < data.WorkCenter.length; i++) {
            const workCenter = data.WorkCenter[i];
            const bucketName = data.BucketName[i];
            const capacity = data.Capacity[i];
            const position = data.Position[i]; // 1-based position

            columnOrderSet.add(workCenter);

            if (!grouped[workCenter]) {
                grouped[workCenter] = {};
            }
            if (!grouped[workCenter][position]) {
                grouped[workCenter][position] = [];
            }

            grouped[workCenter][position].push({
                label: bucketName,
                capacity: capacity
            });
        }

        // Build configuration and capacity data for each work center
        Object.keys(grouped).forEach(workCenter => {
            const positions = grouped[workCenter];
            const hasMultiCard = Object.values(positions).some(buckets => buckets.length > 1);

            if (hasMultiCard) {
                // Multi-card configuration
                config[workCenter] = {
                    isMultiCard: true,
                    labels: []
                };
                capacityData[workCenter] = {
                    capacity: []
                };

                // Build for each row (1-5)
                for (let row = 1; row <= ROW_COUNT; row++) {
                    const buckets = positions[row] || [];

                    if (buckets.length > 0) {
                        config[workCenter].labels[row - 1] = buckets.map(b => b.label);
                        capacityData[workCenter].capacity[row - 1] = buckets.map(b => b.capacity);
                    } else {
                        config[workCenter].labels[row - 1] = [];
                        capacityData[workCenter].capacity[row - 1] = [];
                    }
                }
            } else {
                // Single-card configuration
                config[workCenter] = {
                    labels: []
                };
                capacityData[workCenter] = {
                    capacity: []
                };

                // Build for each row (1-5)
                for (let row = 1; row <= ROW_COUNT; row++) {
                    const buckets = positions[row] || [];

                    if (buckets.length > 0) {
                        config[workCenter].labels[row - 1] = buckets[0].label;
                        capacityData[workCenter].capacity[row - 1] = buckets[0].capacity;
                    } else {
                        config[workCenter].labels[row - 1] = '';
                        capacityData[workCenter].capacity[row - 1] = 0;
                    }
                }
            }
        });

        // Define column order (standard order for consistent display)
        const standardOrder = ['PLAN BOARD', 'ORDER PICKING', 'WELDING', 'HYDRO', 'NDT', 'EA1', 'CALIBRATION', 'FINAL ASSY', 'QUALITY', 'PACKING'];
        const columnOrder = standardOrder.filter(wc => columnOrderSet.has(wc));

        return {
            config: config,
            columnOrder: columnOrder,
            capacityData: capacityData
        };
    }

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
     * Initialize capacity values and optionally configuration from backend.
     * Call this ONCE on page load.
     * 
     * @param {Object} capacityObj - Work center capacity data object
     * @param {Object} configObj - Optional: Work center configuration object
     * @param {Array} columnOrderArr - Optional: Column order array
     * @example initializeCapacity(capacityData, WORK_CENTER_CONFIG, ['WELDING', 'NDT'])
     */
    function initializeCapacity(capacityObj, configObj, columnOrderArr) {
        if (!capacityObj || typeof capacityObj !== 'object') {
            console.error('Invalid data object for capacity initialization');
            return;
        }
        capacityData = capacityObj;

        if (configObj) {
            WORK_CENTER_CONFIG = configObj;
        }
        if (columnOrderArr && Array.isArray(columnOrderArr)) {
            COLUMN_ORDER = columnOrderArr;
        }

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
    // SAMPLE DATA - Using AJAX structure format
    // ============================================
    const SAMPLE_AJAX_CONFIG = {
        "WorkCenter": [
            "CALIBRATION", "CALIBRATION", "CALIBRATION",
            "EA1", "EA1", "EA1", "EA1",
            "FINAL ASSY", "FINAL ASSY", "FINAL ASSY",
            "HYDRO", "HYDRO", "HYDRO",
            "NDT", "NDT", "NDT",
            "ORDER PICKING",
            "PACKING",
            "PLAN BOARD", "PLAN BOARD", "PLAN BOARD", "PLAN BOARD", "PLAN BOARD",
            "QUALITY", "QUALITY",
            "WELDING", "WELDING", "WELDING", "WELDING", "WELDING", "WELDING", "WELDING"
        ],
        "BucketName": [
            "LARGE", "MEDIUM", "SMALL",
            "LARGE", "MEDIUM", "REP", "SMALL",
            "ASSY", "IBQ", "O2",
            "LARGE", "MEDIUM", "SMALL",
            "DYE PEN", "LARGE", "SMALL",
            "PICKING",
            "LINE 1/2",
            "B2B", "LARGE", "MEDIUM", "SMALL", "SPARE",
            "Q CERTS", "QA VERIF",
            "LARGE MANUAL", "LARGE ROBOT", "MEDIUM MANUAL", "NGEFW", "POL/HE", "SEFW", "SMALL MANUAL"
        ],
        "Capacity": [
            1, 1, 1,
            5, 8, 6, 10,
            6, 2, 2,
            2, 2, 2,
            1, 1, 3,
            2,
            20,
            15, 15, 20, 15, 20,
            2, 2,
            4, 1, 4, 6, 2, 4, 4
        ],
        "Position": [
            3, 2, 1,
            3, 2, 4, 1,
            1, 3, 2,
            3, 2, 1,
            4, 3, 1,
            1,
            1,
            4, 3, 2, 1, 5,
            1, 2,
            3, 3, 2, 2, 4, 1, 1
        ]
    };

    // Parse configuration from AJAX data
    const parsedConfig = parseConfigurationData(SAMPLE_AJAX_CONFIG);

    if (parsedConfig) {
        // Initialize with parsed configuration and capacity
        initializeCapacity(parsedConfig.capacityData, parsedConfig.config, parsedConfig.columnOrder);

        // Sample actual values (using same structure as capacity for demo)
        const SAMPLE_ACTUAL = {};
        Object.keys(parsedConfig.capacityData).forEach(workCenter => {
            const cap = parsedConfig.capacityData[workCenter].capacity;
            SAMPLE_ACTUAL[workCenter] = { actual: JSON.parse(JSON.stringify(cap)) }; // Deep copy

            // Reduce actual values for demo purposes (80-95% of capacity)
            if (Array.isArray(SAMPLE_ACTUAL[workCenter].actual[0])) {
                // Multi-card
                SAMPLE_ACTUAL[workCenter].actual = SAMPLE_ACTUAL[workCenter].actual.map(row =>
                    row.map(val => Math.floor(val * (0.8 + Math.random() * 0.15)))
                );
            } else {
                // Single-card
                SAMPLE_ACTUAL[workCenter].actual = SAMPLE_ACTUAL[workCenter].actual.map(val =>
                    Math.floor(val * (0.8 + Math.random() * 0.15))
                );
            }
        });

        updateActualValues(SAMPLE_ACTUAL);

        const SAMPLE_HEADER = {
            recordableDays: 1268,
            ncCount: 8,
            obqCount: 2,
            targetCount: 23,
            pastDueCount: 10,
            builtCount: 42
        };
        updateHeader(SAMPLE_HEADER);
    }
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
        parseConfigurationData: parseConfigurationData,
        initializeCapacity: initializeCapacity,
        updateActualValues: updateActualValues,
        updateHeader: updateHeader,
        callpopupAction: callpopupAction,
        defaultColorLogic: defaultColorLogic
    };
});

