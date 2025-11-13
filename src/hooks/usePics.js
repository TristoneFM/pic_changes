import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Create PIC
export function useCreatePic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (picData) => {
      const response = await fetch('/api/pics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(picData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create PIC');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch PICs list
      queryClient.invalidateQueries({ queryKey: ['pics'] });
    },
  });
}

// Get all PICs
export function useGetPics() {
  return useQuery({
    queryKey: ['pics'],
    queryFn: async () => {
      const response = await fetch('/api/pics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch PICs');
      }
      
      const data = await response.json();
      return data.data;
    },
  });
}

// Get single PIC by ID
export function useGetPic(id) {
  return useQuery({
    queryKey: ['pics', id],
    queryFn: async () => {
      const response = await fetch(`/api/pics?id=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PIC');
      }
      
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

// Get subareas by area ID (defaults to area ID 4)
export function useGetSubareas(areaId = 4) {
  // Ensure areaId is a valid number
  const validAreaId = areaId && !isNaN(areaId) ? parseInt(areaId) : 4;
  
  return useQuery({
    queryKey: ['subareas', validAreaId],
    queryFn: async () => {
      const response = await fetch(`/api/areas?areaId=${validAreaId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subareas');
      }
      
      const data = await response.json();
      return data.data;
    },
    enabled: !!validAreaId, // Only run query if areaId is valid
  });
}

// Get employees from empleados database
export function useGetEmpleados() {
  return useQuery({
    queryKey: ['empleados'],
    queryFn: async () => {
      const response = await fetch('/api/empleados');
      
      if (!response.ok) {
        throw new Error('Failed to fetch empleados');
      }
      
      const data = await response.json();
      return data.data;
    },
  });
}

// Get PICs with pending approvals for current user (using employee login ID)
export function useGetPendingApprovals(approverId) {
  return useQuery({
    queryKey: ['pendingApprovals', approverId],
    queryFn: async () => {
      if (!approverId) {
        console.log('No approverId provided, skipping fetch');
        return [];
      }
      
      console.log('Fetching pending approvals for emp_id:', approverId);
      const response = await fetch(`/api/pics/pending-approvals?approverId=${approverId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch pending approvals');
      }
      
      const data = await response.json();
      console.log(`Found ${data.data?.length || 0} PICs pending approval for emp_id: ${approverId}`);
      return data.data;
    },
    enabled: !!approverId,
  });
}

// Approve or reject a PIC
export function useApproveRejectPic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ picId, approverId, status, comment }) => {
      const response = await fetch(`/api/pics/${picId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approverId, status, comment }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update approval');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch pending approvals and PICs
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pics'] });
    },
  });
}

// Update a PIC
export function useUpdatePic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ picId, picData }) => {
      const response = await fetch(`/api/pics/${picId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(picData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update PIC');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch PICs list and specific PIC
      queryClient.invalidateQueries({ queryKey: ['pics'] });
      queryClient.invalidateQueries({ queryKey: ['pics', variables.picId] });
    },
  });
}

// Delete a PIC
export function useDeletePic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (picId) => {
      const response = await fetch(`/api/pics/${picId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete PIC');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch PICs list
      queryClient.invalidateQueries({ queryKey: ['pics'] });
    },
  });
}

// Get configuration (areas with mandatory approvers)
export function useGetConfiguration() {
  return useQuery({
    queryKey: ['configuration'],
    queryFn: async () => {
      const response = await fetch('/api/configuration');
      
      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }
      
      const data = await response.json();
      return data.areas || [];
    },
  });
}

// Check if a PDF file exists for a PIC
export function useCheckPdfExists(picId) {
  return useQuery({
    queryKey: ['pdfExists', picId],
    queryFn: async () => {
      if (!picId) return false;
      
      const response = await fetch(`/api/pics/${picId}/file`);
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.exists || false;
    },
    enabled: !!picId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

