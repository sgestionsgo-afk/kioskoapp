export class UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  cuit?: string;
  ivaCategory?: 'CONSUMIDOR_FINAL' | 'RESPONSABLE_INSCRIPTO' | 'MONOTRIBUTISTA' | 'EXENTO' | 'NO_RESPONSABLE' | 'SUJETO_NO_IDENTIFICADO';
}
