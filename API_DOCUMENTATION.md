# API Documentation

## Base URL
- **Production**: `https://your-project.vercel.app/api`
- **Development**: `http://localhost:3000/api`

---

## Endpoints

### 1. Initialize Database
**Endpoint**: `GET /api/init`

**Description**: Creates database tables if they don't exist

**Response**:
```json
{
  "success": true,
  "message": "Database initialized successfully"
}
```

---

### 2. Records API

#### Get All Records
**Endpoint**: `GET /api/records`

**Response**:
```json
{
  "success": true,
  "records": [
    {
      "id": 1,
      "patientName": "John Doe",
      "folderNumber": "FN001",
      "reviewDate": "2025-12-18",
      "hospitalName": "Niger Foundation Hospital Enugu",
      "serviceType": "Surgery",
      "serviceDetails": "Surgery",
      "fee": 50000.00,
      "notes": "Post-operative care required",
      "createdAt": "2025-12-18T10:30:00.000Z"
    }
  ]
}
```

#### Create Record
**Endpoint**: `POST /api/records`

**Request Body**:
```json
{
  "patientName": "John Doe",
  "folderNumber": "FN001",
  "reviewDate": "2025-12-18",
  "hospitalName": "Niger Foundation Hospital Enugu",
  "serviceType": "Surgery",
  "serviceDetails": "Surgery",
  "fee": 50000.00,
  "notes": "Post-operative care required"
}
```

**Response**:
```json
{
  "success": true,
  "record": { /* created record */ }
}
```

#### Update Record
**Endpoint**: `PUT /api/records`

**Request Body**:
```json
{
  "id": 1,
  "patientName": "John Doe",
  "folderNumber": "FN001",
  "reviewDate": "2025-12-18",
  "hospitalName": "Niger Foundation Hospital Enugu",
  "serviceType": "Surgery",
  "serviceDetails": "Surgery",
  "fee": 50000.00,
  "notes": "Updated notes"
}
```

**Response**:
```json
{
  "success": true,
  "record": { /* updated record */ }
}
```

#### Delete Record
**Endpoint**: `DELETE /api/records?id=1`

**Response**:
```json
{
  "success": true,
  "message": "Record deleted"
}
```

---

### 3. Patients API

#### Get All Patients
**Endpoint**: `GET /api/patients`

**Response**:
```json
{
  "success": true,
  "patients": {
    "FN001": {
      "folderNumber": "FN001",
      "patientName": "John Doe",
      "firstVisit": "2025-12-01"
    }
  }
}
```

---

### 4. Backup API

#### Export All Data
**Endpoint**: `GET /api/backup`

**Response**:
```json
{
  "success": true,
  "data": {
    "records": [ /* all records */ ],
    "patients": { /* all patients */ },
    "exportDate": "2025-12-18T10:30:00.000Z",
    "appVersion": "2.0"
  }
}
```

#### Import/Restore Data
**Endpoint**: `POST /api/backup`

**Request Body**:
```json
{
  "records": [ /* records to import */ ],
  "patients": { /* patients to import */ },
  "merge": true
}
```

**merge**: 
- `true` - Merge with existing data (add new, keep existing)
- `false` - Replace all data (WARNING: deletes existing data)

**Response**:
```json
{
  "success": true,
  "message": "Merged successfully: 10 records, 5 patients added"
}
```

---

## Database Schema

### patients Table
```sql
CREATE TABLE patients (
  folder_number VARCHAR(100) PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  first_visit DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### records Table
```sql
CREATE TABLE records (
  id BIGSERIAL PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  folder_number VARCHAR(100) NOT NULL,
  review_date DATE NOT NULL,
  hospital_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  service_details TEXT NOT NULL,
  fee DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_timestamp,
  FOREIGN KEY (folder_number) REFERENCES patients(folder_number) ON DELETE CASCADE
);
```

### Indexes
- `idx_records_date` - On `review_date DESC` for fast date queries
- `idx_records_folder` - On `folder_number` for patient lookups

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Server Error

---

## CORS

All API endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Rate Limiting

Vercel Free Tier limits:
- 100 GB-hours/month of serverless function execution
- No per-request limits

For production use, consider upgrading for higher limits.
