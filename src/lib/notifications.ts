import { supabase } from '@/integrations/supabase/client';

interface DonationEmailData {
  ngoEmail: string;
  projectName: string;
  amount: number;
  donorName?: string;
}

interface VerificationEmailData {
  ngoEmail: string;
  ngoName: string;
  verified: boolean;
}

export async function sendDonationNotification(data: DonationEmailData) {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        type: 'donation',
        to: data.ngoEmail,
        data: {
          projectName: data.projectName,
          amount: data.amount,
          donorName: data.donorName || 'Anonymous',
        },
      },
    });

    if (error) {
      console.error('Failed to send donation notification:', error);
    } else {
      console.log('Donation notification sent successfully');
    }
  } catch (err) {
    console.error('Error sending donation notification:', err);
  }
}

export async function sendVerificationNotification(data: VerificationEmailData) {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        type: data.verified ? 'verification' : 'verification_revoked',
        to: data.ngoEmail,
        data: {
          ngoName: data.ngoName,
        },
      },
    });

    if (error) {
      console.error('Failed to send verification notification:', error);
    } else {
      console.log('Verification notification sent successfully');
    }
  } catch (err) {
    console.error('Error sending verification notification:', err);
  }
}
