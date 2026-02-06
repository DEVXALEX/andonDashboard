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

    // ============================================
    // MODAL FUNCTIONALITY
    // ============================================

    // Sample WIP data
    const wipData = {
        nc: [
            { wipjob: '45605410', cart_nr: '', compl_date: '17-12-2025', location: 'S_ElecAssy_Small', status: 'Reject' },
            { wipjob: '46074699', cart_nr: '', compl_date: '29-01-2026', location: 'S_Calibrate_Small', status: 'Reject' },
            { wipjob: '45992801', cart_nr: '', compl_date: '29-01-2026', location: 'S_Quality_Certs', status: 'Reject' },
            { wipjob: '46380329', cart_nr: '', compl_date: '02-02-2026', location: 'S_Calibrate_Small', status: 'Reject' },
            { wipjob: '46126037', cart_nr: '', compl_date: '02-02-2026', location: 'S_Calibrate_Large', status: 'Reject' },
            { wipjob: '46561298', cart_nr: '', compl_date: '02-02-2026', location: 'S_Quality_Verify', status: 'Reject' },
            { wipjob: '46561301', cart_nr: '', compl_date: '02-02-2026', location: 'S_Quality_Verify', status: 'Reject' },
            { wipjob: '46561302', cart_nr: '', compl_date: '02-02-2026', location: 'S_Quality_Verify', status: 'Reject' },
            { wipjob: '47002579', cart_nr: '', compl_date: '02-02-2026', location: 'S_Calibrate_Small', status: 'Reject' },
            { wipjob: '46520788', cart_nr: '', compl_date: '03-02-2026', location: 'S_Calibrate_Large', status: 'Reject' },
            { wipjob: '46353650', cart_nr: '', compl_date: '03-02-2026', location: 'S_Quality_IBQ', status: 'Reject' },
            { wipjob: '46353645', cart_nr: '', compl_date: '03-02-2026', location: 'S_Quality_IBQ', status: 'Reject' },
            { wipjob: '46440151', cart_nr: '', compl_date: '06-02-2026', location: 'S_Calibrate_Small', status: 'Reject' },
            { wipjob: '45530954', cart_nr: '', compl_date: '24-04-2026', location: 'S_Pack', status: 'Reject' },
            { wipjob: '45530953', cart_nr: '', compl_date: '24-04-2026', location: 'S_Pack', status: 'Reject' }
        ],
        osp: [
            { wipjob: '46123456', cart_nr: '', compl_date: '15-02-2026', location: 'OSP_Location_1', status: 'Pending' },
            { wipjob: '46234567', cart_nr: '', compl_date: '20-02-2026', location: 'OSP_Location_2', status: 'Pending' },
            { wipjob: '46345678', cart_nr: '', compl_date: '25-02-2026', location: 'OSP_Location_3', status: 'Pending' },
            { wipjob: '46456789', cart_nr: '', compl_date: '28-02-2026', location: 'OSP_Location_4', status: 'Pending' }
        ],
        ci: [
            { wipjob: '47111111', cart_nr: '', compl_date: '10-03-2026', location: 'CI_Station_A', status: 'In Progress' },
            { wipjob: '47222222', cart_nr: '', compl_date: '12-03-2026', location: 'CI_Station_B', status: 'In Progress' },
            { wipjob: '47333333', cart_nr: '', compl_date: '15-03-2026', location: 'CI_Station_C', status: 'In Progress' }
        ]
    };

    // Sample detail data for WIP orders
    const wipDetails = {
        '45605410': {
            item: 'FT_F025S71727249',
            itemDesc1: 'F025S114CCAZEZZZMCHTCV...',
            itemDesc2: '1700I15AEZEZZZ',
            salesOrder: '40109528',
            line: '25',
            trackId: '%823973664,%823973663',
            sensorSerial: '15638420',
            transmitterSerial: '19033278',
            operationCode: '2EA1',
            operationSeqNum: '710',
            icNumber: '',
            manufacturingDesc: 'SSC Small Electronic Assembly (...',
            departmentCode: 'EA1',
            departmentDesc: 'EDE SSC PUCK/J-BOX',
            dateReleased: '08-01-2026',
            scheduledStart: '16-12-2025',
            scheduledCompletion: '16-01-2026',
            lastMoveDate: '14-01-2026',
            promisedDate: '01-01-2030',
            requestedShipDate: '01-03-2026',
            daysLeft: '-18'
        }
    };

    let currentModalType = '';

    // Function to open modal
    function openModal(type) {
        currentModalType = type;
        const titleMap = {
            'nc': 'NC HOLD - WIP Order Details',
            'osp': 'OSP - WIP Order Details',
            'ci': 'CI - WIP Order Details'
        };

        $('#modal-title').text(titleMap[type]);
        populateWIPTable(type);
        $('#wip-modal').fadeIn(300);
    }

    // Function to populate WIP table
    function populateWIPTable(type) {
        const data = wipData[type] || [];
        const tbody = $('#wip-table-body');
        tbody.empty();

        data.forEach(row => {
            const tr = $('<tr>').data('wipjob', row.wipjob);
            tr.append(`<td>${row.wipjob}</td>`);
            tr.append(`<td>${row.cart_nr}</td>`);
            tr.append(`<td>${row.compl_date}</td>`);
            tr.append(`<td>${row.location}</td>`);
            tr.append(`<td>${row.status}</td>`);
            tbody.append(tr);
        });
    }

    // Function to display WIP details
    function displayWIPDetails(wipjob) {
        const details = wipDetails[wipjob];
        const container = $('#details-container');

        if (!details) {
            container.html('<p class="no-selection">No details available for this WIP order</p>');
            return;
        }

        const detailsHTML = `
            <div class="details-grid">
                <div class="detail-row">
                    <div class="detail-label">Item</div>
                    <div class="detail-value">${details.item}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Item desc 1</div>
                    <div class="detail-value">${details.itemDesc1}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Item desc 2</div>
                    <div class="detail-value">${details.itemDesc2}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Sales order</div>
                    <div class="detail-value">${details.salesOrder}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Line</div>
                    <div class="detail-value">${details.line}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Track ID</div>
                    <div class="detail-value">${details.trackId}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Sensor Serial</div>
                    <div class="detail-value">${details.sensorSerial}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Transmitter Serial</div>
                    <div class="detail-value">${details.transmitterSerial}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Operation Code</div>
                    <div class="detail-value">${details.operationCode}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Operation Seq Num</div>
                    <div class="detail-value">${details.operationSeqNum}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">IC Number</div>
                    <div class="detail-value">${details.icNumber}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Manufacturing Desc</div>
                    <div class="detail-value">${details.manufacturingDesc}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Department Code</div>
                    <div class="detail-value">${details.departmentCode}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Department Desc</div>
                    <div class="detail-value">${details.departmentDesc}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Date Released</div>
                    <div class="detail-value">${details.dateReleased}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Scheduled Start Date</div>
                    <div class="detail-value">${details.scheduledStart}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Scheduled Completion</div>
                    <div class="detail-value">${details.scheduledCompletion}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Last Move Date</div>
                    <div class="detail-value">${details.lastMoveDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Promised Date</div>
                    <div class="detail-value">${details.promisedDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Requested Ship Date</div>
                    <div class="detail-value">${details.requestedShipDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Days Left</div>
                    <div class="detail-value">${details.daysLeft}</div>
                </div>
            </div>
        `;

        container.html(detailsHTML);
    }

    // Button click handlers
    $('#nc-btn').on('click', function () {
        openModal('nc');
    });

    $('#osp-btn').on('click', function () {
        openModal('osp');
    });

    $('#ci-btn').on('click', function () {
        openModal('ci');
    });

    // Close modal
    $('.modal-close').on('click', function () {
        $('#wip-modal').fadeOut(300);
        $('#details-container').html('<p class="no-selection">Select a WIP order to view details</p>');
    });

    // Close modal when clicking outside
    $('#wip-modal').on('click', function (e) {
        if (e.target.id === 'wip-modal') {
            $('#wip-modal').fadeOut(300);
            $('#details-container').html('<p class="no-selection">Select a WIP order to view details</p>');
        }
    });

    // WIP table row click handler
    $(document).on('click', '#wip-table-body tr', function () {
        // Remove selection from all rows
        $('#wip-table-body tr').removeClass('selected');

        // Add selection to clicked row
        $(this).addClass('selected');

        // Get wipjob from row data
        const wipjob = $(this).data('wipjob');

        // Display details
        displayWIPDetails(wipjob);
    });

    // Search functionality
    $('#search-btn').on('click', function () {
        const searchValue = $('#search-input').val().toLowerCase();
        const searchType = $('#search-type').val();

        if (!searchValue) {
            populateWIPTable(currentModalType);
            return;
        }

        const data = wipData[currentModalType] || [];
        const filtered = data.filter(row => {
            if (searchType === 'sensor') {
                // In real implementation, search sensor serial from details
                return row.wipjob.toLowerCase().includes(searchValue);
            } else if (searchType === 'wipjob') {
                return row.wipjob.toLowerCase().includes(searchValue);
            } else if (searchType === 'location') {
                return row.location.toLowerCase().includes(searchValue);
            }
            return false;
        });

        const tbody = $('#wip-table-body');
        tbody.empty();

        filtered.forEach(row => {
            const tr = $('<tr>').data('wipjob', row.wipjob);
            tr.append(`<td>${row.wipjob}</td>`);
            tr.append(`<td>${row.cart_nr}</td>`);
            tr.append(`<td>${row.compl_date}</td>`);
            tr.append(`<td>${row.location}</td>`);
            tr.append(`<td>${row.status}</td>`);
            tbody.append(tr);
        });
    });

    // Search on Enter key
    $('#search-input').on('keypress', function (e) {
        if (e.which === 13) {
            $('#search-btn').click();
        }
    });

    // Click handlers for dashboard cards
    $(document).on('click', '.cell-status', function () {
        const label = $(this).text().trim().toUpperCase();

        // Determine which modal to open based on card content
        if (label.includes('OSP')) {
            openModal('osp');
        } else if (label.includes('CI')) {
            openModal('ci');
        } else {
            // Default to NC modal for all other cards
            openModal('nc');
        }
    });

    // Click handlers for header metrics
    $(document).on('click', '.header-section', function () {
        const text = $(this).text().trim().toUpperCase();

        // Determine which modal to open based on header section
        if (text.includes('NC') || text.includes('OBQ')) {
            openModal('nc');
        } else if (text.includes('BUILT') || text.includes('TARGET') || text.includes('PAST DUE')) {
            openModal('nc'); // Default to NC modal
        }
    });

    // Add pointer cursor to clickable cards and header sections
    $(document).on('mouseenter', '.cell-status, .header-section', function () {
        $(this).css('cursor', 'pointer');
    });
});
