// Assessment Tracker - Google Apps Script Backend
// This script handles data storage in Google Sheets

// Main function to handle all requests
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Connection successful'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'load') {
    return loadData();
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Unknown action'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    
    if (postData.action === 'save') {
      saveData(postData.data);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        message: 'Data saved successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Save data to the sheet
function saveData(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get or create the Data sheet
  let dataSheet = ss.getSheetByName('TrackerData');
  if (!dataSheet) {
    dataSheet = ss.insertSheet('TrackerData');
  }
  
  // Clear existing data
  dataSheet.clear();
  
  // Save as JSON in cell A1
  const jsonData = JSON.stringify(data);
  dataSheet.getRange('A1').setValue(jsonData);
  
  // Add metadata
  dataSheet.getRange('A2').setValue('Last Updated: ' + new Date().toLocaleString());
  
  // Also save a human-readable summary on a separate sheet
  saveSummary(ss, data);
  
  return true;
}

// Load data from the sheet
function loadData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName('TrackerData');
  
  if (!dataSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'No data found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const jsonData = dataSheet.getRange('A1').getValue();
  
  if (!jsonData) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'No data found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = JSON.parse(jsonData);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

// Create a human-readable summary sheet
function saveSummary(ss, data) {
  let summarySheet = ss.getSheetByName('Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Summary');
  }
  
  summarySheet.clear();
  
  let row = 1;
  
  // Students summary
  summarySheet.getRange(row, 1).setValue('STUDENTS').setFontWeight('bold').setFontSize(14);
  row++;
  summarySheet.getRange(row, 1).setValue('Name');
  summarySheet.getRange(row, 2).setValue('ID');
  row++;
  
  if (data.students && data.students.length > 0) {
    data.students.forEach(student => {
      summarySheet.getRange(row, 1).setValue(student.fullName);
      summarySheet.getRange(row, 2).setValue(student.id);
      row++;
    });
  }
  
  row += 2;
  
  // Assessments summary
  summarySheet.getRange(row, 1).setValue('ASSESSMENTS').setFontWeight('bold').setFontSize(14);
  row++;
  summarySheet.getRange(row, 1).setValue('Name');
  summarySheet.getRange(row, 2).setValue('Subject');
  summarySheet.getRange(row, 3).setValue('Date');
  summarySheet.getRange(row, 4).setValue('Grades Recorded');
  row++;
  
  if (data.assessments && data.assessments.length > 0) {
    data.assessments.forEach(assessment => {
      summarySheet.getRange(row, 1).setValue(assessment.name);
      summarySheet.getRange(row, 2).setValue(assessment.subject);
      summarySheet.getRange(row, 3).setValue(assessment.date);
      summarySheet.getRange(row, 4).setValue(Object.keys(assessment.grades || {}).length);
      row++;
    });
  }
  
  row += 2;
  
  // Sync info
  summarySheet.getRange(row, 1).setValue('SYNC INFO').setFontWeight('bold').setFontSize(14);
  row++;
  summarySheet.getRange(row, 1).setValue('Last Sync:');
  summarySheet.getRange(row, 2).setValue(data.lastSync || 'Never');
  row++;
  summarySheet.getRange(row, 1).setValue('Total Students:');
  summarySheet.getRange(row, 2).setValue(data.students ? data.students.length : 0);
  row++;
  summarySheet.getRange(row, 1).setValue('Total Assessments:');
  summarySheet.getRange(row, 2).setValue(data.assessments ? data.assessments.length : 0);
  
  // Format
  summarySheet.setColumnWidth(1, 200);
  summarySheet.setColumnWidth(2, 200);
  summarySheet.setColumnWidth(3, 150);
  summarySheet.setColumnWidth(4, 150);
}
