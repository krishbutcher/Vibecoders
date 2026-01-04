import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DonationPayload {
  id: string;
  amount: number;
  project_id: string;
  donor_id: string;
  created_at: string;
}

interface NgoPayload {
  id: string;
  name: string;
  is_verified: boolean;
  user_id: string;
}

export function useRealtimeNotifications() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const ngoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // For NGO users, get their NGO ID first
    const fetchNgoId = async () => {
      if (role === 'ngo') {
        const { data } = await supabase
          .from('ngos')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          ngoIdRef.current = data.id;
        }
      }
    };

    fetchNgoId();

    // Subscribe to donations for NGO users
    const donationsChannel = supabase
      .channel('donations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
        },
        async (payload) => {
          const donation = payload.new as DonationPayload;
          
          // Check if this donation is for the NGO's project
          if (role === 'ngo' && ngoIdRef.current) {
            const { data: project } = await supabase
              .from('projects')
              .select('name, ngo_id')
              .eq('id', donation.project_id)
              .maybeSingle();

            if (project && project.ngo_id === ngoIdRef.current) {
              toast({
                title: '🎉 New Donation Received!',
                description: `₹${Number(donation.amount).toLocaleString()} donated to "${project.name}"`,
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to NGO verification changes
    const ngosChannel = supabase
      .channel('ngos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ngos',
        },
        (payload) => {
          const ngo = payload.new as NgoPayload;
          const oldNgo = payload.old as NgoPayload;

          // Notify NGO owner when their NGO gets verified
          if (role === 'ngo' && ngo.user_id === user.id) {
            if (!oldNgo.is_verified && ngo.is_verified) {
              toast({
                title: '✅ Congratulations!',
                description: `Your NGO "${ngo.name}" has been verified! You can now receive donations.`,
              });
            } else if (oldNgo.is_verified && !ngo.is_verified) {
              toast({
                variant: 'destructive',
                title: 'Verification Status Changed',
                description: `Your NGO "${ngo.name}" verification has been revoked.`,
              });
            }
          }

          // Notify admins about verification changes
          if (role === 'admin') {
            if (!oldNgo.is_verified && ngo.is_verified) {
              toast({
                title: 'NGO Verified',
                description: `"${ngo.name}" is now verified and can receive donations.`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(donationsChannel);
      supabase.removeChannel(ngosChannel);
    };
  }, [user, role, toast]);
}
