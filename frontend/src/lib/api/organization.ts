import { apiClient } from "./client";

export type PositionCategory =
  | "line_staff"
  | "specialist"
  | "manager"
  | "head";

// Распределительные центры

export type DistributionCenter = {
  id: number;
  code: string;
  name: string;
  city: string;
};

export type CreateDistributionCenterRequest = {
  code: string;
  name: string;
  city: string;
};

export type UpdateDistributionCenterRequest =
  Partial<CreateDistributionCenterRequest>;

export function getDistributionCenters(): Promise<
  DistributionCenter[]
> {
  return apiClient<DistributionCenter[]>(
    "/distribution_centers",
    {
      auth: true,
    },
  );
}

export function getDistributionCenter(
  centerId: number,
): Promise<DistributionCenter> {
  return apiClient<DistributionCenter>(
    `/distribution_centers/${centerId}`,
    {
      auth: true,
    },
  );
}

export function createDistributionCenter(
  data: CreateDistributionCenterRequest,
): Promise<DistributionCenter> {
  return apiClient<DistributionCenter>(
    "/distribution_centers",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function updateDistributionCenter(
  centerId: number,
  data: UpdateDistributionCenterRequest,
): Promise<DistributionCenter> {
  return apiClient<DistributionCenter>(
    `/distribution_centers/${centerId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteDistributionCenter(
  centerId: number,
): Promise<void> {
  return apiClient<void>(
    `/distribution_centers/${centerId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

// Глобальные группы подразделений

export type DivisionGroup = {
  id: number;
  code: string;
  name: string;
  abbreviation: string;
};

export type CreateDivisionGroupRequest = {
  code: string;
  name: string;
  abbreviation: string;
};

export type UpdateDivisionGroupRequest =
  Partial<CreateDivisionGroupRequest>;

export function getDivisionGroups(): Promise<
  DivisionGroup[]
> {
  return apiClient<DivisionGroup[]>(
    "/division_groups",
    {
      auth: true,
    },
  );
}

export function createDivisionGroup(
  data: CreateDivisionGroupRequest,
): Promise<DivisionGroup> {
  return apiClient<DivisionGroup>(
    "/division_groups",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function updateDivisionGroup(
  groupId: number,
  data: UpdateDivisionGroupRequest,
): Promise<DivisionGroup> {
  return apiClient<DivisionGroup>(
    `/division_groups/${groupId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteDivisionGroup(
  groupId: number,
): Promise<void> {
  return apiClient<void>(
    `/division_groups/${groupId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

// Глобальные подразделения

export type Division = {
  id: number;
  division_group_id: number;
  name: string;
};

export type CreateDivisionRequest = {
  division_group_id: number;
  name: string;
};

export type UpdateDivisionRequest =
  Partial<CreateDivisionRequest>;

export function getDivisions(
  divisionGroupId?: number,
): Promise<Division[]> {
  const query =
    divisionGroupId === undefined
      ? ""
      : `?division_group_id=${divisionGroupId}`;

  return apiClient<Division[]>(
    `/divisions${query}`,
    {
      auth: true,
    },
  );
}

export function createDivision(
  data: CreateDivisionRequest,
): Promise<Division> {
  return apiClient<Division>("/divisions", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function updateDivision(
  divisionId: number,
  data: UpdateDivisionRequest,
): Promise<Division> {
  return apiClient<Division>(
    `/divisions/${divisionId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteDivision(
  divisionId: number,
): Promise<void> {
  return apiClient<void>(
    `/divisions/${divisionId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

// Глобальные должности

export type Position = {
  id: number;
  division_id: number;
  name: string;
  category: PositionCategory;
};

export type CreatePositionRequest = {
  division_id: number;
  name: string;
  category: PositionCategory;
};

export type UpdatePositionRequest =
  Partial<CreatePositionRequest>;

export function getPositions(
  divisionId?: number,
): Promise<Position[]> {
  const query =
    divisionId === undefined
      ? ""
      : `?division_id=${divisionId}`;

  return apiClient<Position[]>(
    `/positions${query}`,
    {
      auth: true,
    },
  );
}

export function createPosition(
  data: CreatePositionRequest,
): Promise<Position> {
  return apiClient<Position>("/positions", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function updatePosition(
  positionId: number,
  data: UpdatePositionRequest,
): Promise<Position> {
  return apiClient<Position>(
    `/positions/${positionId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deletePosition(
  positionId: number,
): Promise<void> {
  return apiClient<void>(
    `/positions/${positionId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

// Конкретные подразделения РЦ

export type DivisionWithGroup = Division & {
  division_group: DivisionGroup;
};

export type DistributionCenterDivision = {
  id: number;
  distribution_center_id: number;
  division_id: number;
  name: string;
  division: DivisionWithGroup;
};

export type CreateDistributionCenterDivisionRequest = {
  division_id: number;
  name: string;
};

export function getDistributionCenterDivisions(
  centerId: number,
): Promise<DistributionCenterDivision[]> {
  return apiClient<DistributionCenterDivision[]>(
    `/distribution_centers/${centerId}/divisions`,
    {
      auth: true,
    },
  );
}

export function createDistributionCenterDivision(
  centerId: number,
  data: CreateDistributionCenterDivisionRequest,
): Promise<DistributionCenterDivision> {
  return apiClient<DistributionCenterDivision>(
    `/distribution_centers/${centerId}/divisions`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteDistributionCenterDivision(
  centerId: number,
  centerDivisionId: number,
): Promise<void> {
  return apiClient<void>(
    `/distribution_centers/${centerId}/divisions/${centerDivisionId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

// Полная структура выбранного РЦ

export type DistributionCenterStructureDivision = {
  id: number;
  name: string;
  division_id: number;
  positions: Position[];
};

export type DistributionCenterStructureGroup =
  DivisionGroup & {
    divisions: DistributionCenterStructureDivision[];
  };

export type DistributionCenterStructure =
  DistributionCenter & {
    groups: DistributionCenterStructureGroup[];
  };

export function getDistributionCenterStructure(
  centerId: number,
): Promise<DistributionCenterStructure> {
  return apiClient<DistributionCenterStructure>(
    `/distribution_centers/${centerId}/structure`,
    {
      auth: true,
    },
  );
}