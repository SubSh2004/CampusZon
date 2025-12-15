## 🔌 How to Integrate Unlock System into ItemDetail Page

### Quick Integration Example

Add these to your existing `ItemDetail.tsx`:

```typescript
import { useState } from 'react';
import UnlockModal from '../components/UnlockModal';
import FreeCreditsIndicator from '../components/FreeCreditsIndicator';

function ItemDetail() {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [unlockTier, setUnlockTier] = useState<string | null>(null);

  // Handler when unlock succeeds
  const handleUnlockSuccess = (seller: any, tier: string) => {
    setSellerInfo(seller);
    setUnlockTier(tier);
    setUnlocked(true);
  };

  return (
    <div>
      {/* Add free credits indicator at top */}
      <FreeCreditsIndicator />

      {/* Your existing item details */}
      <div className="item-details">
        <h1>{item.title}</h1>
        <p>{item.description}</p>
        <p>₹{item.price}</p>
        
        {/* Seller section - hide details until unlocked */}
        <div className="seller-section">
          {!unlocked ? (
            <>
              <p>Seller: {item.userHostel} (hostel only)</p>
              <button 
                onClick={() => setShowUnlockModal(true)}
                className="unlock-button"
              >
                🔓 Unlock Contact to See Seller Details
              </button>
              <p className="text-sm text-gray-600">
                💡 First 3 unlocks are FREE!
              </p>
            </>
          ) : (
            <>
              <p>✅ Seller: {sellerInfo.name}</p>
              <p>🏠 Hostel: {sellerInfo.hostel}</p>
              {unlockTier === 'premium' && (
                <>
                  <p>📞 Phone: {sellerInfo.phone}</p>
                  <p>📧 Email: {sellerInfo.email}</p>
                  <a href={`tel:${sellerInfo.phone}`} className="call-button">
                    📞 Call Seller
                  </a>
                </>
              )}
              <button className="chat-button">
                💬 Chat with Seller
                {unlockTier === 'basic' && ' (20 messages)'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Unlock Modal */}
      <UnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        itemId={item._id}
        itemTitle={item.title}
        onUnlockSuccess={handleUnlockSuccess}
      />
    </div>
  );
}
```

### Key Changes to Make:

1. **Hide contact details by default**
   - Only show hostel name
   - Hide name, phone, email, chat button

2. **Add "Unlock Contact" button**
   - Opens UnlockModal when clicked
   - Shows "First 3 FREE!" message

3. **Reveal details after unlock**
   - Show name and hostel for Basic
   - Show phone and email for Premium

4. **Add FreeCreditsIndicator**
   - Floating badge showing remaining credits
   - Auto-updates after each unlock

### Styling Tips:

```css
.unlock-button {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  animation: pulse 2s infinite;
}

.unlock-button:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}
```

### That's it! 🎉

Users will now see the unlock flow and you'll start earning!
