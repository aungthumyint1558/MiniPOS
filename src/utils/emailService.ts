// Email service utility for sending emails
interface EmailData {
  to_email: string;
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  enable_tls: boolean;
}

// Since browsers cannot directly send SMTP emails due to security restrictions,
// we need to use alternative methods:

// Method 1: Use EmailJS service (requires account setup)
export const sendEmailViaEmailJS = async (emailData: EmailData): Promise<boolean> => {
  try {
    // This would require EmailJS setup and service ID
    // For now, we'll return false to trigger fallback
    return false;
  } catch (error) {
    console.error('EmailJS error:', error);
    return false;
  }
};

// Method 2: Use a backend API endpoint (if available)
export const sendEmailViaAPI = async (emailData: EmailData): Promise<boolean> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailData.to_email,
        from: emailData.from_email,
        fromName: emailData.from_name,
        subject: emailData.subject,
        text: emailData.message,
        smtpConfig: {
          host: emailData.smtp_server,
          port: emailData.smtp_port,
          secure: emailData.enable_tls,
          auth: {
            user: emailData.smtp_username,
            pass: emailData.smtp_password
          }
        }
      })
    });

    return response.ok;
  } catch (error) {
    console.error('API email error:', error);
    return false;
  }
};

// Method 3: Use Web API with service worker (limited support)
export const sendEmailViaWebAPI = async (emailData: EmailData): Promise<boolean> => {
  try {
    // This is a placeholder for potential future Web API support
    // Currently not supported by browsers
    return false;
  } catch (error) {
    console.error('Web API email error:', error);
    return false;
  }
};

// Main email sending function that tries multiple methods
export const sendEmailViaService = async (emailData: EmailData): Promise<boolean> => {
  // Try EmailJS first
  let success = await sendEmailViaEmailJS(emailData);
  if (success) return true;

  // Try backend API
  success = await sendEmailViaAPI(emailData);
  if (success) return true;

  // Try Web API
  success = await sendEmailViaWebAPI(emailData);
  if (success) return true;

  // All methods failed
  return false;
};

// Validate email configuration
export const validateEmailConfig = (emailData: EmailData): string[] => {
  const errors: string[] = [];

  if (!emailData.smtp_server) {
    errors.push('SMTP server is required');
  }

  if (!emailData.smtp_username) {
    errors.push('SMTP username is required');
  }

  if (!emailData.smtp_password) {
    errors.push('SMTP password is required');
  }

  if (!emailData.to_email) {
    errors.push('Recipient email is required');
  }

  if (emailData.smtp_port < 1 || emailData.smtp_port > 65535) {
    errors.push('Invalid SMTP port number');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailData.to_email && !emailRegex.test(emailData.to_email)) {
    errors.push('Invalid recipient email format');
  }

  if (emailData.from_email && !emailRegex.test(emailData.from_email)) {
    errors.push('Invalid sender email format');
  }

  return errors;
};

// Generate email template
export const generateEmailTemplate = (subject: string, message: string, senderName: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${subject}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #7c3aed;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
        }
        .footer {
            background-color: #374151;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${subject}</h1>
    </div>
    <div class="content">
        <p>${message}</p>
    </div>
    <div class="footer">
        <p>Sent from ${senderName} - Restaurant POS System</p>
        <p>This is an automated email. Please do not reply.</p>
    </div>
</body>
</html>
  `;
};