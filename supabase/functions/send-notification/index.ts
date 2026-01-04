import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "donation" | "verification" | "verification_revoked";
  to: string;
  data: {
    ngoName?: string;
    projectName?: string;
    amount?: number;
    donorName?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();
    console.log(`Sending ${type} email to ${to}`, data);

    let subject: string;
    let html: string;

    switch (type) {
      case "donation":
        subject = `🎉 New Donation Received - ₹${data.amount?.toLocaleString()}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a5fb4 0%, #26a269 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
              .amount { font-size: 36px; font-weight: bold; color: #26a269; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Donation Received! 🎉</h1>
              </div>
              <div class="content">
                <p>Great news! Your project has received a new donation.</p>
                <p class="amount">₹${data.amount?.toLocaleString()}</p>
                <p><strong>Project:</strong> ${data.projectName}</p>
                <p><strong>Donor:</strong> ${data.donorName || 'Anonymous'}</p>
                <p>Thank you for making a difference through FundTracker!</p>
              </div>
              <div class="footer">
                <p>FundTracker - Transparent Giving Platform</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "verification":
        subject = `✅ Congratulations! Your NGO "${data.ngoName}" is Now Verified`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #26a269 0%, #1a5fb4 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
              .badge { display: inline-block; background: #26a269; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <p>Your NGO <strong>"${data.ngoName}"</strong> has been verified!</p>
                <p><span class="badge">✓ Verified</span></p>
                <p>This means:</p>
                <ul>
                  <li>Your organization is now visible to all donors</li>
                  <li>You can receive donations for your projects</li>
                  <li>Donors can track fund utilization transparently</li>
                </ul>
                <p>Start creating projects and making an impact today!</p>
              </div>
              <div class="footer">
                <p>FundTracker - Transparent Giving Platform</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "verification_revoked":
        subject = `⚠️ Verification Status Update for "${data.ngoName}"`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #dc3545; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Verification Status Changed</h1>
              </div>
              <div class="content">
                <p>The verification status for <strong>"${data.ngoName}"</strong> has been updated.</p>
                <p>Your NGO's verification has been revoked. Please contact our support team for more information.</p>
              </div>
              <div class="footer">
                <p>FundTracker - Transparent Giving Platform</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        throw new Error("Invalid email type");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FundTracker <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const responseData = await emailResponse.json();
    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: emailResponse.ok ? 200 : 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
