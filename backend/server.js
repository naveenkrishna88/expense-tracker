const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sheetsService = require('./sheets_service');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'expense-tracker-api-node',
    storage_mode: sheetsService.isConnected ? 'google_sheets' : 'local_fallback'
  });
});

// GET /api/data
app.get('/api/data', async (req, res) => {
  try {
    const data = await sheetsService.getAllData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data', detail: err.message });
  }
});

// POST /api/transactions
app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, description, date, category, payment_mode, group_id, id, created_at } = req.body;
    if (amount === undefined || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'Description is mandatory' });
    }

    const tx = await sheetsService.addTransaction({
      id,
      amount: Number(amount),
      description,
      date,
      category,
      payment_mode,
      group_id,
      created_at
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: tx
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record transaction', detail: err.message });
  }
});

// PUT /api/transactions/:id
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, date, category, payment_mode, group_id } = req.body;

    if (amount !== undefined && (isNaN(amount) || Number(amount) <= 0)) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    if (description !== undefined && !String(description).trim()) {
      return res.status(400).json({ error: 'Description cannot be empty' });
    }

    const updated = await sheetsService.updateTransaction(id, {
      amount,
      description,
      date,
      category,
      payment_mode,
      group_id
    });

    if (!updated) {
      return res.status(404).json({ error: `Transaction '${id}' not found` });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updated
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction', detail: err.message });
  }
});

// DELETE /api/transactions/:id
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await sheetsService.deleteTransaction(id);
    if (!deleted) {
      return res.status(404).json({ error: `Transaction '${id}' not found` });
    }
    res.json({
      success: true,
      message: 'Transaction marked as deleted'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction', detail: err.message });
  }
});

// POST /api/groups
app.post('/api/groups', async (req, res) => {
  try {
    const { group_name } = req.body;
    if (!group_name || !String(group_name).trim()) {
      return res.status(400).json({ error: 'group_name is mandatory' });
    }

    const group = await sheetsService.addGroup(group_name);
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group', detail: err.message });
  }
});

// PUT /api/groups/:id/archive
app.put('/api/groups/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const archived = await sheetsService.archiveGroup(id);
    if (!archived) {
      return res.status(404).json({ error: `Group '${id}' not found` });
    }
    res.json({
      success: true,
      message: `Group '${id}' archived successfully`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive group', detail: err.message });
  }
});

// POST /api/categories
app.post('/api/categories', async (req, res) => {
  try {
    const { category_name, color, icon, category_id } = req.body;
    if (!category_name || !String(category_name).trim()) {
      return res.status(400).json({ error: 'category_name is mandatory' });
    }

    const cat = await sheetsService.addCategory({
      category_name: category_name.trim(),
      category_id: category_id || category_name.trim(),
      color: color || '#10b981',
      icon: icon || 'Tag'
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: cat
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category', detail: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Expense Tracker Express Server running on http://localhost:${PORT}`);
});
