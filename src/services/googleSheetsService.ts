import { Asset, AssetHistoryRecord, GoogleSheetsConfig, SystemSettingsState } from '../types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export async function createNewAssetSpreadsheet(
  accessToken: string,
  title: string = 'ระบบบริหารทรัพย์สินมหาวิทยาลัย (Asset Management)'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Assets (ข้อมูลทรัพย์สิน)',
            gridProperties: { rowCount: 1000, columnCount: 20 },
          },
        },
        {
          properties: {
            title: 'AssetHistory (ประวัติทรัพย์สิน)',
            gridProperties: { rowCount: 1000, columnCount: 15 },
          },
        },
        {
          properties: {
            title: 'MasterSettings (ตั้งค่าระบบ)',
            gridProperties: { rowCount: 500, columnCount: 10 },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `สร้าง Google Sheet ไม่สำเร็จ (${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
}

export async function syncDataToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  assets: Asset[],
  history: AssetHistoryRecord[],
  settings: SystemSettingsState
): Promise<{ success: boolean; updatedCells: number }> {
  // Format Assets data
  const assetHeaders = [
    'รหัสทรัพย์สิน',
    'ชื่อทรัพย์สิน',
    'ประเภทอุปกรณ์',
    'วิทยาเขต',
    'สังกัด/คณะ',
    'สาขา/หน่วยงาน',
    'อาคาร',
    'ชื่อห้อง',
    'จำนวน',
    'วันที่ซื้อ',
    'ราคา (บาท)',
    'สถานะ',
    'หมายเหตุ',
    'URL รูปภาพ',
    'วันที่บันทึกล่าสุด',
  ];

  const assetRows = assets.map((a) => [
    a.assetCode,
    a.name,
    a.typeName,
    a.campusName,
    a.facultyName,
    a.departmentName,
    a.buildingName,
    a.room,
    a.quantity,
    a.purchaseDate,
    a.price,
    a.status,
    a.note || '',
    a.imageUrl || '',
    a.updatedAt ? new Date(a.updatedAt).toLocaleString('th-TH') : '',
  ]);

  // Format History data
  const historyHeaders = [
    'รหัสประวัติ',
    'รหัสทรัพย์สิน',
    'ชื่อทรัพย์สิน',
    'วันเวลาที่ดำเนินการ',
    'ประเภทรายการ',
    'สถานะเดิม',
    'สถานะใหม่',
    'หมายเหตุ/รายละเอียด',
    'ผู้ดำเนินการ',
  ];

  const historyRows = history.map((h) => [
    h.id,
    h.assetCode,
    h.assetName,
    new Date(h.timestamp).toLocaleString('th-TH'),
    h.actionLabel || h.action,
    h.previousStatus || '-',
    h.newStatus || '-',
    h.note || '',
    h.performedBy || '',
  ]);

  // Format Settings data
  const settingsHeaders = ['หมวดหมู่การตั้งค่า', 'รหัส', 'ชื่อการตั้งค่า'];
  const settingsRows: string[][] = [];

  settings.assetTypes.forEach((t) => settingsRows.push(['ประเภทอุปกรณ์', t.code, t.name]));
  settings.campuses.forEach((c) => settingsRows.push(['วิทยาเขต', c.code, c.name]));
  settings.faculties.forEach((f) => settingsRows.push(['สังกัด/คณะ', f.code, f.name]));
  settings.departments.forEach((d) => settingsRows.push(['สาขา/หน่วยงาน', d.code, d.name]));
  settings.buildings.forEach((b) => settingsRows.push(['อาคาร', b.code, b.name]));

  // Clear and update all 3 sheets using batchUpdate values
  const payload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Assets (ข้อมูลทรัพย์สิน)'!A1:O" + (assetRows.length + 10),
        values: [assetHeaders, ...assetRows],
      },
      {
        range: "'AssetHistory (ประวัติทรัพย์สิน)'!A1:I" + (historyRows.length + 10),
        values: [historyHeaders, ...historyRows],
      },
      {
        range: "'MasterSettings (ตั้งค่าระบบ)'!A1:C" + (settingsRows.length + 10),
        values: [settingsHeaders, ...settingsRows],
      },
    ],
  };

  const updateResponse = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!updateResponse.ok) {
    // If sheet name doesn't match, attempt simple update to Sheet1
    const fallbackResponse = await fetch(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [assetHeaders, ...assetRows],
        }),
      }
    );

    if (!fallbackResponse.ok) {
      const err = await updateResponse.json().catch(() => ({}));
      throw new Error(err.error?.message || `บันทึกข้อมูลลง Google Sheet ไม่สำเร็จ (${updateResponse.status})`);
    }

    return { success: true, updatedCells: assetRows.length * assetHeaders.length };
  }

  const result = await updateResponse.json();
  return { success: true, updatedCells: result.totalUpdatedCells || 1 };
}
