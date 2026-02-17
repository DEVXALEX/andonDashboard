$(document).ready(function () {
    let workCentersData = null;
    const ROW_COUNT = 5;
    let actualData = {};
    let refreshCounter = 0;

    function parseConfigurationData(data) {
        if (!data || !data.WorkCenter || !data.BucketName || !data.Capacity || !data.Position) {
            console.error('Invalid AJAX data structure');
            return null;
        }

        const workCenterMap = {};
        const columnOrderSet = new Set();

        for (let i = 0; i < data.WorkCenter.length; i++) {
            columnOrderSet.add(data.WorkCenter[i]);
            if (!workCenterMap[data.WorkCenter[i]]) {
                workCenterMap[data.WorkCenter[i]] = [];
            }
            workCenterMap[data.WorkCenter[i]].push({
                name: data.BucketName[i],
                position: data.Position[i],
                capacity: data.Capacity[i]
            });
        }

        const standardOrder = ['PLAN BOARD', 'ORDER PICKING', 'WELDING', 'NDT', 'HYDRO', 'EA1', 'CALIBRATION', 'FINAL ASSY', 'QUALITY', 'PACKING'];
        const orderedNames = standardOrder.filter(wc => columnOrderSet.has(wc));

        return {
            workCenters: orderedNames.map(name => ({
                name: name,
                buckets: workCenterMap[name].sort((a, b) => a.position - b.position)
            }))
        };
    }

    function groupBucketsByPosition(buckets) {
        const groups = {};
        buckets.forEach(bucket => {
            if (!groups[bucket.position]) groups[bucket.position] = [];
            groups[bucket.position].push(bucket);
        });
        return groups;
    }

    function getStatusColor(actual, capacity) {
        if (capacity === 0 || capacity === undefined) return { color: 'lightgray' };
        const ratio = actual / capacity;
        if (ratio > 1) return { color: 'red' };
        if (ratio >= 0.9) return { color: 'green' };
        if (ratio >= 0.7) return { color: 'yellow' };
        if (ratio >= 0.5) return { color: 'orange' };
        return { color: 'lightgray' };
    }

    function initializeDashboard(parsedData) {
        if (!parsedData || !parsedData.workCenters) {
            console.error('Invalid data object for initialization');
            return;
        }
        workCentersData = parsedData;
        renderDashboard();
    }

    function updateActualValues(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data object for actual values update');
            return;
        }
        actualData = data;
        updateCardValues();
        refreshCounter = 0;
        updateRefreshTime();
    }

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

    function calculateCurrentPeriod() {
        const currentMonth = new Date().getMonth();
        return currentMonth >= 9 ? currentMonth - 8 : currentMonth + 4;
    }

    function updateHeader(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data for header update');
            return;
        }

        $('#p5-count').text(`P${calculateCurrentPeriod()}`);

        const fieldMap = {
            recordableDays: '#recordable-days',
            ncCount: '#nc-count',
            obqCount: '#obq-count',
            targetCount: '#target-count',
            pastDueCount: '#pastdue-count',
            builtCount: '#built-count'
        };

        Object.entries(fieldMap).forEach(([key, selector]) => {
            if (data[key] !== undefined) $(selector).text(data[key]);
        });
    }

    function renderDashboard() {
        const tbody = $('#dashboard-body');
        tbody.empty();
        if (!workCentersData || !workCentersData.workCenters || workCentersData.workCenters.length === 0) return;

        workCentersData.workCenters.forEach((wc, colIdx) => {
            const positionGroups = groupBucketsByPosition(wc.buckets);

            for (let row = 0; row < ROW_COUNT; row++) {
                let tr;
                if (colIdx === 0) {
                    tr = $('<tr></tr>');
                    tbody.append(tr);
                } else {
                    tr = tbody.find('tr').eq(row);
                }

                const td = $('<td></td>');
                const bucketsAtPosition = positionGroups[row + 1] || [];

                if (bucketsAtPosition.length === 0) {
                    td.addClass('empty-cell');
                } else {
                    bucketsAtPosition.forEach((bucket, idx) => {
                        const content = $('<div class="cell-content"></div>')
                            .attr('data-row', row)
                            .attr('data-col', wc.name)
                            .attr('data-idx', idx);
                        content.append(`<div class="cell-label">${bucket.name}</div>`);
                        content.append('<div class="cell-status"></div>');
                        td.append(content);
                    });
                }

                tr.append(td);
            }
        });
    }

    function updateTime() {
        const now = new Date();
        $('#nl-time').text(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }

    function updateRefreshTime() {
        $('#refresh-time').text(`${refreshCounter} MIN AGO`);
    }

    function openPopup(dataFlag, column, label) {
        console.log('openPopup called with:', { dataFlag, column, label });
        let message = `dataFlag: ${dataFlag}`;
        if (column) message += `\ncolumn: ${column}`;
        if (label) message += `\nlabel: ${label}`;
        alert(message);
    }

    $(document).on('click', '[data-modal-type]', function () {
        openPopup($(this).data('modal-type'));
    });

    $(document).on('click', '.cell-status', function () {
        const $content = $(this).closest('.cell-content');
        openPopup('CELL', $content.data('col'), $content.find('.cell-label').text().trim());
    });

    updateTime();
    updateRefreshTime();
    $('[data-default]').each(function () { $(this).text($(this).data('default')); });

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

    const parsedConfig = parseConfigurationData(SAMPLE_AJAX_CONFIG);

    if (parsedConfig) {
        initializeDashboard(parsedConfig);

        const SAMPLE_ACTUAL = {};
        parsedConfig.workCenters.forEach(wc => {
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
        });

        updateActualValues(SAMPLE_ACTUAL);
        updateHeader({ recordableDays: 1268, ncCount: 8, obqCount: 2, targetCount: 23, pastDueCount: 10, builtCount: 42 });
    }

    setInterval(updateTime, 60000);
    setInterval(() => { refreshCounter++; updateRefreshTime(); }, 60000);

    window.AndonDashboard = {
        parseConfigurationData: parseConfigurationData,
        initializeDashboard: initializeDashboard,
        updateActualValues: updateActualValues,
        updateHeader: updateHeader,
        openPopup: openPopup,
        getStatusColor: getStatusColor
    };
});
