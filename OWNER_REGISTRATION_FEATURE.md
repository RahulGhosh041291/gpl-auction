# Owner Registration Feature

## Overview

A comprehensive owner registration system for Galaxia Premier League Season 2, allowing interested residents to register as team owners.

## Feature Highlights

### Event Information
- **Tournament:** Galaxia Premier League Season 2
- **Tournament Dates:** 10-11 January 2026
- **Auction Date:** 2nd November 2025
- **Venue:** Club Stella
- **Team Price:** ₹15,000 INR per team
- **Available Teams:** 12

### Registration Form Fields

#### Owner Details
- Full Name (Required)
- Residential Block (Dropdown: Ophelia, Bianca, Orion, Cygnus, Phoenix, Mynsa, Europa, Atlas, Capella)
- Unit Number (Required)

#### Co-Owner Details
- Full Name (Required)
- Residential Block (Dropdown)
- Unit Number (Required)

#### Purchase Interest
- Radio Button: Yes / No
- Question: "Are you interested in purchasing a team for ₹15,000 INR?"

### Features

1. **Beautiful UI/UX**
   - Gradient backgrounds
   - Animated success messages
   - Responsive design for all devices
   - Interactive radio buttons with hover effects

2. **Event Information Display**
   - Prominent event details at the top
   - Tournament and auction dates
   - Venue information
   - Team price highlight

3. **Excel Export**
   - Download all registrations as Excel file
   - Professionally formatted with:
     - Event header
     - Color-coded columns
     - Auto-adjusted column widths
     - Summary statistics (Total registrations, Interested buyers)
   - Timestamped filename

4. **Real-time Statistics**
   - Total Registrations counter
   - Interested to Buy counter
   - Teams Available display

5. **Admin Features**
   - View all registrations
   - Export to Excel
   - Real-time statistics dashboard

## Backend Implementation

### Database Model (`backend/models.py`)

```python
class OwnerRegistration(Base):
    __tablename__ = "owner_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_full_name = Column(String, nullable=False)
    co_owner_full_name = Column(String, nullable=False)
    owner_block = Column(Enum(BlockName), nullable=False)
    owner_unit_number = Column(String, nullable=False)
    co_owner_block = Column(Enum(BlockName), nullable=False)
    co_owner_unit_number = Column(String, nullable=False)
    interested_to_buy = Column(Boolean, nullable=False, default=False)
    team_price = Column(Float, default=15000.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### API Endpoints (`backend/routers/owner_registration.py`)

1. **POST `/api/owner-registrations/`**
   - Create new owner registration
   - Request body: OwnerRegistrationCreate schema
   - Returns: OwnerRegistrationResponse

2. **GET `/api/owner-registrations/`**
   - Get all owner registrations
   - Returns: List[OwnerRegistrationResponse]
   - Ordered by created_at (newest first)

3. **GET `/api/owner-registrations/{registration_id}`**
   - Get specific registration by ID
   - Returns: OwnerRegistrationResponse

4. **GET `/api/owner-registrations/export/excel`**
   - Export all registrations to Excel
   - Returns: StreamingResponse (Excel file)
   - Filename format: `GPL_Season2_Owner_Registrations_YYYYMMDD_HHMMSS.xlsx`

5. **DELETE `/api/owner-registrations/{registration_id}`**
   - Delete a registration
   - Returns: Success message

### Excel Export Format

```
+---------------------------------------------------------------------------------+
|                Galaxia Premier League Season 2 - Owner Registrations            |
|    Tournament: 10-11 January 2026 | Auction: 2nd November 2025 at Club Stella  |
|                          Team Price: ₹15,000                                    |
+---------------------------------------------------------------------------------+
| ID | Owner Name | Block | Unit | Co-Owner | Block | Unit | Interest | Price | Date |
+---------------------------------------------------------------------------------+
| 1  | John Doe   | Ophelia| 101 | Jane Doe | Bianca| 202 | Yes      |₹15,000| ... |
+---------------------------------------------------------------------------------+
|                                                                                 |
| Total Registrations: 25                                                         |
| Interested to Buy: 18                                                           |
+---------------------------------------------------------------------------------+
```

## Frontend Implementation

### Component: `OwnerRegistration.js`

Location: `frontend/src/pages/OwnerRegistration/`

#### Features:
- Framer Motion animations
- Real-time form validation
- Success/Error messaging
- Excel export functionality
- Responsive design

### Styling: `OwnerRegistration.css`

- Gradient backgrounds
- Card-based layout
- Animated buttons
- Mobile-responsive grid system
- Professional color scheme

### API Integration: `frontend/src/services/api.js`

```javascript
export const ownerRegistrationAPI = {
  register: (data) => api.post('/owner-registrations/', data),
  getAll: () => api.get('/owner-registrations/'),
  getById: (id) => api.get(`/owner-registrations/${id}`),
  exportExcel: () => api.get('/owner-registrations/export/excel', { 
    responseType: 'blob' 
  }),
  delete: (id) => api.delete(`/owner-registrations/${id}`),
};
```

## Navigation

### Route: `/owner-registration`

Added to:
- `App.js` - Main router configuration
- `Navbar.js` - Navigation menu item

Menu item displays as: **"Owner Registration"** with shield icon

## Database Migration

After pulling the code, run:

```bash
# Backend - Create tables
cd backend
python -m alembic revision --autogenerate -m "Add owner registration table"
python -m alembic upgrade head

# OR restart the backend server (tables auto-create)
uvicorn main:app --reload
```

The table will be automatically created when the backend starts due to `Base.metadata.create_all(bind=engine)` in `main.py`.

## Usage Flow

### For Residents (Potential Owners):

1. Navigate to `/owner-registration`
2. Fill in Owner details (Name, Block, Unit)
3. Fill in Co-Owner details (Name, Block, Unit)
4. Select interest: Yes or No for purchasing team
5. Click "Submit Registration"
6. Receive success confirmation

### For Admins:

1. Navigate to `/owner-registration`
2. Scroll to bottom "Registrations Summary" section
3. View statistics:
   - Total Registrations
   - Interested to Buy count
   - Teams Available
4. Click "Export to Excel" button
5. Excel file downloads automatically with all data

## Excel Export Details

### File Name Format:
```
GPL_Season2_Owner_Registrations_20251010_143025.xlsx
```

### Column Headers:
1. ID
2. Owner Full Name
3. Owner Block
4. Owner Unit
5. Co-Owner Full Name
6. Co-Owner Block
7. Co-Owner Unit
8. Interested to Buy (Yes/No)
9. Team Price (₹15,000)
10. Registration Date

### Features:
- Professional formatting with colors
- Auto-adjusted column widths
- Event information header
- Summary statistics footer
- Timestamp in filename

## Dependencies

### Backend:
- `openpyxl==3.1.2` - Excel file generation (already in requirements.txt)
- `fastapi` - API framework
- `sqlalchemy` - Database ORM

### Frontend:
- `react-router-dom` - Routing
- `framer-motion` - Animations
- `react-icons` - Icons
- `axios` - HTTP client

## Security

- No authentication required for registration (public form)
- Excel export available to all users (can be protected if needed)
- Input validation on both frontend and backend
- SQL injection protection via SQLAlchemy ORM

## Future Enhancements

1. Add admin-only export (require authentication)
2. Email notifications on registration
3. Payment gateway integration
4. Owner dashboard after purchase
5. Team selection interface
6. WhatsApp/SMS notifications
7. Registration approval workflow
8. Owner profile management

## Testing

### Manual Testing Steps:

1. **Form Submission:**
   ```bash
   # Navigate to http://localhost:3000/owner-registration
   # Fill all fields
   # Submit form
   # Check for success message
   ```

2. **Excel Export:**
   ```bash
   # Click "Export to Excel" button
   # Check downloaded file opens correctly
   # Verify all data is present
   # Check formatting is professional
   ```

3. **API Testing:**
   ```bash
   # Create registration
   curl -X POST http://localhost:8000/api/owner-registrations/ \
     -H "Content-Type: application/json" \
     -d '{
       "owner_full_name": "Test Owner",
       "co_owner_full_name": "Test Co-Owner",
       "owner_block": "Ophelia",
       "owner_unit_number": "101",
       "co_owner_block": "Bianca",
       "co_owner_unit_number": "202",
       "interested_to_buy": true
     }'
   
   # Get all registrations
   curl http://localhost:8000/api/owner-registrations/
   
   # Export Excel
   curl http://localhost:8000/api/owner-registrations/export/excel > test.xlsx
   ```

## Commit Message

```
Add Owner Registration feature for GPL Season 2

- Backend: Add OwnerRegistration model and API endpoints
- Backend: Implement Excel export with professional formatting
- Frontend: Create beautiful registration form with animations
- Frontend: Add real-time statistics dashboard
- Frontend: Implement Excel download functionality
- Navigation: Add Owner Registration link to navbar
- Documentation: Add comprehensive feature documentation

Features:
- Owner and Co-Owner details capture
- Block and Unit number selection
- Purchase interest radio buttons
- Event information display (Tournament, Auction dates, Venue)
- Excel export with summary statistics
- Responsive design for all devices
- Success/Error messaging
```

## Files Modified/Created

### Backend:
- ✅ `backend/models.py` - Added OwnerRegistration model
- ✅ `backend/schemas.py` - Added OwnerRegistration schemas
- ✅ `backend/main.py` - Registered owner_registration router
- ✅ `backend/routers/owner_registration.py` - Created new router

### Frontend:
- ✅ `frontend/src/pages/OwnerRegistration/OwnerRegistration.js` - Created component
- ✅ `frontend/src/pages/OwnerRegistration/OwnerRegistration.css` - Created styles
- ✅ `frontend/src/App.js` - Added route
- ✅ `frontend/src/components/Navbar/Navbar.js` - Added nav item
- ✅ `frontend/src/services/api.js` - Added API methods

### Documentation:
- ✅ `OWNER_REGISTRATION_FEATURE.md` - This file
