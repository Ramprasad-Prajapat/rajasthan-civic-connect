# RajCivic Connect — API Versioning & Envelope Standard

## 1. Versioning Strategy
- **Base Endpoint Prefix**: `/api/v1/`
- **Legacy Aliases**: `/api/` endpoints map to `v1` for full backward compatibility.

## 2. Standardized Response Envelopes
### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "requestId": "REQ-1785082910"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ACCESS",
    "message": "Authentication token expired or missing"
  },
  "requestId": "REQ-1785082910"
}
```
