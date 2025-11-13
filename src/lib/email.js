import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables
if (typeof window === 'undefined') {
  dotenv.config();
}

// Create reusable transporter for Outlook/Office365
const createTransporter = () => {
  // Get email credentials from environment variables
  // eslint-disable-next-line no-undef
  const emailHost = process.env.EMAIL_HOST 
  // eslint-disable-next-line no-undef
  const emailPort = parseInt(process.env.EMAIL_PORT)
  // eslint-disable-next-line no-undef
  const emailUser = process.env.EMAIL_USER 
  // eslint-disable-next-line no-undef
  const emailPassword = process.env.EMAIL_PASSWORD 

  if (!emailPassword) {
    console.warn('EMAIL_PASSWORD not configured, email functionality may not work');
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: false,
    requireTLS: false,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send email notification when a PIC is created
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email address(es) - can be single email or array
 * @param {string} options.creatorName - Name of the PIC creator
 * @param {number} options.picId - PIC ID
 * @param {string} options.platform - PIC platform
 * @param {string} options.revisionReason - Revision reason
 */
export async function sendPicCreatedEmail({ to, creatorName, picId, platform, revisionReason }) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email transporter not available, skipping email notification');
      return { success: false, error: 'Email not configured' };
    }

    // eslint-disable-next-line no-undef
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'TFT.DEL.Mailer@tristone.com';
    
    // Handle both single email and array of emails
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    
    const mailOptions = {
      from: `"Sistema de PICs" <${emailFrom}>`,
      to: recipients,
      subject: `PIC #${picId} Creado Exitosamente - Sistema de PICs`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              padding: 20px;
              margin: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .header {
              background-color: #1976d2;
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 600;
              margin: 0 0 5px 0;
            }
            .header p {
              font-size: 14px;
              margin: 0;
              opacity: 0.9;
            }
            .content {
              padding: 30px 20px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 16px;
              color: #333;
              margin-bottom: 15px;
            }
            .greeting strong {
              color: #1976d2;
            }
            .message {
              font-size: 15px;
              color: #555;
              margin-bottom: 25px;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #1976d2;
              padding: 20px;
              margin: 25px 0;
            }
            .info-box h3 {
              font-size: 18px;
              color: #1976d2;
              margin: 0 0 15px 0;
              font-weight: 600;
            }
            .info-row {
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #666;
              display: inline-block;
              width: 140px;
              font-size: 14px;
            }
            .info-value {
              color: #333;
              font-size: 14px;
            }
            .status-badge {
              display: inline-block;
              background-color: #fff3cd;
              color: #856404;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 600;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
            }
            .footer p {
              margin: 5px 0;
            }
            @media only screen and (max-width: 600px) {
              body {
                padding: 10px;
              }
              .header, .content, .footer {
                padding: 20px 15px;
              }
              .info-label {
                display: block;
                width: 100%;
                margin-bottom: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>PIC Creado Exitosamente</h1>
              <p>Sistema de Gestión de PICs</p>
            </div>
            <div class="content">
              <div class="greeting">
                Estimado/a <strong>${creatorName}</strong>,
              </div>
              
              <div class="message">
                Su PIC ha sido creado exitosamente en el sistema y está ahora en proceso de revisión y aprobación.
              </div>
              
              <div class="info-box">
                <h3>Detalles del PIC</h3>
                <div class="info-row">
                  <span class="info-label">ID del PIC:</span>
                  <span class="info-value"><strong>#${picId}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Plataforma:</span>
                  <span class="info-value">${platform || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Motivo de Revisión:</span>
                  <span class="info-value">${revisionReason || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Estado:</span>
                  <span class="info-value"><span class="status-badge">Pendiente</span></span>
                </div>
              </div>
            </div>
            <div class="footer">
              <p><strong>Sistema de PICs</strong></p>
              <p>Este es un mensaje automático. Por favor, no responda a este correo.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Sistema de PICs - Notificación de Creación
        
        Estimado/a ${creatorName},
        
        Su PIC ha sido creado exitosamente en el sistema.
        
        Detalles del PIC:
        - ID del PIC: #${picId}
        - Plataforma: ${platform || 'N/A'}
        - Motivo de Revisión: ${revisionReason || 'N/A'}
        - Estado: Pendiente
        
        Su PIC está ahora en proceso de revisión y aprobación.
        
        Este es un mensaje automático del Sistema de PICs.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Construct email from username/alias and domain
 * @param {string} username - Username/alias
 * @param {string} domain - Email domain (e.g., 'tristone.com')
 * @returns {string|null} Email address or null if invalid input
 */
export function constructEmailFromUsername(username, domain) {
  if (!username || !domain) return null;
  // Remove any spaces and convert to lowercase
  const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '.');
  return `${cleanUsername}@${domain}`;
}

/**
 * Send email notification to approvers when a PIC needs approval
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email address(es) - can be single email or array
 * @param {string} options.approverName - Name of the approver
 * @param {number} options.picId - PIC ID
 * @param {string} options.platform - PIC platform
 * @param {string} options.revisionReason - Revision reason
 * @param {string} options.creatorName - Name of the PIC creator
 */
export async function sendPicApprovalRequestEmail({ to, approverName, picId, platform, revisionReason, creatorName }) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email transporter not available, skipping email notification');
      return { success: false, error: 'Email not configured' };
    }

    // eslint-disable-next-line no-undef
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'TFT.DEL.Mailer@tristone.com';
    
    // Handle both single email and array of emails
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    
    const mailOptions = {
      from: `"Sistema de PICs" <${emailFrom}>`,
      to: recipients,
      subject: `PIC #${picId} Requiere su Aprobación - Sistema de PICs`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              padding: 20px;
              margin: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .header {
              background-color: #f57c00;
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 600;
              margin: 0 0 5px 0;
            }
            .header p {
              font-size: 14px;
              margin: 0;
              opacity: 0.9;
            }
            .content {
              padding: 30px 20px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 16px;
              color: #333;
              margin-bottom: 15px;
            }
            .greeting strong {
              color: #f57c00;
            }
            .message {
              font-size: 15px;
              color: #555;
              margin-bottom: 25px;
            }
            .info-box {
              background-color: #fff8e1;
              border-left: 4px solid #f57c00;
              padding: 20px;
              margin: 25px 0;
            }
            .info-box h3 {
              font-size: 18px;
              color: #f57c00;
              margin: 0 0 15px 0;
              font-weight: 600;
            }
            .info-row {
              padding: 8px 0;
              border-bottom: 1px solid #ffe0b2;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #666;
              display: inline-block;
              width: 140px;
              font-size: 14px;
            }
            .info-value {
              color: #333;
              font-size: 14px;
            }
            .action-box {
              background-color: #fff3e0;
              border-left: 4px solid #f57c00;
              padding: 20px;
              margin: 25px 0;
            }
            .action-box p {
              font-size: 16px;
              color: #e65100;
              font-weight: 600;
              margin: 0;
            }
            .status-badge {
              display: inline-block;
              background-color: #fff3cd;
              color: #856404;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 600;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
            }
            .footer p {
              margin: 5px 0;
            }
            @media only screen and (max-width: 600px) {
              body {
                padding: 10px;
              }
              .header, .content, .footer {
                padding: 20px 15px;
              }
              .info-label {
                display: block;
                width: 100%;
                margin-bottom: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>Aprobación Requerida</h1>
              <p>Sistema de Gestión de PICs</p>
            </div>
            <div class="content">
              <div class="greeting">
                Estimado/a <strong>${approverName}</strong>,
              </div>
              
              <div class="message">
                Se ha creado un nuevo PIC que requiere su revisión y aprobación. Por favor, acceda al sistema para revisar los detalles completos.
              </div>
              
              <div class="info-box">
                <h3>Detalles del PIC</h3>
                <div class="info-row">
                  <span class="info-label">ID del PIC:</span>
                  <span class="info-value"><strong>#${picId}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Plataforma:</span>
                  <span class="info-value">${platform || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Motivo de Revisión:</span>
                  <span class="info-value">${revisionReason || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Creado por:</span>
                  <span class="info-value">${creatorName || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Estado:</span>
                  <span class="info-value"><span class="status-badge">Pendiente de Aprobación</span></span>
                </div>
              </div>
              
              <div class="action-box">
                <p>Acción Requerida: Por favor, revise y apruebe este PIC en el sistema.</p>
              </div>
            </div>
            <div class="footer">
              <p><strong>Sistema de PICs</strong></p>
              <p>Este es un mensaje automático. Por favor, no responda a este correo.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Sistema de PICs - Notificación de Aprobación Requerida
        
        Estimado/a ${approverName},
        
        Se ha creado un nuevo PIC que requiere su aprobación.
        
        Detalles del PIC:
        - ID del PIC: #${picId}
        - Plataforma: ${platform || 'N/A'}
        - Motivo de Revisión: ${revisionReason || 'N/A'}
        - Creado por: ${creatorName || 'N/A'}
        - Estado: Pendiente de Aprobación
        
        ⚠️ Acción Requerida: Por favor, revise y apruebe este PIC en el sistema.
        
        Puede acceder al sistema para revisar los detalles completos del PIC y realizar su aprobación.
        
        Este es un mensaje automático del Sistema de PICs.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval request email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approval request email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get email address from emp_id using emp_alias
 * @param {number} empId - Employee ID
 * @param {Array} empleados - Array of employee objects with emp_id and emp_alias
 * @param {string} domain - Email domain (defaults to EMAIL_DOMAIN env var or 'tristone.com')
 * @returns {string|null} Email address or null if not found
 */
export function getEmailFromEmpId(empId, empleados, domain = null) {
  if (!empId) return null;
  // eslint-disable-next-line no-undef
  const emailDomain = domain || process.env.EMAIL_DOMAIN || 'tristone.com';
  const empleado = empleados.find(emp => emp.emp_id === empId);
  if (!empleado || !empleado.emp_alias) return null;
  return constructEmailFromUsername(empleado.emp_alias, emailDomain);
}

