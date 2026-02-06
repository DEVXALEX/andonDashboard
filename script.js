$(document).ready(function () {
    // Dashboard data structure - EXACT match to screenshot
    const dashboardData = [
        {
            planBoard: { label: 'SMALL', status: '9 / 15', color: 'green' },
            orderPicking: { label: 'PICK 1 / 2', status: '', color: 'lightgray' },
            welding: [
                { label: 'SEFW', status: '4 / 4', color: 'orange' },
                { label: 'MANUAL', status: '', color: 'lightgray' }
            ],
            ndt: { label: 'SMALL', status: '2 / 3', color: 'yellow' },
            hydro: { label: 'SMALL 0 / 2', status: '7 / 2', color: 'red' },
            ea1: { label: 'SMALL (1)', status: '4 / 10', color: 'green' },
            calibration: { label: 'SMALL (4)', status: '', color: 'yellow' },
            finalAssy: { label: 'O2', status: '0 / 2', color: 'green' },
            quality: { label: 'Q CERTS', status: '10 / 2', color: 'red' },
            packing: { label: 'PACK 2/2 (2)', status: '10 / 20', color: 'green' }
        },
        {
            planBoard: { label: 'MEDIUM', status: '7 / 20', color: 'green' },
            orderPicking: {},
            welding: [
                { label: 'ROBOT', status: '0 / 1', color: 'green' },
                { label: 'NDEFW', status: '2 / 8', color: 'green' }
            ],
            ndt: {},
            hydro: { label: 'MEDIUM', status: '0 / 2', color: 'green' },
            ea1: { label: 'MEDIUM', status: '3 / 8', color: 'green' },
            calibration: { label: 'MEDIUM (1)', status: '', color: 'yellow' },
            finalAssy: [
                { label: 'FA 7 / 0', status: '18 / 20', color: 'green' },
                { label: 'SPARE 3 / 10', status: '', color: 'green' }
            ],
            quality: { label: 'QA VERIFY (3)', status: '2 / 2', color: 'yellow' },
            packing: {}
        },
        {
            planBoard: { label: 'LARGE', status: '0 / 16', color: 'green' },
            orderPicking: {},
            welding: [
                { label: 'MANUAL', status: '0 / 1', color: 'green' }
            ],
            ndt: { label: 'LARGE', status: '0 / 1', color: 'green' },
            hydro: { label: 'LARGE', status: '1 / 2', color: 'green' },
            ea1: { label: 'LARGE', status: '2 / 6', color: 'green' },
            calibration: { label: 'LARGE (2)', status: '', color: 'yellow' },
            finalAssy: [
                { label: 'IBQ (2)', status: '0 / 2', color: 'brown' }
            ],
            quality: {},
            packing: { label: 'SPARE 0 / 10', status: '', color: 'green' }
        },
        {
            planBoard: { label: 'B28', status: '0 / 15', color: 'green' },
            orderPicking: {},
            welding: [
                { label: 'POLNE', status: '0 / 2', color: 'green' }
            ],
            ndt: {},
            hydro: {},
            ea1: {},
            calibration: {},
            finalAssy: {},
            quality: {},
            packing: { label: 'REP 1 / 6', status: '', color: 'green' }
        },
        {
            planBoard: { label: 'SPARE', status: '3 / 20', color: 'green' },
            orderPicking: {},
            welding: [
                { label: 'ROBOT', status: '2 / 2', color: 'orange' },
                { label: 'MANUAL', status: '', color: 'lightgray' }
            ],
            ndt: { label: 'DYE PEN', status: '2 / 1', color: 'red' },
            hydro: {},
            ea1: { label: 'REP 3 / 6 *', status: '', color: 'green' },
            calibration: {},
            finalAssy: {},
            quality: {},
            packing: {}
        }
    ];

    // Function to render dashboard
    function renderDashboard() {
        const tbody = $('#dashboard-body');
        tbody.empty();

        dashboardData.forEach(row => {
            const tr = $('<tr></tr>');

            // Helper function to create cell
            function createCell(data) {
                const td = $('<td></td>');

                if (!data || (typeof data === 'object' && !data.label && !Array.isArray(data))) {
                    td.addClass('empty-cell');
                    return td;
                }

                if (Array.isArray(data)) {
                    data.forEach(item => {
                        if (item.label || item.status) {
                            const content = $('<div class="cell-content"></div>');
                            if (item.label) {
                                content.append(`<div class="cell-label">${item.label}</div>`);
                            }
                            if (item.status) {
                                content.append(`<div class="cell-status status-${item.color}">${item.status}</div>`);
                            } else if (item.color) {
                                content.append(`<div class="cell-status status-${item.color}"></div>`);
                            }
                            td.append(content);
                        }
                    });
                } else {
                    const content = $('<div class="cell-content"></div>');
                    if (data.label) {
                        content.append(`<div class="cell-label">${data.label}</div>`);
                    }
                    if (data.status) {
                        content.append(`<div class="cell-status status-${data.color}">${data.status}</div>`);
                    } else if (data.color) {
                        content.append(`<div class="cell-status status-${data.color}"></div>`);
                    }
                    td.append(content);
                }

                return td;
            }

            // Add cells for each column
            tr.append(createCell(row.planBoard));
            tr.append(createCell(row.orderPicking));
            tr.append(createCell(row.welding));
            tr.append(createCell(row.ndt));
            tr.append(createCell(row.hydro));
            tr.append(createCell(row.ea1));
            tr.append(createCell(row.calibration));
            tr.append(createCell(row.finalAssy));
            tr.append(createCell(row.quality));
            tr.append(createCell(row.packing));

            tbody.append(tr);
        });
    }

    // Update time display
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        $('#nl-time').text(`${hours}:${minutes}`);
    }

    // Update refresh time
    let refreshCounter = 0;
    function updateRefreshTime() {
        $('#refresh-time').text(`${refreshCounter} MIN AGO`);
    }

    // Simulate data updates (optional - for demo purposes)
    function simulateUpdate() {
        // Random update to show dynamic capability
        const randomRow = Math.floor(Math.random() * dashboardData.length);
        const properties = ['planBoard', 'orderPicking', 'welding', 'ndt', 'hydro', 'ea1', 'calibration', 'finalAssy', 'quality', 'packing'];
        const randomProp = properties[Math.floor(Math.random() * properties.length)];

        // Reset refresh counter
        refreshCounter = 0;
        updateRefreshTime();

        renderDashboard();
    }

    // Initialize dashboard
    renderDashboard();
    updateTime();
    updateRefreshTime();

    // Set header values to match screenshot
    $('#recordable-days').text('1268');
    $('#nc-count').html('<span style="color: #2ecc71; font-weight: bold;">10</span>');
    $('#obq-count').text('0');
    $('#target-count').text('32');
    $('#pastdue-count').text('10');
    $('#built-count').text('18');
    $('#nl-time').text('11:01');
    $('#refresh-time').text('2 MIN AGO');

    // Update time every minute
    setInterval(updateTime, 60000);

    // Update refresh counter every minute
    setInterval(() => {
        refreshCounter++;
        updateRefreshTime();
    }, 60000);

    // Optional: Simulate updates every 5 minutes
    // setInterval(simulateUpdate, 300000);

    // Button click handlers (placeholder functionality)
    $('.footer-btn').on('click', function () {
        const btnText = $(this).text();
        console.log(`Button clicked: ${btnText}`);
        alert(`${btnText} clicked`);
    });
});
