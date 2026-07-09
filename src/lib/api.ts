async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { ...init, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed');
  }

  return data as T;
}

export async function adminRegister(email: string, password: string) {
  return request<{ success: boolean; message: string; adminToken: string }>('/api/admin/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function adminLogin(email: string, password: string) {
  return request<{ success: boolean; message: string; adminToken: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function sendVerificationCode(email: string) {
  return request<{ success: boolean; message: string; debugCode?: string }>('/api/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyVerificationCode(email: string, code: string) {
  return request<{ success: boolean; message: string; token?: string; user?: { uid: string; email: string; displayName: string } }>('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function initializeSubscriptionCheckout(payload: Record<string, unknown>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('netflix_auth_token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return request<{ success: boolean; checkoutUrl?: string; sandboxMode?: boolean; error?: string }>('/api/payments/initialize', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

export async function fetchMovies() {
  return request<{ success: boolean; movies: any[] }>('/api/movies', { method: 'GET' });
}

export async function createMovie(movie: any, adminToken: string) {
  return request<{ success: boolean; movie: any }>('/api/movies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(movie),
  });
}

export async function updateMovie(movieId: string, movie: any, adminToken: string) {
  return request<{ success: boolean; movie: any }>(`/api/movies/${movieId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(movie),
  });
}

export async function deleteMovie(movieId: string, adminToken: string) {
  return request<{ success: boolean }>(`/api/movies/${movieId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
}

