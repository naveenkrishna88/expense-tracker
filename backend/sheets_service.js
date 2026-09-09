const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
require('dotenv').config();

const BASE_DIR = __dirname;
const LOCAL_STORE_PATH = path.join(BASE_DIR, 'local_storage.json');
const CREDS_FILE = process.env.CREDENTIALS_FILE || 'credentials.json';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

class SheetsService {
  constructor() {
    this.isConnected = false;
    this.sheets = null;
    this.spreadsheetId = SPREADSHEET_ID.trim();
    this.initConnection();
  }

  initConnection() {
    const credsPath = path.join(BASE_DIR, CREDS_FILE);
    if (fs.existsSync(credsPath) && this.spreadsheetId) {
      try {
        const auth = new google.auth.GoogleAuth({
          keyFile: credsPath,
          scopes: SCOPES,
        });
        this.sheets = google.sheets({ version: 'v4', auth });
        this.isConnected = true;
        console.log(`[SheetsService-Node] Connected to Google Sheet: ${this.spreadsheetId.slice(0, 6)}...`);
        return;
      } catch (err) {
        console.warn(`[SheetsService-Node] Failed to connect: ${err.message}. Using local storage fallback.`);
      }
    } else {
      console.log('[SheetsService-Node] Credentials or SPREADSHEET_ID not provided. Using local JSON store.');
    }
    this.isConnected = false;
    this.initLocalStore();
  }

  initLocalStore() {
    if (!fs.existsSync(LOCAL_STORE_PATH)) {
      const defaultData = {
        groups: [
          { group_id: 'grp_general', group_name: 'General Expenses', status: 'active', created_at: new Date().toISOString() },
          { group_id: 'grp_goa', group_name: 'Goa Trip', status: 'active', created_at: new Date().toISOString() },
          { group_id: 'grp_reno', group_name: 'Home Renovation', status: 'active', created_at: new Date().toISOString() }
        ],
        transactions: [
          {
            id: uuidv4(),
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            amount: 450,
            description: 'Artisan Coffee & Croissant',
            category: 'Food',
            payment_mode: 'UPI',
            group_id: 'grp_general',
            created_at: new Date().toISOString(),
            is_deleted: false
          },
          {
            id: uuidv4(),
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            amount: 2800,
            description: 'Flight Ticket Advance',
            category: 'Travel',
            payment_mode: 'Credit Card',
            group_id: 'grp_goa',
            created_at: new Date().toISOString(),
            is_deleted: false
          },
          {
            id: uuidv4(),
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            amount: 1200,
            description: 'High-Speed Internet Bill',
            category: 'Utilities',
            payment_mode: 'Net Banking',
            group_id: 'grp_general',
            created_at: new Date().toISOString(),
            is_deleted: false
          }
        ]
      };
      fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
    }
  }

  readLocalData() {
    this.initLocalStore();
    return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf8'));
  }

  writeLocalData(data) {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  }

  async getAllData() {
    if (!this.isConnected) {
      const local = this.readLocalData();
      return {
        transactions: (local.transactions || [])
          .filter(t => !t.is_deleted)
          .sort((a, b) => new Date(b.date) - new Date(a.date)),
        groups: (local.groups || []).filter(g => g.status === 'active'),
        all_groups: local.groups || [],
        categories: local.categories || [],
        storage_mode: 'local_fallback'
      };
    }

    try {
      const [txRes, grpRes, catRes] = await Promise.all([
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Transactions!A2:I',
        }),
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Groups!A2:D',
        }),
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Categories!A2:E',
        }).catch(() => ({ data: { values: [] } })),
      ]);

      const txRows = txRes.data.values || [];
      const transactions = [];
      for (const r of txRows) {
        const isDeleted = String(r[8] || '').trim().toLowerCase() === 'true';
        if (!isDeleted && r[0]) {
          transactions.push({
            id: r[0],
            date: r[1] || '',
            amount: parseFloat(r[2]) || 0,
            description: r[3] || '',
            category: r[4] || 'Other',
            payment_mode: r[5] || 'UPI',
            group_id: r[6] || '',
            created_at: r[7] || '',
            is_deleted: false
          });
        }
      }

      const grpRows = grpRes.data.values || [];
      const activeGroups = [];
      const allGroups = [];
      for (const g of grpRows) {
        if (g[0]) {
          const item = {
            group_id: g[0],
            group_name: g[1] || '',
            status: g[2] || 'active',
            created_at: g[3] || ''
          };
          allGroups.push(item);
          if (String(g[2] || '').trim().toLowerCase() === 'active') {
            activeGroups.push(item);
          }
        }
      }

      const catRows = (catRes && catRes.data && catRes.data.values) || [];
      const categories = [];
      for (const c of catRows) {
        if (c[0] || c[1]) {
          categories.push({
            category_id: c[0] || c[1],
            category_name: c[1] || c[0],
            color: c[2] || '#10b981',
            icon: c[3] || 'Tag',
            created_at: c[4] || ''
          });
        }
      }

      return {
        transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
        groups: activeGroups,
        all_groups: allGroups,
        categories: categories.length > 0 ? categories : (this.readLocalData().categories || []),
        storage_mode: 'google_sheets'
      };
    } catch (err) {
      console.error('[SheetsService-Node] Error fetching from Sheets:', err.message);
      return this.getAllDataLocalFallback();
    }
  }

  getAllDataLocalFallback() {
    const local = this.readLocalData();
    return {
      transactions: (local.transactions || [])
        .filter(t => !t.is_deleted)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
      groups: (local.groups || []).filter(g => g.status === 'active'),
      all_groups: local.groups || [],
      categories: local.categories || [],
      storage_mode: 'local_fallback'
    };
  }

  async addCategory(catData) {
    const newCat = {
      category_id: catData.category_id || catData.category_name,
      category_name: catData.category_name,
      color: catData.color || '#10b981',
      icon: catData.icon || 'Tag',
      created_at: new Date().toISOString()
    };

    const local = this.readLocalData();
    local.categories = local.categories || [];
    if (!local.categories.some(c => c.category_name.toLowerCase() === newCat.category_name.toLowerCase())) {
      local.categories.push(newCat);
      this.writeLocalData(local);
    }

    if (!this.isConnected) {
      return newCat;
    }

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Categories!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[newCat.category_id, newCat.category_name, newCat.color, newCat.icon, newCat.created_at]]
        }
      });
      return newCat;
    } catch (err) {
      console.warn('[SheetsService-Node] Could not append to Categories sheet:', err.message);
      return newCat;
    }
  }

  async addTransaction(txData) {
    const rawDate = txData.date || new Date().toISOString().slice(0, 10);
    const dateStr = String(rawDate).split('T')[0].split(' ')[0];
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const timestampId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const newTx = {
      id: txData.id || timestampId,
      date: dateStr,
      amount: parseFloat(txData.amount),
      description: String(txData.description).trim(),
      category: String(txData.category || 'Other').trim(),
      payment_mode: String(txData.payment_mode || 'UPI').trim(),
      group_id: String(txData.group_id || '').trim(),
      created_at: txData.created_at || new Date().toISOString(),
      is_deleted: false
    };

    if (!this.isConnected) {
      const local = this.readLocalData();
      local.transactions = local.transactions || [];
      local.transactions.push(newTx);
      this.writeLocalData(local);
      return newTx;
    }

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newTx.id,
              newTx.date,
              newTx.amount,
              newTx.description,
              newTx.category,
              newTx.payment_mode,
              newTx.group_id,
              newTx.created_at,
              'FALSE'
            ]
          ]
        }
      });
      return newTx;
    } catch (err) {
      console.error('[SheetsService-Node] Error appending to Sheets:', err.message);
      const local = this.readLocalData();
      local.transactions = local.transactions || [];
      local.transactions.push(newTx);
      this.writeLocalData(local);
      return newTx;
    }
  }

  async updateTransaction(id, updates) {
    if (!this.isConnected) {
      const local = this.readLocalData();
      const tx = (local.transactions || []).find(t => t.id === id);
      if (!tx) return null;
      if (updates.amount !== undefined) tx.amount = parseFloat(updates.amount);
      if (updates.description !== undefined) tx.description = String(updates.description).trim();
      if (updates.category !== undefined) tx.category = String(updates.category).trim();
      if (updates.payment_mode !== undefined) tx.payment_mode = String(updates.payment_mode).trim();
      if (updates.group_id !== undefined) tx.group_id = String(updates.group_id).trim();
      if (updates.date !== undefined) tx.date = String(updates.date).split('T')[0].split(' ')[0];
      this.writeLocalData(local);
      return tx;
    }

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A2:I',
      });
      const rows = res.data.values || [];
      let rowIndex = -1;
      let existingRow = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === id) {
          rowIndex = i + 2; // header is row 1
          existingRow = rows[i];
          break;
        }
      }
      if (rowIndex === -1) return null;

      const rawDate = updates.date !== undefined ? updates.date : existingRow[1];
      const dateVal = String(rawDate).split('T')[0].split(' ')[0];
      const amtVal = updates.amount !== undefined ? parseFloat(updates.amount) : parseFloat(existingRow[2]);
      const descVal = updates.description !== undefined ? String(updates.description).trim() : existingRow[3];
      const catVal = updates.category !== undefined ? String(updates.category).trim() : existingRow[4];
      const modeVal = updates.payment_mode !== undefined ? String(updates.payment_mode).trim() : existingRow[5];
      const grpVal = updates.group_id !== undefined ? String(updates.group_id).trim() : existingRow[6];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Transactions!B${rowIndex}:G${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[dateVal, amtVal, descVal, catVal, modeVal, grpVal]]
        }
      });

      return {
        id,
        date: dateVal,
        amount: amtVal,
        description: descVal,
        category: catVal,
        payment_mode: modeVal,
        group_id: grpVal,
        created_at: existingRow[7] || '',
        is_deleted: false
      };
    } catch (err) {
      console.error('[SheetsService-Node] update error:', err.message);
      return null;
    }
  }

  async deleteTransaction(id) {
    if (!this.isConnected) {
      const local = this.readLocalData();
      const tx = (local.transactions || []).find(t => t.id === id);
      if (!tx) return false;
      tx.is_deleted = true;
      this.writeLocalData(local);
      return true;
    }

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A2:I',
      });
      const rows = res.data.values || [];
      let rowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === id) {
          rowIndex = i + 2;
          break;
        }
      }
      if (rowIndex === -1) return false;

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Transactions!I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['TRUE']]
        }
      });
      return true;
    } catch (err) {
      console.error('[SheetsService-Node] delete error:', err.message);
      return false;
    }
  }

  async addGroup(groupName) {
    const newGroup = {
      group_id: `grp_${uuidv4().slice(0, 8)}`,
      group_name: groupName.trim(),
      status: 'active',
      created_at: new Date().toISOString()
    };

    if (!this.isConnected) {
      const local = this.readLocalData();
      local.groups = local.groups || [];
      local.groups.push(newGroup);
      this.writeLocalData(local);
      return newGroup;
    }

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Groups!A:D',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[newGroup.group_id, newGroup.group_name, newGroup.status, newGroup.created_at]]
        }
      });
      return newGroup;
    } catch (err) {
      console.error('[SheetsService-Node] group add error:', err.message);
      const local = this.readLocalData();
      local.groups = local.groups || [];
      local.groups.push(newGroup);
      this.writeLocalData(local);
      return newGroup;
    }
  }

  async archiveGroup(groupId) {
    if (!this.isConnected) {
      const local = this.readLocalData();
      const grp = (local.groups || []).find(g => g.group_id === groupId);
      if (!grp) return false;
      grp.status = 'archived';
      this.writeLocalData(local);
      return true;
    }

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Groups!A2:D',
      });
      const rows = res.data.values || [];
      let rowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === groupId) {
          rowIndex = i + 2;
          break;
        }
      }
      if (rowIndex === -1) return false;

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Groups!C${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['archived']]
        }
      });
      return true;
    } catch (err) {
      console.error('[SheetsService-Node] archive error:', err.message);
      return false;
    }
  }
}

module.exports = new SheetsService();
