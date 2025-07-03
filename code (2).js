// Google Apps Script Code (in dein Script-Editor einfügen)

const sheetName = "Tabelle1"; // Stelle sicher, dass dies der Name deines Tabellenblatts ist
const scriptProp = PropertiesService.getScriptProperties();

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(sheetName);

    // Die erste Zeile sind die Header
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;

    const newRow = headers.map(function(header) {
      // Wenn der Header im JSON-Payload von der Webseite existiert, nutze den Wert.
      // Sonst, füge eine leere Zelle ein.
      return e.parameter[header] !== undefined ? e.parameter[header] : "";
    });

    // Füge die neue Zeile zum Sheet hinzu
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    // Gib eine Erfolgsmeldung als JSON zurück
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": nextRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    // Gib eine Fehlermeldung als JSON zurück
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}