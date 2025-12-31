// Token Storage - Maps GitHub username to their token/bonding curve addresses

export interface UserToken {
  githubLogin: string;
  tokenAddress: string;
  bondingCurveAddress: string;
  tokenName: string;
  tokenSymbol: string;
  walletAddress: string;
  createdAt: string;
  txHash?: string;
}

export interface StoredPost {
  id: string;
  author: {
    login: string;
    name: string;
    avatar_url: string;
  };
  content: string;
  prLink?: string;
  orgName?: string;
  repoName?: string;
  timestamp: string;
  // On-chain data
  tokenAddress?: string;
  bondingCurveAddress?: string;
}

const USER_TOKENS_KEY = "trustmygit_user_tokens";
const POSTS_KEY = "trustmygit_posts";

// ============ Token Storage ============

export function saveUserToken(token: UserToken): void {
  console.log("[TokenStorage] Saving user token:", token);
  const tokens = getAllUserTokens();

  // Update or add
  const existingIndex = tokens.findIndex(
    (t) => t.githubLogin === token.githubLogin
  );
  if (existingIndex >= 0) {
    tokens[existingIndex] = token;
    console.log(
      "[TokenStorage] Updated existing token for:",
      token.githubLogin
    );
  } else {
    tokens.push(token);
    console.log("[TokenStorage] Added new token for:", token.githubLogin);
  }

  localStorage.setItem(USER_TOKENS_KEY, JSON.stringify(tokens));
  console.log("[TokenStorage] Total tokens stored:", tokens.length);
}

export function getUserToken(githubLogin: string): UserToken | null {
  console.log("[TokenStorage] Looking up token for:", githubLogin);
  const tokens = getAllUserTokens();
  const token =
    tokens.find(
      (t) => t.githubLogin.toLowerCase() === githubLogin.toLowerCase()
    ) || null;
  console.log("[TokenStorage] Found:", token ? "Yes" : "No");
  return token;
}

export function getUserTokenByWallet(walletAddress: string): UserToken | null {
  console.log("[TokenStorage] Looking up token by wallet:", walletAddress);
  const tokens = getAllUserTokens();
  const token =
    tokens.find(
      (t) => t.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    ) || null;
  console.log("[TokenStorage] Found:", token ? token.githubLogin : "None");
  return token;
}

export function getAllUserTokens(): UserToken[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(USER_TOKENS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function hasUserToken(githubLogin: string): boolean {
  return getUserToken(githubLogin) !== null;
}

// ============ Posts Storage ============

export function savePost(post: StoredPost): void {
  console.log("[PostStorage] Saving post:", post.id);
  const posts = getAllPosts();
  posts.unshift(post); // Add to beginning
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  console.log("[PostStorage] Total posts:", posts.length);
}

export function getAllPosts(): StoredPost[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(POSTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getPostsByAuthor(githubLogin: string): StoredPost[] {
  const posts = getAllPosts();
  return posts.filter(
    (p) => p.author.login.toLowerCase() === githubLogin.toLowerCase()
  );
}

export function deletePost(postId: string): void {
  const posts = getAllPosts();
  const filtered = posts.filter((p) => p.id !== postId);
  localStorage.setItem(POSTS_KEY, JSON.stringify(filtered));
  console.log("[PostStorage] Deleted post:", postId);
}

// ============ Purchase History ============

export interface TokenPurchase {
  id: string;
  buyerWallet: string;
  sellerGithubLogin: string;
  tokenAddress: string;
  bondingCurveAddress: string;
  ethAmount: string;
  tokensReceived: string;
  txHash: string;
  timestamp: string;
}

const PURCHASES_KEY = "trustmygit_purchases";

export function savePurchase(purchase: TokenPurchase): void {
  console.log("[PurchaseStorage] Saving purchase:", purchase.id);
  const purchases = getAllPurchases();
  purchases.unshift(purchase);
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
}

export function getAllPurchases(): TokenPurchase[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(PURCHASES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getPurchasesByBuyer(walletAddress: string): TokenPurchase[] {
  const purchases = getAllPurchases();
  return purchases.filter(
    (p) => p.buyerWallet.toLowerCase() === walletAddress.toLowerCase()
  );
}

export function getPurchasesForSeller(githubLogin: string): TokenPurchase[] {
  const purchases = getAllPurchases();
  return purchases.filter(
    (p) => p.sellerGithubLogin.toLowerCase() === githubLogin.toLowerCase()
  );
}
