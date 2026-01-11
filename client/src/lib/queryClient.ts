import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { fetchWithTokenRefresh } from "@/lib/tokenUtils";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`[API Request] ${method} ${url}`, data);
  
  try {
    // Use our token refresh utility for better auth handling
    const res = await fetchWithTokenRefresh(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log(`[API Response] ${method} ${url} - Status: ${res.status}`);
    
    // Check if the response has content and is JSON before trying to parse it
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (res.status !== 204 && isJson) {
      const clonedRes = res.clone();
      try {
        const responseBody = await clonedRes.json();
        console.log(`[API Response Body] ${method} ${url}:`, responseBody);
      } catch (e) {
        console.log(`[API Response Body] ${method} ${url}: Could not parse as JSON`);
      }
    } else {
      console.log(`[API Response Body] ${method} ${url}: No JSON content or 204 status`);
    }

    await throwIfResNotOk(res);
    return res;
  } catch (err) {
    console.error(`[API Error] ${method} ${url}:`, err);
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

interface QueryFnOptions {
  on401?: UnauthorizedBehavior;
  params?: Record<string, string | number | null | undefined>;
}

export const getQueryFn: <T>(options?: QueryFnOptions) => QueryFunction<T> =
  (options = { on401: "throw" }) =>
  async ({ queryKey }) => {
    const { on401: unauthorizedBehavior = "throw", params } = options;
    
    // Build URL with query parameters if they exist
    let url = queryKey[0] as string;
    
    if (params) {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }
    
    // Use fetchWithTokenRefresh for automatic token refresh
    const res = await fetchWithTokenRefresh(url);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
