import { atom } from 'recoil';

interface UserState {
  isLoggedIn: boolean;
  email: string | null;
  username?: string | null;
  token?: string | null;
  phoneNumber?: string | null;
  hostelName?: string | null;
  userId?: string | null;
  isAdmin?: boolean;
}

export const userAtom = atom<UserState>({
  key: 'userAtom',
  default: {
    isLoggedIn: false,
    email: null,
    username: null,
    token: null,
    phoneNumber: null,
    hostelName: null,
    userId: null,
    isAdmin: false,
  },
});
