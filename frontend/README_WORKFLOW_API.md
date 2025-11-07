# Workflow Management API

FastAPI backend for saving and retrieving workflow data.

## Setup

1. Install dependencies:
```bash
pip install -r requirements_workflow.txt
```

2. Configure database:
   - Edit `DATABASE_URL` in `backend_workflow_api.py`
   - Default is SQLite: `sqlite:///./workflows.db`
   - For PostgreSQL: `postgresql://user:password@localhost/dbname`
   - For MySQL: `mysql+pymysql://user:password@localhost/dbname`

3. Run the server:
```bash
python backend_workflow_api.py
```

Or using uvicorn directly:
```bash
uvicorn backend_workflow_api:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### POST /workflow/save
Save workflow data to the database.

**Headers:**
- `Authorization: Bearer chatbot-api-token-2024`

**Request Body:**
```json
{
  "workflow_id": "optional-existing-id",
  "workflow_name": "My Workflow",
  "nodes": [
    {
      "id": "node-1",
      "type": "text-input",
      "label": "Text Input",
      "prompt": "Please type your question:",
      "position_x": 100,
      "position_y": 200,
      "options_json": null,
      "form_fields_json": null,
      "next_nodes_json": "[\"node-2\"]",
      "order_index": 0,
      "workflow_id": "workflow-123",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "workflow_id": "uuid-here",
  "message": "Workflow saved successfully with 2 nodes"
}
```

### GET /workflow/{workflow_id}
Retrieve workflow data by workflow_id.

**Headers:**
- `Authorization: Bearer chatbot-api-token-2024`

**Response:**
```json
{
  "success": true,
  "workflow_id": "uuid-here",
  "nodes": [...]
}
```

### GET /workflows
List all unique workflow_ids.

**Headers:**
- `Authorization: Bearer chatbot-api-token-2024`

**Response:**
```json
{
  "success": true,
  "workflows": ["workflow-id-1", "workflow-id-2"]
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "workflow-api"
}
```

## Database Schema

The `workflow_nodes` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | String | Node identifier (primary key) |
| type | String | Node type (text-input, button-list, etc.) |
| label | String | Node label |
| prompt | Text | Prompt text |
| position_x | Integer | X coordinate |
| position_y | Integer | Y coordinate |
| options_json | Text | JSON string of options (nullable) |
| form_fields_json | Text | JSON string of form fields (nullable) |
| next_nodes_json | Text | JSON array of next node IDs (nullable) |
| order_index | Integer | Order index for execution |
| workflow_id | String | Workflow identifier (indexed) |
| created_at | DateTime | Creation timestamp |

## Authentication

All endpoints (except `/health`) require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer chatbot-api-token-2024
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `401`: Unauthorized (invalid or missing token)
- `404`: Workflow not found
- `500`: Internal server error

## Notes

- When updating an existing workflow, all old nodes are deleted and new ones are inserted
- The workflow_id is auto-generated if not provided
- All timestamps are stored in UTC

