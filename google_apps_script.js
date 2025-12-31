// ==========================================
// CONFIGURATION
// ==========================================
// تأكد من صحة الـ ID الخاص بالشيت
const SHEET_ID = '15uqLAXYvVwIFGbIp8FjG5IA1oCwjdU72Hs4ONO06WCc';
const SHEET = SpreadsheetApp.openById(SHEET_ID);

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateId(prefix) {
    return prefix + '_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
}

function deleteRowsByColumn(sheetName, idColumn, idValue) {
    const sheet = SHEET.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf(idColumn);

    if (idIndex === -1) return;

    // We iterate backwards to avoid index shift issues when deleting
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][idIndex] === idValue) {
            sheet.deleteRow(i + 1);
        }
    }
}

function deleteEventCascade(eventId) {
    // 1. Delete slots associated with the days of this event
    const days = getSheetData('Event_Days').filter(d => d.event_id === eventId);
    days.forEach(day => {
        deleteRowsByColumn('Agenda_Slots', 'day_id', day.day_id);
    });

    // 2. Delete days associated with this event
    deleteRowsByColumn('Event_Days', 'event_id', eventId);

    // 3. Delete the event itself
    return deleteRowFromSheet('Events', 'event_id', eventId);
}

function getSheetData(sheetName) {
    const sheet = SHEET.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });
}

function addRowToSheet(sheetName, rowData) {
    const sheet = SHEET.getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const row = headers.map(header => rowData[header] || '');
    sheet.appendRow(row);

    return { success: true, data: rowData };
}

function updateRowInSheet(sheetName, idColumn, idValue, updates) {
    const sheet = SHEET.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf(idColumn);

    for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === idValue) {
            Object.keys(updates).forEach(key => {
                const colIndex = headers.indexOf(key);
                if (colIndex !== -1) {
                    sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
                }
            });
            return { success: true, message: 'Updated successfully' };
        }
    }

    return { success: false, message: 'Record not found' };
}

function deleteRowFromSheet(sheetName, idColumn, idValue) {
    const sheet = SHEET.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf(idColumn);

    for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === idValue) {
            sheet.deleteRow(i + 1);
            return { success: true, message: 'Deleted successfully' };
        }
    }

    return { success: false, message: 'Record not found' };
}

// ==========================================
// API ENDPOINTS
// ==========================================

function doGet(e) {
    const action = e.parameter.action;

    try {
        switch (action) {
            case 'getEvents':
                return jsonResponse(getSheetData('Events'));

            case 'getEvent':
                const eventId = e.parameter.eventId;
                const events = getSheetData('Events');
                const event = events.find(ev => ev.event_id === eventId);
                return jsonResponse(event || { error: 'Event not found' });

            case 'getEventDays':
                const evtId = e.parameter.eventId;
                const days = getSheetData('Event_Days').filter(d => d.event_id === evtId);
                return jsonResponse(days);

            case 'getAgendaSlots':
                const dayId = e.parameter.dayId;
                const slots = getSheetData('Agenda_Slots').filter(s => s.day_id === dayId);
                return jsonResponse(slots.sort((a, b) => a.sort_order - b.sort_order));

            case 'getFullAgenda':
                const fullEventId = e.parameter.eventId;
                const fullEvent = getSheetData('Events').find(ev => ev.event_id === fullEventId);
                const fullDays = getSheetData('Event_Days').filter(d => d.event_id === fullEventId);
                const allSlots = getSheetData('Agenda_Slots');

                const agenda = {
                    event: fullEvent,
                    days: fullDays.map(day => ({
                        ...day,
                        slots: allSlots.filter(s => s.day_id === day.day_id).sort((a, b) => a.sort_order - b.sort_order)
                    }))
                };

                return jsonResponse(agenda);

            default:
                return jsonResponse({ error: 'Invalid action' });
        }
    } catch (error) {
        return jsonResponse({ error: error.toString() });
    }
}

function doPost(e) {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    try {
        switch (action) {
            case 'createEvent':
                const eventData = {
                    event_id: generateId('EVT'),
                    event_name: data.event_name,
                    header_image_url: data.header_image_url || '',
                    background_image_url: data.background_image_url || '',
                    footer_image_url: data.footer_image_url || '',
                    header_height: data.header_height || '', // Added support for header_height
                    created_at: new Date().toISOString(),
                    status: 'active'
                };
                return jsonResponse(addRowToSheet('Events', eventData));

            case 'updateEvent':
                // updateEvent is generic, so it will automatically handle header_height if passed in 'updates'
                return jsonResponse(updateRowInSheet('Events', 'event_id', data.event_id, data.updates));

            case 'deleteEvent':
                return jsonResponse(deleteEventCascade(data.event_id));

            case 'createDay':
                const dayData = {
                    day_id: generateId('DAY'),
                    event_id: data.event_id,
                    day_number: data.day_number,
                    day_name: data.day_name,
                    day_date: data.day_date
                };
                return jsonResponse(addRowToSheet('Event_Days', dayData));

            case 'updateDay':
                return jsonResponse(updateRowInSheet('Event_Days', 'day_id', data.day_id, data.updates));

            case 'deleteDay':
                return jsonResponse(deleteRowFromSheet('Event_Days', 'day_id', data.day_id));

            case 'createSlot':
                const slotData = {
                    slot_id: generateId('SLOT'),
                    day_id: data.day_id,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    slot_title: data.slot_title,
                    presenter_name: data.presenter_name || '',
                    show_presenter: data.show_presenter || false, // Added show_presenter
                    sort_order: data.sort_order || 999
                };
                return jsonResponse(addRowToSheet('Agenda_Slots', slotData));

            case 'updateSlot':
                return jsonResponse(updateRowInSheet('Agenda_Slots', 'slot_id', data.slot_id, data.updates));

            case 'deleteSlot':
                return jsonResponse(deleteRowFromSheet('Agenda_Slots', 'slot_id', data.slot_id));

            default:
                return jsonResponse({ error: 'Invalid action' });
        }
    } catch (error) {
        return jsonResponse({ error: error.toString() });
    }
}

function jsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
