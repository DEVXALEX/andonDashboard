$(document).ready(function() {
    let workCentersData = null;
    const ROW_COUNT = 5;
    let actualData = {};
    let refreshCounter = 0;
    // make all operation call here 
    function parseConfigurationData(data) {
        if (!data || !data.InitialWorkCenter || !data.InitialBucketName || !data.InitialCapacity || !data.InitialPosition) {
            console.error('Invalid AJAX data structure');
            return null;
        }

        const workCenterMap = {};
        const columnOrderSet = new Set();

        for (let i = 0; i < data.InitialWorkCenter.length; i++) {
            columnOrderSet.add(data.InitialWorkCenter[i]);
            if (!workCenterMap[data.InitialWorkCenter[i]]) {
                workCenterMap[data.InitialWorkCenter[i]] = [];
            }
            workCenterMap[data.InitialWorkCenter[i]].push({
                name: data.InitialBucketName[i],
                position: data.InitialPosition[i],
                capacity: data.InitialCapacity[i]
            });
        }

        const standardOrder = ['PLAN BOARD', 'ORDER PICKING', 'WELDING', 'HYDRO', 'NDT', 'EA1', 'CALIBRATION', 'FINAL ASSY', 'QUALITY', 'PACKING'];
        const orderedNames = standardOrder.filter(wc => columnOrderSet.has(wc));

        return {
            workCenters: orderedNames.map(name => ({
                name: name,
                buckets: workCenterMap[name].sort((a, b) => a.position - b.position)
            }))
        };
    }
	
	//Can we Eliminate This ?
    function groupBucketsByPosition(buckets) {
        const groups = {};
        buckets.forEach(bucket => {
            if (!groups[bucket.position]) groups[bucket.position] = [];
            groups[bucket.position].push(bucket);
        });
        return groups;
    }
	// Till here
	
    function getStatusColor(actual, capacity) {
        if (capacity === 0 || capacity === undefined) return {
            color: 'lightgray'
        };
        if (actual > capacity) return {
            color: 'red'
        };
        if (actual === capacity) return {
            color: 'orange'
        };
        if (actual === capacity - 1) return {
            color: 'yellow'
        };
        return {
            color: 'green'
        };
    }

	// Can we Use this function for Start of the Execution
    function initializeDashboard(parsedData) {
        if (!parsedData || !parsedData.workCenters) {
            console.error('Invalid data object for initialization');
            return;
        }
        workCentersData = parsedData;
        renderDashboard(workCentersData);
        updateInitialCardValues();
		 callAjax(context, 'Data');
    }
	// Till Here


	// Do we need this function
    function updateActualValues(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data object for actual values update');
            return;
        }
        //  actualData = data;
        updateCardValues(data);
		updateHeader(data);
        refreshCounter = 0;
        updateRefreshTime();
    }
	// Till Here
	
    // Start Of Update Value Function
	//Can we Do Operation OverLoading to merge updateInitialCardValues And updateCardValues
    function updateInitialCardValues() {
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

	//Function OverLoading with function Defined above
    function updateCardValues(actualData) {
        if (!actualData || !actualData.ActualWorkCenter) return;
		//console.log('UpdateCall')
		//console.log(actualData)
        const actualMap = {};
        const len = actualData.ActualWorkCenter.length;
        for (let i = 0; i < len; i++) {
            const wc = actualData.ActualWorkCenter[i];
            const bucket = actualData.ActualBucket[i];
            actualMap[`${wc}|${bucket}`] = actualData.ActualCount[i];
        }

        const cells = document.querySelectorAll('.cell-content');
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const labelDiv = cell.querySelector('.cell-label');
            const statusDiv = cell.querySelector('.cell-status');
            if (!labelDiv || !statusDiv) continue;
            const wcName = cell.getAttribute('data-col');
            const bucketName = labelDiv.textContent.trim();
            const currentText = statusDiv.textContent || '';
            const slashIndex = currentText.indexOf('/');
            const capacity = slashIndex !== -1 ? parseInt(currentText.substring(slashIndex + 1), 10) : 0;
            const actualVal = actualMap[`${wcName}|${bucketName}`] || 0;
            const colors = getStatusColor(actualVal, capacity);
            const statusText = capacity > 0 ? `${actualVal} / ${capacity}` : '';
            statusDiv.textContent = statusText;
            statusDiv.className = `cell-status status-${colors.color}`;
        }
    }

	// What Does This Do ?
    function calculateCurrentPeriod() {
        const currentMonth = new Date().getMonth();
        return currentMonth >= 9 ? currentMonth - 8 : currentMonth + 4;
    }

	//Header
    function updateHeader(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data for header update');
            return;
        }

        $('#p5-count').text(`P${calculateCurrentPeriod()}`);

        const fieldMap = {
            HeaderDaysRecordables: '#recordable-days',
            HeaderNC: '#nc-count',
            HeaderOBQ: '#obq-count',
            HeaderTarget: '#target-count',
            HeaderPastDue: '#pastdue-count',
            HeaderBuilt: '#built-count',
			ButtonNCHold:'#nc-btn-val',
			ButtonOSP:'#osp-btn-val',
			ButtonCI:'#ci-btn-val'
        };

        Object.entries(fieldMap).forEach(([key, selector]) => {
            if (data[key] !== undefined) $(selector).text(data[key]);
        });
    }
	
	// Can We Refactor This Function
    function renderDashboard(workCentersData) {
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

	// What Does this Do ?
    function updateTime() {
        const now = new Date();
        $('#nl-time').text(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }

	// What Does this Do ?
    function updateRefreshTime() {
        $('#refresh-time').text(`${refreshCounter} MIN AGO`);
    }

    function openPopup(dataFlag, column, label) {
	console.log(dataFlag)
    	if(dataFlag == 'OBQ')
			context.outputs.Action = 'OBQPOPUP';
		else
			context.outputs.Action = 'POPUP'
        context.outputs.DataFlag = dataFlag;
        context.outputs.DataWC = column;
        context.outputs.DataBucket = label;
        context.submit();
    }

	// Arrow This 
    $(document).on('click', '[data-modal-type]', function() {
        openPopup($(this).data('modal-type'));
    });

	// Arrow This 
    $(document).on('click', '.cell-status', function() {
        const $content = $(this).closest('.cell-content');
        openPopup('CELL', $content.data('col'), $content.find('.cell-label').text().trim());
    });

    updateTime();
    updateRefreshTime();
	//Arrow This Maybe Not Needed but need to modify html before removing this 
    $('[data-default]').each(function() {
        $(this).text($(this).data('default'));
    });

    setInterval(updateTime, 60000);
	//Shorthand THis
    setInterval(() => {
        refreshCounter++;
        updateRefreshTime();
    }, 60000);

	//Optimize this
    function callAjax(context, flag) {
        var inputs = {};
        inputs.Route = flag;
      //  console.log(flag)
        context.callOperation('EMR_MME_Andon_FetchDashboardData', inputs,
            function(outputs) {
           //     console.log(outputs);
                //Operation outputs: WorkCenter, BucketName, Capacity, Position
                if (flag == 'INITIAL') {
                    const parsedConfig = parseConfigurationData(outputs);
				//	console.log('parsedConfig');
                //    console.log(parsedConfig);
                    if (parsedConfig) {
                    //    console.log('here');
                        initializeDashboard(parsedConfig);
                    //    console.log('here2');
                    }
                } else {
				//	console.log('DataCall')
                    updateActualValues(outputs);
                }
            },
            function(message) {
               // alert(message);
            });
    }
	// Till here
    callAjax(context, 'INITIAL');
    setInterval(() => callAjax(context, 'Data'), 5000);
});
