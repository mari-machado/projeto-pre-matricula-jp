import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

interface SendConfirmationEmailParams {
  to: string;
  responsibleName?: string; 
  studentName?: string; 
  loginDate: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;
  private readonly schoolName = "Colégio SEICE";
  private readonly primaryColor = "#FFC300"; 
  private readonly darkColor = "#111111"; 

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
  const rawFrom = process.env.MAIL_FROM || 'Colégio SEICE <noreply@thinkspace.app.br>';
  this.fromAddress = this.normalizeFrom(rawFrom);
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!apiKey) {
      this.logger.warn("RESEND_API_KEY não configurada. Emails serão apenas logados.");
    }
  }

  private normalizeFrom(value: string): string {
    const trimmed = value.trim().replace(/^"|"$/g, ''); 
    const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const namedEmailRegex = /^[^<>]+<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
    if (simpleEmailRegex.test(trimmed) || namedEmailRegex.test(trimmed)) {
      return trimmed;
    }
    this.logger.warn(`MAIL_FROM inválido ('${value}'). Usando fallback padrão.`);
    return 'Colégio SEICE <noreply@thinkspace.app.br>';
  }

  async sendVerificationEmail(email: string, codigo: string): Promise<boolean> {
    const subject = `${this.schoolName} - Verificação de E-mail`;
    const html = this.buildVerificationTemplate(codigo);

    if (!this.resend) {
      this.logger.log(`[FAKE-EMAIL][VERIFICATION] Para: ${email} | Código: ${codigo}`);
      return false;
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to: [email],
        subject,
        html,
      });
      if (result.error) {
        this.logger.error(`Erro ao enviar email de verificação: ${result.error.message}`);
        return false;
      }
      this.logger.log(`Email de verificação enviado para ${email}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Falha no envio de verificação: ${err.message}`);
      return false;
    }
  }

  async sendVerificationCode(params: { to: string; code: string }): Promise<boolean> {
    return this.sendVerificationEmail(params.to, params.code);
  }

  private buildVerificationTemplate(codigo: string): string {
    const yellow = this.primaryColor; 
    const black = this.darkColor;    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Borel&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Afacad:wght@400;600&display=swap" rel="stylesheet">
<title>Verificação de E-mail</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
    <tr>
      <td>
        <table role="presentation" width="640" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e2e2;box-shadow:0 2px 6px rgba(0,0,0,.06);">
          <tr>
            <td style="background:${yellow};padding:40px 0 32px 0;text-align:center;">
              <div style="width:100%;max-width:640px;margin:0 auto;padding:0 12%;box-sizing:border-box;line-height:0;">
                <img src="https://i.imgur.com/0PYTjgz.png" alt="Logo ${this.schoolName}" style="display:block;width:100%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 38px 28px 38px;">
              <h2 style="margin:0 0 16px 0;font-size:20px;color:${black};">🔐 Verifique seu e-mail</h2>
              <p style="margin:0 0 14px 0;font-size:15px;color:${black};line-height:1.5;">Obrigado por iniciar seu cadastro no <strong>${this.schoolName}</strong>. Para continuar o processo de pré-matrícula, utilize o código de verificação abaixo. Ele é válido por <strong>10 minutos</strong>.</p>
              <div style="margin:26px 0;text-align:center;">
                <span style="display:inline-block;font-size:30px;letter-spacing:6px;font-weight:700;color:${black};background:${yellow};padding:14px 26px;border-radius:20px;">${codigo}</span>
              </div>
              <p style="text-align:center;margin:0 0 16px 0;font-size:14px;color:${black};line-height:1.5;">Você pode solicitar reenvio limitado de códigos. Caso o processo não seja concluído, o cadastro poderá ser descartado por segurança e será necessário reiniciar.</p>
              <p style="text-align:center;margin:0 0 16px 0;font-size:13px;color:${black};opacity:.85;line-height:1.5;">Se você não iniciou este procedimento, ignore este e-mail. Nenhuma ação adicional será tomada.</p>
              <p style="margin:28px 0 0 0;font-size:13px;color:${black};opacity:.9;">Atenciosamente,<br/><strong>Equipe Administrativa - ${this.schoolName}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:${black};padding:20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#ffffff;line-height:1.4;">Este é um e-mail automático. Por favor, não responda.</p>
              <p style="margin:6px 0 0 0;font-size:11px;color:#cccccc;">&copy; ${new Date().getFullYear()} ${this.schoolName}. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendPasswordResetEmail(params: { to: string; name?: string; tempPassword: string }): Promise<boolean> {
    const subject = `${this.schoolName} - Redefinição de Senha`;
    const html = this.buildPasswordResetTemplate(params.name || 'Usuário', params.tempPassword);
    if (!this.resend) {
      this.logger.log(`[FAKE-EMAIL][RESET] Para: ${params.to}`);
      return false;
    }
    try {
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to: [params.to],
        subject,
        html,
      });
      if (result.error) {
        this.logger.error(`Erro ao enviar email de reset: ${result.error.message}`);
        return false;
      }
      this.logger.log(`Email de reset enviado para ${params.to}`);
      return true;
    } catch (e:any) {
      this.logger.error(`Falha no envio de reset: ${e.message}`);
      return false;
    }
  }

  private buildPasswordResetTemplate(nome: string, senha: string): string {
    const yellow = this.primaryColor;
    const black = this.darkColor;
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /><title>Redefinição de Senha</title><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
    <tr><td>
      <table role="presentation" width="640" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e2e2;box-shadow:0 2px 6px rgba(0,0,0,.06);">
        <tr>
          <td style="background:${yellow};padding:28px 24px;text-align:center;">
              <div style="width:100%;max-width:640px;margin:0 auto;padding:0 12%;box-sizing:border-box;line-height:0;">
                <img src="https://i.imgur.com/0PYTjgz.png" alt="Logo ${this.schoolName}" style="display:block;width:100%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
              </div>   
          </td>
        </tr>
        <tr>
          <td style="padding:34px 38px 28px 38px;">
            <h2 style="margin:0 0 18px 0;font-size:19px;color:${black};">🔄 Senha redefinida</h2>
            <p style="margin:0 0 14px 0;font-size:15px;color:${black};line-height:1.5;">Olá <strong>${nome}</strong>, geramos uma senha temporária para o seu acesso ao <strong>${this.schoolName}</strong>.</p>
            <div style="margin:24px 0;text-align:center;">
              <span style="display:inline-block;font-size:22px;letter-spacing:2px;font-weight:700;color:${black};background:${yellow};padding:12px 22px;border-radius:14px;font-family:monospace;">${senha}</span>
            </div>
            <p style="margin:0 0 12px 0;font-size:13px;color:${black};opacity:.85;line-height:1.5;">Se você não solicitou esta redefinição, entre em contato com a administração imediatamente.</p>
            <p style="margin:24px 0 0 0;font-size:13px;color:${black};opacity:.9;">Atenciosamente,<br/><strong>Equipe Administrativa - ${this.schoolName}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background:${black};padding:20px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#ffffff;line-height:1.4;">Este é um e-mail automático. Por favor, não responda.</p>
            <p style="margin:6px 0 0 0;font-size:11px;color:#cccccc;">&copy; ${new Date().getFullYear()} ${this.schoolName}. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  async sendLoginConfirmation(params: SendConfirmationEmailParams): Promise<boolean> {
    const { to, responsibleName, studentName, loginDate } = params;
    const loginIso = loginDate.toISOString();

    const subject = `${this.schoolName} - Confirmação de Acesso ao Portal de Pré-Matrícula`;
    const html = this.buildHtmlTemplate({
      responsibleName,
      studentName,
      loginIso,
    });

    if (!this.resend) {
      this.logger.log(`[FAKE-EMAIL] Para: ${to} | Assunto: ${subject}`);
      return false; 
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to: [to],
        subject,
        html,
      });
      if (result.error) {
        this.logger.error(`Erro ao enviar email: ${result.error.message}`);
        return false;
      }
      this.logger.log(`Email de confirmação enviado para ${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Falha no envio de email: ${err.message}`);
      return false;
    }
  }

  private buildHtmlTemplate(data: { responsibleName?: string; studentName?: string; loginIso: string }): string {
    const greetingName = data.responsibleName || "Responsável";
    const studentLine = data.studentName
      ? `<p style=\"margin:4px 0;color:${this.darkColor};font-size:14px\">Aluno(a): <strong>${data.studentName}</strong></p>`
      : "";

    return `<!DOCTYPE html>
<html lang=\"pt-BR\">
<head>
<meta charset=\"UTF-8\" />
<title>Confirmação de Acesso</title>
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
</head>
<body style=\"margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f6f6f6;\">
  <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f6f6f6;padding:24px 0;\">
    <tr>
      <td>
        <table role=\"presentation\" width=\"640\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e2e2;box-shadow:0 2px 4px rgba(0,0,0,0.05);\">
          <tr>
            <td style=\"background:${this.primaryColor};padding:24px;text-align:center;\">
              <h1 style=\"margin:0;color:${this.darkColor};font-size:24px;letter-spacing:0.5px;\">${this.schoolName}</h1>
              <p style=\"margin:8px 0 0;color:${this.darkColor};font-size:14px;font-weight:600;\">Portal de Pré-Matrícula</p>
            </td>
          </tr>
          <tr>
            <td style=\"padding:32px 32px 24px 32px;\">
              <p style=\"margin:0 0 16px 0;font-size:16px;color:${this.darkColor};line-height:1.4;\">Olá, <strong>${greetingName}</strong>,</p>
              <p style=\"margin:0 0 16px 0;font-size:15px;color:${this.darkColor};line-height:1.5;\">Confirmamos que um acesso foi realizado recentemente ao <strong>Portal de Pré-Matrícula</strong> do <strong>${this.schoolName}</strong>.</p>
              ${studentLine}
              <p style=\"margin:16px 0 8px 0;font-size:14px;color:${this.darkColor};\">Data/Hora (UTC): <strong>${data.loginIso}</strong></p>
              <p style=\"margin:8px 0 16px 0;font-size:14px;color:${this.darkColor};\">Se foi você, nenhuma ação adicional é necessária. Caso não reconheça este acesso, recomendamos que redefina a senha imediatamente e contate nossa equipe administrativa.</p>
              <p style=\"margin:16px 0 0;font-size:13px;color:${this.darkColor};opacity:0.85;line-height:1.4;\">Este e-mail é automático. Por favor, não responda diretamente. Em caso de dúvidas, utilize os canais oficiais de atendimento do ${this.schoolName}.</p>
            </td>
          </tr>
          <tr>
            <td style=\"background:${this.darkColor};padding:20px;text-align:center;\">
              <p style=\"margin:0;font-size:12px;color:#ffffff;line-height:1.4;\">&copy; ${new Date().getFullYear()} ${this.schoolName}. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
