import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

function parseDateFlexible(value: string): Date {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [_, yyyy, mm, dd] = iso;
    return new Date(parseInt(yyyy,10), parseInt(mm,10)-1, parseInt(dd,10));
  }
  const isoDateTime = value.match(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/);
  if (isoDateTime) {
    return new Date(value);
  }
  const dmyOrMdy = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dmyOrMdy) {
    const [_, a, b, yyyy, hh, mi, ss] = dmyOrMdy;
    const A = parseInt(a, 10);
    const B = parseInt(b, 10);
    const Y = parseInt(yyyy, 10);
    let day = A, month = B;
    if (A > 12 && B <= 12) { day = A; month = B; }
    else if (B > 12 && A <= 12) { day = B; month = A; }
    const H = hh ? parseInt(hh, 10) : 0;
    const M = mi ? parseInt(mi, 10) : 0;
    const S = ss ? parseInt(ss, 10) : 0;
    return new Date(Y, month - 1, day, H, M, S);
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
      const ok = /^(\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?|\d{2}[\/\-]\d{2}[\/\-]\d{4}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?)$/.test(value);
      if (!ok) return false;
      const d = parseDateFlexible(value);
      return !isNaN(d.getTime());
    }
    return false;
  }
  defaultMessage(): string {
    return 'Data deve ser string (yyyy-MM-dd, dd/MM/yyyy, dd-MM-yyyy, MM/dd/yyyy, MM-dd-yyyy) ou um Date válido.';
  }
}
