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
        console.log("Bucket Input");
        console.log(buckets);
        const groups = {};
        buckets.forEach(bucket => {
            if (!groups[bucket.position]) groups[bucket.position] = [];
            groups[bucket.position].push(bucket);
        });
        console.log("groupBucketsByPosition");
        console.log(groups);
        console.log("groupBucketsByPosition");
        return groups;
    }

    function getStatusColor(actual, capacity) {
        if (capacity === 0 || capacity === undefined) return { color: 'lightgray' };
        if (actual > capacity) return { color: 'red' };
        if (actual === capacity) return { color: 'orange' };
        if (actual === capacity - 1) return { color: 'yellow' };
        return { color: 'green' };
    }

    function initializeDashboard(parsedData) {
        if (!parsedData || !parsedData.workCenters) {
            console.error('Invalid data object for initialization');
            return;
        }
        workCentersData = parsedData;
        renderDashboard();
        updateCardValues();
    }

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
            const colActual = actualData[wc.name]; // Actual values for the work center

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
                            .attr('data-col', wc.name)
                            .attr('data-bucket', bucket.name);
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
            SAMPLE_ACTUAL[wc.name] = {};
            wc.buckets.forEach(bucket => {
                SAMPLE_ACTUAL[wc.name][bucket.name] = Math.floor(bucket.capacity * (0.8 + Math.random() * 0.15));
            });
        });

        updateActualValues(SAMPLE_ACTUAL);
        updateHeader({ recordableDays: 1268, ncCount: 8, obqCount: 2, targetCount: 23, pastDueCount: 10, builtCount: 42 });
    }

    setInterval(updateTime, 60000);
    setInterval(() => { refreshCounter++; updateRefreshTime(); }, 60000);

    window.AndonDashboard = {
        parseConfigurationData: parseConfigurationData,
        parseActualData: parseActualData,
        initializeDashboard: initializeDashboard,
        updateActualValues: updateActualValues,
        updateHeader: updateHeader,
        openPopup: openPopup,
        getStatusColor: getStatusColor
    };
});
