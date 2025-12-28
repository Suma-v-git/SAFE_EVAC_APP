
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- Email Test Script ---');
console.log(`Email User: ${process.env.EMAIL_USER}`);
// Mask password for security in logs
const pass = process.env.EMAIL_PASS || '';
console.log(`Email Pass: ${pass.substring(0, 4)}...${pass.substring(pass.length - 4)}`);

async function sendTestEmail() {
    console.log('Configuring transporter...');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self for testing
        subject: 'Test Email from SafeEvac Debugger',
        text: 'If you receive this, the email configuration is working correctly!'
    };

    console.log('Attempting to send email...');
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Email sending failed:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        if (error.response) console.error('SMTP Response:', error.response);
    }
}

sendTestEmail();
