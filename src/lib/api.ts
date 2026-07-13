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

export async function sendVerificationCode(email: string, mode?: 'login' | 'signup') {
  return request<{ success: boolean; message: string; debugCode?: string; requiresRegistration?: boolean }>('/api/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ email, mode }),
  });
}

export async function verifyVerificationCode(email: string, code: string, name?: string) {
  return request<{ success: boolean; message: string; token?: string; user?: { uid: string; email: string; displayName: string } }>('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code, name }),
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

export async function fetchSubscriptionStatus(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return request<{ success: boolean; subscription: any }>('/api/subscriptions/me', { method: 'GET', headers });
}

export async function fetchAdminStats(adminToken: string) {
  return request<{ success: boolean; stats: { movies: number; users: number; subscriptions: number; revenue: number } }>('/api/admin/stats', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
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

export async function uploadFiles(files: FileList, adminToken: string) {
  const formData = new FormData();
  const fieldNames = ['poster', 'backdrop', 'video', 'trailer'];
  
  for (let i = 0; i < files.length && i < fieldNames.length; i++) {
    formData.append(fieldNames[i], files[i]);
  }

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json() as Promise<{ success: boolean; uploadedUrls: Record<string, string> }>;
}
