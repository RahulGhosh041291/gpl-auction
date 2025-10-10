# Quick Setup Guide - Owner Registration Feature

## 🚀 Start the Application

### Backend Setup

```bash
cd backend

# The database tables will auto-create when you start the server
# OwnerRegistration table will be created automatically

# Start backend server
uvicorn main:app --reload
```

Backend will run at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Start frontend development server
npm start
```

Frontend will run at: `http://localhost:3000`

## 📋 Access the Feature

1. Open browser: `http://localhost:3000`
2. Click **"Owner Registration"** in the navigation menu
3. Or directly navigate to: `http://localhost:3000/owner-registration`

## ✅ Test the Feature

### Test Registration:

1. Fill in Owner Details:
   - Full Name: "John Doe"
   - Block: Select "Ophelia"
   - Unit Number: "101"

2. Fill in Co-Owner Details:
   - Full Name: "Jane Doe"
   - Block: Select "Bianca"
   - Unit Number: "202"

3. Select Interest:
   - Click "✓ Yes, I'm Interested" or "✗ No, Not at this time"

4. Click **"Submit Registration"**

5. See success message at top!

### Test Excel Export:

1. Scroll to bottom of page
2. See "Registrations Summary" with statistics
3. Click **"Export to Excel"** button
4. Excel file downloads automatically
5. Open file to see formatted data

## 📊 Excel File Contains:

- Event header (GPL Season 2 details)
- All registration data in organized columns
- Summary statistics (Total registrations, Interested buyers)
- Professional formatting with colors
- Auto-adjusted column widths

## 🔧 Troubleshooting

### Backend Issues:

**Error: "Table doesn't exist"**
```bash
# The table auto-creates on server start
# Just restart the backend:
cd backend
uvicorn main:app --reload
```

**Error: "Module not found: owner_registration"**
```bash
# Make sure the router file exists:
ls backend/routers/owner_registration.py

# Should show the file exists
```

### Frontend Issues:

**Error: "Page not found"**
```bash
# Make sure you pulled latest code:
cd frontend
git pull
npm start
```

**Error: "API call failed"**
```bash
# Check backend is running:
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

## 📱 Mobile Testing

The form is fully responsive! Test on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

All layouts adapt automatically.

## 🎨 UI Features

- ✅ Animated hero section with trophy icon
- ✅ Event details cards (Tournament, Auction, Venue, Price)
- ✅ Gradient backgrounds (Purple to Pink)
- ✅ Interactive radio buttons with animations
- ✅ Success banner with checkmark animation
- ✅ Real-time statistics cards
- ✅ Professional form validation
- ✅ Hover effects on all interactive elements

## 📝 API Endpoints

Test with curl or Postman:

### Create Registration:
```bash
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
```

### Get All Registrations:
```bash
curl http://localhost:8000/api/owner-registrations/
```

### Export Excel:
```bash
curl http://localhost:8000/api/owner-registrations/export/excel \
  --output registrations.xlsx
```

## 🎯 Success Indicators

1. ✅ Form submits without errors
2. ✅ Success message appears at top
3. ✅ Form fields clear after submission
4. ✅ Statistics counters update
5. ✅ Excel file downloads and opens correctly
6. ✅ Data appears formatted in Excel

## 🔐 Deployment Notes

### Render Backend:
- Database migrations will run automatically
- Table will be created on first deploy

### Netlify/AWS Frontend:
- Build command: `npm run build`
- Environment variables: Same as before (REACT_APP_API_URL)

## 📞 Support

If you encounter any issues:
1. Check backend logs in terminal
2. Check browser console (F12)
3. Verify both servers are running
4. Clear browser cache and try again

---

**Ready to use!** The feature is production-ready and fully functional. 🎉
