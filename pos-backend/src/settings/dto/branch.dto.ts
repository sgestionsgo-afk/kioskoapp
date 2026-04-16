export class CreateBranchDto {
  name: string;
  email?: string;
  phone?: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  manager?: string;
  isMainBranch?: boolean;
  active?: boolean;
}

export class UpdateBranchDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  manager?: string;
  isMainBranch?: boolean;
  active?: boolean;
}
