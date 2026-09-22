export const permissionResourceLabels: Record<
  string,
  string
> = {
  users: "Пользователи",
  employees: "Сотрудники",
  roles: "Роли",
  organization: "Структура организации",
  notifications: "Уведомления",
  onboarding: "Вводные процессы",
};

export const permissionActionLabels: Record<
  string,
  string
> = {
  read: "Просмотр",
  create: "Создание",
  update: "Редактирование",
  delete: "Удаление",
  manage_all_centers: "Управление всеми РЦ",
  imports_read: "Просмотр импортов",
    imports_create: "Загрузка файлов импорта",
    imports_execute: "Выполнение импорта",
};

export function getPermissionParts(
  permission: string,
): {
  resource: string;
  action: string;
} {
  const [resource, action] =
    permission.split(".");

  return {
    resource,
    action,
  };
}