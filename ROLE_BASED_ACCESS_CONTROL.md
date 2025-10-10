# Role-Based Access Control for Live Auction

## Overview

Implemented role-based access control to restrict critical auction operations to Admin users only. GenericUser role can now only view the auction but cannot interact with bidding controls.

## Changes Made

### Frontend Changes (`frontend/src/pages/LiveAuction/LiveAuction.js`)

#### 1. **Place Bid Button**
- **Disabled for:** GenericUser role
- **Button state:** Greyed out and non-clickable
- **Tooltip:** "Admin only" for generic users
- **Function check:** Added role validation in `placeBid()` function
  ```javascript
  if (userRole === 'generic_user') {
    setError('You do not have permission to place bids');
    alert('Only admin users can place bids. Please contact an administrator.');
    return;
  }
  ```

#### 2. **Mark Sold Button**
- **Disabled for:** GenericUser role
- **Button state:** Greyed out and non-clickable
- **Tooltip:** "Admin only" for generic users
- **Function check:** Added role validation in `markSold()` function
  ```javascript
  if (userRole === 'generic_user') {
    alert('Only admin users can mark players as sold. Please contact an administrator.');
    return;
  }
  ```

#### 3. **Mark Unsold Button**
- **Disabled for:** GenericUser role
- **Button state:** Greyed out and non-clickable
- **Tooltip:** "Admin only" for generic users
- **Function check:** Added role validation in `markUnsold()` function
  ```javascript
  if (userRole === 'generic_user') {
    alert('Only admin users can mark players as unsold. Please contact an administrator.');
    return;
  }
  ```

### Backend Changes (`backend/routers/auction.py`)

#### 1. **Place Bid Endpoint (`POST /api/auction/bid`)**
- **Protection:** Added `current_user: User = Depends(get_current_admin_user)`
- **Effect:** Only Admin users can place bids via API
- **Error:** Returns 403 Forbidden if non-admin tries to access

#### 2. **Mark Sold Endpoint (`POST /api/auction/sold`)**
- **Protection:** Added `current_user: User = Depends(get_current_admin_user)`
- **Effect:** Only Admin users can mark players as sold via API
- **Error:** Returns 403 Forbidden if non-admin tries to access

#### 3. **Mark Unsold Endpoint (`POST /api/auction/unsold`)**
- **Protection:** Already had admin protection (no change needed)
- **Effect:** Only Admin users can mark players as unsold via API

## Security Layers

### Layer 1: Frontend UI (UX Enhancement)
- Buttons are disabled and show helpful tooltips
- Prevents accidental clicks
- Clear visual feedback to users

### Layer 2: Frontend Function Logic (Client-side Validation)
- Functions check user role before making API calls
- Shows appropriate error messages
- Prevents unnecessary API calls

### Layer 3: Backend API (Server-side Enforcement)
- Endpoints require admin authentication
- Returns 403 Forbidden for unauthorized access
- Prevents any bypass attempts (e.g., Postman, curl)

## User Roles

### Admin User
- **Username:** Admin
- **Password:** Admin123*#
- **Permissions:**
  - ✅ View live auction
  - ✅ Place bids for teams
  - ✅ Mark players as sold
  - ✅ Mark players as unsold
  - ✅ Select random player
  - ✅ Edit last bid
  - ✅ Reset auction
  - ✅ Full access to all features

### GenericUser
- **Username:** GenericUser
- **Password:** User123#
- **Permissions:**
  - ✅ View live auction
  - ✅ See current player details
  - ✅ View team budgets and player counts
  - ✅ See bid history
  - ❌ Place bids (disabled)
  - ❌ Mark players as sold (disabled)
  - ❌ Mark players as unsold (disabled)
  - ❌ Select random player (disabled)
  - ❌ Edit bids (disabled)
  - ❌ Reset auction (disabled)

## Testing

### Test Scenario 1: Admin User
1. Login as Admin (Admin / Admin123*#)
2. Go to Live Auction
3. All buttons should be enabled
4. Should be able to:
   - Select a team and place a bid
   - Mark player as sold
   - Mark player as unsold

### Test Scenario 2: GenericUser
1. Login as GenericUser (GenericUser / User123#)
2. Go to Live Auction
3. "Place Bid", "Mark Sold", and "Mark Unsold" buttons should be greyed out
4. Hovering over buttons should show "Admin only" tooltip
5. Clicking buttons should show alert: "Only admin users can..."

### Test Scenario 3: API Security
1. Get GenericUser authentication token
2. Try to call API endpoints directly:
   ```bash
   # This should fail with 403 Forbidden
   curl -X POST http://localhost:8000/api/auction/bid \
     -H "Authorization: Bearer <generic_user_token>" \
     -H "Content-Type: application/json" \
     -d '{"team_id": 1, "bid_amount": 50000}'
   ```
3. Should receive: `{"detail": "Admin privileges required"}`

## Benefits

1. **Security:** Multi-layer protection prevents unauthorized actions
2. **User Experience:** Clear visual feedback about permissions
3. **Audit Trail:** All actions are linked to authenticated admin users
4. **Scalability:** Easy to add more roles and permissions in the future
5. **Compliance:** Proper access control for sensitive auction operations

## Future Enhancements

- Add "Auctioneer" role with partial permissions
- Add "Team Owner" role that can only bid for their team
- Add audit logging for all admin actions
- Add role management UI for admins
- Add session timeout for inactive users

## Commit

**Commit Hash:** 0a6d07a  
**Branch:** main  
**Date:** October 10, 2025  
**Changes:**
- Modified: `backend/routers/auction.py`
- Modified: `frontend/src/pages/LiveAuction/LiveAuction.js`
- Added role-based access control for Place Bid, Mark Sold, Mark Unsold
