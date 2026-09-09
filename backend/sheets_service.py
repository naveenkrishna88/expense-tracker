import os
import json
import uuid
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
import gspread
from google.oauth2.service_account import Credentials
from google.oauth2.credentials import Credentials as UserCredentials
from google.auth.transport.requests import Request
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
LOCAL_STORE_PATH = BASE_DIR / "local_storage.json"
CREDS_FILE = os.getenv("CREDENTIALS_FILE", "credentials.json")
TOKEN_FILE = "token.json"
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID", "").strip()

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets"
]

def clean_sheet_id(val: str) -> str:
    if not val:
        return ""
    val = val.strip()
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", val)
    if match:
        return match.group(1)
    return val

class SheetsService:
    def __init__(self):
        self.is_connected = False
        self.client = None
        self.spreadsheet = None
        self._init_connection()

    def _init_connection(self):
        creds_path = BASE_DIR / CREDS_FILE
        token_path = BASE_DIR / TOKEN_FILE
        sheet_id = clean_sheet_id(os.getenv("SPREADSHEET_ID", ""))

        if not sheet_id:
            print("[SheetsService] SPREADSHEET_ID not configured in .env. Using local JSON store.")
            self.is_connected = False
            self._init_local_store()
            return

        # 1. Try OAuth 2.0 User Token
        if token_path.exists():
            try:
                user_creds = UserCredentials.from_authorized_user_file(str(token_path), SCOPES)
                if user_creds.expired and user_creds.refresh_token:
                    user_creds.refresh(Request())
                    with open(token_path, "w", encoding="utf-8") as tf:
                        tf.write(user_creds.to_json())
                self.client = gspread.authorize(user_creds)
                self.spreadsheet = self.client.open_by_key(sheet_id)
                self.is_connected = True
                print(f"[SheetsService] Authenticated as Google User. Connected to: '{self.spreadsheet.title}' ({sheet_id[:6]}...)")
                return
            except Exception as e:
                print(f"[SheetsService] OAuth token connection failed: {e}")

        # 2. Try Service Account
        if creds_path.exists():
            try:
                with open(creds_path, "r", encoding="utf-8") as f:
                    cdata = json.load(f)
                if cdata.get("type") == "service_account":
                    credentials = Credentials.from_service_account_file(str(creds_path), scopes=SCOPES)
                    self.client = gspread.authorize(credentials)
                    self.spreadsheet = self.client.open_by_key(sheet_id)
                    self.is_connected = True
                    print(f"[SheetsService] Authenticated via Service Account. Connected to: '{self.spreadsheet.title}' ({sheet_id[:6]}...)")
                    return
            except Exception as e:
                print(f"[SheetsService] Service account connection failed: {e}")

        print("[SheetsService] No active Google Sheets connection. Running in local fallback mode.")
        self.is_connected = False
        self._init_local_store()

    def _init_local_store(self):
        if not LOCAL_STORE_PATH.exists():
            default_data = {
                "groups": [
                    {
                        "group_id": "grp_general",
                        "group_name": "General Expenses",
                        "status": "active",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    },
                    {
                        "group_id": "grp_goa",
                        "group_name": "Goa Trip",
                        "status": "active",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    },
                    {
                        "group_id": "grp_reno",
                        "group_name": "Home Renovation",
                        "status": "active",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                ],
                "transactions": [
                    {
                        "id": str(uuid.uuid4()),
                        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
                        "amount": 450.0,
                        "description": "Artisan Coffee & Croissant",
                        "category": "Food",
                        "payment_mode": "UPI",
                        "group_id": "grp_general",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "is_deleted": False
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
                        "amount": 2800.0,
                        "description": "Flight Ticket Advance",
                        "category": "Travel",
                        "payment_mode": "Credit Card",
                        "group_id": "grp_goa",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "is_deleted": False
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
                        "amount": 1200.0,
                        "description": "High-Speed Internet Bill",
                        "category": "Utilities",
                        "payment_mode": "Net Banking",
                        "group_id": "grp_general",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "is_deleted": False
                    }
                ]
            }
            with open(LOCAL_STORE_PATH, "w", encoding="utf-8") as f:
                json.dump(default_data, f, indent=2)

    def _read_local_data(self) -> Dict[str, Any]:
        self._init_local_store()
        with open(LOCAL_STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_local_data(self, data: Dict[str, Any]):
        with open(LOCAL_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    # ==========================
    # DATA RETRIEVAL (GET /api/data)
    # ==========================
    def get_all_data(self) -> Dict[str, Any]:
        if not self.is_connected:
            local = self._read_local_data()
            transactions = [
                tx for tx in local.get("transactions", [])
                if not tx.get("is_deleted", False)
            ]
            groups = [
                g for g in local.get("groups", [])
                if g.get("status") == "active"
            ]
            all_groups = local.get("groups", [])
            categories = local.get("categories", [])
            return {
                "transactions": sorted(transactions, key=lambda x: x.get("date", ""), reverse=True),
                "groups": groups,
                "all_groups": all_groups,
                "categories": categories,
                "storage_mode": "local_fallback"
            }

        try:
            tx_ws = self.spreadsheet.worksheet("Transactions")
            tx_records = tx_ws.get_all_records()

            transactions = []
            for r in tx_records:
                is_del = str(r.get("is_deleted", "")).strip().lower() in ("true", "1", "yes")
                if not is_del and r.get("id"):
                    try:
                        amt = float(r.get("amount", 0))
                    except (ValueError, TypeError):
                        amt = 0.0
                    transactions.append({
                        "id": str(r.get("id")),
                        "date": str(r.get("date")),
                        "amount": amt,
                        "description": str(r.get("description")),
                        "category": str(r.get("category")),
                        "payment_mode": str(r.get("payment_mode")),
                        "group_id": str(r.get("group_id")),
                        "created_at": str(r.get("created_at")),
                        "is_deleted": False
                    })

            grp_ws = self.spreadsheet.worksheet("Groups")
            grp_records = grp_ws.get_all_records()

            active_groups = []
            all_groups = []
            for g in grp_records:
                if g.get("group_id"):
                    item = {
                        "group_id": str(g.get("group_id")),
                        "group_name": str(g.get("group_name")),
                        "status": str(g.get("status")),
                        "created_at": str(g.get("created_at"))
                    }
                    all_groups.append(item)
                    if str(g.get("status", "")).strip().lower() == "active":
                        active_groups.append(item)

            categories = []
            try:
                cat_ws = self.spreadsheet.worksheet("Categories")
                cat_records = cat_ws.get_all_records()
                for c in cat_records:
                    if c.get("category_id") or c.get("category_name"):
                        categories.append({
                            "category_id": str(c.get("category_id") or c.get("category_name")),
                            "category_name": str(c.get("category_name")),
                            "color": str(c.get("color") or "#10b981"),
                            "icon": str(c.get("icon") or "Tag"),
                            "created_at": str(c.get("created_at") or "")
                        })
            except Exception as e:
                # If worksheet is not yet created in sheet, check local storage
                local = self._read_local_data()
                categories = local.get("categories", [])

            return {
                "transactions": sorted(transactions, key=lambda x: x.get("date", ""), reverse=True),
                "groups": active_groups,
                "all_groups": all_groups,
                "categories": categories,
                "storage_mode": "google_sheets"
            }
        except Exception as e:
            print(f"[SheetsService] Error reading from Google Sheet: {e}. Falling back to local.")
            return self._read_local_data()

    # ==========================
    # TRANSACTIONS
    # ==========================
    def add_transaction(self, tx_data: Dict[str, Any]) -> Dict[str, Any]:
        tx_id = tx_data.get("id") or datetime.now().strftime("%Y%m%d%H%M%S")
        created_at = tx_data.get("created_at") or datetime.now(timezone.utc).isoformat()
        date_str = tx_data.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if " " in date_str:
            date_str = date_str.split(" ")[0]
        elif "T" in date_str:
            date_str = date_str.split("T")[0]

        new_tx = {
            "id": tx_id,
            "date": date_str,
            "amount": float(tx_data["amount"]),
            "description": str(tx_data["description"]).strip(),
            "category": str(tx_data.get("category", "Other")).strip(),
            "payment_mode": str(tx_data.get("payment_mode", "UPI")).strip(),
            "group_id": str(tx_data.get("group_id", "")).strip(),
            "created_at": created_at,
            "is_deleted": False
        }

        if not self.is_connected:
            local = self._read_local_data()
            local.setdefault("transactions", []).append(new_tx)
            self._write_local_data(local)
            return new_tx

        try:
            tx_ws = self.spreadsheet.worksheet("Transactions")
            row = [
                new_tx["id"],
                new_tx["date"],
                new_tx["amount"],
                new_tx["description"],
                new_tx["category"],
                new_tx["payment_mode"],
                new_tx["group_id"],
                new_tx["created_at"],
                "FALSE"
            ]
            tx_ws.append_row(row, value_input_option="USER_ENTERED")
            return new_tx
        except Exception as e:
            print(f"[SheetsService] Error adding transaction to Google Sheet: {e}. Saving locally.")
            local = self._read_local_data()
            local.setdefault("transactions", []).append(new_tx)
            self._write_local_data(local)
            return new_tx

    def update_transaction(self, tx_id: str, tx_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_connected:
            local = self._read_local_data()
            for tx in local.get("transactions", []):
                if tx.get("id") == tx_id:
                    if "amount" in tx_data:
                        tx["amount"] = float(tx_data["amount"])
                    if "description" in tx_data:
                        tx["description"] = str(tx_data["description"]).strip()
                    if "category" in tx_data:
                        tx["category"] = str(tx_data["category"]).strip()
                    if "payment_mode" in tx_data:
                        tx["payment_mode"] = str(tx_data["payment_mode"]).strip()
                    if "group_id" in tx_data:
                        tx["group_id"] = str(tx_data["group_id"]).strip()
                    if "date" in tx_data:
                        raw_d = str(tx_data["date"])
                        tx["date"] = raw_d.split(" ")[0].split("T")[0]
                    self._write_local_data(local)
                    return tx
            return None

        try:
            tx_ws = self.spreadsheet.worksheet("Transactions")
            records = tx_ws.get_all_records()
            row_idx = None
            existing = None
            for i, r in enumerate(records, start=2):
                if str(r.get("id")) == tx_id:
                    row_idx = i
                    existing = r
                    break

            if not row_idx:
                return None

            raw_date = str(tx_data.get("date", existing.get("date")))
            date_val = raw_date.split(" ")[0].split("T")[0]
            amt_val = float(tx_data.get("amount", existing.get("amount")))
            desc_val = str(tx_data.get("description", existing.get("description"))).strip()
            cat_val = str(tx_data.get("category", existing.get("category"))).strip()
            mode_val = str(tx_data.get("payment_mode", existing.get("payment_mode"))).strip()
            grp_val = str(tx_data.get("group_id", existing.get("group_id"))).strip()

            tx_ws.update(
                f"B{row_idx}:G{row_idx}",
                [[date_val, amt_val, desc_val, cat_val, mode_val, grp_val]],
                value_input_option="USER_ENTERED"
            )

            return {
                "id": tx_id,
                "date": date_val,
                "amount": amt_val,
                "description": desc_val,
                "category": cat_val,
                "payment_mode": mode_val,
                "group_id": grp_val,
                "created_at": str(existing.get("created_at")),
                "is_deleted": False
            }
        except Exception as e:
            print(f"[SheetsService] Error updating transaction in Google Sheet: {e}")
            return None

    def delete_transaction(self, tx_id: str) -> bool:
        if not self.is_connected:
            local = self._read_local_data()
            found = False
            for tx in local.get("transactions", []):
                if tx.get("id") == tx_id:
                    tx["is_deleted"] = True
                    found = True
                    break
            if found:
                self._write_local_data(local)
            return found

        try:
            tx_ws = self.spreadsheet.worksheet("Transactions")
            records = tx_ws.get_all_records()
            row_idx = None
            for i, r in enumerate(records, start=2):
                if str(r.get("id")) == tx_id:
                    row_idx = i
                    break

            if not row_idx:
                return False

            tx_ws.update(f"I{row_idx}", [["TRUE"]], value_input_option="USER_ENTERED")
            return True
        except Exception as e:
            print(f"[SheetsService] Error deleting transaction from Google Sheet: {e}")
            return False

    # ==========================
    # GROUPS / OCCASIONS
    # ==========================
    def add_group(self, group_name: str) -> Dict[str, Any]:
        group_id = f"grp_{uuid.uuid4().hex[:8]}"
        created_at = datetime.now(timezone.utc).isoformat()
        new_group = {
            "group_id": group_id,
            "group_name": group_name.strip(),
            "status": "active",
            "created_at": created_at
        }

        if not self.is_connected:
            local = self._read_local_data()
            local.setdefault("groups", []).append(new_group)
            self._write_local_data(local)
            return new_group

        try:
            grp_ws = self.spreadsheet.worksheet("Groups")
            row = [new_group["group_id"], new_group["group_name"], new_group["status"], new_group["created_at"]]
            grp_ws.append_row(row, value_input_option="USER_ENTERED")
            return new_group
        except Exception as e:
            print(f"[SheetsService] Error adding group to Google Sheet: {e}. Saving locally.")
            local = self._read_local_data()
            local.setdefault("groups", []).append(new_group)
            self._write_local_data(local)
            return new_group

    def archive_group(self, group_id: str) -> bool:
        if not self.is_connected:
            local = self._read_local_data()
            found = False
            for g in local.get("groups", []):
                if g.get("group_id") == group_id:
                    g["status"] = "archived"
                    found = True
                    break
            if found:
                self._write_local_data(local)
            return found

        try:
            grp_ws = self.spreadsheet.worksheet("Groups")
            records = grp_ws.get_all_records()
            row_idx = None
            for i, r in enumerate(records, start=2):
                if str(r.get("group_id")) == group_id:
                    row_idx = i
                    break

            if not row_idx:
                return False

            grp_ws.update(f"C{row_idx}", [["archived"]], value_input_option="USER_ENTERED")
            return True
        except Exception as e:
            print(f"[SheetsService] Error archiving group in Google Sheet: {e}")
            return False

    # ==========================
    # CATEGORIES
    # ==========================
    def add_category(self, cat_data: Dict[str, Any]) -> Dict[str, Any]:
        cat_name = str(cat_data.get("category_name", "")).strip()
        cat_id = cat_data.get("category_id") or cat_name
        color = cat_data.get("color") or "#10b981"
        icon = cat_data.get("icon") or "Tag"
        created_at = datetime.now(timezone.utc).isoformat()

        new_cat = {
            "category_id": cat_id,
            "category_name": cat_name,
            "color": color,
            "icon": icon,
            "created_at": created_at
        }

        # Always update local storage
        local = self._read_local_data()
        existing_cats = local.setdefault("categories", [])
        if not any(c.get("category_name", "").lower() == cat_name.lower() for c in existing_cats):
            existing_cats.append(new_cat)
            self._write_local_data(local)

        if not self.is_connected:
            return new_cat

        try:
            cat_ws = self.spreadsheet.worksheet("Categories")
            row = [new_cat["category_id"], new_cat["category_name"], new_cat["color"], new_cat["icon"], new_cat["created_at"]]
            cat_ws.append_row(row, value_input_option="USER_ENTERED")
            return new_cat
        except Exception as e:
            print(f"[SheetsService] Notice: Could not append to 'Categories' worksheet: {e}. Saved in local fallback.")
            return new_cat
