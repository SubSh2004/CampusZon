# Review Submission Debugging Guide

## STEP 1: Open Browser Console

1. Go to https://www.campuszon.tech
2. Open any item details page
3. Press **F12** (or Right-click → Inspect)
4. Click the **Console** tab

## STEP 2: Check Console Logs

Try submitting a review and look for these logs:

### ✅ Expected Logs (if everything works):
```
Submitting review: {userId: "...", userName: "...", rating: 5, comment: "good", itemId: "..."}
Review response: {success: true, message: "Review added successfully"}
```

### ❌ Error Logs (if something fails):
```
Review submission error: AxiosError {...}
Error response: {success: false, message: "...", errors: [...]}
```

## STEP 3: Check Network Tab

1. Click the **Network** tab in Developer Tools
2. Try submitting a review
3. Look for a request to: `review` or ending with `/review`
4. Click on it
5. Check these tabs:
   - **Headers** tab → Check "Request URL" 
   - **Payload** tab → See what data was sent
   - **Response** tab → See the error message from server

## STEP 4: Common Issues & How to Identify

### Issue 1: Token/Authentication Problem
**Console shows:**
```
Review submission error: AxiosError
Error response: {status: 401, message: "Unauthorized"}
```

**Fix:** You're not logged in or token expired
- Clear browser cache and login again
- Run in console: `localStorage.getItem('token')` - should show a long string

### Issue 2: Validation Error
**Console shows:**
```
Error response: {
  success: false,
  message: "Validation failed",
  errors: [
    {field: "userId", message: "Invalid user ID format"}
  ]
}
```

**Fix:** Data format issue - this means we need to fix the frontend code

### Issue 3: Network Error
**Console shows:**
```
Review submission error: AxiosError {message: "Network Error"}
```

**Fix:** Backend is down or CORS issue

### Issue 4: 404 Not Found
**Console shows:**
```
Error response: {status: 404, message: "Item not found"}
```

**Fix:** Invalid item ID in URL

## STEP 5: Manual Test (Advanced)

Open browser console and run this:

```javascript
// Check if logged in
console.log('Token:', localStorage.getItem('token'));

// Check current item ID
console.log('Current URL:', window.location.pathname);

// Test API connection
fetch('https://campuskart-api.onrender.com/api/items')
  .then(r => r.json())
  .then(d => console.log('API Working:', d))
  .catch(e => console.error('API Error:', e));
```

## STEP 6: What to Share

After following above steps, share:

1. **Exact error message** from Console tab
2. **Response** from Network tab
3. **Screenshot** of the Console errors (if possible)

This will help me provide the exact fix!

## Quick Checklist Before Debugging:

- [ ] I'm logged in (check: localStorage has token)
- [ ] I selected a star rating (1-5 stars)
- [ ] I typed text in the review box
- [ ] I cleared browser cache (Ctrl+Shift+Delete)
- [ ] I can see other reviews on the page
- [ ] The page URL looks correct: `/item/[some-id]`

## Emergency Fix:

If nothing works, try this:

1. **Hard refresh the page**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear all site data**:
   - F12 → Application tab → Clear storage → "Clear site data"
3. **Login again**
4. **Try submitting review again**

---

**After you check the console and share the exact error message, I can provide a targeted fix!**
