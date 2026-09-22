const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

type RequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
};

const errorMessages: Record<string, string> = {
  "Invalid credentials": "Неверный email или пароль",
  "User is inactive": "Пользователь отключён",
  "Refresh token missing": "Сессия истекла",
  "Invalid refresh token": "Сессия истекла",
  "Invalid token": "Сессия истекла",
  "User unavailable": "Пользователь недоступен",
  "User not found": "Пользователь не найден",
  "Permission denied": "Недостаточно прав",
};

function getErrorMessage(
  detail: unknown,
  status: number,
): string {
  if (typeof detail === "string") {
    return errorMessages[detail] ?? detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (
          typeof item !== "object" ||
          item === null
        ) {
          return null;
        }

        const message =
          "msg" in item &&
          typeof item.msg === "string"
            ? item.msg
            : null;

        const location =
          "loc" in item &&
          Array.isArray(item.loc)
            ? item.loc
                .filter(
                  (part: unknown) =>
                    part !== "body",
                )
                .join(".")
            : "";

        if (!message) {
          return null;
        }

        return location
          ? `${location}: ${message}`
          : message;
      })
      .filter(
        (message): message is string =>
          message !== null,
      );

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  if (status === 422) {
    return "Проверьте правильность заполнения полей";
  }

  if (status >= 500) {
    return "Ошибка сервера. Попробуйте позже";
  }

  return "Не удалось выполнить запрос";
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    auth = false,
    retry = true,
    headers,
    ...fetchOptions
  } = options;

  const requestHeaders = new Headers(headers);

    const isFormData =
      typeof FormData !== "undefined" &&
      fetchOptions.body instanceof FormData;

    if (
      !isFormData &&
      !requestHeaders.has("Content-Type")
    ) {
      requestHeaders.set(
        "Content-Type",
        "application/json",
      );
    }

  if (auth) {
    const accessToken =
      localStorage.getItem("access_token");

    if (accessToken) {
      requestHeaders.set(
        "Authorization",
        `Bearer ${accessToken}`,
      );
    }
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...fetchOptions,
      credentials: "include",
      headers: requestHeaders,
    },
  );

  if (
      response.status === 401 &&
      auth &&
      retry
    ) {
      const refreshResponse = await fetch(
        `${API_URL}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (refreshResponse.ok) {
        const tokens = await refreshResponse.json();

        localStorage.setItem(
          "access_token",
          tokens.access_token,
        );

        return apiClient<T>(path, {
          ...options,
          retry: false,
        });
      }

      localStorage.removeItem("access_token");

      throw new Error("Сессия истекла");
    }

  if (!response.ok) {
    let message = getErrorMessage(
      undefined,
      response.status,
    );

    try {
      const error: { detail?: unknown } =
        await response.json();

      message = getErrorMessage(
        error.detail,
        response.status,
      );
    } catch {
      // Используем сообщение по HTTP-статусу.
    }

    throw new Error(message);
  }

    if (response.status === 204) {
      return undefined as T;
    }

  return response.json();
}

export type DownloadedFile = {
  blob: Blob;
  filename: string | null;
};


export async function apiDownload(
  path: string,
  options: RequestOptions = {},
): Promise<DownloadedFile> {
  const {
    auth = false,
    retry = true,
    headers,
    ...fetchOptions
  } = options;

  const requestHeaders = new Headers(
    headers,
  );

  if (auth) {
    const accessToken =
      localStorage.getItem(
        "access_token",
      );

    if (accessToken) {
      requestHeaders.set(
        "Authorization",
        `Bearer ${accessToken}`,
      );
    }
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...fetchOptions,
      credentials: "include",
      headers: requestHeaders,
    },
  );

  if (
    response.status === 401 &&
    auth &&
    retry
  ) {
    const refreshResponse = await fetch(
      `${API_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (refreshResponse.ok) {
      const tokens =
        await refreshResponse.json();

      localStorage.setItem(
        "access_token",
        tokens.access_token,
      );

      return apiDownload(path, {
        ...options,
        retry: false,
      });
    }

    localStorage.removeItem(
      "access_token",
    );

    throw new Error(
      "Сессия истекла",
    );
  }

  if (!response.ok) {
    let message = getErrorMessage(
      undefined,
      response.status,
    );

    try {
      const error: {
        detail?: unknown;
      } = await response.json();

      message = getErrorMessage(
        error.detail,
        response.status,
      );
    } catch {
      // Используем сообщение по HTTP-статусу.
    }

    throw new Error(message);
  }

  const contentDisposition =
    response.headers.get(
      "Content-Disposition",
    );

  return {
    blob: await response.blob(),
    filename: getDownloadFilename(
      contentDisposition,
    ),
  };
}


function getDownloadFilename(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const encodedMatch =
    contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i,
    );

  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(
        encodedMatch[1],
      );
    } catch {
      return encodedMatch[1];
    }
  }

  const regularMatch =
    contentDisposition.match(
      /filename="?([^";]+)"?/i,
    );

  return regularMatch?.[1] ?? null;
}