import { atom } from 'recoil';

export interface CartItem {
  _id: string;
  itemId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  category: string;
  condition: string;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  count: number;
}

export const cartAtom = atom<CartState>({
  key: 'cartAtom',
  default: {
    items: [],
    count: 0,
  },
});
