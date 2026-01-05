// Token Package Configurations
export const TOKEN_PACKAGES = [
  {
    id: 'token_1',
    tokens: 1,
    price: 6,
    name: 'Single Token',
    description: 'Unlock 1 item',
    popular: false
  },
  {
    id: 'token_2',
    tokens: 2,
    price: 11,
    name: 'Starter Pack',
    description: 'Unlock 2 items',
    popular: false,
    savings: '₹1 off'
  },
  {
    id: 'token_5',
    tokens: 5,
    price: 25,
    name: 'Value Pack',
    description: 'Unlock 5 items',
    popular: true,
    savings: '₹5 off',
    pricePerToken: 5
  },
  {
    id: 'token_12',
    tokens: 12,
    price: 50,
    name: 'Power Pack',
    description: 'Unlock 12 items',
    popular: false,
    savings: '₹22 off',
    pricePerToken: 4.17
  },
  {
    id: 'token_25',
    tokens: 25,
    price: 100,
    name: 'Ultimate Pack',
    description: 'Unlock 25 items',
    popular: false,
    savings: '₹50 off',
    pricePerToken: 4,
    badge: 'Best Value'
  }
];

export const FREE_TOKENS_PER_USER = 2;

export const getPackageById = (id) => {
  return TOKEN_PACKAGES.find(pkg => pkg.id === id);
};

export const getPackageByTokens = (tokens) => {
  return TOKEN_PACKAGES.find(pkg => pkg.tokens === tokens);
};
