declare module 'cpf-cnpj-validator' {
  export const cpf: {
    isValid(value: string | null | undefined): boolean;
    format(value: string): string;
    strip(value: string): string;
  };
  export const cnpj: {
    isValid(value: string | null | undefined): boolean;
    format(value: string): string;
    strip(value: string): string;
  };
}
