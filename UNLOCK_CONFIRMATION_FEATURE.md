# Unlock Confirmation Feature

## Overview
This feature adds a confirmation popup before users unlock items with tokens, providing important information about the unlock process and refund policy.

## Features Implemented

### 1. Confirmation Popup Before Unlock
- **Component**: `UnlockConfirmationModal.tsx`
- **Trigger**: Shows when user clicks "Unlock with 1 Token" (unless preference is set to skip)
- **Content**:
  - Warning that unlocking doesn't guarantee a confirmed booking
  - Information about needing to interact with seller
  - Refund policy details (0.5 token refund on rejection/cancellation)
  - Item remains unlocked even after rejection

### 2. User Preference Storage
- **Database Field**: `skipUnlockConfirmation` in User model
- **Default Value**: `false`
- **Checkbox**: "Don't show this again" in confirmation modal
- **Endpoint**: `PUT /api/user/preferences` to update preference

### 3. Token Refund System
- **Refund Amount**: 0.5 tokens
- **Triggered On**:
  - Seller rejects booking request
  - Buyer cancels pending booking
- **Conditions**:
  - User must have unlocked the item
  - Item remains unlocked for future access
  - Refund is automatic

## Implementation Details

### Frontend Components

#### UnlockConfirmationModal
**Location**: `campuszon-client/src/components/UnlockConfirmationModal.tsx`

**Props**:
- `isOpen: boolean` - Controls modal visibility
- `onConfirm: (dontShowAgain: boolean) => void` - Callback when user confirms
- `onCancel: () => void` - Callback when user cancels
- `itemTitle: string` - Item name being unlocked

**Features**:
- Clear warning messages with icons
- Refund policy explanation
- "Don't show this again" checkbox
- Two action buttons: "Cancel" and "Unlock with 1 Token"

#### Updated UnlockModal
**Location**: `campuszon-client/src/components/UnlockModal.tsx`

**Changes**:
- Added `showConfirmation` state
- Added `skipConfirmation` state
- New function `checkSkipConfirmation()` to fetch user preference
- New function `handleUnlockClick()` to show confirmation or proceed
- New function `handleConfirmUnlock()` to save preference and unlock
- New function `handleCancelConfirmation()` to close confirmation
- Renamed `handleUnlock()` to `performUnlock()` for actual unlock logic

### Backend Changes

#### User Model
**Location**: `campuszon-server/src/models/user.model.js`

**New Field**:
```javascript
skipUnlockConfirmation: {
  type: Boolean,
  default: false,
}
```

#### User Routes
**Location**: `campuszon-server/src/routes/user.routes.js`

**New Endpoint**:
```javascript
PUT /api/user/preferences
```

**Request Body**:
```json
{
  "skipUnlockConfirmation": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": {
    "skipUnlockConfirmation": true
  }
}
```

#### User Controller
**Location**: `campuszon-server/src/controllers/user.controller.js`

**Changes**:
- Updated `getProfile` to include `skipUnlockConfirmation` in response

#### Booking Controller
**Location**: `campuszon-server/src/controllers/booking.controller.js`

**Updates**:

1. **Rejection Handler** (`updateBookingStatus` function):
   - Added token refund logic (0.5 tokens)
   - Checks if buyer unlocked the item
   - Updates chat message to mention refund
   - Updates notification to mention refund

2. **Cancellation Handler** (`deleteBooking` function):
   - Added token refund logic for pending bookings
   - Only refunds if user unlocked the item
   - Updated response message to mention refund

## User Flow

### First-Time Unlock Flow
1. User clicks "Unlock with 1 Token" button
2. System checks user preference (`skipUnlockConfirmation`)
3. If `false`, show confirmation popup with:
   - Important information about unlock process
   - Refund policy details
   - "Don't show this again" checkbox
4. User reads and makes choice:
   - **Option A**: Click "Cancel" → No action taken
   - **Option B**: Click "Unlock with 1 Token" → Proceed to step 5
5. If "Don't show this again" was checked:
   - Save preference to database
   - Future unlocks skip confirmation
6. Perform unlock and deduct 1 token

### Subsequent Unlocks (if preference saved)
1. User clicks "Unlock with 1 Token" button
2. System checks user preference (`skipUnlockConfirmation`)
3. If `true`, skip confirmation and unlock immediately

### Booking Rejection Flow
1. Seller rejects booking request
2. System checks if buyer unlocked the item
3. If yes:
   - Credit 0.5 tokens to buyer
   - Send chat message mentioning refund
   - Send notification mentioning refund
   - Item remains unlocked
4. If no: Process rejection normally

### Booking Cancellation Flow
1. Buyer cancels pending booking
2. System checks if buyer unlocked the item
3. If yes:
   - Credit 0.5 tokens to buyer
   - Show success message with refund info
   - Item remains unlocked
4. If no: Delete booking normally

## API Endpoints

### Get User Profile (includes preference)
```
GET /api/user/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "phoneNumber": "...",
    "hostelName": "...",
    "skipUnlockConfirmation": false
  }
}
```

### Update User Preferences
```
PUT /api/user/preferences
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "skipUnlockConfirmation": true
}

Response:
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": {
    "skipUnlockConfirmation": true
  }
}
```

## Design Decisions

### Why 0.5 Token Refund?
- Partial refund to compensate for unsuccessful booking
- User still "used" the unlock to contact seller
- Item remains unlocked for future use
- Prevents abuse while being fair to users

### Why Not Full Refund?
- Seller contact information was accessed
- User had opportunity to interact with seller
- Item remains unlocked (has lasting value)
- Encourages careful booking decisions

### Why Keep Item Unlocked?
- User may want to rebook later
- Information already accessed
- Reduces friction for legitimate users
- Seller details remain accessible

## Testing Checklist

### Frontend
- [ ] Confirmation popup appears on first unlock attempt
- [ ] Popup shows correct item title
- [ ] "Cancel" button closes popup without unlocking
- [ ] "Unlock with 1 Token" button proceeds with unlock
- [ ] "Don't show this again" checkbox works correctly
- [ ] Preference is saved to backend when checked
- [ ] Future unlocks skip confirmation when preference is true
- [ ] Token balance updates correctly after unlock

### Backend
- [ ] `skipUnlockConfirmation` field is created in database
- [ ] User preference endpoint saves correctly
- [ ] Profile endpoint returns preference value
- [ ] Booking rejection triggers 0.5 token refund
- [ ] Booking cancellation triggers 0.5 token refund
- [ ] Refund only happens if item was unlocked
- [ ] Item remains unlocked after refund
- [ ] Chat messages mention refund
- [ ] Notifications mention refund

## Future Enhancements

1. **Refund History**
   - Track all refunds in separate collection
   - Show refund history in payment history

2. **Customizable Refund Amount**
   - Admin panel to configure refund percentage
   - Different refund rates for different categories

3. **Analytics**
   - Track how many users skip confirmation
   - Monitor refund rate by category
   - Analyze booking success rate after unlock

4. **Email Notifications**
   - Send email when refund is processed
   - Include refund details and reason

## Known Limitations

1. Partial tokens (0.5) are stored as decimals
2. Refund is processed immediately (no review)
3. No refund history tracking
4. Cannot undo preference change from UI (needs re-check)

## Migration Notes

- Existing users will have `skipUnlockConfirmation: false` by default
- No database migration needed (field has default value)
- Feature works immediately after deployment
