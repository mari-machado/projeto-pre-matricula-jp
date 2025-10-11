import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

function parseDateFlexible(value: string): Date {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [_, yyyy, mm, dd] = iso;
    return new Date(parseInt(yyyy,10), parseInt(mm,10)-1, parseInt(dd,10));
  }
  const dmyOrMdy = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (dmyOrMdy) {
    const [_, a, b, yyyy] = dmyOrMdy;
    const A = parseInt(a, 10);
    const B = parseInt(b, 10);
    const Y = parseInt(yyyy, 10);
    let day = A, month = B;
    if (A > 12 && B <= 12) { day = A; month = B; }
    else if (B > 12 && A <= 12) { day = B; month = A; }
    return new Date(Y, month - 1, day);
  }
  return new Date(value);
}

@ValidatorConstraint({ name: 'IsDateStringOrDate', async: false })
export class IsDateStringOrDate implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value) return false;
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    if (typeof value === 'string') {
      const ok = /^(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4})$/.test(value);
      if (!ok) return false;
      const d = parseDateFlexible(value);
      return !isNaN(d.getTime());
    }
    return false;
  }
  defaultMessage(): string {
    return 'Data deve ser string (yyyy-MM-dd, dd/MM/yyyy, dd-MM-yyyy, MM/dd/yyyy, MM-dd-yyyy) ou um Date válido';
  }
}
