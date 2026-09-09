import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from sheets_service import SheetsService

load_dotenv()

app = FastAPI(
    title="Personal Expense Tracker API",
    description="Privacy-preserving REST API abstraction backed by Google Sheets",
    version="1.0.0"
)

# Enable CORS for frontend Vite development & local network testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sheets_service = SheetsService()

# Pydantic Request Models
class TransactionCreate(BaseModel):
    id: Optional[str] = None
    amount: float = Field(gt=0, description="Expense amount must be greater than 0")
    description: str = Field(min_length=1, description="Expense description is mandatory")
    date: Optional[str] = None
    category: str = Field(default="Other")
    payment_mode: str = Field(default="UPI")
    group_id: Optional[str] = ""
    created_at: Optional[str] = None

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = Field(default=None, min_length=1)
    date: Optional[str] = None
    category: Optional[str] = None
    payment_mode: Optional[str] = None
    group_id: Optional[str] = None

class GroupCreate(BaseModel):
    group_name: str = Field(min_length=1, description="Group/Occasion name is mandatory")

class CategoryCreate(BaseModel):
    category_name: str = Field(min_length=1, description="Category name is mandatory")
    color: Optional[str] = "#10b981"
    icon: Optional[str] = "Tag"

from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow

# Health / Status Check
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "expense-tracker-api",
        "storage_mode": "google_sheets" if sheets_service.is_connected else "local_fallback"
    }

# In-memory and file-backed verifier store for PKCE state
OAUTH_SESSIONS = {}

@app.get("/api/auth/status")
def auth_status():
    return {
        "authenticated": sheets_service.is_connected,
        "storage_mode": "google_sheets" if sheets_service.is_connected else "local_fallback"
    }

@app.get("/api/auth/login")
def auth_login():
    """Web OAuth login redirect for browser-based sign in"""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    creds_path = os.path.join(backend_dir, "credentials.json")
    state_file = os.path.join(backend_dir, ".oauth_state.json")
    if not os.path.exists(creds_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="credentials.json not found in backend directory. Please configure your OAuth Client ID."
        )
    try:
        flow = Flow.from_client_secrets_file(
            creds_path,
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
            redirect_uri="http://localhost:8000/api/auth/callback"
        )
        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )
        verifier = getattr(flow, 'code_verifier', None)
        if state and verifier:
            OAUTH_SESSIONS[state] = verifier
            try:
                state_data = {}
                if os.path.exists(state_file):
                    with open(state_file, "r", encoding="utf-8") as sf:
                        state_data = json.load(sf)
                state_data[state] = verifier
                with open(state_file, "w", encoding="utf-8") as sf:
                    json.dump(state_data, sf)
            except Exception:
                pass

        return RedirectResponse(auth_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Google OAuth: {str(e)}"
        )

@app.get("/api/auth/callback")
def auth_callback(code: str, state: Optional[str] = None):
    """Handles OAuth callback, saves token.json, and redirects to frontend Web App"""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    creds_path = os.path.join(backend_dir, "credentials.json")
    token_path = os.path.join(backend_dir, "token.json")
    state_file = os.path.join(backend_dir, ".oauth_state.json")

    code_verifier = OAUTH_SESSIONS.get(state) if state else None
    if not code_verifier and state and os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as sf:
                state_data = json.load(sf)
                code_verifier = state_data.get(state)
        except Exception:
            pass

    try:
        flow = Flow.from_client_secrets_file(
            creds_path,
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
            redirect_uri="http://localhost:8000/api/auth/callback"
        )
        if code_verifier:
            flow.fetch_token(code=code, code_verifier=code_verifier)
        else:
            flow.fetch_token(code=code)

        creds = flow.credentials
        with open(token_path, "w", encoding="utf-8") as f:
            f.write(creds.to_json())

        # Refresh sheets service with new token
        sheets_service._init_connection()

        # Clean up temporary state file
        if os.path.exists(state_file):
            try:
                os.remove(state_file)
            except Exception:
                pass

        # Redirect user back to frontend PWA Web App
        return RedirectResponse("http://localhost:5173/?connected=true")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )

# GET /api/data
@app.get("/api/data")
def get_all_data():
    """
    Returns all non-deleted transactions and active groups.
    Hides all Google Sheet internals from the client.
    """
    try:
        data = sheets_service.get_all_data()
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch data: {str(e)}"
        )

# POST /api/transactions
@app.post("/api/transactions", status_code=status.HTTP_201_CREATED)
def create_transaction(tx: TransactionCreate):
    """
    Appends a new transaction with a unique UUID, timestamp, and is_deleted=False.
    """
    try:
        result = sheets_service.add_transaction(tx.model_dump())
        return {
            "success": True,
            "message": "Transaction created successfully",
            "transaction": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record transaction: {str(e)}"
        )

# PUT /api/transactions/:id
@app.put("/api/transactions/{transaction_id}")
def update_transaction(transaction_id: str, tx: TransactionUpdate):
    """
    Updates an existing transaction matching the UUID.
    """
    try:
        update_dict = {k: v for k, v in tx.model_dump().items() if v is not None}
        updated = sheets_service.update_transaction(transaction_id, update_dict)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction '{transaction_id}' not found"
            )
        return {
            "success": True,
            "message": "Transaction updated successfully",
            "transaction": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update transaction: {str(e)}"
        )

# DELETE /api/transactions/:id
@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: str):
    """
    Soft-deletes a transaction by setting is_deleted=True.
    """
    try:
        deleted = sheets_service.delete_transaction(transaction_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction '{transaction_id}' not found"
            )
        return {
            "success": True,
            "message": "Transaction marked as deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete transaction: {str(e)}"
        )

# POST /api/groups
@app.post("/api/groups", status_code=status.HTTP_201_CREATED)
def create_group(group: GroupCreate):
    """
    Creates a new purpose/occasion group.
    """
    try:
        result = sheets_service.add_group(group.group_name)
        return {
            "success": True,
            "message": "Group created successfully",
            "group": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create group: {str(e)}"
        )

# PUT /api/groups/:id/archive
@app.put("/api/groups/{group_id}/archive")
def archive_group(group_id: str):
    """
    Sets a group's status to 'archived'.
    """
    try:
        archived = sheets_service.archive_group(group_id)
        if not archived:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Group '{group_id}' not found"
            )
        return {
            "success": True,
            "message": f"Group '{group_id}' archived successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive group: {str(e)}"
        )

# POST /api/categories
@app.post("/api/categories", status_code=status.HTTP_201_CREATED)
def create_category(cat: CategoryCreate):
    """
    Creates a new custom category.
    """
    try:
        result = sheets_service.add_category(cat.model_dump())
        return {
            "success": True,
            "message": "Category created successfully",
            "category": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create category: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"[Server] Starting Expense Tracker API Server on http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
