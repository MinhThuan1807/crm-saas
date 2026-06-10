import { Injectable, Logger } from '@nestjs/common';
import envConfig from '../config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendInvitationEmail({
    to,
    companyName,
    role,
    inviteLink,
  }: {
    to: string;
    companyName: string;
    role: string;
    inviteLink: string;
  }): Promise<boolean> {
    const apiKey = envConfig.RESEND_API_KEY;
    const fromEmail = envConfig.RESEND_FROM_EMAIL;

    const subject = `Lời mời tham gia workspace ${companyName} - SalesFlow CRM`;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F8F7; padding: 40px 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; bg-color: #ffffff; background: #ffffff; border: 1px solid #E8E7E2; border-radius: 12px; padding: 32px; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
          
          <!-- Header/Logo -->
          <div style="margin-bottom: 24px;">
            <span style="font-size: 18px; font-weight: 700; color: #534AB7; tracking-tight: -0.02em;">SalesFlow <span style="color: #1A1A18; font-weight: 500;">CRM</span></span>
          </div>

          <!-- Main content -->
          <h2 style="font-size: 20px; font-weight: 600; color: #1A1A18; margin-top: 0; margin-bottom: 8px; line-height: 1.3;">
            Bạn được mời tham gia ${companyName}
          </h2>
          <p style="font-size: 14px; color: #6B6B67; line-height: 1.5; margin-bottom: 24px;">
            Hệ thống quản lý quan hệ khách hàng của <strong>${companyName}</strong> đang mời bạn gia nhập đội ngũ với vai trò <strong>${role}</strong>.
          </p>

          <!-- Action Button -->
          <div style="margin-bottom: 24px;">
            <a href="${inviteLink}" target="_blank" style="display: inline-block; background-color: #534AB7; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px rgba(83, 74, 183, 0.15);">
              Chấp nhận lời mời & Thiết lập tài khoản
            </a>
          </div>

          <p style="font-size: 12px; color: #9A9A95; line-height: 1.5; margin-bottom: 0;">
            Nếu nút trên không hoạt động, sao chép link sau và dán vào thanh địa chỉ trình duyệt:<br/>
            <span style="color: #534AB7; word-break: break-all;">${inviteLink}</span>
          </p>

          <hr style="border: 0; border-top: 1px solid #E8E7E2; margin: 24px 0;" />

          <p style="font-size: 11px; color: #9A9A95; line-height: 1.4; margin: 0;">
            Lời mời này được gửi đến <strong>${to}</strong> và có giá trị trong vòng 7 ngày kể từ ngày gửi. Nếu bạn không mong đợi lời mời này, hãy bỏ qua email này.
          </p>
        </div>
      </div>
    `;

    // 1. If Resend Key is missing, fallback to logging
    if (!apiKey) {
      this.logger.warn(`[DEVELOPMENT] Resend API Key is missing. Logged invite Link:`);
      console.log(`\n==================================================`);
      console.log(`TO: ${to}`);
      console.log(`WORKSPACE: ${companyName}`);
      console.log(`ROLE: ${role}`);
      console.log(`INVITE LINK: ${inviteLink}`);
      console.log(`==================================================\n`);
      return true;
    }

    // 2. Send via Resend API
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`Resend API failed: ${JSON.stringify(errorData)}`);
        return false;
      }

      this.logger.log(`Invitation email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invitation email: ${error.message}`, error.stack);
      return false;
    }
  }
}
