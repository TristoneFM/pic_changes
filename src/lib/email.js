import nodemailer from 'nodemailer';

// Create reusable transporter for Outlook/Office365
const createTransporter = () => {
  // Get email credentials from environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || emailUser;

  if (!emailUser || !emailPassword) {
    console.warn('Email credentials not configured. Email notifications will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, 
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send email notification when a PIC is created
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
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

    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: `"Sistema de PICs" <${emailFrom}>`,
      to: to,
      subject: `PIC #${picId} Creado Exitosamente - Sistema de PICs`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .header {
              background-color: #1976d2;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              padding: 20px;
              background-color: #f9f9f9;
            }
            .info-box {
              background-color: white;
              padding: 15px;
              margin: 10px 0;
              border-left: 4px solid #1976d2;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sistema de PICs</h1>
              <p>Notificación de Creación de PIC</p>
            </div>
            <div class="content">
              <p>Estimado/a <strong>${creatorName}</strong>,</p>
              
              <p>Su PIC ha sido creado exitosamente en el sistema.</p>
              
              <div class="info-box">
                <h3>Detalles del PIC:</h3>
                <p><strong>ID del PIC:</strong> #${picId}</p>
                <p><strong>Plataforma:</strong> ${platform || 'N/A'}</p>
                <p><strong>Motivo de Revisión:</strong> ${revisionReason || 'N/A'}</p>
                <p><strong>Estado:</strong> Pendiente</p>
              </div>
              
              <p>Su PIC está ahora en proceso de revisión y aprobación. Recibirá notificaciones cuando haya cambios en el estado.</p>
              
              <p>Puede ver el estado de su PIC accediendo al sistema en cualquier momento.</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático del Sistema de PICs.</p>
              <p>Por favor, no responda a este correo.</p>
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
 * @param {string} domain - Email domain (e.g., 'company.com')
 * @returns {string|null} Email address or null if invalid input
 */
export function constructEmailFromUsername(username, domain) {
  if (!username || !domain) return null;
  // Remove any spaces and convert to lowercase
  const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '.');
  return `${cleanUsername}@${domain}`;
}

