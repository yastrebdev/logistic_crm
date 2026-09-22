import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/lib/api/users";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: getMe,
    retry: false,
  });
}